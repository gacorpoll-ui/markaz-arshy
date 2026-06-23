import prisma from '../../backend/src/db.js';

/**
 * Record daily revenue metrics snapshot.
 * Called by the Analytics Agent each day.
 */
export async function recordDailyMetrics() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  // Revenue from completed orders today
  const [orderStats, newUsers, activeResellers, depositStats] = await Promise.all([
    prisma.order.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: todayStart, lt: todayEnd },
      },
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.user.count({
      where: { createdAt: { gte: todayStart, lt: todayEnd } },
    }),
    prisma.user.count({
      where: {
        role: 'RESELLER',
        orders: { some: { status: 'COMPLETED', createdAt: { gte: todayStart, lt: todayEnd } } },
      },
    }),
    prisma.deposit.aggregate({
      where: {
        status: 'CONFIRMED',
        createdAt: { gte: todayStart, lt: todayEnd },
      },
      _sum: { amount: true },
    }),
  ]);

  const totalRevenue = orderStats._sum.amount || 0;
  const orderCount = orderStats._count.id || 0;
  const depositTotal = depositStats._sum.amount || 0;

  // Conversion rate: orders / total users who visited (estimated from active users)
  const totalUsers = await prisma.user.count();
  const conversionRate = totalUsers > 0 ? (orderCount / totalUsers) * 100 : 0;

  // Upsert daily metric
  const metric = await prisma.revenueMetric.upsert({
    where: { date: todayStart },
    update: {
      totalRevenue,
      orderCount,
      newUsers,
      activeResellers,
      depositTotal,
      conversionRate,
    },
    create: {
      date: todayStart,
      totalRevenue,
      orderCount,
      newUsers,
      activeResellers,
      depositTotal,
      conversionRate,
    },
  });

  return metric;
}

/**
 * Get cumulative revenue stats.
 */
export async function getCumulativeRevenue() {
  const result = await prisma.order.aggregate({
    where: { status: 'COMPLETED' },
    _sum: { amount: true },
    _count: { id: true },
  });

  const totalRevenue = result._sum.amount || 0;
  const totalOrders = result._count.id || 0;
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  return {
    totalRevenue,
    totalOrders,
    avgOrderValue,
    targetProgress: (totalRevenue / 1_000_000_000 * 100).toFixed(2),
    remainingToTarget: Math.max(0, 1_000_000_000 - totalRevenue),
  };
}

/**
 * Get revenue metrics for a date range.
 */
export async function getRevenueMetrics(startDate, endDate) {
  return prisma.revenueMetric.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
    },
    orderBy: { date: 'asc' },
  });
}

/**
 * Get agent-specific revenue stats.
 */
export async function getAgentRevenueStats() {
  const agentTypes = [
    'seo', 'social_media', 'email', 'whatsapp', 'competitor',
    'dynamic_pricing', 'analytics', 'reseller', 'retention',
    'upsell', 'content_writer', 'review_request',
  ];

  const stats = [];
  for (const agentType of agentTypes) {
    const taskCount = await prisma.agentTask.count({ where: { agentType } });
    const successCount = await prisma.agentTask.count({ where: { agentType, status: 'COMPLETED' } });
    const costResult = await prisma.agentTask.aggregate({
      where: { agentType },
      _sum: { llmCost: true },
    });

    stats.push({
      agentType,
      totalRuns: taskCount,
      successfulRuns: successCount,
      totalCost: costResult._sum.llmCost || 0,
      successRate: taskCount > 0 ? (successCount / taskCount * 100).toFixed(1) : '0',
    });
  }

  return stats;
}

export default {
  recordDailyMetrics,
  getCumulativeRevenue,
  getRevenueMetrics,
  getAgentRevenueStats,
};
