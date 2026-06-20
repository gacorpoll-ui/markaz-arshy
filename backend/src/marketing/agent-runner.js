import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import prisma from '../db.js';
import { sendPromoEmail } from '../emailService.js';

// Resolve current directory for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper for parsing CLI arguments
const getArgs = () => {
  const args = {};
  process.argv.slice(2).forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.split('=');
      args[key.replace('--', '')] = value || true;
    }
  });
  return args;
};

// Ensure reports directory exists
const reportsDir = path.join(__dirname, 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// System prompts for each agent
const AGENT_PROMPTS = {
  strategist: `You are the Lead Marketing Manager & Strategist for Markaz-Arshy (an Indonesian SMM and premium accounts store). Your job is to orchestrate campaigns that convert inactive users and attract new sign-ups. Always write in engaging, localized Indonesian.`,
  seo: `You are the SEO Specialist Agent. You write top-ranking Google SEO blog posts, landing pages, and metadata descriptions. Your tone is informative, professional, and optimized with keywords. Always write in Indonesian.`,
  competitor: `You are the Competitor Pricing Intelligence Agent. You audit pricing, margins, and catalog competitiveness. Your goal is to maximize profitability and attract reseller accounts by offering competitive, clear structures.`,
  distributor: `You are the Outreach & Distribution Agent. You craft high-converting email and WhatsApp campaigns with clear call-to-actions, hooks, and professional aesthetics.`
};

// Helper to query LLM with a mock fallback if key is dummy or empty
async function callLLM(agentKey, systemPrompt, userPrompt) {
  const apiUrl = process.env.MARKET_AGENT_API_URL || 'https://ai.markaz-arshy.com/v1';
  const apiKey = process.env.MARKET_AGENT_API_KEY;
  const model = process.env.MARKET_AGENT_MODEL || 'gpt-4o-mini';

  const isDummyKey = !apiKey || apiKey === 'ma-dummy-key-replace-me' || apiKey.trim() === '';

  if (isDummyKey) {
    console.log(`[AI-AGENT] ⚠️ Using dummy or empty API key. Running Agent "${agentKey}" in Mock/Dry-Run Mode.`);
    return getMockResponse(agentKey, userPrompt);
  }

  try {
    const response = await fetch(`${apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        stream: false
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API error (${response.status}): ${errText}`);
    }

    const rawText = await response.text();
    const trimmedText = rawText.trim();

    // Check if the response is in Server-Sent Events (SSE) stream format
    if (trimmedText.startsWith('data:')) {
      const lines = trimmedText.split('\n');
      let combinedContent = '';
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('data:')) {
          const jsonStr = trimmedLine.slice(5).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsedChunk = JSON.parse(jsonStr);
            if (parsedChunk.choices && parsedChunk.choices[0]) {
              const choice = parsedChunk.choices[0];
              if (choice.delta && choice.delta.content) {
                combinedContent += choice.delta.content;
              } else if (choice.message && choice.message.content) {
                combinedContent += choice.message.content;
              } else if (choice.text) {
                combinedContent += choice.text;
              }
            }
          } catch (e) {
            // Skip invalid JSON lines
          }
        }
      }
      if (combinedContent) {
        return combinedContent;
      }
    }

    // Otherwise, parse as standard JSON
    const data = JSON.parse(rawText);
    return data.choices[0].message.content;
  } catch (error) {
    console.error(`[AI-AGENT] ❌ LLM call failed: ${error.message}. Falling back to Mock response.`);
    return getMockResponse(agentKey, userPrompt);
  }
}

// Generate Mock Data for Dry-runs or Key Failures
function getMockResponse(agentKey, userPrompt) {
  if (agentKey === 'competitor') {
    return `# 📊 Laporan Audit Harga & Kompetitor — Markaz-Arshy
Tanggal: ${new Date().toLocaleDateString('id-ID')}
Penyusun: Agen Intelijen Kompetitor AI

## 1. Analisis Margin Saat Ini
Berdasarkan katalog produk aktif yang dianalisis:
* **Layanan SMM**: Margin saat ini berkisar di angka 10% - 20%. Ini sudah cukup baik, namun untuk menarik lebih banyak **Reseller**, kita disarankan memangkas harga reseller SMM sebesar 3% - 5% lebih murah dibanding harga user biasa agar terlihat kontras yang menarik.
* **Akun Premium**: Produk fast-moving seperti Netflix Premium dan Spotify Premium saat ini sangat kompetitif. Disarankan menerapkan strategi *loss leader* untuk Spotify Premium (margin kecil) guna memancing pendaftaran baru, kemudian upsell ke layanan SMM atau ChatGPT Plus.

## 2. Rekomendasi Penyesuaian Harga
* **Netflix Premium (1 Bulan)**: Pertahankan harga user di kisaran Rp 25.000 - Rp 35.000 dengan garansi penuh 30 hari.
* **SMM Followers Instagram**: Lakukan flash sale pada jam-jam sibuk malam hari untuk meningkatkan volume transaksi harian.

---
*Laporan ini dihasilkan secara otomatis oleh Agen AI untuk keperluan simulasi.*`;
  }

  if (agentKey === 'seo') {
    return `# Panduan Lengkap Cara Menaikkan Followers Instagram Gratis & Berbayar Tercepat (2026)
*Penulis: Tim Edukasi Markaz-Arshy*

Apakah Anda ingin meningkatkan kredibilitas toko online atau personal brand Anda di Instagram? Meningkatkan jumlah followers adalah salah satu langkah pertama yang paling krusial. Dalam artikel ini, kita akan membahas cara menaikkan followers secara organik maupun menggunakan bantuan gateway terpercaya.

## 1. Buat Konten Relevan secara Konsisten
Algoritma Instagram sangat menyukai konsistensi. Postinglah Reels minimal 3-5 kali seminggu untuk menjangkau audiens baru yang belum mem-follow Anda.

## 2. Gunakan Hashtag dan Sound yang Sedang Tren
Menggunakan audio yang sedang viral pada konten Reels Anda bisa meningkatkan jangkauan postingan hingga 200%.

## 3. Gunakan Gateway Layanan Terpercaya: Markaz-Arshy
Bagi Anda pemilik bisnis yang tidak memiliki banyak waktu untuk menunggu pertumbuhan organik secara lambat, menggunakan layanan **SMM Panel Markaz-Arshy** adalah pilihan terbaik.
* **Aman & Cepat**: Proses masuk otomatis tanpa membutuhkan password akun Instagram Anda.
* **Harga Terjangkau**: Mulai dari Rp 5.000 per 1.000 followers.
* **Layanan Lengkap**: Menyediakan likes, views Reels, hingga komentar tertarget untuk meramaikan toko online Anda.

Daftar sekarang di [Markaz-Arshy](https://markaz-arshy.com) dan dapatkan kemudahan kelola sosial media Anda!`;
  }

  if (agentKey === 'distributor' && userPrompt.includes('WhatsApp')) {
    return `*🔥 PROMO KHUSUS AKHIR BULAN MARKAZ-ARSHY! 🔥*

Halo Kak! Mau ningkatin omset jualan online atau butuh hiburan premium dengan harga super hemat? 🤩

Markaz-Arshy lagi ada diskon up to 30% khusus buat Kakak hari ini!

*✨ LAYANAN SMM POPULER:*
* Followers Instagram Aktif -> Mulai Rp 8.000 / 1K followers!
* TikTok Views & Likes -> Proses kilat 24 jam!

*🍿 AKUN PREMIUM RESMI (Anti On-Hold):*
* Netflix Premium -> Hanya Rp 29.000 / bulan!
* Spotify Premium -> Mulai Rp 12.000 / bulan!

*🤖 AI API ROUTER:*
* Akses GPT-4o, Claude 3.5 Sonnet, dan Gemini Pro terpusat hanya dengan 1 API Key murah rupiah!

Yuk, buruan top up saldo Kakak sekarang juga sebelum promo habis!
👉 *Daftar / Login:* https://markaz-arshy.com
👉 *Hubungi Admin WA:* https://wa.me/6285175450863?text=Halo%20Admin%20saya%20tertarik%20dengan%20promo%20terbaru

*Markaz-Arshy — Solusi Kebutuhan Digital & SMM Terpercaya.*`;
  }

  // Fallback default mock for emails
  return {
    subject: `Promo Eksklusif: Sambutan Hangat untuk Anda dari Markaz-Arshy! 🎁`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; background-color: #070913; border: 1px solid #1e293b; border-radius: 12px; color: #f8fafc;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="background: linear-gradient(135deg, #4facfe, #00f2fe); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0; font-size: 28px; font-weight: 800;">Markaz-Arshy</h1>
          <p style="color: #00f2fe; font-size: 13px; font-weight: bold; letter-spacing: 1px; margin-top: 5px; text-transform: uppercase;">Penawaran Spesial Terbatas</p>
        </div>
        <p style="font-size: 15px; line-height: 1.6; color: #cbd5e1;">Halo <strong>Pelanggan Setia</strong>,</p>
        <p style="font-size: 14px; line-height: 1.6; color: #94a3b8;">Kami melihat Anda telah terdaftar di Markaz-Arshy, tetapi belum sempat mencoba layanan unggulan kami. Untuk menyambut kehadiran Anda, kami memberikan info produk terpopuler kami yang siap melejitkan bisnis maupun menemani waktu santai Anda!</p>
        
        <div style="background-color: rgba(79, 172, 254, 0.05); border: 1px solid rgba(79, 172, 254, 0.2); border-radius: 8px; padding: 15px; margin: 20px 0;">
          <h3 style="color: #4facfe; margin-top: 0; font-size: 16px;">🔥 Produk Terpopuler Bulan Ini:</h3>
          <ul style="color: #cbd5e1; font-size: 13px; padding-left: 20px; line-height: 1.8;">
            <li><strong>Layanan SMM Premium</strong>: Followers & Likes Instagram/TikTok mulai Rp 5.000.</li>
            <li><strong>Akun Streaming Resmi</strong>: Netflix Premium 4K resmi mulai Rp 29.000/bulan.</li>
            <li><strong>AI Router API</strong>: Akses model AI terbaik (GPT-4o, Claude) terpusat dengan saldo rupiah.</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://markaz-arshy.com/deposit" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: #070913; padding: 12px 30px; font-weight: bold; border-radius: 8px; text-decoration: none; display: inline-block; font-size: 14px; box-shadow: 0 4px 15px rgba(0, 242, 254, 0.3);">Lakukan Isi Saldo & Dapatkan Bonus</a>
        </div>
        
        <p style="font-size: 12px; color: #64748b; text-align: center; line-height: 1.5; border-top: 1px solid #1e293b; padding-top: 15px; margin-top: 25px;">
          Butuh bantuan transaksi? Hubungi CS WhatsApp kami di <a href="https://wa.me/6285175450863" style="color: #00f2fe; text-decoration: none;">+6285175450863</a>.<br>
          © 2026 Markaz-Arshy. All rights reserved.
        </p>
      </div>
    `
  };
}

// ----------------------------------------------------
// TASK 1: EMAIL CAMPAIGN AGENT
// ----------------------------------------------------
async function runEmailCampaign(limitVal) {
  console.log('[AGENT-EMAIL] Starting outreach campaign targeting inactive users...');
  
  try {
    const limit = parseInt(limitVal) || 5;
    
    // Find verified users with 0 balance and no orders
    const targetUsers = await prisma.user.findMany({
      where: {
        isVerified: true,
        balance: 0,
        orders: { none: {} }
      },
      take: limit
    });

    console.log(`[AGENT-EMAIL] Found ${targetUsers.length} target users matching criteria (verified, 0 balance, 0 orders).`);

    if (targetUsers.length === 0) {
      console.log('[AGENT-EMAIL] No target users found. Campaign completed.');
      return;
    }

    for (const user of targetUsers) {
      console.log(`[AGENT-EMAIL] Generating personalized promo content for: ${user.name} (${user.email})...`);
      
      const userPrompt = `Generate a personalized marketing email welcome campaign for a registered user named "${user.name}" who has verified their email but has not deposited any balance or purchased any SMM or premium account products yet. Offer them a warm welcome and highlight our top products (Netflix premium at Rp 29K, Spotify at Rp 12K, Instagram followers SMM, and our new AI Router API). Return a JSON output containing "subject" and "html" keys. The html content should be beautifully styled with a modern dark glassmorphism look (using #070913 background and cyan/indigo text accents).`;
      
      const rawResult = await callLLM('distributor', AGENT_PROMPTS.distributor, userPrompt);
      
      let subject, html;
      try {
        // Attempt parsing JSON from LLM
        const parsed = JSON.parse(rawResult.substring(rawResult.indexOf('{'), rawResult.lastIndexOf('}') + 1));
        subject = parsed.subject;
        html = parsed.html;
      } catch (e) {
        // Fallback if LLM output is not valid JSON
        console.warn('[AGENT-EMAIL] LLM response was not strict JSON, using default templates.');
        const mock = getMockResponse('distributor', 'fallback-email');
        subject = `Spesial Buat Kak ${user.name}: Nikmati Layanan Terbaik Markaz-Arshy! 🎁`;
        html = mock.html.replace('Pelanggan Setia', user.name);
      }

      console.log(`[AGENT-EMAIL] Sending email to ${user.email} with subject: "${subject}"...`);
      await sendPromoEmail(user.email, user.name, subject, html);
    }
    
    console.log('[AGENT-EMAIL] All emails sent successfully.');
  } catch (error) {
    console.error('[AGENT-EMAIL] Error during campaign execution:', error);
  }
}

// ----------------------------------------------------
// TASK 2: COMPETITOR PRICE AUDIT AGENT
// ----------------------------------------------------
async function runCompetitorPriceAudit() {
  console.log('[AGENT-COMPETITOR] Starting competitor price audit on active products...');
  
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: { category: true }
    });

    console.log(`[AGENT-COMPETITOR] Fetched ${products.length} active products from database.`);

    const productListContext = products.map(p => ({
      id: p.id,
      category: p.category.name,
      name: p.name,
      priceUser: p.priceUser,
      priceReseller: p.priceReseller,
      type: p.type
    }));

    const userPrompt = `Here is the list of active products in our database:\n${JSON.stringify(productListContext, null, 2)}\n\nAnalyze this list. Perform a competitive price audit of our SMM services and Premium Accounts. Give clear recommendations on which products we should adjust prices for (e.g., to attract more resellers or increase profits) and output the suggestions in a beautifully formatted Markdown report.`;

    const reportContent = await callLLM('competitor', AGENT_PROMPTS.competitor, userPrompt);

    const reportPath = path.join(reportsDir, 'competitor_price_report.md');
    fs.writeFileSync(reportPath, reportContent, 'utf-8');
    console.log(`[AGENT-COMPETITOR] ✅ Price audit report generated successfully at: ${reportPath}`);
  } catch (error) {
    console.error('[AGENT-COMPETITOR] Error during price audit:', error);
  }
}

// ----------------------------------------------------
// TASK 3: SEO ARTICLE GENERATOR AGENT
// ----------------------------------------------------
async function runSEOGenerator(topic) {
  const targetTopic = topic || 'smm-panel-indonesia';
  console.log(`[AGENT-SEO] Generating SEO blog article for topic: "${targetTopic}"...`);
  
  try {
    const userPrompt = `Generate a high-quality, comprehensive, SEO-optimized blog article about the topic: "${targetTopic}".
Requirements:
1. Meta Title (Max 60 chars) and Meta Description (Max 150 chars).
2. Keywords checklist.
3. H1, H2, and H3 structured content in Indonesian.
4. Integrate references to Markaz-Arshy (https://markaz-arshy.com) as the best provider for SMM panels, premium streaming accounts (Netflix, Spotify), and multi-model AI API key routers.
5. Return the entire output in clean markdown format.`;

    const articleContent = await callLLM('seo', AGENT_PROMPTS.seo, userPrompt);

    const articlePath = path.join(reportsDir, `seo_article_${targetTopic.replace(/[^a-zA-Z0-9]/g, '_')}.md`);
    fs.writeFileSync(articlePath, articleContent, 'utf-8');
    console.log(`[AGENT-SEO] ✅ SEO article generated successfully at: ${articlePath}`);
  } catch (error) {
    console.error('[AGENT-SEO] Error during SEO generation:', error);
  }
}

// ----------------------------------------------------
// TASK 4: WHATSAPP PROMO AGENT
// ----------------------------------------------------
async function runWhatsAppPromo() {
  console.log('[AGENT-DISTRIBUTOR] Generating WhatsApp promo broadcast script...');
  
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      take: 5
    });

    const context = products.map(p => `${p.name} - Rp ${p.priceUser.toLocaleString('id-ID')}`);

    const userPrompt = `Generate a catchy, high-conversion WhatsApp broadcast text in Indonesian.
Reference some of our popular products:\n${context.join('\n')}\n
Include emojis, clear bullet points, urgency hooks (e.g. valid only today/this week), and a call to action link to the website (https://markaz-arshy.com) and admin WhatsApp (+6285175450863) using standard link formats. Keep it engaging and clear.`;

    const promoContent = await callLLM('distributor', AGENT_PROMPTS.distributor, userPrompt);

    const promoPath = path.join(reportsDir, 'whatsapp_promo.md');
    fs.writeFileSync(promoPath, promoContent, 'utf-8');
    console.log(`[AGENT-DISTRIBUTOR] ✅ WhatsApp promo script generated successfully at: ${promoPath}`);
  } catch (error) {
    console.error('[AGENT-DISTRIBUTOR] Error during WhatsApp promo generation:', error);
  }
}

// ----------------------------------------------------
// CLI ROUTER
// ----------------------------------------------------
async function main() {
  const args = getArgs();
  const task = args.task;

  console.log(`[AI-MARKETING-TEAM] Initializing agent runner...`);

  if (!task) {
    console.log('Usage: node src/marketing/agent-runner.js --task=[email-campaign|competitor-price|seo-generator|whatsapp-promo] [options]');
    console.log('Options:');
    console.log('  --limit=N          (For email-campaign, default 5)');
    console.log('  --topic="topic"    (For seo-generator, default "smm-panel-indonesia")');
    process.exit(1);
  }

  switch (task) {
    case 'email-campaign':
      await runEmailCampaign(args.limit);
      break;
    case 'competitor-price':
      await runCompetitorPriceAudit();
      break;
    case 'seo-generator':
      await runSEOGenerator(args.topic);
      break;
    case 'whatsapp-promo':
      await runWhatsAppPromo();
      break;
    default:
      console.error(`Unknown task: ${task}`);
      process.exit(1);
  }

  // Close Prisma connection at the end
  await prisma.$disconnect();
  console.log('[AI-MARKETING-TEAM] Done. Exited.');
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
