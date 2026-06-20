import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

const count = await p.aIUsage.count();
console.log('Usage records:', count);

if (count > 0) {
  const recent = await p.aIUsage.findMany({ 
    take: 5, orderBy: { createdAt: 'desc' },
    select: { id: true, apiKeyId: true, totalTokens: true, totalCost: true, statusCode: true, endpoint: true, latencyMs: true, createdAt: true }
  });
  console.log('Recent usage:\n', JSON.stringify(recent, null, 2));
} else {
  console.log('NO USAGE RECORDS FOUND!');
}

const keys = await p.aIApiKey.findMany({ 
  select: { id: true, keyName: true, creditsBalance: true, lastUsedAt: true } 
});
console.log('\nKey balances:\n', JSON.stringify(keys, null, 2));

await p.$disconnect();
