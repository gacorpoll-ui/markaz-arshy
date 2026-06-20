import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function deleteSpecificProducts() {
  console.log('🧹 Memulai penghapusan produk secara spesifik...');

  const productsToDelete = [
    "Linux VPS Ubuntu 22.04 (2GB RAM)",
    "Windows RDP High-End (8GB RAM, 4 vCPU)",
    "Windows RDP Admin (4GB RAM, 2 vCPU)"
  ];

  for (const name of productsToDelete) {
    try {
      // Cari dulu produknya berdasarkan nama (karena slug bisa bervariasi)
      const product = await prisma.product.findFirst({
        where: { name: name }
      });

      if (product) {
        // Jika ada kendala relasi (order), kita hapus dulu relasinya atau set status inactive
        // Tapi di sini kita coba hapus langsung dulu
        await prisma.product.delete({
          where: { id: product.id }
        });
        console.log(`✅ Berhasil menghapus: ${name}`);
      } else {
        console.log(`ℹ️ Produk tidak ditemukan: ${name}`);
      }
    } catch (error) {
      console.error(`❌ Gagal menghapus ${name}:`, error.message);
      console.log(`💡 Mencoba menonaktifkan produk sebagai alternatif...`);
      
      // Jika gagal hapus karena relasi database, kita ubah namanya agar tidak muncul/valid
      await prisma.product.updateMany({
        where: { name: name },
        data: { 
            slug: `deleted-${Date.now()}`, 
            name: `[DELETED] ${name}`,
            categoryId: 1 // Pindahkan ke kategori dummy/lain jika perlu agar hilang dari katalog
        }
      });
    }
  }
}

deleteSpecificProducts()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    console.log('✨ Proses selesai.');
  });
