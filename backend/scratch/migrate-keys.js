import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const NINE_ROUTER_URL = 'http://localhost:20128';

// Get all existing ma-* keys
const maKeys = await prisma.aIApiKey.findMany({ where: { apiKey: { startsWith: 'ma-' } } });
console.log(`Found ${maKeys.length} ma-* keys to migrate`);

// Login to 9router
const loginRes = await fetch(`${NINE_ROUTER_URL}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin', password: 'Riri@150187' }),
});
const cookie = loginRes.headers.get('set-cookie').split(';')[0];

for (const k of maKeys) {
  // Create new sk-* key on 9router
  const createRes = await fetch(`${NINE_ROUTER_URL}/api/keys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
    body: JSON.stringify({ name: `user-${k.userId}-${k.id}` }),
  });
  
  if (createRes.ok) {
    const { key: skKey } = await createRes.json();
    // Update DB: replace ma-* with sk-*
    await prisma.aIApiKey.update({
      where: { id: k.id },
      data: { apiKey: skKey, nineRouterKey: skKey, isActive: true },
    });
    console.log(`✅ ${k.keyName || k.id}: ${k.apiKey.slice(0, 15)}... → ${skKey.slice(0, 15)}...`);
  } else {
    console.log(`❌ ${k.keyName || k.id}: Failed to create 9router key`);
  }
}

// Show final result
console.log('\n=== Final keys ===');
const allKeys = await prisma.aIApiKey.findMany({ select: { keyName: true, apiKey: true, isActive: true } });
for (const k of allKeys) {
  console.log(`${k.keyName}: ${k.apiKey} active=${k.isActive}`);
}

await prisma.$disconnect();
