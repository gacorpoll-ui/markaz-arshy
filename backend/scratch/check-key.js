import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const keys = await prisma.aIApiKey.findMany({ select: { id: true, keyName: true, apiKey: true, nineRouterKey: true, isActive: true } });
console.log('All keys:', JSON.stringify(keys, null, 2));
await prisma.$disconnect();
