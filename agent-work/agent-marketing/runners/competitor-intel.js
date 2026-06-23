import prisma from '../../../backend/src/db.js';
import {
  AGENT_PROMPTS, createTask, startTask, completeTask, failTask,
  callAgentLLM, generateReport, saveReportFile, log,
} from '../../shared/agent-base.js';

/**
 * Competitor Intelligence Agent (Agent 5)
 * Analyzes product pricing against market and generates pricing recommendations.
 * Queries all active products and produces a markdown report.
 */
export async function runAgent(options = {}) {
  const categories = options.categories || [];
  const task = await createTask('competitor', `Competitor Intel: ${categories.length ? categories.join(', ') : 'Semua Kategori'}`, options, options.triggeredBy || 'cli');

  try {
    await startTask(task.id);
    log('competitor', `Starting competitor analysis${categories.length ? ` for categories: ${categories.join(', ')}` : ''}...`);

    // Query active products, optionally filtered by category
    const whereClause = {
      isActive: true,
      ...(categories.length > 0 && {
        category: { name: { in: categories } },
      }),
    };

    const products = await prisma.product.findMany({
      where: whereClause,
      include: { category: true, orders: { where: { status: 'COMPLETED' }, select: { id: true, amount: true } } },
      orderBy: { category: { name: 'asc' } },
    });

    log('competitor', `Found ${products.length} active products to analyze`);

    if (products.length === 0) {
      const msg = 'Tidak ada produk aktif ditemukan';
      const reportContent = `# Competitor Intel Analysis\n\n## Hasil\n- **Produk Dianalisis:** 0\n- **Status:** ${msg}\n\n## Rekomendasi\n1. Pastikan katalog produk sudah di-sync dari provider\n2. Jalankan sinkronisasi katalog terlebih dahulu\n3. Atau cek filter category yang dipakai`;
      const reportPath = saveReportFile('competitor_intel_empty.md', reportContent);
      await generateReport(task.id, 'campaign', 'Competitor Intel — 0 products', reportContent.slice(0, 500), { analyzed: 0 }, null, null);
      await completeTask(task.id, { analyzed: 0, reason: msg }, reportPath);
      log('competitor', 'Tidak ada produk untuk dianalisis');
      return { analyzed: 0, taskId: task.id };
    }

    // Build product data for LLM analysis
    const productData = products.map(p => ({
      nama: p.name,
      kategori: p.category?.name || '-',
      tipe: p.type,
      hargaUser: p.priceUser,
      hargaReseller: p.priceReseller,
      totalOrder: p.orders.length,
      totalRevenue: p.orders.reduce((sum, o) => sum + o.amount, 0),
      providerServiceId: p.providerServiceId || '-',
      isActive: p.isActive,
    }));

    const userPrompt = `Analisis kompetitif produk-produk Markaz-Arshy berikut:

${JSON.stringify(productData, null, 2)}

Tugas analisis:
1. **Benchmark Harga**: Bandingkan harga tiap produk dengan range harga pasar Indonesia (SMM panel dan premium accounts). Berdasarkan pengalaman, harga pasar:
   - Instagram Followers 1K: Rp 5.000-15.000
   - TikTok Followers 1K: Rp 8.000-20.000
   - YouTube Subscribers 1K: Rp 15.000-40.000
   - Netflix Premium 1 bulan: Rp 25.000-45.000
   - Spotify Premium 1 bulan: Rp 10.000-20.000
   - ChatGPT Plus 1 bulan: Rp 30.000-60.000

2. **Margin Analysis**: Hitung potensi margin untuk tiap produk
3. **Rekomendasi Harga**: Sertakan harga optimal dan strategi pricing
4. **Produk Potensial**: Identifikasi produk yang underpriced atau overpriced
5. **Saran Penambahan Produk**: Produk baru yang bisa ditambahkan

Format output dalam markdown yang terstruktur dengan tabel.`;

    const analysis = await callAgentLLM(task.id, 'competitor', AGENT_PROMPTS.competitor, userPrompt);

    // Calculate summary statistics
    const totalRevenue = products.reduce((sum, p) => sum + p.orders.reduce((s, o) => s + o.amount, 0), 0);
    const avgPrice = Math.round(products.reduce((sum, p) => sum + p.priceUser, 0) / products.length);
    const avgResellerPrice = Math.round(products.reduce((sum, p) => sum + p.priceReseller, 0) / products.length);

    const categoryBreakdown = {};
    for (const p of products) {
      const cat = p.category?.name || 'Uncategorized';
      if (!categoryBreakdown[cat]) {
        categoryBreakdown[cat] = { count: 0, totalRevenue: 0, avgPrice: 0 };
      }
      categoryBreakdown[cat].count++;
      categoryBreakdown[cat].totalRevenue += p.orders.reduce((s, o) => s + o.amount, 0);
    }
    for (const cat of Object.keys(categoryBreakdown)) {
      categoryBreakdown[cat].avgPrice = Math.round(categoryBreakdown[cat].totalRevenue / categoryBreakdown[cat].count || 0);
    }

    // Save report
    const reportContent = `# Laporan Competitor Intelligence Agent

## Ringkasan Eksekutif
- **Total Produk Dianalisis:** ${products.length}
- **Total Revenue (semua order):** Rp ${totalRevenue.toLocaleString('id-ID')}
- **Harga Rata-rata User:** Rp ${avgPrice.toLocaleString('id-ID')}
- **Harga Rata-rata Reseller:** Rp ${avgResellerPrice.toLocaleString('id-ID')}

## Breakdown per Kategori
${Object.entries(categoryBreakdown).map(([cat, data]) => `- **${cat}**: ${data.count} produk, Revenue Rp ${data.totalRevenue.toLocaleString('id-ID')}`).join('\n')}

## Data Produk
| Nama | Kategori | Harga User | Harga Reseller | Total Order | Revenue |
|------|----------|------------|----------------|-------------|---------|
${products.map(p => `| ${p.name} | ${p.category?.name || '-'} | Rp ${p.priceUser.toLocaleString('id-ID')} | Rp ${p.priceReseller.toLocaleString('id-ID')} | ${p.orders.length} | Rp ${p.orders.reduce((s, o) => s + o.amount, 0).toLocaleString('id-ID')} |`).join('\n')}

---

## Analisis Kompetitif dari LLM
${analysis}`;

    const reportPath = saveReportFile(`competitor_intel_${Date.now()}.md`, reportContent);

    const metrics = {
      totalProducts: products.length,
      totalRevenue,
      avgPrice,
      categoriesAnalyzed: Object.keys(categoryBreakdown),
    };

    await generateReport(task.id, 'campaign', 'Competitor Intelligence Report', reportContent.slice(0, 500), metrics);
    await completeTask(task.id, metrics, reportPath);
    log('competitor', `Done: analyzed ${products.length} products, report saved`);

    return { products: products.length, reportPath, taskId: task.id };
  } catch (error) {
    await failTask(task.id, error.message);
    log('competitor', `Failed: ${error.message}`);
    throw error;
  }
}

export default runAgent;
