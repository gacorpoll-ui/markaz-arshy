import express from 'express';
import prisma from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { createNotification } from '../utils/notificationService.js';

const router = express.Router();

// Apply admin protection to all routes in this router
router.use(requireAuth);
router.use(requireAdmin);

// 1. Dashboard Statistics
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await prisma.user.count({ where: { role: 'USER' } });
    const totalResellers = await prisma.user.count({ where: { role: 'RESELLER' } });

    const ordersGroup = await prisma.order.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { amount: true },
    });

    const pendingDeposits = await prisma.deposit.count({ where: { status: 'PENDING' } });
    const totalAccountsAvailable = await prisma.account.count({ where: { isSold: false } });

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
        priceUser: parseFloat(priceUser),
        priceReseller: parseFloat(priceReseller),
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
        priceUser: priceUser ? parseFloat(priceUser) : undefined,
        priceReseller: priceReseller ? parseFloat(priceReseller) : undefined,
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

// 7. Get all system orders
router.get('/orders', async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        product: { select: { name: true, type: true } },
        account: { select: { email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ orders });
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
        balanceAfter += parseFloat(amount);
      } else {
        balanceAfter -= parseFloat(amount);
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
          amount: parseFloat(amount),
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

// 9. Manage Users (Membership Control)
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        balance: true,
        isVerified: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ users });
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
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role }
    });
    return res.json({ message: `User role updated to ${role} successfully.`, user: updatedUser });
  } catch (error) {
    console.error('Update user role error:', error);
    return res.status(500).json({ error: 'Failed to update user role.' });
  }
});

export default router;
