import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const products = await prisma.product.findMany({
        where: { isActive: true },
        include: {
            category: { select: { name: true, slug: true, type: true } },
        }
    });
    console.log(`Total active products: ${products.length}`);
    const smmProducts = products.filter(p => p.category.type === 'SMM');
    console.log(`SMM Products: ${smmProducts.length}`);
}
main().finally(() => prisma.$disconnect());
