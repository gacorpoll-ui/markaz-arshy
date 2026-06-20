import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function deepCleanAndFix() {
  console.log('🛠 Memulai Sinkronisasi Total Database dan Kategori...');

  // 1. Identifikasi Kategori Utama
  const vpsCat = await prisma.category.findUnique({ where: { slug: 'vps-rdp' } });
  const premiumCat = await prisma.category.findUnique({ where: { slug: 'premium-accounts' } });

  // 2. Sembunyikan SEMUA produk yang namanya mengandung [DELETED], RDP, atau VPS 
  // tapi TIDAK berada di kategori vps-rdp yang benar.
  const badProducts = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: '[DELETED]' } },
        { name: { contains: 'RDP' }, categoryId: { not: vpsCat?.id } },
        { name: { contains: 'VPS' }, categoryId: { not: vpsCat?.id } }
      ]
    }
  });

  console.log(`🔍 Ditemukan ${badProducts.length} produk salah kamar/terhapus.`);

  for (const p of badProducts) {
    await prisma.product.update({
      where: { id: p.id },
      data: {
        categoryId: 1, // Masukkan ke ID 1 (biasanya Default/Uncategorized) atau kategori sampah
        name: `HIDDEN_${p.id}`,
        slug: `hidden-${p.id}-${Date.now()}`
      }
    });
  }

  // 3. Gabungkan kategori duplikat "Akun Premium"
  // Cari semua kategori yang namanya mirip 'Akun Premium'
  const allPremiumCats = await prisma.category.findMany({
    where: { name: { contains: 'Akun Premium' } }
  });

  if (allPremiumCats.length > 1) {
    const mainPremiumCat = allPremiumCats[0];
    for (let i = 1; i < allPremiumCats.length; i++) {
      const duplicateCat = allPremiumCats[i];
      // Pindahkan produk dari duplikat ke kategori utama
      await prisma.product.updateMany({
        where: { categoryId: duplicateCat.id },
        data: { categoryId: mainPremiumCat.id }
      });
      // Hapus kategori duplikat
      await prisma.category.delete({ where: { id: duplicateCat.id } });
      console.log(`🗑 Menghapus kategori duplikat: ${duplicateCat.name} (ID: ${duplicateCat.id})`);
    }
  }

  console.log('✨ Database sudah bersih!');
}

deepCleanAndFix()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
