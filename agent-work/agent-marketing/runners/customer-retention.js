import prisma from '../../../backend/src/db.js';
import {
  AGENT_PROMPTS, createTask, startTask, completeTask, failTask,
  callAgentLLM, generateReport, saveReportFile, log,
} from '../../shared/agent-base.js';

/**
 * Customer Retention Agent (Agent 9)
 * Finds users inactive for 30+ days, segments by purchase type,
 * and generates comeback campaigns with discount codes.
 */
export async function runAgent(options = {}) {
  const inactiveDays = options.inactiveDays || 30;
  const incentive = options.inactive || 'discount';
  const task = await createTask('retention', `Customer Retention: ${inactiveDays}d inactive`, options, options.triggeredBy || 'cli');

  try {
    await startTask(task.id);
    log('retention', `Starting retention campaign (inactive: ${inactiveDays}+ days, incentive: ${incentive})...`);

    const cutoffDate = new Date(Date.now() - inactiveDays * 86400000);

    // Find inactive users (verified, has orders, but no recent activity)
    const inactiveUsers = await prisma.user.findMany({
      where: {
        isVerified: true,
        orders: { some: {} }, // Has at least one order ever
      },
      include: {
        orders: {
          where: { status: 'COMPLETED' },
          select: {
            id: true,
            amount: true,
            createdAt: true,
            product: { select: { name: true, type: true, category: { select: { name: true } } } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // Filter: last order is older than cutoff date
    const trulyInactive = inactiveUsers.filter(user => {
      if (user.orders.length === 0) return false;
      const lastOrder = user.orders[0]; // Already sorted desc
      return lastOrder.createdAt < cutoffDate;
    });

    log('retention', `Found ${trulyInactive.length} inactive users (${inactiveDays}+ days without order)`);

    if (trulyInactive.length === 0) {
      const msg = `Tidak ada user inactive ${inactiveDays}+ hari yang pernah order`;
      const reportContent = `# Customer Retention: ${inactiveDays}d inactive\n\n## Hasil\n- **Inactive Users:** 0\n- **Status:** ${msg}\n\n## Rekomendasi\n1. Semua user masih aktif — bagus!\n2. Jalankan upsell campaign untuk user aktif\n3. Pertimbangkan loyalty program untuk user repeat order`;
      const reportPath = saveReportFile(`retention_${inactiveDays}d_empty.md`, reportContent);
      await generateReport(task.id, 'campaign', `Customer Retention: ${inactiveDays}d — 0 inactive`, reportContent.slice(0, 500), { outreachCount: 0, inactiveUsers: 0 }, null, null);
      await completeTask(task.id, { outreachCount: 0, reason: msg }, reportPath);
      log('retention', msg);
      return { outreachCount: 0, taskId: task.id };
    }

    // Segment users by past purchase type
    const segments = segmentUsers(trulyInactive);
    log('retention', `Segments: SMM=${segments.smm.length}, Premium=${segments.premium.length}, Mixed=${segments.mixed.length}`);

    // Generate campaign for each segment
    const campaigns = [];

    for (const [segmentName, segmentUsers] of Object.entries(segments)) {
      if (segmentUsers.length === 0) continue;

      // Generate unique comeback code
      const comebackCode = `COMEBACK-${segmentName.toUpperCase().slice(0, 3)}-${generateCode()}`;

      const userSample = segmentUsers.slice(0, 10).map(u => ({
        nama: u.name,
        totalBelanja: u.orders.reduce((s, o) => s + o.amount, 0),
        totalOrder: u.orders.length,
        produkTerakhir: u.orders[0]?.product?.name || '-',
        hariInactive: Math.floor((Date.now() - u.orders[0].createdAt.getTime()) / 86400000),
      }));

      const userPrompt = `Buat kampanye comeback untuk user inactive di Markaz-Arshy.

## Segment: ${segmentName}
User sample (maksimal 10):
${JSON.stringify(userSample, null, 2)}

Total user di segment ini: ${segmentUsers.length}

## Detail Incentive
- Tipe: ${incentive}
- Kode diskon: ${comebackCode}
- Hari inactive: ${inactiveDays}+ hari

Buat:
1. **Email Comeback** — Personal, menunjukkan peduli, tawarkan incentive menarik
2. **WhatsApp Message** — Versi pendek, friendly, urgent
3. **Subject Line** — 3 opsi email subject yang compelling
4. **Personalisasi** — Sesuaikan berdasarkan produk terakhir yang mereka beli

Contoh incentive yang bisa disebutkan:
- Diskon 15% dengan kode ${comebackCode}
- Bonus saldo Rp 10.000 untuk deposit berikutnya
- Akses gratis ke layanan premium selama 3 hari

Semua dalam Bahasa Indonesia, tone friendly tapi profesional.`;

      const campaignContent = await callAgentLLM(task.id, 'retention', AGENT_PROMPTS.retention, userPrompt);

      campaigns.push({
        segment: segmentName,
        userCount: segmentUsers.length,
        comebackCode,
        content: campaignContent,
        users: segmentUsers.map(u => ({ id: u.id, name: u.name, email: u.email })),
      });
    }

    // Build report
    const reportContent = buildReport(campaigns, inactiveDays, incentive);
    const reportPath = saveReportFile(`retention_campaign_${Date.now()}.md`, reportContent);

    const metrics = {
      totalInactive: trulyInactive.length,
      inactiveDays,
      incentive,
      segmentsCount: Object.keys(segments).filter(k => segments[k].length > 0).length,
      campaignsGenerated: campaigns.length,
      comebackCodes: campaigns.map(c => c.comebackCode),
    };

    await generateReport(task.id, 'campaign', `Retention: ${inactiveDays}d inactive`, reportContent.slice(0, 500), metrics);
    await completeTask(task.id, metrics, reportPath);
    log('retention', `Done: ${campaigns.length} campaigns for ${trulyInactive.length} inactive users`);

    return { campaigns, reportPath, taskId: task.id };
  } catch (error) {
    await failTask(task.id, error.message);
    log('retention', `Failed: ${error.message}`);
    throw error;
  }
}

function segmentUsers(users) {
  const segments = { smm: [], premium: [], mixed: [] };

  for (const user of users) {
    const types = new Set(user.orders.map(o => o.product?.type).filter(Boolean));

    if (types.has('SMM') && !types.has('PREMIUM')) {
      segments.smm.push(user);
    } else if (types.has('PREMIUM') && !types.has('SMM')) {
      segments.premium.push(user);
    } else {
      segments.mixed.push(user);
    }
  }

  return segments;
}

function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function buildReport(campaigns, inactiveDays, incentive) {
  return `# Laporan Customer Retention Agent

## Ringkasan
- **Minimum Hari Inactive:** ${inactiveDays} hari
- **Tipe Incentive:** ${incentive}
- **Total User Inactive:** ${campaigns.reduce((s, c) => s + c.userCount, 0)}
- **Kampanye Dibuat:** ${campaigns.length}
- **Status:** BELUM DIKIRIM — Admin harus review dan kirim manual

## Detail per Segment

${campaigns.map(c => `### Segment: ${c.segment} (${c.userCount} user)
- Kode Diskon: **${c.comebackCode}**
- User Target: ${c.users.slice(0, 5).map(u => u.name).join(', ')}${c.userCount > 5 ? ` dan ${c.userCount - 5} lainnya` : ''}

#### Isi Kampanye:
${c.content.slice(0, 1000)}${c.content.length > 1000 ? '\n...(lihat laporan lengkap)' : ''}
`).join('\n---\n')}

## Semua Kode Diskon yang Dihasilkan
${campaigns.map(c => `- **${c.comebackCode}** — Segment ${c.segment} (${c.userCount} user)`).join('\n')}

## Langkah Selanjutnya
1. Review isi kampanye di atas
2. Setup kode diskon di system (atau admin input manual)
3. Kirim kampanye via email/WhatsApp ke target user
4. Monitor redemption rate kode diskon
5. Follow up user yang belum merespon setelah 3 hari`;
}

export default runAgent;
