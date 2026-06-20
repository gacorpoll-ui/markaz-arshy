import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Delete the old YouTube Premium product (YOUTUBE1M)
const deleted = await prisma.product.deleteMany({
  where: { providerServiceId: 'YOUTUBE1M' }
});

console.log(`Deleted ${deleted.count} old YouTube Premium products`);

// Show remaining products
const products = await prisma.product.findMany({
  where: { category: { name: 'YouTube Premium' } }
});
console.log(`\nRemaining YouTube Premium products: ${products.length}`);
products.forEach(p => {
  console.log(`  - ${p.name} (Provider ID: ${p.providerServiceId}) | Status: ${p.providerStatus}`);
});

await prisma.$disconnect();
