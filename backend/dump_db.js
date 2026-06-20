import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function dumpDB() {
  console.log("=== DATABASE DUMP: PREMIUM PRODUCTS ===");
  try {
    const products = await prisma.product.findMany({
      include: { category: true }
    });

    console.log(`Total Products in DB: ${products.length}`);
    for (const p of products) {
      if (p.type === 'PREMIUM' || p.category.type === 'PREMIUM') {
        console.log(`\nID: ${p.id}`);
        console.log(`Nama: ${p.name}`);
        console.log(`Slug: ${p.slug}`);
        console.log(`Type: ${p.type}`);
        console.log(`Category: ${p.category.name} (Type: ${p.category.type})`);
        console.log(`Price User: Rp ${p.priceUser}`);
        console.log(`Price Reseller: Rp ${p.priceReseller}`);
        console.log(`Provider Code: ${p.providerServiceId}`);
        console.log("-----------------------------------------");
      }
    }
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

dumpDB();
