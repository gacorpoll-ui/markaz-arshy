import prisma from '../../../backend/src/db.js';
import {
  AGENT_PROMPTS, createTask, startTask, completeTask, failTask,
  callAgentLLM, generateReport, saveReportFile, log,
} from '../../shared/agent-base.js';

/**
 * Upsell Agent (Agent 10)
 * Cross-sells based on purchase history:
 * - SMM buyers get premium account offers
 * - Premium buyers get SMM offers
 * Generates personalized upsell content for each segment.
 */
export async function runAgent(options = {}) {
  const strategy = options.strategy || 'complementary';
  const task = await createTask('upsell', `Upsell: ${strategy}`, options, options.triggeredBy || 'cli');

  try {
    await startTask(task.id);
    log('upsell', `Starting upsell campaign (strategy: ${strategy})...`);

    // Find SMM buyers (for premium upsell) and Premium buyers (for SMM upsell)
    const smmBuyers = await prisma.user.findMany({
      where: {
        isVerified: true,
        orders: {
          some: {
            status: 'COMPLETED',
            product: { type: 'SMM' },
          },
        },
      },
      include: {
        orders: {
          where: { status: 'COMPLETED' },
          include: { product: { select: { name: true, type: true, priceUser: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    const premiumBuyers = await prisma.user.findMany({
      where: {
        isVerified: true,
        orders: {
          some: {
            status: 'COMPLETED',
            product: { type: 'PREMIUM' },
          },
        },
      },
      include: {
        orders: {
          where: { status: 'COMPLETED' },
          include: { product: { select: { name: true, type: true, priceUser: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // Exclude users who already bought from both categories
    const smmOnly = smmBuyers.filter(u => !u.orders.some(o => o.product?.type === 'PREMIUM'));
    const premiumOnly = premiumBuyers.filter(u => !u.orders.some(o => o.product?.type === 'SMM'));
    const both = smmBuyers.filter(u => u.orders.some(o => o.product?.type === 'PREMIUM'));

    log('upsell', `SMM-only: ${smmOnly.length}, Premium-only: ${premiumOnly.length}, Both: ${both.length}`);

    // Get product catalogs for cross-selling suggestions
    const [smmProducts, premiumProducts] = await Promise.all([
      prisma.product.findMany({
        where: { isActive: true, type: 'SMM' },
        include: { category: true },
        take: 10,
      }),
      prisma.product.findMany({
        where: { isActive: true, type: 'PREMIUM' },
        include: { category: true },
        take: 10,
      }),
    ]);

    const premiumCatalog = premiumProducts
      .map(p => `- ${p.name} — Rp ${p.priceUser.toLocaleString('id-ID')}/bulan (${p.category?.name || '-'})`)
      .join('\n');

    const smmCatalog = smmProducts
      .map(p => `- ${p.name} — Rp ${p.priceUser.toLocaleString('id-ID')}/1K (${p.category?.name || '-'})`)
      .join('\n');

    const upsellCampaigns = [];

    // Campaign 1: SMM buyers -> Premium upsell
    if (smmOnly.length > 0) {
      const smmSample = smmOnly.slice(0, 10).map(u => ({
        nama: u.name,
        produkSMM: u.orders.filter(o => o.product?.type === 'SMM').slice(0, 3).map(o => o.product?.name),
        totalBelanja: u.orders.reduce((s, o) => s + o.amount, 0),
      }));

      const userPrompt = `Buat kampanye upsell untuk pengguna SMM Markaz-Arshy agar tertarik menggunakan Premium Accounts.

## Target: ${smmOnly.length} user yang hanya beli produk SMM
Sample user:
${JSON.stringify(smmSample, null, 2)}

## Katalog Premium Accounts:
${premiumCatalog}

## Strategi: ${strategy}
Buat konten upsell yang:
1. Tunjukkan hubungan natural antara SMM dan Premium (misal: "Sudah punya followers? Saqya punya Netflix Premium untuk hiburan!")
2. Tawarkan bundle deal (SMM + Premium = diskon)
3. Highlight value proposition Premium accounts
4. Personalisasi berdasarkan produk SMM yang pernah mereka beli

Buat:
- Email upsell (subject + body)
- WhatsApp message
- 3 variasi CTA

Semua Bahasa Indonesia.`;

      const campaign = await callAgentLLM(task.id, 'upsell', AGENT_PROMPTS.upsell, userPrompt);
      upsellCampaigns.push({
        segment: 'smm_to_premium',
        userCount: smmOnly.length,
        content: campaign,
      });
    }

    // Campaign 2: Premium buyers -> SMM upsell
    if (premiumOnly.length > 0) {
      const premiumSample = premiumOnly.slice(0, 10).map(u => ({
        nama: u.name,
        produkPremium: u.orders.filter(o => o.product?.type === 'PREMIUM').slice(0, 3).map(o => o.product?.name),
        totalBelanja: u.orders.reduce((s, o) => s + o.amount, 0),
      }));

      const userPrompt = `Buat kampanye upsell untuk pengguna Premium Accounts Markaz-Arshy agar tertarik menggunakan layanan SMM.

## Target: ${premiumOnly.length} user yang hanya beli produk Premium
Sample user:
${JSON.stringify(premiumSample, null, 2)}

## Katalog SMM Services:
${smmCatalog}

## Strategi: ${strategy}
Buat konten upsell yang:
1. Tunjukkan value SMM untuk complement premium usage (misal: "Netflix sudah aktif? Saatnya naikkan followers Instagram!")
2. Tawarkan paket combo
3. Highlight kemudahan dan harga terjangkau SMM
4. Personalisasi berdasarkan produk premium yang mereka miliki

Buat:
- Email upsell (subject + body)
- WhatsApp message
- 3 variasi CTA

Semua Bahasa Indonesia.`;

      const campaign = await callAgentLLM(task.id, 'upsell', AGENT_PROMPTS.upsell, userPrompt);
      upsellCampaigns.push({
        segment: 'premium_to_smm',
        userCount: premiumOnly.length,
        content: campaign,
      });
    }

    // Build report
    const reportContent = `# Laporan Upsell Agent

## Ringkasan
- **Strategi:** ${strategy}
- **User SMM-only (target premium upsell):** ${smmOnly.length}
- **User Premium-only (target SMM upsell):** ${premiumOnly.length}
- **User Both (sudah beli keduanya):** ${both.length}
- **Kampanye Dibuat:** ${upsellCampaigns.length}

## Detail Kampanye

${upsellCampaigns.map(c => `### Segment: ${c.segment} (${c.userCount} user)

${c.content}
`).join('\n---\n')}

## Statistik Cross-Sell
| Segmen | Jumlah User | Potensi Revenue |
|--------|-------------|-----------------|
| SMM-only -> Premium | ${smmOnly.length} | ~Rp ${(smmOnly.length * 25000).toLocaleString('id-ID')}/bulan |
| Premium-only -> SMM | ${premiumOnly.length} | ~Rp ${(premiumOnly.length * 15000).toLocaleString('id-ID')}/bulan |
| Sudah keduanya | ${both.length} | Repeat purchase |

## Langkah Selanjutnya
1. Review konten kampanye upsell di atas
2. Kirim via email/WhatsApp ke target user
3. Setup bundle discount di system
4. Monitor conversion rate upsell per segment
5. A/B test variasi CTA yang paling efektif`;

    const reportPath = saveReportFile(`upsell_${strategy}_${Date.now()}.md`, reportContent);

    const metrics = {
      strategy,
      smmOnlyCount: smmOnly.length,
      premiumOnlyCount: premiumOnly.length,
      bothCount: both.length,
      campaignsGenerated: upsellCampaigns.length,
    };

    await generateReport(task.id, 'campaign', `Upsell: ${strategy}`, reportContent.slice(0, 500), metrics);
    await completeTask(task.id, metrics, reportPath);
    log('upsell', `Done: ${upsellCampaigns.length} campaigns for ${smmOnly.length + premiumOnly.length} users`);

    return { campaigns: upsellCampaigns, reportPath, taskId: task.id };
  } catch (error) {
    await failTask(task.id, error.message);
    log('upsell', `Failed: ${error.message}`);
    throw error;
  }
}

export default runAgent;
