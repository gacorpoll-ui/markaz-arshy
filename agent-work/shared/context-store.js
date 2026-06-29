/**
 * Agent Context Store — cross-agent data queries.
 * Agents read recent outputs from other agents to make data-driven decisions.
 */
import prisma from '../../backend/src/db.js';

export async function getLatestReport(agentType) {
  const task = await prisma.agentTask.findFirst({
    where: { agentType, status: 'COMPLETED' },
    orderBy: { completedAt: 'desc' },
    include: { reports: { orderBy: { createdAt: 'desc' }, take: 1 } },
  });
  return task?.reports?.[0] || null;
}

export async function getRecentTasks(agentType, limit = 5) {
  return prisma.agentTask.findMany({
    where: { agentType },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: { id: true, taskName: true, status: true, output: true, completedAt: true, durationMs: true },
  });
}

export async function getRevenueSnapshot() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);

  const [total, today, week] = await Promise.all([
    prisma.order.aggregate({ where: { status: 'COMPLETED' }, _sum: { amount: true }, _count: { id: true } }),
    prisma.order.aggregate({ where: { status: 'COMPLETED', createdAt: { gte: todayStart } }, _sum: { amount: true }, _count: { id: true } }),
    prisma.order.aggregate({ where: { status: 'COMPLETED', createdAt: { gte: sevenDaysAgo } }, _sum: { amount: true }, _count: { id: true } }),
  ]);

  return {
    totalRevenue: total._sum.amount || 0,
    totalOrders: total._count.id || 0,
    todayRevenue: today._sum.amount || 0,
    todayOrders: today._count.id || 0,
    weekRevenue: week._sum.amount || 0,
    weekOrders: week._count.id || 0,
    targetProgress: ((total._sum.amount || 0) / 1_000_000_000 * 100).toFixed(2),
  };
}

export async function getTopProducts(limit = 5) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
  const grouped = await prisma.order.groupBy({
    by: ['productId'],
    where: { status: 'COMPLETED', createdAt: { gte: thirtyDaysAgo } },
    _count: { id: true },
    _sum: { amount: true },
    orderBy: { _sum: { amount: 'desc' } },
    take: limit,
  });

  const enriched = [];
  for (const g of grouped) {
    const product = await prisma.product.findUnique({ where: { id: g.productId }, select: { name: true, type: true } });
    enriched.push({ name: product?.name || `#${g.productId}`, type: product?.type || '-', orders: g._count.id, revenue: g._sum.amount || 0 });
  }
  return enriched;
}

export async function getInactiveUsers(days = 30, limit = 20) {
  const cutoff = new Date(Date.now() - days * 86400000);
  return prisma.user.findMany({
    where: { isVerified: true, orders: { none: { createdAt: { gte: cutoff } } } },
    take: limit,
    select: { id: true, name: true, email: true, balance: true, createdAt: true },
  });
}

export default { getLatestReport, getRecentTasks, getRevenueSnapshot, getTopProducts, getInactiveUsers };
