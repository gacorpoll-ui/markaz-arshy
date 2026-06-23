import prisma from '../db.js';
import { createNotification } from './notificationService.js';

/**
 * Atomic refund: reads fresh balance, credits user, records transaction, updates order.
 * Used by orders.js (SMM failure) and cron.js (SMM cancellation + Premium failure).
 *
 * @param {number} orderId
 * @param {string} reason - Human-readable reason for refund
 * @returns {Promise<{refundAmount: number, newBalance: number}>}
 */
export async function refundOrder(orderId, reason = 'Refund otomatis') {
  const result = await prisma.$transaction(async (tx) => {
    // Read current state inside transaction
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error(`Order #${orderId} not found`);
    if (order.status === 'REFUNDED') throw new Error(`Order #${orderId} already refunded`);

    const user = await tx.user.findUnique({ where: { id: order.userId } });
    if (!user) throw new Error(`User for order #${orderId} not found`);

    const refundAmount = order.amount;
    const newBalance = user.balance + refundAmount;

    // Credit user balance
    await tx.user.update({
      where: { id: order.userId },
      data: { balance: newBalance },
    });

    // Record balance transaction
    await tx.balanceTransaction.create({
      data: {
        userId: order.userId,
        type: 'REFUND',
        amount: refundAmount,
        balanceBefore: user.balance,
        balanceAfter: newBalance,
        description: `${reason} (Order #${orderId})`,
        referenceId: String(orderId),
      },
    });

    // Update order status
    await tx.order.update({
      where: { id: orderId },
      data: { status: 'REFUNDED', notes: reason },
    });

    return { refundAmount, newBalance, userId: order.userId };
  });

  // Notify user (outside transaction — best effort)
  await createNotification(
    result.userId,
    'ORDER_REFUNDED',
    `Saldo Anda sebesar Rp ${result.refundAmount.toLocaleString('id-ID')} telah dikembalikan. ${reason}`,
    '/dashboard'
  ).catch(() => {});

  return { refundAmount: result.refundAmount, newBalance: result.newBalance };
}
