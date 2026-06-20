import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const products = await prisma.product.findMany({ where: { type: 'PREMIUM' }, include: { category: true } });
    console.log(products.map(p => ({ name: p.name, category: p.category.name })));
}
main().finally(() => prisma.$disconnect());
