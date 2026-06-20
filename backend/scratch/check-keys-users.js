import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const keys = await p.aIApiKey.findMany({ select: { id: true, userId: true, keyName: true, apiKey: true, isActive: true } });
console.log(JSON.stringify(keys, null, 2));
const users = await p.user.findMany({ select: { id: true, email: true, name: true } });
console.log('\nUsers:', JSON.stringify(users, null, 2));
await p.$disconnect();
