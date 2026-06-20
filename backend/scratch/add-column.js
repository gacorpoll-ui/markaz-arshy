import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
try {
  await prisma.$executeRawUnsafe('ALTER TABLE AIApiKey ADD COLUMN nineRouterKey TEXT');
  console.log('Column nineRouterKey added successfully');
} catch (e) {
  console.log('Column may already exist:', e.message);
}
await prisma.$disconnect();
