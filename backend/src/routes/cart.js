import express from 'express';
import prisma from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAuth);

// GET /api/cart — get user's cart with items
router.get('/', async (req, res) => {
  try {
    let cart = await prisma.cart.findUnique({
      where: { userId: req.user.id },
      include: {
        items: {
          include: { product: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: req.user.id },
        include: { items: { include: { product: true } } },
      });
    }
    res.json({ cart });
  } catch (error) {
    console.error('Cart fetch error:', error);
    res.status(500).json({ error: 'Gagal memuat keranjang.' });
  }
});

// POST /api/cart/add — add item to cart
router.post('/add', async (req, res) => {
  const { productId, quantity, selectedVariant } = req.body;
  if (!productId || !quantity || quantity < 1) {
    return res.status(400).json({ error: 'productId dan quantity wajib diisi.' });
  }
  try {
    // Verify product exists and is PHYSICAL
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: 'Produk tidak ditemukan.' });
    if (product.type !== 'PHYSICAL') return res.status(400).json({ error: 'Produk ini tidak bisa ditambahkan ke keranjang.' });

    // Auto-create cart if needed
    let cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId: req.user.id } });
    }

    // Upsert cart item
    const existing = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
    });

    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity, selectedVariant: selectedVariant || existing.selectedVariant },
      });
    } else {
      await prisma.cartItem.create({
        data: { cartId: cart.id, productId, quantity, selectedVariant: selectedVariant || undefined },
      });
    }

    // Return updated cart
    const updated = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: { items: { include: { product: true } } },
    });
    res.json({ cart: updated });
  } catch (error) {
    console.error('Cart add error:', error);
    res.status(500).json({ error: 'Gagal menambahkan ke keranjang.' });
  }
});

// PUT /api/cart/item/:id — update quantity
router.put('/item/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { quantity } = req.body;
  if (!quantity || quantity < 1) return res.status(400).json({ error: 'Quantity minimal 1.' });

  try {
    const item = await prisma.cartItem.findUnique({
      where: { id },
      include: { cart: true },
    });
    if (!item || item.cart.userId !== req.user.id) {
      return res.status(404).json({ error: 'Item tidak ditemukan.' });
    }
    await prisma.cartItem.update({ where: { id }, data: { quantity } });
    const cart = await prisma.cart.findUnique({
      where: { id: item.cartId },
      include: { items: { include: { product: true } } },
    });
    res.json({ cart });
  } catch (error) {
    console.error('Cart update error:', error);
    res.status(500).json({ error: 'Gagal memperbarui keranjang.' });
  }
});

// DELETE /api/cart/item/:id — remove item
router.delete('/item/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const item = await prisma.cartItem.findUnique({
      where: { id },
      include: { cart: true },
    });
    if (!item || item.cart.userId !== req.user.id) {
      return res.status(404).json({ error: 'Item tidak ditemukan.' });
    }
    await prisma.cartItem.delete({ where: { id } });
    const cart = await prisma.cart.findUnique({
      where: { id: item.cartId },
      include: { items: { include: { product: true } } },
    });
    res.json({ cart });
  } catch (error) {
    console.error('Cart delete error:', error);
    res.status(500).json({ error: 'Gagal menghapus item.' });
  }
});

// DELETE /api/cart — clear entire cart
router.delete('/', async (req, res) => {
  try {
    const cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
    res.json({ message: 'Keranjang dikosongkan.' });
  } catch (error) {
    console.error('Cart clear error:', error);
    res.status(500).json({ error: 'Gagal mengosongkan keranjang.' });
  }
});

export default router;
