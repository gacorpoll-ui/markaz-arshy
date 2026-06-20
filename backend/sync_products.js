import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

const LOLIPOP_API_URL = process.env.LOLIPOP_API_URL || "https://lollipop-smm.com/api/v2";
const LOLIPOP_API_KEY = process.env.LOLIPOP_API_KEY;

async function syncLolipopServices() {
  if (!LOLIPOP_API_KEY) {
    console.error("LOLIPOP_API_KEY tidak ditemukan di file .env");
    process.exit(1);
  }

  console.log("Mengambil layanan dari Lolipop SMM...");
  try {
    const response = await fetch(LOLIPOP_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: LOLIPOP_API_KEY,
        action: 'services'
      })
    });

    const services = await response.json();
    
    if (services.error) {
      console.error("API Error:", services.error);
      return;
    }

    console.log(`Berhasil mendapatkan ${services.length} layanan dari Lolipop SMM.`);

    // Kita akan menyinkronkan seluruh layanan dari Lolipop SMM
    const servicesToSync = services;

    let stats = { created: 0, updated: 0 };

    for (const service of servicesToSync) {
      // Lewati jika kategori kosong
      if (!service.category) continue;

      // 1. Bersihkan dan buat Hierarki Kategori
      // Lolipop biasanya memiliki format "TikTok Followers [Indonesian]"
      const categoryName = service.category;
      const categorySlug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      let category = await prisma.category.findUnique({ where: { slug: categorySlug } });

      if (!category) {
        category = await prisma.category.create({
          data: {
            name: categoryName,
            slug: categorySlug,
            type: 'SMM',
            order: 0
          }
        });
      }

      // 2. Buat atau Update Produk
      const productSlug = `${categorySlug}-svc-${service.service}`;

      // Harga di API Lolipop adalah rate (per 1000 unit)
      // Disini kita akan simpan rate per 1000 untuk frontend,
      // supaya harganya masuk akal dan gampang dibaca.
      const basePricePer1000 = parseFloat(service.rate);
      const priceUser = basePricePer1000 + (basePricePer1000 * 0.2); // Untung 20%
      const priceReseller = basePricePer1000 + (basePricePer1000 * 0.1); // Untung 10%

      const productData = {
        categoryId: category.id,
        name: service.name,
        slug: productSlug,
        description: service.description || `Layanan untuk ${service.name}. Minimum pemesanan: ${service.min}, Maksimum: ${service.max}.`,
        priceUser: priceUser,
        priceReseller: priceReseller,
        type: 'SMM',
        providerServiceId: String(service.service),
        minOrder: parseInt(service.min),
        maxOrder: parseInt(service.max),
        isActive: true
      };

      const existingProduct = await prisma.product.findFirst({
        where: { providerServiceId: String(service.service) }
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

    console.log(`Sinkronisasi SMM Selesai! Dibuat: ${stats.created}, Diupdate: ${stats.updated}`);

  } catch (err) {
    console.error("Gagal melakukan sinkronisasi:", err);
  } finally {
    await prisma.$disconnect();
  }
}

syncLolipopServices();
