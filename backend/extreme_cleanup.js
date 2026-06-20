import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function extremeCleanup() {
  console.log('🧹 Memulai pembersihan tuntas produk [DELETED]...');

  // 1. Cari semua produk yang mengandung kata '[DELETED]'
  const deletedProducts = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: '[DELETED]' } },
        { name: { contains: 'Linux VPS Ubuntu 22.04' } },
        { name: { contains: 'Windows RDP High-End' } },
        { name: { contains: 'Windows RDP Admin' } }
      ]
    }
  });

  console.log(`🔍 Ditemukan ${deletedProducts.length} produk untuk dibersihkan.`);

  for (const prod of deletedProducts) {
    try {
      // Kita ubah kategorinya ke ID yang tidak ada (misal 999999) 
      // atau kita buat kategori tersembunyi khusus 'TRASH'
      
      const trashCategory = await prisma.category.upsert({
        where: { slug: 'hidden-trash' },
        update: {},
        create: {
          name: 'Hidden Trash',
          slug: 'hidden-trash',
          type: 'SMM' // Tipe asal agar tidak masuk PREMIUM
        }
      });

      await prisma.product.update({
        where: { id: prod.id },
        data: {
          categoryId: trashCategory.id,
          slug: `permanent-deleted-${prod.id}-${Date.now()}`,
          name: `HIDDEN_${prod.id}` // Ganti nama agar tidak bisa dicari
        }
      });
      console.log(`✅ Produk ID ${prod.id} berhasil disembunyikan selamanya.`);
    } catch (err) {
      console.error(`❌ Gagal menyembunyikan ID ${prod.id}:`, err.message);
    }
  }
}

extremeCleanup()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    console.log('✨ Pembersihan selesai. Silakan refresh halaman.');
  });
