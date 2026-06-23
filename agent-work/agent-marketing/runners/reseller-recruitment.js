import prisma from '../../../backend/src/db.js';
import {
  AGENT_PROMPTS, createTask, startTask, completeTask, failTask,
  callAgentLLM, generateReport, saveReportFile, log,
} from '../../shared/agent-base.js';

/**
 * Reseller Recruitment Agent (Agent 8)
 * Finds users with 5+ completed orders as potential resellers.
 * Generates personalized outreach messages highlighting reseller benefits.
 * Saves to report for admin to send manually.
 */
export async function runAgent(options = {}) {
  const task = await createTask('reseller', 'Reseller Recruitment Outreach', options, options.triggeredBy || 'cli');

  try {
    await startTask(task.id);
    log('reseller', 'Starting reseller recruitment analysis...');

    // Find users with 5+ completed orders who are not yet resellers
    const potentialResellers = await prisma.user.findMany({
      where: {
        isVerified: true,
        role: 'USER', // Not yet resellers
        orders: {
          some: { status: 'COMPLETED' },
        },
      },
      include: {
        orders: {
          where: { status: 'COMPLETED' },
          select: { id: true, amount: true, createdAt: true, product: { select: { name: true, type: true } } },
        },
      },
    });

    // Filter to users with 5+ orders
    const qualifiedUsers = potentialResellers.filter(u => u.orders.length >= 5);

    // Also find existing resellers for social proof data
    const existingResellers = await prisma.user.findMany({
      where: { role: 'RESELLER', isVerified: true },
      include: {
        orders: {
          where: { status: 'COMPLETED' },
          select: { id: true, amount: true },
        },
      },
      take: 5,
    });

    log('reseller', `Found ${qualifiedUsers.length} potential resellers (5+ orders), ${existingResellers.length} existing resellers`);

    if (qualifiedUsers.length === 0) {
      const msg = 'Tidak ada user dengan 5+ order yang belum menjadi reseller';
      const reportContent = `# Reseller Recruitment Analysis\n\n## Hasil\n- **Potential Resellers:** 0\n- **Status:** ${msg}\n\n## Rekomendasi\n1. Tunggu hingga lebih banyak user memiliki 5+ order\n2. Pertimbangkan menurunkan threshold ke 3+ order\n3. Atau jalankan kampanye retention untuk user yang sudah dekat`;
      const reportPath = saveReportFile(`reseller_recruitment_empty.md`, reportContent);
      await generateReport(task.id, 'campaign', 'Reseller Recruitment — 0 candidates', reportContent.slice(0, 500), { outreachCount: 0, qualifiedUsers: 0 }, null, null);
      await completeTask(task.id, { outreachCount: 0, reason: msg }, reportPath);
      log('reseller', msg);
      return { outreachCount: 0, taskId: task.id };
    }

    // Prepare user profiles for LLM
    const userProfiles = qualifiedUsers.slice(0, 20).map(u => {
      const totalSpent = u.orders.reduce((s, o) => s + o.amount, 0);
      const avgOrder = Math.round(totalSpent / u.orders.length);
      const productTypes = [...new Set(u.orders.map(o => o.product?.type).filter(Boolean))];
      const lastOrder = u.orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

      return {
        nama: u.name,
        email: u.email,
        totalOrder: u.orders.length,
        totalBelanja: totalSpent,
        rataRataOrder: avgOrder,
        tipeProduk: productTypes,
        orderTerakhir: lastOrder?.createdAt?.toISOString()?.slice(0, 10) || '-',
      };
    });

    const existingResellerStats = existingResellers.map(r => ({
      nama: r.name,
      totalOrder: r.orders.length,
      totalRevenue: r.orders.reduce((s, o) => s + o.amount, 0),
    }));

    const userPrompt = `Buat pesan outreach personal untuk rekrut reseller Markaz-Arshy.

## Calon Reseller (5+ order, belum reseller)
${JSON.stringify(userProfiles, null, 2)}

## Data Reseller Existing (untuk social proof)
${JSON.stringify(existingResellerStats, null, 2)}

## Manfaat Reseller Markaz-Arshy:
- Harga khusus reseller (lebih murah dari harga user)
- Komisi dari setiap referral
- Akses ke semua kategori produk (SMM + Premium Accounts)
- Dashboard khusus untuk manage order
- Dukungan prioritas

Buat:
1. **Template Pesan Personal** — personalised untuk setiap user berdasarkan data order mereka
2. **Email Subject Line** — 3 opsi subject line yang menarik
3. **WhatsApp Message** — versi pendek untuk WhatsApp
4. **Highlight Manfaat** — poin-poin yang paling relevan berdasarkan pola belanja mereka

Output untuk setiap user dengan format:
---USER: [nama]---
[personalized outreach message]

Buat untuk 10 user pertama (yang paling aktif). Semua dalam Bahasa Indonesia.`;

    const rawResult = await callAgentLLM(task.id, 'reseller', AGENT_PROMPTS.reseller, userPrompt);

    // Parse outreach messages per user
    const outreachMessages = parseOutreachMessages(rawResult, qualifiedUsers);

    // Build report
    const reportContent = `# Laporan Reseller Recruitment Agent

## Ringkasan
- **Total Calon Reseller:** ${qualifiedUsers.length}
- **Outreach Dipersonalisasi:** ${outreachMessages.length}
- **Status:** PESAN BELUM DIKIRIM — Admin harus kirim manual

## Kandidat Terbaik (Top 10)
${userProfiles.slice(0, 10).map((u, i) => `### ${i + 1}. ${u.nama}
- Total Order: ${u.totalOrder}
- Total Belanja: Rp ${u.totalBelanja.toLocaleString('id-ID')}
- Rata-rata Order: Rp ${u.rataRataOrder.toLocaleString('id-ID')}
- Tipe Produk: ${u.tipeProduk.join(', ') || 'Campuran'}
- Order Terakhir: u.orderTerakhir`).join('\n')}

---

## Pesan Outreach yang Dihasilkan

${outreachMessages.map(m => `### Kepada: ${m.userName} (${m.userEmail})
${m.message}
`).join('\n---\n')}

---

## Template Universal
Untuk user lain yang belum dipersonalisasi:

**Email Subject:**
"Jadilah Reseller Markaz-Arshy — Harga Spesial + Komisi!"

**WhatsApp:**
"Hai [nama]! 👋

Kami perhatikan kamu sudah ${qualifiedUsers[0]?.orders?.length || 5}x belanja di Markaz-Arshy. Keren banget! 🎉

Mau harga LEBIH MURAH lagi? Gabung jadi Reseller kami!

✅ Harga khusus reseller (diskon sampai 20%)
✅ Komisi dari setiap referral
✅ Akses semua produk SMM & Premium

Minat? Balas pesan ini atau hubungi admin ya! 🔥"

## Langkah Selanjutnya
1. Review pesan outreach di atas
2. Kirim personal message ke masing-masing kandidat
3. Track conversion rate rekrut reseller
4. Follow up dalam 3-7 hari jika belum merespon`;

    const reportPath = saveReportFile(`reseller_recruitment_${Date.now()}.md`, reportContent);

    const metrics = {
      totalPotentialResellers: qualifiedUsers.length,
      outreachGenerated: outreachMessages.length,
      avgOrderValue: qualifiedUsers.length > 0
        ? Math.round(qualifiedUsers.reduce((s, u) => s + u.orders.reduce((os, o) => os + o.amount, 0) / u.orders.length, 0) / qualifiedUsers.length)
        : 0,
    };

    await generateReport(task.id, 'campaign', 'Reseller Recruitment Outreach', reportContent.slice(0, 500), metrics);
    await completeTask(task.id, metrics, reportPath);
    log('reseller', `Done: ${outreachMessages.length} outreach messages generated for ${qualifiedUsers.length} candidates`);

    return { outreachCount: outreachMessages.length, reportPath, taskId: task.id };
  } catch (error) {
    await failTask(task.id, error.message);
    log('reseller', `Failed: ${error.message}`);
    throw error;
  }
}

function parseOutreachMessages(rawResult, users) {
  const messages = [];
  const parts = rawResult.split(/---USER:\s*(.+?)---/i);

  for (let i = 1; i < parts.length; i += 2) {
    const userName = parts[i].trim();
    const message = (parts[i + 1] || '').trim();
    if (message.length > 10) {
      const user = users.find(u => u.name === userName);
      messages.push({
        userName,
        userEmail: user?.email || '-',
        message: message.slice(0, 2000),
      });
    }
  }

  return messages;
}

export default runAgent;
