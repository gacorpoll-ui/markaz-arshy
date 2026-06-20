import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Delete old ChatGPT product with ID 975
const deleted = await prisma.product.deleteMany({ where: { providerServiceId: '975' } });
console.log(`Deleted old ChatGPT 975: ${deleted.count}`);

// Check current state
const chatgpt = await prisma.product.findMany({ where: { category: { name: 'ChatGPT Plus' } } });
console.log('\nChatGPT Plus after delete:');
chatgpt.forEach(p => console.log(`  - ${p.name} (${p.providerServiceId})`));

await prisma.$disconnect();
