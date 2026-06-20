import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.category.findMany({
    where: { type: 'PREMIUM' },
    include: {
      products: true
    }
  });

  console.log("=== CATEGORIES AND PRODUCTS ===");
  for (const cat of categories) {
    console.log(`\nCategory: ${cat.name} (Slug: ${cat.slug}, Type: ${cat.type})`);
    if (cat.products.length === 0) {
      console.log("  (No products)");
    } else {
      for (const prod of cat.products) {
        console.log(`  - [ID: ${prod.id}] ${prod.name} (Slug: ${prod.slug}, Active: ${prod.isActive}, Status: ${prod.providerStatus}, ProviderID: ${prod.providerServiceId})`);
      }
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
