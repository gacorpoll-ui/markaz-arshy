import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const products = await prisma.product.findMany({
  where: { category: { name: 'Disney+ Hotstar' } },
  include: { category: true }
});
products.forEach(p => {
  console.log(`${p.name} | Harga User: Rp ${p.priceUser.toLocaleString('id-ID')} | Harga Reseller: Rp ${p.priceReseller.toLocaleString('id-ID')} | Status: ${p.providerStatus}`);
});
await prisma.$disconnect();
