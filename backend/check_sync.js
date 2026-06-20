import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

const LOLIPOP_API_URL = process.env.LOLIPOP_API_URL || "https://lollipop-smm.com/api/v2";
const LOLIPOP_API_KEY = process.env.LOLIPOP_API_KEY;

async function checkSync() {
  try {
    const response = await fetch(LOLIPOP_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: LOLIPOP_API_KEY, action: 'services' })
    });
    const services = await response.json();
    const totalLolipopServices = services.length;

    const totalActiveLocalSmmProducts = await prisma.product.count({
      where: { type: 'SMM', isActive: true }
    });

    console.log("=== LAPORAN SINKRONISASI LOLIPOP SMM ===");
    console.log(`Total Layanan di API Lolipop SMM : ${totalLolipopServices} produk`);
    console.log(`Total Layanan AKTIF di Database  : ${totalActiveLocalSmmProducts} produk`);
    
    if (totalLolipopServices === totalActiveLocalSmmProducts) {
      console.log("\n✅ STATUS: SINKRON 100%");
      console.log("Semua layanan Lolipop SMM sudah masuk dan ter-update di database Markaz Arshy.");
    } else {
      console.log("\n❌ STATUS: BELUM SINKRON PENUH");
    }

  } catch (err) {
    console.error("Gagal mengecek sinkronisasi:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSync();
