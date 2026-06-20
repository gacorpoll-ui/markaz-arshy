import prisma from './src/db.js';

async function main() {
  const users = await prisma.user.findMany();
  console.log('--- USERS & BALANCES ---');
  users.forEach(u => console.log(`User ID: ${u.id} | Email: ${u.email} | Name: ${u.name} | Role: ${u.role} | Balance: ${u.balance}`));

  const deposits = await prisma.deposit.findMany();
  console.log('\n--- DEPOSITS ---');
  deposits.forEach(d => console.log(`Dep ID: ${d.id} | User ID: ${d.userId} | Amount: ${d.amount} | Status: ${d.status}`));

  const orders = await prisma.order.findMany();
  console.log('\n--- ORDERS ---');
  orders.forEach(o => console.log(`Order ID: ${o.id} | User ID: ${o.userId} | Product ID: ${o.productId} | Amount: ${o.amount} | Status: ${o.status}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
