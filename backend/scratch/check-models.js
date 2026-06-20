import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

const usages = await p.aIUsage.findMany({ 
  include: { model: { select: { name: true, modelId: true } } }, 
  take: 5, orderBy: { createdAt: 'desc' } 
});
usages.forEach(u => console.log(u.id, 'modelId:', u.modelId, 'model:', u.model?.modelId, 'name:', u.model?.name, 'tokens:', u.totalTokens, 'cost:', u.totalCost));

// Check models in DB
const models = await p.aIModel.findMany({ select: { id: true, name: true, modelId: true } });
console.log('\nModels in DB:', JSON.stringify(models, null, 2));

await p.$disconnect();
