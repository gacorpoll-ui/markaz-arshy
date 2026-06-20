import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { getRajaitemPrepaidServices } from './src/utils/rajaitemService.js';

dotenv.config();
const prisma = new PrismaClient();

function getCategoryFromProductName(productName, defaultCategory, id) {
  const nameLower = productName.toLowerCase();
  const idStr = String(id);
  const netflixIds = ['919', '918', '815', '708', '707', '706', '705', '704', '543', '542', 'NETFLIX1M'];
  
  if (nameLower.includes('netflix') || netflixIds.includes(idStr) || nameLower.startsWith('profile shared') || nameLower.startsWith('profile private') || nameLower.startsWith('voucher netflix')) return 'Netflix Premium';
  if (nameLower.includes('youtube')) return 'YouTube Premium';
  if (nameLower.includes('canva')) return 'Canva Pro';
  if (nameLower.includes('gemini') || nameLower.includes('google one')) return 'Google Gemini';
  if (nameLower.includes('capcut')) return 'CapCut Pro';
  if (nameLower.includes('chatgpt')) return 'ChatGPT Plus';
  if (nameLower.includes('vidio')) return 'Vidio Premier';
  if (nameLower.includes('wetv')) return 'WeTV Premium';
  if (nameLower.includes('grok')) return 'SuperGrok Pro';
  const viuIds = ['734', '733', '408', '407', '406', 'VIU1M'];
  if (nameLower.includes('viu') || viuIds.includes(idStr)) return 'Viu Premium';
  if (nameLower.includes('bstation')) return 'Bstation Premium';
  if (nameLower.includes('disney') || nameLower.includes('hotstar') || nameLower.includes('disney hotstar')) return 'Disney+ Hotstar';
  if (nameLower.includes('spotify')) return 'Spotify Premium';
  if (nameLower.includes('zoom')) return 'Zoom Premium';
  if (nameLower.includes('apple music')) return 'Apple Music';
  if (nameLower.includes('nord vpn') || nameLower.includes('nordvpn')) return 'Nord VPN';
  if (nameLower.includes('scribd')) return 'Scribd Premium';
  if (nameLower.includes('duolingo')) return 'Duolingo Premium';
  if (nameLower.includes('claude')) return 'Claude AI';
  if (nameLower.includes('dropbox')) return 'Dropbox Premium';
  
  return defaultCategory;
}

async function syncRajaitemServices() {
  console.log("=== MEMULAI SINKRONISASI PRODUK PREMIUM RAJAITEM ===");
  try {
    const response = await getRajaitemPrepaidServices();
    
    if (!response || !response.status) {
      console.error("Gagal mendapatkan produk dari Rajaitem:", response ? response.message : "Tidak ada respon");
      return;
    }

    const services = response.data;
    if (!services || !Array.isArray(services)) {
      console.error("Format data produk Rajaitem tidak valid (bukan array):", services);
      return;
    }

    console.log(`Berhasil mendapatkan ${services.length} produk prabayar/premium dari Rajaitem.`);

    let stats = { created: 0, updated: 0 };

    for (const service of services) {
      // Lewati jika kategori atau kode kosong
      const serviceCode = service.id || service.code;
      if (!service.category || !serviceCode) continue;

      const productName = service.product || service.name;

      // 1. Dapatkan atau Buat Kategori (Dipetakan dinamis sesuai brand produk)
      const categoryName = getCategoryFromProductName(productName, service.category, serviceCode);
      const categorySlug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      let category = await prisma.category.findUnique({ where: { slug: categorySlug } });

      if (!category) {
        category = await prisma.category.create({
          data: {
            name: categoryName,
            slug: categorySlug,
            type: 'PREMIUM',
            order: 1
          }
        });
        console.log(`[Category] Kategori PREMIUM baru dibuat: ${categoryName}`);
      }

      // 2. Buat atau Update Produk
      const productSlug = `premium-${String(serviceCode).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      
      // Ambil harga dari Rajaitem (member price & reseller price jika ada)
      let basePriceMember = 0;
      let basePriceReseller = 0;

      if (service.price && typeof service.price === 'object') {
        basePriceMember = parseFloat(service.price.normal || 0);
        basePriceReseller = parseFloat(service.price.reseller || service.price.vip || 0);
      } else {
        basePriceMember = parseFloat(service.price_member || service.member_price || service.price || service.rate || 0);
        basePriceReseller = parseFloat(service.price_reseller || service.reseller_price || service.price || service.rate || 0);
      }
      
      if (basePriceMember <= 0) {
        console.warn(`[Product] Lewati ${productName} karena harga tidak valid (${basePriceMember})`);
        continue;
      }

      // Markup harga: 20% untuk user biasa (dari harga member Rajaitem), 10% untuk reseller (dari harga reseller Rajaitem)
      const priceUser = Math.ceil(basePriceMember * 1.20);
      const priceReseller = Math.ceil(basePriceReseller * 1.10);

      // Tentukan apakah produk Tersedia atau Gangguan
      const isAvailable = service.status === 'On' || service.status === 'active' || service.status === 'sukses' || service.status === 'tersedia' || service.status === true;
      const providerStatus = isAvailable ? 'Tersedia' : 'Gangguan';

      const productData = {
        categoryId: category.id,
        name: productName,
        slug: productSlug,
        description: `Layanan premium otomatis untuk ${productName}. Pemrosesan instant via H2H.`,
        priceUser: priceUser,
        priceReseller: priceReseller,
        type: 'PREMIUM',
        providerServiceId: String(serviceCode),
        minOrder: 1,
        maxOrder: 1,
        isActive: true, // Produk tetap diposting/ditampilkan di katalog
        providerStatus: providerStatus
      };

      const existingProduct = await prisma.product.findFirst({
        where: { providerServiceId: String(serviceCode), type: 'PREMIUM' }
      });

      if (existingProduct) {
        await prisma.product.update({
          where: { id: existingProduct.id },
          data: productData
        });
        stats.updated++;
      } else {
        await prisma.product.create({
          data: productData
        });
        stats.created++;
      }
    }

    console.log(`Sinkronisasi Premium Selesai! Dibuat: ${stats.created}, Diupdate: ${stats.updated}`);

  } catch (err) {
    console.error("Gagal melakukan sinkronisasi produk Rajaitem:", err);
  } finally {
    await prisma.$disconnect();
  }
}

syncRajaitemServices();
