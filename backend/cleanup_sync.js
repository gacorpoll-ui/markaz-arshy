import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

const LOLIPOP_API_URL = process.env.LOLIPOP_API_URL || "https://lollipop-smm.com/api/v2";
const LOLIPOP_API_KEY = process.env.LOLIPOP_API_KEY;

async function cleanupSync() {
  try {
    const response = await fetch(LOLIPOP_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: LOLIPOP_API_KEY, action: 'services' })
    });
    const lolipopServices = await response.json();
    const activeServiceIds = lolipopServices.map(s => String(s.service));

    // Dapatkan semua produk SMM di database kita
    const localSmmProducts = await prisma.product.findMany({
      where: { type: 'SMM' }
    });

    let deactivatedCount = 0;

    for (const product of localSmmProducts) {
      if (!activeServiceIds.includes(product.providerServiceId)) {
        // Jika produk di database kita tidak ada di daftar layanan Lolipop yang aktif, kita nonaktifkan
        await prisma.product.update({
          where: { id: product.id },
          data: { isActive: false }
        });
        deactivatedCount++;
        console.log(`Menonaktifkan produk (sudah dihapus di Lolipop): ${product.name}`);
      }
    }

    console.log(`\n✅ Selesai. ${deactivatedCount} produk lama dinonaktifkan.`);
  } catch (err) {
    console.error("Gagal melakukan cleanup:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupSync();
