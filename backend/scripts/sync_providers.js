import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const LOLIPOP_API_URL = process.env.LOLIPOP_API_URL || "https://lollipop-smm.com/api/v2";
const LOLIPOP_API_KEY = process.env.LOLIPOP_API_KEY;

async function syncLolipopPrices() {
  console.log('=== Sync Harga Lolipop SMM ===');

  if (!LOLIPOP_API_KEY) {
    console.log('❌ LOLIPOP_API_KEY tidak dikonfigurasi');
    return;
  }

  try {
    const response = await fetch(LOLIPOP_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: LOLIPOP_API_KEY, action: 'services' })
    });
    const services = await response.json();

    if (!Array.isArray(services)) {
      console.log('❌ Response Lolipop tidak valid');
      return;
    }

    console.log(`✅ Mendapat ${services.length} layanan dari Lolipop`);

    let updated = 0;
    let matched = 0;

    for (const svc of services) {
      const serviceId = String(svc.service);
      const lolipopRate = Math.round(parseFloat(svc.rate));

      const product = await prisma.product.findFirst({
        where: { providerServiceId: serviceId, type: 'SMM' }
      });

      if (product) {
        matched++;

        // Markup 20% untuk user, 10% untuk reseller
        const newPriceUser = lolipopRate + Math.round(lolipopRate * 0.2);
        const newPriceReseller = lolipopRate + Math.round(lolipopRate * 0.1);

        // Update jika harga berubah
        if (product.priceUser !== newPriceUser || product.priceReseller !== newPriceReseller) {
          await prisma.product.update({
            where: { id: product.id },
            data: {
              priceUser: newPriceUser,
              priceReseller: newPriceReseller,
              minOrder: svc.min || product.minOrder,
              maxOrder: svc.max || product.maxOrder,
            }
          });
          updated++;
        }
      }
    }

    console.log(`📊 Produk cocok: ${matched}`);
    console.log(`🔄 Harga diupdate: ${updated}`);

  } catch (error) {
    console.error('❌ Error sync Lolipop:', error.message);
  }
}

async function syncRajaitemProducts() {
  console.log('\n=== Sync Produk Rajaitem ===');

  const RAJAITEM_API_KEY = process.env.RAJAITEM_API_KEY;
  if (!RAJAITEM_API_KEY) {
    console.log('❌ RAJAITEM_API_KEY tidak dikonfigurasi');
    return;
  }

  // Rajaitem digunakan untuk PREMIUM H2H — tidak perlu sync harga,
  // karena harga sudah diatur manual di database
  const premiumWithProvider = await prisma.product.count({
    where: { type: 'PREMIUM', NOT: { providerServiceId: null } }
  });
  console.log(`✅ ${premiumWithProvider} produk PREMIUM siap H2H via Rajaitem`);
}

async function main() {
  console.log('🚀 Memulai sinkronisasi provider...\n');

  await syncLolipopPrices();
  await syncRajaitemProducts();

  console.log('\n✅ Sinkronisasi selesai!');
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Fatal:', e.message);
  await prisma.$disconnect();
  process.exit(1);
});
