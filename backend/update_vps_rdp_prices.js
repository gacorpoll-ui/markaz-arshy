import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Script ini mengkonversi durationOptions dari sistem priceMultiplier
 * ke sistem harga langsung (price field) untuk setiap produk VPS/RDP.
 *
 * Multiplier asli:
 *   7 Hari  → ×1.00 (harga dasar)
 *   14 Hari → ×1.56
 *   21 Hari → ×1.88
 *   30 Hari → ×2.03
 */

async function main() {
  console.log('🔄 Memulai update harga durasi VPS/RDP ke format harga langsung...\n');

  // Cari kategori VPS/RDP
  const vpsCategory = await prisma.category.findUnique({ where: { slug: 'vps-rdp' } });
  if (!vpsCategory) {
    console.error('❌ Kategori vps-rdp tidak ditemukan. Pastikan sudah diinisialisasi.');
    return;
  }

  // Ambil semua produk VPS/RDP
  const products = await prisma.product.findMany({
    where: { categoryId: vpsCategory.id }
  });

  console.log(`📦 Ditemukan ${products.length} produk VPS/RDP\n`);

  let updatedCount = 0;

  for (const product of products) {
    const base = product.priceUser; // Harga dasar (7 hari)

    // Hitung harga langsung per durasi berdasarkan multiplier asli
    const durationOptions = [
      { label: "7 Hari",  months: 0.25, priceMultiplier: 1.0,  price: Math.ceil(base * 1.0)  },
      { label: "14 Hari", months: 0.5,  priceMultiplier: 1.56, price: Math.ceil(base * 1.56) },
      { label: "21 Hari", months: 0.75, priceMultiplier: 1.88, price: Math.ceil(base * 1.88) },
      { label: "30 Hari", months: 1.0,  priceMultiplier: 2.03, price: Math.ceil(base * 2.03) },
    ];

    // Update produk
    await prisma.product.update({
      where: { id: product.id },
      data: {
        durationOptions: JSON.stringify(durationOptions)
      }
    });

    console.log(`✅ ${product.name}`);
    console.log(`   7 Hari  : Rp ${durationOptions[0].price.toLocaleString('id-ID')}`);
    console.log(`   14 Hari : Rp ${durationOptions[1].price.toLocaleString('id-ID')}`);
    console.log(`   21 Hari : Rp ${durationOptions[2].price.toLocaleString('id-ID')}`);
    console.log(`   30 Hari : Rp ${durationOptions[3].price.toLocaleString('id-ID')}\n`);

    updatedCount++;
  }

  console.log(`\n🎉 Selesai! ${updatedCount} produk berhasil diperbarui.`);
  console.log('💡 Sekarang setiap tombol durasi akan menampilkan harga yang berbeda di frontend.');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
