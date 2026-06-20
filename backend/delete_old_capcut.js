import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Delete old CapCut Pro product
const deleted = await prisma.product.deleteMany({
  where: { providerServiceId: 'CAPCUT1M' }
});
console.log(`Deleted ${deleted.count} old CapCut Pro products`);

// Show remaining products
const products = await prisma.product.findMany({
  where: { category: { name: 'CapCut Pro' } }
});
console.log(`\nCapCut Pro products: ${products.length}`);
products.forEach(p => {
  console.log(`  - ${p.name} | Harga User: Rp ${p.priceUser.toLocaleString('id-ID')} | Status: ${p.providerStatus}`);
});

await prisma.$disconnect();
