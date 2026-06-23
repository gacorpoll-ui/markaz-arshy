import prisma from '../../../backend/src/db.js';
import {
  AGENT_PROMPTS, createTask, startTask, completeTask, failTask,
  callAgentLLM, generateReport, saveReportFile, log,
} from '../../shared/agent-base.js';

const WHATSAPP_NUMBER = '6285175450863';
const WA_LINK_BASE = `https://wa.me/${WHATSAPP_NUMBER}?text=`;

/**
 * WhatsApp Broadcast Agent (Agent 3)
 * Generates WhatsApp broadcast messages for different user segments.
 * Creates short, emoji-rich messages with urgency hooks.
 * Does NOT auto-send — admin must review and approve before sending.
 */
export async function runAgent(options = {}) {
  const segment = options.segment || 'all';
  const task = await createTask('whatsapp', `WhatsApp Broadcast: ${segment}`, options, options.triggeredBy || 'cli');

  try {
    await startTask(task.id);
    log('whatsapp', `Starting broadcast generation for segment: "${segment}"...`);

    // Query users based on segment
    const users = await findUsersBySegment(segment);
    log('whatsapp', `Found ${users.length} users in segment "${segment}"`);

    if (users.length === 0) {
      const msg = `Tidak ada user ditemukan untuk segment "${segment}"`;
      const reportContent = `# WhatsApp Broadcast: ${segment}\n\n## Hasil\n- **Segment:** ${segment}\n- **Target Users:** 0\n- **Status:** Tidak ada user dengan nomor WhatsApp di segment ini\n\n## Rekomendasi\n1. Pastikan user sudah mengisi nomor WhatsApp di profil mereka\n2. Coba segment lain (all, inactive, new, vip)\n3. Atau tambahkan nomor WhatsApp user secara manual di database`;
      const reportPath = saveReportFile(`whatsapp_broadcast_${segment}_empty.md`, reportContent);
      await generateReport(task.id, 'campaign', `WhatsApp Broadcast: ${segment} — 0 users`, reportContent.slice(0, 500), { segment, totalUsers: 0, variationsGenerated: 0 }, null, null);
      await completeTask(task.id, { sent: 0, reason: msg }, reportPath);
      log('whatsapp', msg);
      return { sent: 0, taskId: task.id };
    }

    // Get top products for context
    const topProducts = await prisma.product.findMany({
      where: { isActive: true },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const productList = topProducts
      .map(p => `- ${p.name}: Rp ${p.priceUser.toLocaleString('id-ID')}`)
      .join('\n');

    // Build LLM prompt for broadcast message generation
    const userSample = users.slice(0, 10).map(u => ({
      name: u.name,
      role: u.role,
      balance: u.balance,
      orderCount: u.orders?.length || 0,
    }));

    const userPrompt = `Buat pesan WhatsApp broadcast untuk segment "${segment}" di Markaz-Arshy.

Data sample user (maksimal 10):
${JSON.stringify(userSample, null, 2)}

Produk unggulan:
${productList}

Persyaratan:
1. Pesan pendek (maks 300 karakter) supaya enak dibaca di WhatsApp
2. Gunakan 3-5 emoji yang relevan
3. Buat urgency hook di baris pertama (misal: "Hari ini saja!", "Terbatas!", "Jangan sampai kehabisan!")
4. Sertakan CTA yang jelas
5. Buat 3 variasi pesan berbeda (A/B/C testing)
6. Format link WhatsApp: ${WA_LINK_BASE}[encoded_message]
7. Semua dalam Bahasa Indonesia, santai tapi profesional

Untuk setiap variasi, format:
---VARIASI A---
[isi pesan]
---VARIASI B---
[isi pesan]
---VARIASI C---
[isi pesan]`;

    const rawResult = await callAgentLLM(task.id, 'whatsapp', AGENT_PROMPTS.whatsapp, userPrompt);

    // Parse message variations
    const variations = parseVariations(rawResult);
    log('whatsapp', `Generated ${variations.length} message variations`);

    // Create wa.me links for each variation
    const messagesWithLinks = variations.map(v => {
      const encoded = encodeURIComponent(v);
      const waLink = `${WA_LINK_BASE}${encoded}`;
      return { message: v, waLink };
    });

    // Save report with all variations and user counts
    const reportContent = buildReport(segment, users.length, messagesWithLinks);
    const reportPath = saveReportFile(`whatsapp_broadcast_${segment}_${Date.now()}.md`, reportContent);

    const metrics = {
      segment,
      totalUsers: users.length,
      variationsGenerated: variations.length,
      messages: messagesWithLinks.map(m => ({
        message: m.message.slice(0, 100) + '...',
        waLinkPreview: m.waLink.slice(0, 80) + '...',
      })),
    };

    await generateReport(task.id, 'campaign', `WhatsApp Broadcast: ${segment}`, reportContent.slice(0, 500), metrics);
    await completeTask(task.id, metrics, reportPath);
    log('whatsapp', `Done: ${variations.length} variations for ${users.length} users (NOT auto-sent)`);

    return { messages: messagesWithLinks, userCount: users.length, taskId: task.id };
  } catch (error) {
    await failTask(task.id, error.message);
    log('whatsapp', `Failed: ${error.message}`);
    throw error;
  }
}

async function findUsersBySegment(segment) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);

  switch (segment) {
    case 'inactive':
      return prisma.user.findMany({
        where: {
          isVerified: true,
          whatsapp: { not: null },
          orders: {
            some: {
              status: 'COMPLETED',
              createdAt: { lt: thirtyDaysAgo },
            },
          },
        },
        include: { orders: { select: { id: true, status: true, createdAt: true } } },
        take: 100,
      });

    case 'new':
      return prisma.user.findMany({
        where: {
          isVerified: true,
          whatsapp: { not: null },
          createdAt: { gte: thirtyDaysAgo },
        },
        include: { orders: { select: { id: true, status: true } } },
        take: 100,
      });

    case 'vip':
      return prisma.user.findMany({
        where: {
          isVerified: true,
          whatsapp: { not: null },
          OR: [
            { role: 'RESELLER' },
            {
              orders: {
                some: {
                  status: 'COMPLETED',
                  amount: { gte: 500000 },
                },
              },
            },
          ],
        },
        include: { orders: { select: { id: true, amount: true } } },
        take: 100,
      });

    case 'all':
    default:
      return prisma.user.findMany({
        where: {
          isVerified: true,
          whatsapp: { not: null },
        },
        include: { orders: { select: { id: true } } },
        take: 200,
      });
  }
}

function parseVariations(rawResult) {
  const variations = [];
  const parts = rawResult.split(/---\s*VARIASI\s+[A-Z]\s*---/i);

  for (let i = 1; i < parts.length; i++) {
    const msg = parts[i].trim();
    if (msg.length > 5) {
      // Clean up: remove trailing markers and extra whitespace
      const cleaned = msg.replace(/\n---[\s\S]*$/, '').trim();
      variations.push(cleaned.slice(0, 500));
    }
  }

  // Fallback: if no variations parsed, treat whole output as one message
  if (variations.length === 0 && rawResult.trim().length > 10) {
    variations.push(rawResult.trim().slice(0, 500));
  }

  return variations;
}

function buildReport(segment, userCount, messages) {
  const userLink = `https://wa.me/${WHATSAPP_NUMBER}`;

  return `# Laporan WhatsApp Broadcast Agent

## Ringkasan
- **Segment:** ${segment}
- **Jumlah Target:** ${userCount} user
- **Variasi Pesan:** ${messages.length}
- **Status:** PESAN BELUM DIKIRIM — Admin harus approve & kirim manual

## Pesan yang Dihasilkan

${messages.map((m, i) => `### Variasi ${String.fromCharCode(65 + i)}
${m.message}

**Link Kirim Langsung:**
${m.waLink}
`).join('\n---\n')}

## Link WhatsApp Admin
Untuk mengirim manual ke masing-masing user:
${userLink}

## Langkah Selanjutnya
1. Pilih variasi pesan terbaik (atau A/B test beberapa variasi)
2. Copy pesan dan kirim ke target user secara manual atau via WhatsApp Business API
3. Track konversi dari broadcast ini
4. JANGAN kirim otomatis tanpa review admin terlebih dahulu`;
}

export default runAgent;
