import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const NINE_ROUTER_URL = 'http://localhost:20128';

// 1. Login 9router
const loginRes = await fetch(`${NINE_ROUTER_URL}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin', password: 'Riri@150187' }),
});
const cookie = loginRes.headers.get('set-cookie').split(';')[0];

// 2. Get all 9router keys
const keysRes = await fetch(`${NINE_ROUTER_URL}/api/keys`, { headers: { 'Cookie': cookie } });
const { keys: nineKeys } = await keysRes.json();
console.log('9router keys:', nineKeys.map(k => ({ name: k.name, key: k.key })));

// 3. Get all ma-* keys from Markaz Arshy DB
const maKeys = await prisma.aIApiKey.findMany({ select: { id: true, keyName: true, apiKey: true, nineRouterKey: true, isActive: true } });
console.log('\nMarkaz Arshy keys:');
for (const k of maKeys) {
  console.log(`  ${k.apiKey.slice(0, 15)}... active=${k.isActive} nineRouterKey=${k.nineRouterKey || 'null'}`);
}

// 4. For each active ma-* key without nineRouterKey, create a 9router key
for (const k of maKeys) {
  if (!k.isActive || k.nineRouterKey) continue;
  
  const keyName = `ma-${k.keyName || k.id}`;
  const createRes = await fetch(`${NINE_ROUTER_URL}/api/keys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
    body: JSON.stringify({ name: keyName }),
  });
  
  if (createRes.ok) {
    const { key: skKey } = await createRes.json();
    await prisma.aIApiKey.update({ where: { id: k.id }, data: { nineRouterKey: skKey } });
    console.log(`\n✅ Created 9router key for ${k.keyName}: ${skKey}`);
  } else {
    console.log(`\n❌ Failed to create key for ${k.keyName}: ${createRes.status}`);
  }
}

// 5. Also activate the claude key if it exists
const claudeKey = await prisma.aIApiKey.findUnique({ where: { apiKey: 'ma-6923f8a006ac9612ab94d71ab28b545f0633f284bb09dbb4' } });
if (claudeKey && !claudeKey.isActive) {
  await prisma.aIApiKey.update({ where: { id: claudeKey.id }, data: { isActive: true } });
  console.log(`\n✅ Activated claude key`);
  
  // Also create 9router key for it
  const createRes = await fetch(`${NINE_ROUTER_URL}/api/keys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
    body: JSON.stringify({ name: 'ma-claude' }),
  });
  if (createRes.ok) {
    const { key: skKey } = await createRes.json();
    await prisma.aIApiKey.update({ where: { id: claudeKey.id }, data: { nineRouterKey: skKey } });
    console.log(`✅ Created 9router key for claude: ${skKey}`);
  }
}

// 6. Show final state
console.log('\n=== Final state ===');
const finalKeys = await prisma.aIApiKey.findMany({ select: { keyName: true, apiKey: true, nineRouterKey: true, isActive: true } });
for (const k of finalKeys) {
  console.log(`${k.keyName}: ${k.apiKey.slice(0, 15)}... → ${k.nineRouterKey?.slice(0, 15) || 'NONE'}... active=${k.isActive}`);
}

await prisma.$disconnect();
