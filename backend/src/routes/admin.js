import express from 'express';
import prisma from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { createNotification } from '../utils/notificationService.js';
import { logAdminAction } from '../utils/auditLog.js';
import { syncJakmallProducts } from '../../scripts/sync_jakmall_products.js';

const router = express.Router();

// Apply admin protection to all routes in this router
router.use(requireAuth);
router.use(requireAdmin);

// 1. Dashboard Statistics
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalResellers, ordersGroup, pendingDeposits, totalAccountsAvailable] = await Promise.all([
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.user.count({ where: { role: 'RESELLER' } }),
      prisma.order.groupBy({
        by: ['status'],
        _count: { id: true },
        _sum: { amount: true },
      }),
      prisma.deposit.count({ where: { status: 'PENDING' } }),
      prisma.account.count({ where: { isSold: false } }),
    ]);

    return res.json({
      stats: {
        totalUsers,
        totalResellers,
        pendingDeposits,
        totalAccountsAvailable,
        ordersGroup,
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch admin stats.' });
  }
});

// 1b. Daily Revenue (for chart data)
router.get('/stats/daily-revenue', async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days) || 7, 30);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: startDate }, status: 'COMPLETED' },
      select: { amount: true, createdAt: true },
    });

    // Build daily buckets
    const daily = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      daily.push({ date: key, revenue: 0, label: d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) });
    }

    orders.forEach(o => {
      const key = o.createdAt.toISOString().slice(0, 10);
      const bucket = daily.find(b => b.date === key);
      if (bucket) bucket.revenue += o.amount;
    });

    return res.json({ daily });
  } catch (error) {
    console.error('Daily revenue error:', error);
    return res.status(500).json({ error: 'Failed to fetch daily revenue.' });
  }
});

// 1c. Monthly comparison stats
router.get('/stats/monthly-comparison', async (req, res) => {
  try {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [thisMonthOrders, lastMonthOrders, thisMonthUsers, lastMonthUsers] = await Promise.all([
      prisma.order.aggregate({
        where: { createdAt: { gte: thisMonthStart }, status: 'COMPLETED' },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.order.aggregate({
        where: { createdAt: { gte: lastMonthStart, lt: thisMonthStart }, status: 'COMPLETED' },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.user.count({ where: { createdAt: { gte: thisMonthStart } } }),
      prisma.user.count({ where: { createdAt: { gte: lastMonthStart, lt: thisMonthStart } } }),
    ]);

    const revenueGrowth = lastMonthOrders._sum.amount > 0
      ? ((thisMonthOrders._sum.amount - lastMonthOrders._sum.amount) / lastMonthOrders._sum.amount * 100).toFixed(1)
      : 'N/A';
    const orderGrowth = lastMonthOrders._count.id > 0
      ? ((thisMonthOrders._count.id - lastMonthOrders._count.id) / lastMonthOrders._count.id * 100).toFixed(1)
      : 'N/A';
    const userGrowth = lastMonthUsers > 0
      ? ((thisMonthUsers - lastMonthUsers) / lastMonthUsers * 100).toFixed(1)
      : 'N/A';

    return res.json({
      comparison: {
        revenue: { current: thisMonthOrders._sum.amount || 0, previous: lastMonthOrders._sum.amount || 0, growth: revenueGrowth },
        orders: { current: thisMonthOrders._count.id, previous: lastMonthOrders._count.id, growth: orderGrowth },
        users: { current: thisMonthUsers, previous: lastMonthUsers, growth: userGrowth },
      }
    });
  } catch (error) {
    console.error('Monthly comparison error:', error);
    return res.status(500).json({ error: 'Failed to fetch monthly comparison.' });
  }
});

// Create Category
router.post('/categories', async (req, res) => {
  const { name, slug, type } = req.body;
  if (!name || !slug || !type) {
    return res.status(400).json({ error: 'Name, slug, and type are required.' });
  }
  try {
    const newCategory = await prisma.category.create({
      data: { name, slug, type }
    });
    res.status(201).json({ category: newCategory });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Failed to create category. Make sure slug is unique.' });
  }
});

// Delete Category
router.delete('/categories/:id', async (req, res) => {
  const categoryId = parseInt(req.params.id);
  try {
    // Check if there are products in this category
    const productCount = await prisma.product.count({ where: { categoryId } });
    if (productCount > 0) {
      return res.status(400).json({ error: 'Tidak dapat menghapus kategori yang memiliki produk.' });
    }
    await prisma.category.delete({ where: { id: categoryId } });
    res.json({ message: 'Category deleted successfully.' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Failed to delete category.' });
  }
});

// 2. Fetch pending deposits
router.get('/deposits/pending', async (req, res) => {
  try {
    const pending = await prisma.deposit.findMany({
      where: { status: 'PENDING' },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ deposits: pending });
  } catch (error) {
    console.error('Fetch pending deposits error:', error);
    return res.status(500).json({ error: 'Failed to fetch pending deposits.' });
  }
});

// 3. Confirm Deposit Request
router.post('/deposits/:id/confirm', async (req, res) => {
  const depositId = parseInt(req.params.id);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const deposit = await tx.deposit.findUnique({
        where: { id: depositId },
        include: { user: true }
      });

      if (!deposit) {
        throw new Error('Deposit record not found.');
      }

      if (deposit.status !== 'PENDING') {
        throw new Error('Deposit is already processed.');
      }

      // Add to user balance
      const updatedUser = await tx.user.update({
        where: { id: deposit.userId },
        data: { balance: deposit.user.balance + deposit.amount }
      });

      // Update deposit status
      const updatedDeposit = await tx.deposit.update({
        where: { id: depositId },
        data: {
          status: 'CONFIRMED',
          confirmedByUserId: req.user.id,
          confirmedAt: new Date()
        }
      });

      // Write BalanceTransaction ledger entry
      await tx.balanceTransaction.create({
        data: {
          userId: deposit.userId,
          type: 'DEPOSIT',
          amount: deposit.amount,
          balanceBefore: deposit.user.balance,
          balanceAfter: deposit.user.balance + deposit.amount,
          description: `Top up saldo manual disetujui admin`,
          referenceId: String(deposit.id),
        }
      });

      return { deposit: updatedDeposit, user: updatedUser };
    });

    // Notify user about confirmed deposit (BEFORE response)
    await createNotification(
        result.user.id,
        'DEPOSIT_CONFIRMED',
        `Deposit Anda sebesar Rp ${result.deposit.amount.toLocaleString('id-ID')} telah disetujui. Saldo Anda sekarang Rp ${result.user.balance.toLocaleString('id-ID')}.`,
        '/dashboard'
    );

    return res.json({
      message: 'Deposit confirmed successfully, balance updated.',
      deposit: result.deposit
    });
  } catch (error) {
    console.error('Confirm deposit error:', error);
    return res.status(400).json({ error: 'Failed to confirm deposit.' });
  }
});

// 4. Reject Deposit Request
router.post('/deposits/:id/reject', async (req, res) => {
  const depositId = parseInt(req.params.id);

  try {
    const deposit = await prisma.deposit.findUnique({
      where: { id: depositId }
    });

    if (!deposit) {
      return res.status(404).json({ error: 'Deposit record not found.' });
    }

    if (deposit.status !== 'PENDING') {
      return res.status(400).json({ error: 'Deposit is already processed.' });
    }

    const updatedDeposit = await prisma.deposit.update({
      where: { id: depositId },
      data: {
        status: 'REJECTED',
        confirmedByUserId: req.user.id,
        confirmedAt: new Date()
      }
    });

    // Notify user about rejected deposit (BEFORE response)
    await createNotification(
        deposit.userId,
        'DEPOSIT_REJECTED',
        `Deposit Anda sebesar Rp ${updatedDeposit.amount.toLocaleString('id-ID')} telah ditolak. Silakan periksa kembali bukti transfer Anda atau hubungi admin.`,
        '/dashboard'
    );

    return res.json({
      message: 'Deposit request rejected.',
      deposit: updatedDeposit
    });
  } catch (error) {
    console.error('Reject deposit error:', error);
    return res.status(500).json({ error: 'Failed to reject deposit.' });
  }
});

// 5. Products CRUD
// Create Product
router.post('/products', async (req, res) => {
  const { categoryId, name, slug, description, priceUser, priceReseller, type, providerServiceId, minOrder, maxOrder, durationOptions, osOptions } = req.body;

  if (!categoryId || !name || !slug || !priceUser || !priceReseller || !type) {
    return res.status(400).json({ error: 'Required fields are missing.' });
  }

  // Validasi format JSON jika durationOptions/osOptions diberikan
  if (durationOptions) {
    try { JSON.parse(durationOptions); } catch (e) {
      return res.status(400).json({ error: 'Format durationOptions tidak valid. Harus berupa JSON array.' });
    }
  }
  if (osOptions) {
    try { JSON.parse(osOptions); } catch (e) {
      return res.status(400).json({ error: 'Format osOptions tidak valid. Harus berupa JSON array.' });
    }
  }

  try {
    const newProduct = await prisma.product.create({
      data: {
        categoryId: parseInt(categoryId),
        name,
        slug,
        description,
        priceUser: Math.round(parseFloat(priceUser)),
        priceReseller: Math.round(parseFloat(priceReseller)),
        type,
        providerServiceId: providerServiceId || null,
        minOrder: minOrder ? parseInt(minOrder) : 1,
        maxOrder: maxOrder ? parseInt(maxOrder) : 10000,
        isActive: true,
        durationOptions: durationOptions || null,
        osOptions: osOptions || null,
      }
    });
    return res.status(201).json({ product: newProduct });
  } catch (error) {
    console.error('Create product error:', error);
    return res.status(500).json({ error: 'Failed to create product. Make sure slug is unique.' });
  }
});

// Update Product
router.put('/products/:id', async (req, res) => {
  const productId = parseInt(req.params.id);
  const { categoryId, name, slug, description, priceUser, priceReseller, isActive, providerServiceId, minOrder, maxOrder, durationOptions, osOptions } = req.body;

  // Validasi format JSON jika diberikan
  if (durationOptions !== undefined && durationOptions !== null && durationOptions !== '') {
    try { JSON.parse(durationOptions); } catch (e) {
      return res.status(400).json({ error: 'Format durationOptions tidak valid.' });
    }
  }
  if (osOptions !== undefined && osOptions !== null && osOptions !== '') {
    try { JSON.parse(osOptions); } catch (e) {
      return res.status(400).json({ error: 'Format osOptions tidak valid.' });
    }
  }

  try {
    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        categoryId: categoryId ? parseInt(categoryId) : undefined,
        name,
        slug,
        description,
        priceUser: priceUser ? Math.round(parseFloat(priceUser)) : undefined,
        priceReseller: priceReseller ? Math.round(parseFloat(priceReseller)) : undefined,
        isActive,
        providerServiceId,
        minOrder: minOrder ? parseInt(minOrder) : undefined,
        maxOrder: maxOrder ? parseInt(maxOrder) : undefined,
        durationOptions: durationOptions !== undefined ? (durationOptions || null) : undefined,
        osOptions: osOptions !== undefined ? (osOptions || null) : undefined,
      }
    });
    return res.json({ product: updated });
  } catch (error) {
    console.error('Update product error:', error);
    return res.status(500).json({ error: 'Failed to update product.' });
  }
});

// Delete Product (Permanent if possible, else soft delete)
router.delete('/products/:id', async (req, res) => {
  const productId = parseInt(req.params.id);

  try {
    // Check for related orders first
    const orderCount = await prisma.order.count({ where: { productId } });
    
    if (orderCount === 0) {
      // No orders, can delete permanently
      await prisma.product.delete({ where: { id: productId } });
      return res.json({ message: 'Product deleted permanently.' });
    } else {
      // Has orders, do soft delete
      const deactivated = await prisma.product.update({
        where: { id: productId },
        data: { 
          isActive: false,
          name: `[ARCHIVED] ${productId}`, // Rename to avoid confusion
          slug: `archived-${productId}-${Date.now()}`
        }
      });
      return res.json({ message: 'Product has orders, so it was archived instead of deleted.', product: deactivated });
    }
  } catch (error) {
    console.error('Delete product error:', error);
    return res.status(500).json({ error: 'Failed to delete product.' });
  }
});

// 6. Manage stock of premium accounts
// View all stock for a specific product
router.get('/products/:productId/accounts', async (req, res) => {
  const productId = parseInt(req.params.productId);
  try {
    const accounts = await prisma.account.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ accounts });
  } catch (error) {
    console.error('Fetch accounts error:', error);
    return res.status(500).json({ error: 'Failed to fetch accounts.' });
  }
});

// Bulk upload account credentials
router.post('/products/:productId/accounts/bulk', async (req, res) => {
  const productId = parseInt(req.params.productId);
  const { accounts } = req.body; // Expect array of { email, password, extraInfo }

  if (!accounts || !Array.isArray(accounts) || accounts.length === 0) {
    return res.status(400).json({ error: 'Please provide an array of accounts.' });
  }

  try {
    const parsedAccounts = accounts.map(acc => ({
      productId,
      email: acc.email,
      password: acc.password,
      extraInfo: acc.extraInfo ? (typeof acc.extraInfo === 'object' ? JSON.stringify(acc.extraInfo) : acc.extraInfo) : null,
      isSold: false
    }));

    const result = await prisma.account.createMany({
      data: parsedAccounts
    });

    return res.status(201).json({
      message: `${result.count} accounts added to stock successfully.`,
      count: result.count
    });
  } catch (error) {
    console.error('Bulk upload accounts error:', error);
    return res.status(500).json({ error: 'Failed to upload accounts.' });
  }
});

// 7. Get all system orders (with pagination, filters)
router.get('/orders', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;
    const { status, type, search } = req.query;

    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { id: parseInt(search) || 0 },
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
        { product: { name: { contains: search } } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          product: { select: { name: true, type: true } },
          account: { select: { email: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.order.count({ where }),
    ]);
    return res.json({ orders, total, limit, offset });
  } catch (error) {
    console.error('Fetch admin orders error:', error);
    return res.status(500).json({ error: 'Failed to fetch orders.' });
  }
});

// 8. Manual User Balance Control (Add/Subtract)
router.post('/users/:id/balance', async (req, res) => {
  const userId = parseInt(req.params.id);
  const { amount, action, description } = req.body; // action: 'ADD' or 'SUBTRACT'

  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Please provide a valid amount.' });
  }

  if (!['ADD', 'SUBTRACT'].includes(action)) {
    return res.status(400).json({ error: 'Action must be ADD or SUBTRACT.' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new Error('User not found.');
      }

      const balanceBefore = user.balance;
      let balanceAfter = user.balance;

      if (action === 'ADD') {
        balanceAfter += Math.round(parseFloat(amount));
      } else {
        balanceAfter -= Math.round(parseFloat(amount));
        if (balanceAfter < 0) {
          throw new Error('User balance cannot go below 0.');
        }
      }

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { balance: balanceAfter }
      });

      await tx.balanceTransaction.create({
        data: {
          userId,
          type: action === 'ADD' ? 'DEPOSIT' : 'DEDUCTION',
          amount: Math.round(parseFloat(amount)),
          balanceBefore,
          balanceAfter,
          description: description || `Penyesuaian saldo manual oleh admin: ${action === 'ADD' ? 'Penambahan' : 'Pengurangan'}`,
        }
      });

      return updatedUser;
    });

    return res.json({
      message: 'User balance updated successfully.',
      user: {
        id: result.id,
        name: result.name,
        email: result.email,
        balance: result.balance
      }
    });
  } catch (error) {
    console.error('Manual balance update error:', error);
    return res.status(400).json({ error: error.message || 'Failed to update user balance.' });
  }
});

// 9. Manage Users (Membership Control) — with pagination, search, and filters
router.get('/users', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;
    const { role, search, verified } = req.query;

    const where = {};
    if (role) where.role = role;
    if (verified !== undefined) where.isVerified = verified === 'true';
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          balance: true,
          isVerified: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.user.count({ where }),
    ]);
    return res.json({ users, total, limit, offset });
  } catch (error) {
    console.error('Fetch admin users error:', error);
    return res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

router.patch('/users/:id/role', async (req, res) => {
  const userId = parseInt(req.params.id);
  const { role } = req.body; // 'USER', 'RESELLER', or 'ADMIN'

  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID.' });
  }

  if (!['USER', 'RESELLER', 'ADMIN'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role provided.' });
  }

  // Prevent self-promotion or demotion
  if (userId === req.user.id) {
    return res.status(400).json({ error: 'Tidak dapat mengubah role sendiri.' });
  }

  // Prevent changing other admin roles
  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) {
    return res.status(404).json({ error: 'User not found.' });
  }
  if (targetUser.role === 'ADMIN' && req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Hanya admin yang bisa mengubah role admin lain.' });
  }

  try {
    const oldRole = targetUser.role;
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role }
    });

    // Audit log
    await logAdminAction(req.user.id, 'CHANGE_ROLE', userId, { from: oldRole, to: role, email: targetUser.email });

    return res.json({ message: `User role updated to ${role} successfully.`, user: updatedUser });
  } catch (error) {
    console.error('Update user role error:', error);
    return res.status(500).json({ error: 'Failed to update user role.' });
  }
});

// 11. Delete (deactivate) user — soft delete
router.delete('/users/:id', async (req, res) => {
  const userId = parseInt(req.params.id);
  if (isNaN(userId)) return res.status(400).json({ error: 'Invalid user ID.' });
  if (userId === req.user.id) return res.status(400).json({ error: 'Tidak bisa menghapus diri sendiri.' });

  try {
    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) return res.status(404).json({ error: 'User tidak ditemukan.' });
    if (target.role === 'ADMIN') return res.status(403).json({ error: 'Tidak bisa menghapus admin.' });

    // Check for active orders
    const activeOrders = await prisma.order.count({
      where: { userId, status: { in: ['PENDING', 'PROCESSING', 'AWAITING_PAYMENT'] } }
    });
    if (activeOrders > 0) {
      return res.status(400).json({ error: `User masih memiliki ${activeOrders} order aktif. Selesaikan atau batalkan pesanan terlebih dahulu.` });
    }

    // Soft delete: deactivate + anonymize
    const deactivated = await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        email: `deleted_${userId}_${Date.now()}@removed.local`,
        name: `[Dihapus] User #${userId}`,
      }
    });

    await logAdminAction(req.user.id, 'DELETE_USER', userId, { email: target.email, name: target.name });

    return res.json({ message: 'User berhasil di-nonaktifkan.' });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ error: 'Gagal menghapus user.' });
  }
});

// 12. Get admin audit log
router.get('/audit-log', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const action = req.query.action || null;

    // Read from JSONL file
    const { default: fs } = await import('fs');
    const { default: path } = await import('path');
    const { fileURLToPath } = await import('url');
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const logPath = path.join(__dirname, '..', 'logs', 'admin-audit.log');

    if (!fs.existsSync(logPath)) {
      return res.json({ logs: [], total: 0 });
    }

    const lines = fs.readFileSync(logPath, 'utf-8').trim().split('\n').filter(Boolean);
    let logs = lines.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);

    if (action) logs = logs.filter(l => l.action === action);

    // Sort newest first, apply limit
    logs.reverse();
    const total = logs.length;
    logs = logs.slice(0, limit);

    return res.json({ logs, total });
  } catch (error) {
    console.error('Audit log error:', error);
    return res.status(500).json({ error: 'Failed to fetch audit log.' });
  }
});

// 10. Manual Jakmall product sync
router.post('/sync-jakmall', async (req, res) => {
  try {
    console.log('[ADMIN] Admin triggered Jakmall sync...');
    // Run async in background — don't block the response/event loop
    syncJakmallProducts()
      .then(r => console.log('[JAKMALL] Sync completed:', r?.message || 'done'))
      .catch(e => console.error('[JAKMALL] Sync failed:', e.message));
    res.json({ message: 'Sinkronisasi Jakmall dimulai di background. Periksa log server untuk status.' });
  } catch (error) {
    console.error('Jakmall sync trigger error:', error);
    res.status(500).json({ error: `Gagal memulai sinkronisasi: ${error.message}` });
  }
});

export default router;
