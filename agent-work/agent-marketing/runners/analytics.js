import prisma from '../../../backend/src/db.js';
import {
  AGENT_PROMPTS, createTask, startTask, completeTask, failTask,
  callAgentLLM, generateReport, saveReportFile, log,
} from '../../shared/agent-base.js';
import { recordDailyMetrics, getCumulativeRevenue } from '../../shared/revenue-tracker.js';

/**
 * Analytics Agent (Agent 7)
 * Generates daily/weekly KPI reports with revenue tracking toward Rp 1 Miliar target.
 * Records daily metrics via revenue-tracker and saves RevenueMetric record.
 */
export async function runAgent(options = {}) {
  const period = options.period || 'daily';
  const task = await createTask('analytics', `Analytics Report: ${period}`, options, options.triggeredBy || 'cli');

  try {
    await startTask(task.id);
    log('analytics', `Starting ${period} analytics report...`);

    // Record today's metrics in RevenueMetric table
    const todayMetric = await recordDailyMetrics();
    log('analytics', `Recorded daily metrics: Revenue Rp ${(todayMetric.totalRevenue || 0).toLocaleString('id-ID')}`);

    // Get cumulative revenue toward Rp 1 Miliar target
    const cumulative = await getCumulativeRevenue();
    log('analytics', `Cumulative revenue: Rp ${cumulative.totalRevenue.toLocaleString('id-ID')} (${cumulative.targetProgress}% of target)`);

    const now = new Date();
    const periodStart = period === 'weekly'
      ? new Date(now.getTime() - 7 * 86400000)
      : new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Parallel queries for KPI data
    const [
      totalOrders,
      periodOrders,
      totalUsers,
      newUsers,
      activeResellers,
      recentDeposits,
      agentStats,
      topProducts,
    ] = await Promise.all([
      // Total orders
      prisma.order.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
        _count: { id: true },
      }),
      // Period orders
      prisma.order.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: periodStart },
        },
        _sum: { amount: true },
        _count: { id: true },
      }),
      // Total users
      prisma.user.count(),
      // New users in period
      prisma.user.count({
        where: { createdAt: { gte: periodStart } },
      }),
      // Active resellers (with completed orders in period)
      prisma.user.count({
        where: {
          role: 'RESELLER',
          orders: { some: { status: 'COMPLETED', createdAt: { gte: periodStart } } },
        },
      }),
      // Deposits in period
      prisma.deposit.aggregate({
        where: {
          status: 'CONFIRMED',
          createdAt: { gte: periodStart },
        },
        _sum: { amount: true },
        _count: { id: true },
      }),
      // Agent task stats
      prisma.agentTask.groupBy({
        by: ['agentType', 'status'],
        where: { createdAt: { gte: periodStart } },
        _count: { id: true },
      }),
      // Top products by revenue in period
      prisma.order.groupBy({
        by: ['productId'],
        where: {
          status: 'COMPLETED',
          createdAt: { gte: periodStart },
        },
        _count: { id: true },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
        take: 5,
      }),
    ]);

    // Enrich top products with names
    const enrichedTopProducts = [];
    for (const tp of topProducts) {
      const product = await prisma.product.findUnique({
        where: { id: tp.productId },
        select: { name: true, type: true },
      });
      enrichedTopProducts.push({
        name: product?.name || `Produk #${tp.productId}`,
        type: product?.type || '-',
        orders: tp._count.id,
        revenue: tp._sum.amount || 0,
      });
    }

    // Build metrics object
    const metrics = {
      period,
      periodStart: periodStart.toISOString(),
      periodEnd: now.toISOString(),
      revenue: {
        totalAllTime: cumulative.totalRevenue,
        periodRevenue: periodOrders._sum.amount || 0,
        targetProgress: cumulative.targetProgress,
        remainingToTarget: cumulative.remainingToTarget,
      },
      orders: {
        totalAllTime: totalOrders._count.id,
        periodOrders: periodOrders._count.id,
      },
      users: {
        total: totalUsers,
        newInPeriod: newUsers,
      },
      resellers: {
        activeInPeriod: activeResellers,
      },
      deposits: {
        periodTotal: recentDeposits._sum.amount || 0,
        periodCount: recentDeposits._count.id,
      },
      conversionRate: todayMetric.conversionRate,
    };

    // Generate LLM analysis
    const userPrompt = `Buat laporan analitik ${period === 'weekly' ? 'mingguan' : 'harian'} Markaz-Arshy:

## KPI Utama
- Revenue total: Rp ${cumulative.totalRevenue.toLocaleString('id-ID')}
- Target: Rp 1.000.000.000 (tercapai: ${cumulative.targetProgress}%)
- Revenue periode ini: Rp ${(periodOrders._sum.amount || 0).toLocaleString('id-ID')}
- Order periode ini: ${periodOrders._count.id}
- User baru: ${newUsers}
- User aktif: ${totalUsers}
- Reseller aktif: ${activeResellers}
- Deposit periode ini: Rp ${(recentDeposits._sum.amount || 0).toLocaleString('id-ID')}
- Conversion rate: ${(todayMetric.conversionRate || 0).toFixed(2)}%

## Top 5 Produk
${enrichedTopProducts.map((p, i) => `${i + 1}. ${p.name} (${p.type}): ${p.orders} order, Rp ${p.revenue.toLocaleString('id-ID')}`).join('\n')}

Buat analisis dalam Bahasa Indonesia:
1. **Ringkasan Eksekutif**: 2-3 kalimat tentang performa ${period}
2. **Highlight Positif**: Apa yang berjalan baik
3. **Area Perlu Perbaikan**: Apa yang bisa ditingkatkan
4. **Rekomendasi Aksi**: Langkah konkret untuk meningkatkan revenue
5. **Proyeksi**: Estimasi pencapaian target berdasarkan tren saat ini

Gunakan tabel dan bullet points untuk kemudahan dibaca.`;

    const analysis = await callAgentLLM(task.id, 'analytics', AGENT_PROMPTS.analytics, userPrompt);

    // Build markdown report
    const reportContent = `# Laporan Analitik ${period === 'weekly' ? 'Mingguan' : 'Harian'} — Markaz-Arshy

## Periode: ${periodStart.toLocaleDateString('id-ID')} — ${now.toLocaleDateString('id-ID')}

## KPI Dashboard

| Metrik | Nilai |
|--------|-------|
| Revenue Total | Rp ${cumulative.totalRevenue.toLocaleString('id-ID')} |
| Target | Rp 1.000.000.000 |
| Progres Target | ${cumulative.targetProgress}% |
| Sisa Target | Rp ${cumulative.remainingToTarget.toLocaleString('id-ID')} |
| Revenue Periode Ini | Rp ${(periodOrders._sum.amount || 0).toLocaleString('id-ID')} |
| Order Periode Ini | ${periodOrders._count.id} |
| User Baru | ${newUsers} |
| Total User | ${totalUsers} |
| Reseller Aktif | ${activeResellers} |
| Deposit Periode Ini | Rp ${(recentDeposits._sum.amount || 0).toLocaleString('id-ID')} |
| Conversion Rate | ${(todayMetric.conversionRate || 0).toFixed(2)}% |

## Top 5 Produk (Periode Ini)
${enrichedTopProducts.map((p, i) => `${i + 1}. **${p.name}** (${p.type}): ${p.orders} order — Rp ${p.revenue.toLocaleString('id-ID')}`).join('\n')}

---

## Analisis AI
${analysis}

---

## Record Metric
- RevenueMetric ID: ${todayMetric.id}
- Tanggal: ${todayMetric.date.toISOString().slice(0, 10)}`;

    const reportPath = saveReportFile(`analytics_${period}_${now.toISOString().slice(0, 10)}.md`, reportContent);

    await generateReport(task.id, 'daily', `Laporan ${period === 'weekly' ? 'Mingguan' : 'Harian'}: ${periodStart.toISOString().slice(0, 10)}`, reportContent.slice(0, 500), metrics, periodStart, now);
    await completeTask(task.id, metrics, reportPath);
    log('analytics', `Done: ${period} report generated (target: ${cumulative.targetProgress}%)`);

    return { metrics, reportPath, taskId: task.id };
  } catch (error) {
    await failTask(task.id, error.message);
    log('analytics', `Failed: ${error.message}`);
    throw error;
  }
}

export default runAgent;
