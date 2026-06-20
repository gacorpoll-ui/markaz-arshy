import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fixCategories() {
  console.log('🛠 Memulai perbaikan kategori produk...');

  // 1. Pastikan kedua kategori ada dengan slug yang benar
  const vpsCategory = await prisma.category.upsert({
    where: { slug: 'vps-rdp' },
    update: {},
    create: {
      name: 'VPS/RDP',
      slug: 'vps-rdp',
      type: 'PREMIUM'
    }
  });

  const premiumCategory = await prisma.category.upsert({
    where: { slug: 'premium-accounts' },
    update: {},
    create: {
      name: 'Akun Premium',
      slug: 'premium-accounts',
      type: 'PREMIUM'
    }
  });

  console.log(`✅ Kategori ditemukan/dibuat: ${vpsCategory.name} (ID: ${vpsCategory.id}) dan ${premiumCategory.name} (ID: ${premiumCategory.id})`);

  // 2. Pindahkan produk RDP/VPS ke kategori VPS/RDP
  const rdpUpdate = await prisma.product.updateMany({
    where: {
      OR: [
        { name: { contains: 'RDP' } },
        { name: { contains: 'VPS' } },
        { name: { contains: 'Public IP' } }
      ]
    },
    data: {
      categoryId: vpsCategory.id
    }
  });

  console.log(`✅ Berhasil memindahkan ${rdpUpdate.count} produk ke kategori VPS/RDP.`);

  // 3. Pastikan produk premium (seperti Spotify, Netflix, dll) masuk ke Akun Premium jika salah tempat
  const premiumUpdate = await prisma.product.updateMany({
    where: {
      OR: [
        { name: { contains: 'Spotify' } },
        { name: { contains: 'Netflix' } },
        { name: { contains: 'YouTube' } },
        { name: { contains: 'Canva' } }
      ]
    },
    data: {
      categoryId: premiumCategory.id
    }
  });

  console.log(`✅ Berhasil merapikan ${premiumUpdate.count} produk ke kategori Akun Premium.`);
}

fixCategories()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('✨ Perbaikan kategori selesai!');
  });
