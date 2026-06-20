import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Check ChatGPT Plus products
const chatgpt = await prisma.product.findMany({
  where: { category: { name: 'ChatGPT Plus' } }
});
console.log(`\n=== CHATGPT PLUS (${chatgpt.length} produk) ===`);
chatgpt.forEach(p => {
  console.log(`  - ${p.name} | Provider: ${p.providerServiceId} | Harga User: Rp ${p.priceUser.toLocaleString('id-ID')} | Status: ${p.providerStatus}`);
});

// Check for old CHATGPT1M
const old = await prisma.product.findFirst({ where: { providerServiceId: 'CHATGPT1M' } });
console.log(`\nOld CHATGPT1M exists: ${!!old}`);

// Check for ID 975 conflicts
const id975 = await prisma.product.findMany({ where: { providerServiceId: '975' } });
console.log(`\nProducts with providerServiceId "975": ${id975.length}`);
id975.forEach(p => console.log(`  - ${p.name} (${p.categoryId})`));

// Summary of all premium categories
const categories = await prisma.category.findMany({
  where: { type: 'PREMIUM', name: { not: 'VPS/RDP' } },
  include: { _count: { select: { products: true } } },
  orderBy: { name: 'asc' }
});
console.log('\n=== SEMUA KATEGORI PREMIUM ===');
categories.forEach(c => console.log(`  ${c.name}: ${c._count.products} produk`));

await prisma.$disconnect();
