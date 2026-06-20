import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const products = await prisma.product.findMany({
  where: { category: { name: 'YouTube Premium' } },
  include: { category: true }
});
console.log(`\n=== PRODUK YOUTUBE PREMIUM (${products.length} produk) ===\n`);
products.forEach(p => {
  console.log(`ID: ${p.id} | ${p.name}`);
  console.log(`  Slug: ${p.slug}`);
  console.log(`  Provider ID: ${p.providerServiceId}`);
  console.log(`  Harga User: Rp ${p.priceUser.toLocaleString('id-ID')} | Harga Reseller: Rp ${p.priceReseller.toLocaleString('id-ID')}`);
  console.log(`  Status: ${p.providerStatus} | Active: ${p.isActive}`);
  console.log('');
});
await prisma.$disconnect();
