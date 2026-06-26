import prisma from '../../../backend/src/db.js';
import {
  AGENT_PROMPTS, createTask, startTask, completeTask, failTask,
  callAgentLLM, generateReport, saveReportFile, log,
} from '../../shared/agent-base.js';

/**
 * Dynamic Pricing Agent (Agent 6)
 * Analyzes order patterns from the last 30 days and generates pricing suggestions.
 * Never auto-applies changes — outputs structured JSON recommendations.
 */
export async function runAgent(options = {}) {
  const mode = options.mode || 'analysis';
  const task = await createTask('dynamic_pricing', `Dynamic Pricing: ${mode}`, options, options.triggeredBy || 'cli');

  try {
    await startTask(task.id);
    log('dynamic_pricing', `Starting pricing analysis (mode: ${mode})...`);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);

    // Query order patterns: demand by hour of day
    const ordersByHour = await prisma.$queryRawUnsafe(`
      SELECT
        strftime('%H', createdAt) as hour,
        COUNT(*) as order_count,
        SUM(amount) as total_amount
      FROM Order
      WHERE status = 'COMPLETED'
        AND createdAt >= ?
      GROUP BY strftime('%H', createdAt)
      ORDER BY hour
    `, thirtyDaysAgo.toISOString());

    // Query order patterns: demand by day of week
    const ordersByDay = await prisma.$queryRawUnsafe(`
      SELECT
        strftime('%w', createdAt) as day_of_week,
        COUNT(*) as order_count,
        SUM(amount) as total_amount
      FROM Order
      WHERE status = 'COMPLETED'
        AND createdAt >= ?
      GROUP BY strftime('%w', createdAt)
      ORDER BY day_of_week
    `, thirtyDaysAgo.toISOString());

    // Query top products by demand in last 7 days
    const topProducts = await prisma.order.groupBy({
      by: ['productId'],
      where: {
        status: 'COMPLETED',
        createdAt: { gte: sevenDaysAgo },
      },
      _count: { id: true },
      _sum: { amount: true },
      _avg: { quantity: true },
      orderBy: { _count: { id: 'desc' } },
      take: 15,
    });

    // Enrich with product details
    const enrichedProducts = [];
    for (const tp of topProducts) {
      const product = await prisma.product.findUnique({
        where: { id: tp.productId },
        include: { category: true },
      });
      if (product) {
        enrichedProducts.push({
          nama: product.name,
          kategori: product.category?.name || '-',
          hargaSaatIni: product.priceUser,
          hargaReseller: product.priceReseller,
          totalOrder7Hari: tp._count.id,
          revenue7Hari: tp._sum.amount || 0,
          avgQuantity: Math.round(tp._avg.quantity || 0),
        });
      }
    }

    // Query recent price changes if any (from last order amounts vs list price)
    const recentOrders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: sevenDaysAgo },
      },
      include: { product: { select: { name: true, priceUser: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    const userPrompt = `Analisis pola demand dan pricing Markaz-Arshy (30 hari terakhir):

## Pola Order per Jam
${JSON.stringify(ordersByHour, null, 2)}

## Pola Order per Hari
${JSON.stringify(ordersByDay.map(d => ({
      hari: dayNames[d.day_of_week] || d.day_of_week,
      jumlahOrder: d.order_count,
      totalRevenue: d.total_amount,
    })), null, 2)}

## Top 15 Produk (7 Hari Terakhir)
${JSON.stringify(enrichedProducts, null, 2)}

## Sample Order Terakhir
${recentOrders.slice(0, 20).map(o => `${o.product?.name}: Rp ${o.amount} (qty: ${o.quantity}, tgl: ${o.createdAt.toISOString().slice(0, 10)})`).join('\n')}

Buat rekomendasi pricing:
1. **Peak Hours Discount**: Jam berapa demand tinggi? Suggest dynamic pricing saat peak/off-peak
2. **Product Pricing**: Produk mana yang underpriced vs overpriced berdasarkan demand
3. **Bundle Suggestions**: Produk yang sering dibeli bersamaan, suggest bundle pricing
4. **Weekly Promotions**: Hari apa yang sebaiknya ada promo khusus
5. **Reseller Margin**: Rekomendasi margin reseller

Output dalam format JSON yang terstruktur:
{
  "recommendations": [
    {
      "product": "nama",
      "currentPrice": 0,
      "suggestedPrice": 0,
      "reason": "alasan",
      "priority": "high/medium/low",
      "estimatedImpact": "deskripsi"
    }
  ],
  "peakHours": [...],
  "weeklyStrategy": {...},
  "bundleSuggestions": [...]
}

Catatan: ini HANYA rekomendasi. JANGAN auto-apply. Admin akan review dan approve setiap perubahan harga.`;

    const rawResult = await callAgentLLM(task.id, 'dynamic_pricing', AGENT_PROMPTS.dynamic_pricing, userPrompt);

    // Try to extract JSON recommendations
    let recommendations = null;
    try {
      const jsonMatch = rawResult.match(/\{[\s\S]*"recommendations"[\s\S]*\}/);
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // JSON parsing failed — use raw output
    }

    // Build report
    const reportContent = `# Laporan Dynamic Pricing Agent

## Ringkasan
- **Periode Analisis:** 30 hari terakhir
- **Mode:** ${mode}
- **Produk Dianalisis:** ${enrichedProducts.length}
- **Total Order (7 Hari):** ${topProducts.reduce((s, p) => s + p._count.id, 0)}

## Pola Demand per Jam
${ordersByHour.map(h => `- Jam ${String(h.hour).padStart(2, '0')}:00 — ${h.order_count} order, Rp ${(h.total_amount || 0).toLocaleString('id-ID')}`).join('\n')}

## Pola Demand per Hari
${ordersByDay.map(d => `- ${dayNames[d.day_of_week] || '?'}: ${d.order_count} order, Rp ${(d.total_amount || 0).toLocaleString('id-ID')}`).join('\n')}

## Top Produk (7 Hari)
${enrichedProducts.map(p => `- **${p.nama}** (${p.kategori}): ${p.totalOrder7Hari} order, Rp ${p.revenue7Hari.toLocaleString('id-ID')}`).join('\n')}

---

## Rekomendasi dari AI
${recommendations ? JSON.stringify(recommendations, null, 2) : rawResult}

---

## Catatan Penting
Rekomendasi ini bersifat **saran saja**. Tidak ada perubahan harga yang diterapkan otomatis. Admin harus review dan approve setiap perubahan harga melalui dashboard.`;

    const reportPath = saveReportFile(`dynamic_pricing_${Date.now()}.md`, reportContent);

    const metrics = {
      productsAnalyzed: enrichedProducts.length,
      totalOrders7Days: topProducts.reduce((s, p) => s + p._count.id, 0),
      totalRevenue7Days: topProducts.reduce((s, p) => s + (p._sum.amount || 0), 0),
      recommendationsCount: recommendations?.recommendations?.length || 0,
    };

    await generateReport(task.id, 'campaign', `Dynamic Pricing: ${mode}`, reportContent.slice(0, 500), metrics);
    await completeTask(task.id, metrics, reportPath);
    log('dynamic_pricing', `Done: ${enrichedProducts.length} products analyzed, report saved`);

    return { recommendations, reportPath, taskId: task.id };
  } catch (error) {
    await failTask(task.id, error.message);
    log('dynamic_pricing', `Failed: ${error.message}`);
    throw error;
  }
}

export default runAgent;
