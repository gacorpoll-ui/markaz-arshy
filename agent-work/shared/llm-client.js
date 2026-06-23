// LLM Configuration — reads from database (AgentConfig) with env fallback
// Supports per-agent or global config from admin dashboard

// ─── Lazy-loaded config from database ────────────────────────
let dbConfig = null;
let dbConfigLoaded = false;
let prismaInstance = null;

async function getPrisma() {
  if (prismaInstance) return prismaInstance;
  try {
    const mod = await import('../../backend/src/db.js');
    prismaInstance = mod.default || mod;
    return prismaInstance;
  } catch (e) {
    console.warn('[LLM] Could not import prisma:', e.message);
    return null;
  }
}

export async function loadDBConfig(agentType = 'global') {
  if (dbConfigLoaded && dbConfig) return dbConfig;
  try {
    const prisma = await getPrisma();
    if (!prisma) return null;

    // Use raw SQL — avoids Prisma Client regeneration after schema changes
    let rows = await prisma.$queryRawUnsafe(
      `SELECT * FROM AgentConfig WHERE agentType = ?`, agentType
    );
    if (!rows || rows.length === 0) {
      rows = await prisma.$queryRawUnsafe(
        `SELECT * FROM AgentConfig WHERE agentType = 'global'`
      );
    }
    const config = rows?.[0];

    if (config) {
      dbConfig = {
        baseUrl: config.baseUrl,
        apiKey: config.apiKey,
        model: config.model,
        maxTokens: config.maxTokens,
        temperature: config.temperature,
      };
      dbConfigLoaded = true;
      return dbConfig;
    }
  } catch (e) {
    console.warn('[LLM] Could not load config from database:', e.message);
  }
  return null;
}

// ─── Fallback: environment variables ─────────────────────────
function getEnvConfig() {
  return {
    baseUrl: process.env.MARKET_AGENT_API_URL || 'https://ai.markaz-arshy.com/v1',
    apiKey: process.env.MARKET_AGENT_API_KEY,
    model: process.env.MARKET_AGENT_MODEL || 'gpt-4o-mini',
  };
}

// ─── Get final config (DB > env) ─────────────────────────────
async function getConfig(agentType = 'global') {
  const dbConf = await loadDBConfig(agentType);
  const envConf = getEnvConfig();
  return {
    baseUrl: dbConf?.baseUrl || envConf.baseUrl,
    apiKey: dbConf?.apiKey || envConf.apiKey,
    model: dbConf?.model || envConf.model,
    temperature: dbConf?.temperature ?? 0.7,
  };
}

// ─── Budget & Rate Limiting ──────────────────────────────────
const MAX_LLM_COST_PER_DAY = parseInt(process.env.AGENT_MAX_LLM_COST_PER_DAY || '100000');
const MAX_REQUESTS_PER_MINUTE = parseInt(process.env.AGENT_MAX_RPM || '20');
const requestTimestamps = [];
let dailyCost = 0;
let dailyCostDate = new Date().toDateString();

function checkRateLimit() {
  const now = Date.now();
  while (requestTimestamps.length > 0 && requestTimestamps[0] < now - 60000) {
    requestTimestamps.shift();
  }
  if (requestTimestamps.length >= MAX_REQUESTS_PER_MINUTE) {
    console.warn(`[LLM] ⚠️ Rate limit hit (${MAX_REQUESTS_PER_MINUTE}/min). Waiting...`);
    return false;
  }
  requestTimestamps.push(now);
  return true;
}

function checkDailyBudget() {
  const today = new Date().toDateString();
  if (dailyCostDate !== today) {
    dailyCost = 0;
    dailyCostDate = today;
  }
  if (dailyCost >= MAX_LLM_COST_PER_DAY) {
    console.warn(`[LLM] ⚠️ Daily budget exceeded (Rp ${dailyCost.toLocaleString('id-ID')} / Rp ${MAX_LLM_COST_PER_DAY.toLocaleString('id-ID')}). Using mock.`);
    return false;
  }
  return true;
}

function addDailyCost(estimatedTokens) {
  const today = new Date().toDateString();
  if (dailyCostDate !== today) {
    dailyCost = 0;
    dailyCostDate = today;
  }
  dailyCost += Math.ceil(estimatedTokens * 0.02);
}

/**
 * Call LLM with retry logic and mock fallback.
 *
 * @param {string} agentKey — Agent identifier for config lookup + mock fallback
 * @param {string} systemPrompt — System message
 * @param {string} userPrompt — User message
 * @param {object} options — { model, temperature, maxRetries }
 * @returns {Promise<string>} LLM response text
 */
export async function callLLM(agentKey, systemPrompt, userPrompt, options = {}) {
  // Load config from database (agent-specific or global)
  const config = await getConfig(agentKey);
  const model = options.model || config.model;
  const temperature = options.temperature ?? config.temperature ?? 0.7;
  const maxRetries = options.maxRetries ?? 3;
  const apiKey = config.apiKey;
  const baseUrl = config.baseUrl;

  const isDummyKey = !apiKey || apiKey === 'ma-dummy-key-replace-me' || apiKey.trim() === '';

  if (isDummyKey) {
    console.log(`[LLM] ⚠️ No API key configured — running "${agentKey}" in Mock/Dry-Run mode.`);
    return getMockResponse(agentKey, userPrompt);
  }

  if (!checkDailyBudget()) {
    return getMockResponse(agentKey, userPrompt);
  }

  // Wait up to 5 seconds for rate limit slot
  for (let w = 0; w < 5; w++) {
    if (checkRateLimit()) break;
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`[LLM] Calling ${model} via ${baseUrl} for "${agentKey}"...`);

  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature,
          stream: false,
        }),
        signal: AbortSignal.timeout(120000), // 2 minute timeout per request
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API ${response.status}: ${errText.slice(0, 200)}`);
      }

      const rawText = await response.text();
      const estimatedTokens = Math.ceil((systemPrompt.length + userPrompt.length) / 4);
      addDailyCost(estimatedTokens);
      return parseLLMResponse(rawText);
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * 2 ** attempt, 10000);
        console.log(`[LLM] Attempt ${attempt}/${maxRetries} failed: ${error.message}. Retrying in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  console.error(`[LLM] ❌ All ${maxRetries} attempts failed for "${agentKey}": ${lastError.message}. Using mock.`);
  return getMockResponse(agentKey, userPrompt);
}

/**
 * Parse LLM response — handles both SSE stream and standard JSON formats.
 */
function parseLLMResponse(rawText) {
  const trimmed = rawText.trim();

  // Handle SSE stream format
  if (trimmed.startsWith('data:')) {
    let combined = '';
    for (const line of trimmed.split('\n')) {
      const l = line.trim();
      if (!l.startsWith('data:')) continue;
      const jsonStr = l.slice(5).trim();
      if (jsonStr === '[DONE]') continue;
      try {
        const chunk = JSON.parse(jsonStr);
        const choice = chunk.choices?.[0];
        if (choice?.delta?.content) combined += choice.delta.content;
        else if (choice?.message?.content) combined += choice.message.content;
        else if (choice?.text) combined += choice.text;
      } catch { /* skip invalid lines */ }
    }
    if (combined) return combined;
  }

  // Standard JSON
  const data = JSON.parse(rawText);
  return data.choices[0].message.content;
}

/**
 * Mock responses for development / dry-run mode.
 */
export function getMockResponse(agentKey, userPrompt) {
  const today = new Date().toLocaleDateString('id-ID');

  const mocks = {
    seo: `# Panduan Lengkap Cara Menaikkan Followers Instagram Gratis & Berbayar Tercepat (2026)
*Penulis: Tim Edukasi Markaz-Arshy*

Apakah Anda ingin meningkatkan kredibilitas toko online atau personal brand Anda di Instagram? Meningkatkan jumlah followers adalah salah satu langkah pertama yang paling krusial.

## 1. Buat Konten Relevan secara Konsisten
Algoritma Instagram sangat menyukai konsistensi. Postinglah Reels minimal 3-5 kali seminggu.

## 2. Gunakan Hashtag dan Sound yang Sedang Tren
Menggunakan audio yang viral pada konten Reels bisa meningkatkan jangkauan hingga 200%.

## 3. Gunakan Gateway Layanan Terpercaya: Markaz-Arshy
* **Aman & Cepat**: Proses otomatis tanpa password.
* **Harga Terjangkau**: Mulai dari Rp 5.000 per 1.000 followers.
* **Layanan Lengkap**: Likes, views, komentar tertarget.

Daftar sekarang di [Markaz-Arshy](https://markaz-arshy.com)!`,

    email: {
      subject: `Promo Eksklusif: Nikmati Layanan Terbaik Markaz-Arshy!`,
      html: `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;padding:25px;background:#070913;border:1px solid #1e293b;border-radius:12px;color:#f8fafc;">
        <h1 style="background:linear-gradient(135deg,#4facfe,#00f2fe);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-size:28px;font-weight:800;">Markaz-Arshy</h1>
        <p style="color:#cbd5e1;font-size:15px;">Halo!</p>
        <p style="color:#94a3b8;font-size:14px;">Temukan layanan terbaik kami untuk kebutuhan digital Anda.</p>
        <div style="text-align:center;margin:30px 0;">
          <a href="https://markaz-arshy.com/deposit" style="background:linear-gradient(135deg,#4facfe,#00f2fe);color:#070913;padding:12px 30px;font-weight:bold;border-radius:8px;text-decoration:none;display:inline-block;">Isi Saldo Sekarang</a>
        </div>
        <p style="color:#64748b;font-size:12px;text-align:center;">© 2026 Markaz-Arshy</p>
      </div>`,
    },

    competitor: `# Laporan Audit Harga & Kompetitor — Markaz-Arshy
Tanggal: ${today}

## 1. Analisis Margin Saat Ini
- **Layanan SMM**: Margin 10-20%, disarankan pangkas 3-5% untuk reseller.
- **Akun Premium**: Netflix & Spotify sudah kompetitif. Gunakan strategi loss leader untuk Spotify.

## 2. Rekomendasi
- Netflix Premium: Pertahankan Rp 25.000-35.000/bulan.
- SMM Instagram: Flash sale jam malam untuk volume harian.
- AI Router: Bundling paket untuk reseller.

*Laporan ini dihasilkan oleh AI Agent untuk simulasi.*`,

    social_media: `📱 POST INSTAGRAM — Markaz-Arshy

🔥 Mau followers Instagram naik kilat? Mulai dari Rp 5.000/1K aja!

✅ Proses otomatis 24 jam
✅ Aman, tanpa password
✅ Followers aktif & real

💡 Cocok buat yang mau naikkan kredibilitas toko online atau personal brand!

Order sekarang 👉 link in bio
#smmpanel #followersinstagram #smm #markazarshy #digitalmarketing`,

    whatsapp: `*🔥 PROMO MARKAZ-ARSHY! 🔥*

Halo Kak! Mau ningkatin omset atau butuh hiburan premium hemat? 🤩

*✨ SMM POPULER:*
• Followers IG Aktif → Rp 8.000/1K!
• TikTok Views → Proses kilat 24 jam!

*🍿 AKUN PREMIUM:*
• Netflix → Rp 29.000/bulan!
• Spotify → Rp 12.000/bulan!

Buruan top up saldo sekarang! 👉 https://markaz-arshy.com
Hub Admin: https://wa.me/6285175450863

*Markaz-Arshy — Solusi Digital Terpercaya*`,

    retention: `📧 RE-ENGAGEMENT CAMPAIGN

Subject: Kami kangen kamu di Markaz-Arshy! 🎁

Halo ${userPrompt.match(/named "([^"]+)"/)?.[1] || 'Kak'}, sudah lama tidak berkunjung!

Kami punya promo spesial khusus kamu:
🎁 Diskon 10% dengan kode COMEBACK10
⏰ Berlaku 3 hari ke depan saja!

Yuk, cek produk favoritmu sekarang: https://markaz-arshy.com`,

    upsell: `📧 UPSELL CAMPAIGN

Subject: Upgrade pengalaman digital kamu! ⭐

Kamu sudah suka dengan layanan SMM kami, tapi sudah coba Akun Premium belum?

🎬 Netflix Premium → Rp 29.000/bln (Hemat 75%!)
🎵 Spotify Premium → Rp 12.000/bln
🤖 ChatGPT Plus → Rp 75.000/bln

Bundle deal: SMM + Premium = Diskon extra 15%!`,

    reseller: `📋 RESELLER RECRUITMENT PITCH

Subject: Jadi Reseller Markaz-Arshy — Omset Tambahan dari Rumah!

Kamu sudah sering order di Markaz-Arshy, tertarik jadi reseller?

✨ Keuntungan Reseller:
• Harga lebih murah (diskon 10-20%)
• Komisi per order
• Dashboard khusus
• Support prioritas

Daftar: https://markaz-arshy.com/register (pilih role RESELLER)`,

    review_request: `📧 REVIEW REQUEST

Subject: Bagaimana pengalaman kamu? ⭐

Halo! Pesanan kamu #${userPrompt.match(/order #(\d+)/)?.[1] || 'xxx'} sudah selesai.

Ceritakan pengalaman kamu! Review kamu sangat berarti bagi kami 🙏
Beri rating ⭐⭐⭐⭐⭐ di dashboard kamu ya!

Terima kasih sudah mempercayai Markaz-Arshy! 💙`,

    analytics: `# 📊 Laporan Harian — ${today}

## Revenue
- Total Revenue Hari Ini: Rp 0
- Order Selesai: 0 | Pending: 0 | Gagal: 0
- Rata-rata Order Value: Rp 0

## Users
- User Baru: 0
- Reseller Aktif: 0
- User Inactive (30 hari): 0

## Progress ke Rp 1 Miliar
- Total Revenue Kumulatif: Rp 0
- Progress: 0%
- Estimasi Tercapai: —

*Laporan ini dihasilkan oleh Analytics Agent.*`,

    dynamic_pricing: `# 💰 Rekomendasi Dynamic Pricing — ${today}

## Analisis Demand
- Jam peak order: 19:00-23:00 WIB
- Hari tersibuk: Sabtu & Minggu
- Produk paling laris: Instagram Followers

## Rekomendasi
1. **Flash Sale Jam Malam** (19-23 WIB): Diskon 5% untuk SMM orders
2. **Weekend Bundle**: Netflix + IG Followers = hemat 15%
3. **Reseller Tier Up**: Volume 50+ orders/bulan → diskon tambahan 5%

*Tidak ada perubahan harga yang diterapkan secara otomatis.*`,
  };

  return mocks[agentKey] || `[Mock Response for ${agentKey}] Input received: ${userPrompt.slice(0, 100)}...`;
}

export function resetConfigCache() {
  dbConfigLoaded = false;
  dbConfig = null;
}

export default { callLLM, getMockResponse, getConfig, loadDBConfig, resetConfigCache };
