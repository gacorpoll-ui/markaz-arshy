import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const durationOptionsFull = [
  { label: "7 Hari", months: 0.25, priceMultiplier: 1.0 },
  { label: "14 Hari", months: 0.5, priceMultiplier: 1.56 },
  { label: "21 Hari", months: 0.75, priceMultiplier: 1.88 },
  { label: "30 Hari", months: 1.0, priceMultiplier: 2.03 }
];

async function main() {
  console.log('🔄 Menggabungkan durasi 14 hari ke produk RDP utama...');

  // Cari semua produk yang ada di kategori VPS/RDP
  const vpsCategory = await prisma.category.findUnique({ where: { slug: 'vps-rdp' } });
  
  if (!vpsCategory) {
    console.error('❌ Kategori vps-rdp tidak ditemukan.');
    return;
  }

  // Update semua produk di kategori VPS/RDP agar memiliki pilihan durasi lengkap (7-30 hari)
  const updated = await prisma.product.updateMany({
    where: { categoryId: vpsCategory.id },
    data: {
      durationOptions: JSON.stringify(durationOptionsFull)
    }
  });

  console.log(`✅ Berhasil memperbarui ${updated.count} produk dengan pilihan durasi 7-30 hari.`);
  
  // Hapus produk duplikat yang berakhiran "14D" agar tidak membingungkan
  const deletedDuplicates = await prisma.product.deleteMany({
    where: {
      name: { contains: '14D' }
    }
  });
  
  console.log(`✅ Menghapus ${deletedDuplicates.count} produk duplikat (sudah digabung ke menu durasi).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('✨ Selesai! Silakan cek kembali halaman produk RDP.');
  });
