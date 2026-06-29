import express from 'express';
import prisma from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/favorites — list favorit user
router.get('/', requireAuth, async (req, res) => {
  try {
    const favorites = await prisma.userFavorite.findMany({
      where: { userId: req.user.id },
      include: {
        product: {
          include: { category: { select: { name: true, slug: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ favorites: favorites.map(f => f.product) });
  } catch (error) {
    console.error('Fetch favorites error:', error);
    res.status(500).json({ error: 'Gagal memuat favorit.' });
  }
});

// POST /api/favorites/toggle — toggle favorit
router.post('/toggle', requireAuth, async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: 'productId diperlukan.' });

    const existing = await prisma.userFavorite.findUnique({
      where: { userId_productId: { userId: req.user.id, productId: parseInt(productId) } },
    });

    if (existing) {
      await prisma.userFavorite.delete({ where: { id: existing.id } });
      res.json({ favorited: false });
    } else {
      await prisma.userFavorite.create({
        data: { userId: req.user.id, productId: parseInt(productId) },
      });
      res.json({ favorited: true });
    }
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ error: 'Gagal mengubah favorit.' });
  }
});

// GET /api/favorites/check/:productId — cek apakah produk di-favorit
router.get('/check/:productId', requireAuth, async (req, res) => {
  try {
    const existing = await prisma.userFavorite.findUnique({
      where: {
        userId_productId: {
          userId: req.user.id,
          productId: parseInt(req.params.productId),
        },
      },
    });
    res.json({ favorited: !!existing });
  } catch (error) {
    res.status(500).json({ error: 'Gagal cek favorit.' });
  }
});

export default router;
