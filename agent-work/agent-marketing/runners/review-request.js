import prisma from '../../../backend/src/db.js';
import {
  AGENT_PROMPTS, createTask, startTask, completeTask, failTask,
  callAgentLLM, generateReport, saveReportFile, log,
} from '../../shared/agent-base.js';
import { createNotification } from '../../../backend/src/utils/notificationService.js';

/**
 * Review Request Agent (Agent 12)
 * Finds completed orders from N days ago without reviews,
 * generates personalized review request messages,
 * creates in-app notifications, and generates testimonial highlights.
 */
export async function runAgent(options = {}) {
  const daysAfterOrder = options.daysAfterOrder || 7;
  const task = await createTask('review_request', `Review Request: ${daysAfterOrder}d after order`, options, options.triggeredBy || 'cli');

  try {
    await startTask(task.id);
    log('review_request', `Starting review request campaign (${daysAfterOrder} days after order)...`);

    // Find completed orders from N days ago that don't have reviews
    const targetDateStart = new Date(Date.now() - (daysAfterOrder + 1) * 86400000);
    const targetDateEnd = new Date(Date.now() - daysAfterOrder * 86400000);

    const completedOrders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: targetDateStart, lt: targetDateEnd },
        reviews: { none: {} }, // No review yet
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        product: { select: { name: true, type: true, category: { select: { name: true } } } },
      },
      take: 50,
    });

    log('review_request', `Found ${completedOrders.length} completed orders without reviews (${daysAfterOrder} days ago)`);

    if (completedOrders.length === 0) {
      const msg = `Tidak ada order ${daysAfterOrder} hari lalu yang belum direview`;
      const reportContent = `# Review Request: ${daysAfterOrder}d after order\n\n## Hasil\n- **Target Orders:** 0\n- **Status:** ${msg}\n\n## Rekomendasi\n1. Semua order sudah memiliki review — bagus!\n2. Jalankan campaign lagi nanti saat ada order baru\n3. Pertimbangkan mengurangi daysAfterOrder jika ingin catch lebih banyak`;
      const reportPath = saveReportFile(`review_request_${daysAfterOrder}d_empty.md`, reportContent);
      await generateReport(task.id, 'campaign', `Review Request: ${daysAfterOrder}d — 0 orders`, reportContent.slice(0, 500), { notificationsSent: 0, targetOrders: 0 }, null, null);
      await completeTask(task.id, { notificationsSent: 0, reason: msg }, reportPath);
      log('review_request', msg);
      return { notificationsSent: 0, taskId: task.id };
    }

    // Also get existing positive reviews for testimonial highlights
    const positiveReviews = await prisma.review.findMany({
      where: {
        rating: { gte: 4 },
        isApproved: true,
      },
      include: {
        user: { select: { name: true } },
        product: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    log('review_request', `Found ${positiveReviews.length} existing positive reviews for testimonials`);

    // Build LLM prompt
    const orderSample = completedOrders.slice(0, 15).map(o => ({
      userName: o.user.name,
      productName: o.product?.name || '-',
      productType: o.product?.type || '-',
      amount: o.amount,
      orderDate: o.createdAt.toISOString().slice(0, 10),
    }));

    const testimonialSample = positiveReviews.slice(0, 10).map(r => ({
      user: r.user.name,
      product: r.product?.name || '-',
      rating: r.rating,
      comment: r.comment?.slice(0, 200) || '-',
    }));

    const userPrompt = `Buat pesan review request yang sopan dan engaging untuk pelanggan Markaz-Arshy.

## Order yang Perlu Direview (${completedOrders.length} total)
Sample:
${JSON.stringify(orderSample, null, 2)}

## Testimonial yang Sudah Ada (untuk social proof)
${JSON.stringify(testimonialSample, null, 2)}

## Persyaratan:
1. **Pesan Personal** — Sesuaikan dengan produk yang dibeli
2. **Tone:** Sopan, tidak memaksa, menunjukkan apresiasi
3. **Instruksi Jelas** — Cara memberikan review di platform
4. **Social Proof** — Sertakan contoh review positif dari user lain
5. **Incentive** — "Dapatkan bonus saldo Rp 5.000 untuk review"
6. **Rating Request** — Ajak untuk kasih bintang 5

Buat:
- **In-App Notification Message** (maks 200 karakter)
- **Email Review Request** (lengkap dengan subject + body)
- **WhatsApp Message** (pendek, friendly)

Format:
---NOTIFICATION untuk [nama user]---
[pesan notifikasi]

---EMAIL---
Subject: [subject]
Body: [body]

---WHATSAPP---
[pesan whatsapp]

Semua dalam Bahasa Indonesia.`;

    const rawResult = await callAgentLLM(task.id, 'review_request', AGENT_PROMPTS.review_request, userPrompt);

    // Parse results
    const notifications = parseNotifications(rawResult, completedOrders);

    // Create in-app notifications for each user
    let notifCount = 0;
    const notifiedUsers = [];

    for (const order of completedOrders) {
      const message = notifications.get(order.user.id)
        || generateDefaultNotification(order.product?.name, daysAfterOrder);

      try {
        await createNotification(
          order.user.id,
          'REVIEW_REQUEST',
          message,
          '/orders', // Link to orders page where they can leave review
        );
        notifCount++;
        notifiedUsers.push({
          userId: order.user.id,
          userName: order.user.name,
          productName: order.product?.name || '-',
          orderId: order.id,
        });
      } catch (err) {
        log('review_request', `Failed to create notification for user ${order.user.id}: ${err.message}`);
      }
    }

    log('review_request', `Created ${notifCount} in-app notifications`);

    // Generate testimonial highlights
    const testimonialHighlights = positiveReviews.slice(0, 5).map(r => ({
      user: r.user.name,
      product: r.product?.name || '-',
      rating: r.rating,
      comment: r.comment?.slice(0, 200) || '',
    }));

    // Build report
    const reportContent = `# Laporan Review Request Agent

## Ringkasan
- **Periode Order:** ${targetDateStart.toLocaleDateString('id-ID')} — ${targetDateEnd.toLocaleDateString('id-ID')}
- **Order Tanpa Review:** ${completedOrders.length}
- **Notifikasi Terkirim:** ${notifCount}
- **Testimonial Positive:** ${positiveReviews.length}

## Notifikasi In-App yang Dikirim

${notifiedUsers.map(u => `- **${u.userName}** — Produk: ${u.productName} (Order #${u.orderId})`).join('\n')}

## Template Pesan

### In-App Notification
${notifications.size > 0
    ? [...notifications.values()][0]
    : generateDefaultNotification(completedOrders[0]?.product?.name, daysAfterOrder)}

### Email Subject
"Halo [nama], Bagaimana Pengalaman Anda dengan [produk]? Beri Review Yuk! ⭐"

### WhatsApp
"Hai [nama]! 👋

Gimana kabar dengan [produk] yang ${daysAfterOrder} hari lalu kamu beli di Markaz-Arshy?

Kalau puas, boleh dong kasih review singkat di platform kami. Bantu user lain juga! ⭐

 Bonus: Dapat saldo Rp 5.000 untuk review kamu!

Terima kasih ya sudah trust Markaz-Arshy! 🙏"

---

## Testimonial Highlights (Social Proof)

${testimonialHighlights.map(t => `### ${t.user} — ${t.product}
${'⭐'.repeat(t.rating)} (${t.rating}/5)
"${t.comment}"
`).join('\n')}

## Langkah Selanjutnya
1. Notifikasi in-app sudah dikirim otomatis
2. Monitor review yang masuk dalam 3-7 hari ke depan
3. Approve review positif untuk ditampilkan di halaman produk
4. Follow up user yang belum merespon`;
    const reportPath = saveReportFile(`review_request_${Date.now()}.md`, reportContent);

    const metrics = {
      ordersWithoutReview: completedOrders.length,
      notificationsSent: notifCount,
      positiveReviewsUsed: testimonialHighlights.length,
      daysAfterOrder,
    };

    await generateReport(task.id, 'campaign', `Review Request: ${daysAfterOrder}d`, reportContent.slice(0, 500), metrics);
    await completeTask(task.id, metrics, reportPath);
    log('review_request', `Done: ${notifCount} notifications sent for ${completedOrders.length} orders`);

    return { notificationsSent: notifCount, reportPath, taskId: task.id };
  } catch (error) {
    await failTask(task.id, error.message);
    log('review_request', `Failed: ${error.message}`);
    throw error;
  }
}

function parseNotifications(rawResult, orders) {
  const map = new Map();
  const parts = rawResult.split(/---NOTIFICATION\s+(?:untuk|untuk)\s+(.+?)---/i);

  for (let i = 1; i < parts.length; i += 2) {
    const name = parts[i].trim();
    const message = (parts[i + 1] || '').split(/---/)[0]?.trim();
    if (message && message.length > 5) {
      // Find matching user
      const order = orders.find(o => o.user.name === name);
      if (order) {
        map.set(order.user.id, message.slice(0, 200));
      }
    }
  }

  return map;
}

function generateDefaultNotification(productName, daysAfterOrder) {
  return `Hai! Gimana kabar ${productName || 'produk'} yang ${daysAfterOrder} hari lalu kamu beli? Yuk beri review singkat dan dapatkan bonus saldo Rp 5.000! ⭐`;
}

export default runAgent;
