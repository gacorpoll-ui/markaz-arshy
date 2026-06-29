import express from 'express';
import prisma from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/discussions/:productId — list diskusi produk
router.get('/:productId', async (req, res) => {
  try {
    const productId = parseInt(req.params.productId);
    const discussions = await prisma.productDiscussion.findMany({
      where: { productId, parentId: null },
      include: {
        user: { select: { id: true, name: true } },
        replies: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ discussions });
  } catch (error) {
    console.error('Fetch discussions error:', error);
    res.status(500).json({ error: 'Gagal memuat diskusi.' });
  }
});

// POST /api/discussions/:productId — tambah diskusi
router.post('/:productId', requireAuth, async (req, res) => {
  try {
    const productId = parseInt(req.params.productId);
    const { message, parentId } = req.body;
    if (!message || !message.trim()) return res.status(400).json({ error: 'Pesan tidak boleh kosong.' });

    const discussion = await prisma.productDiscussion.create({
      data: {
        userId: req.user.id,
        productId,
        message: message.trim(),
        parentId: parentId ? parseInt(parentId) : null,
      },
      include: { user: { select: { id: true, name: true } } },
    });
    res.json({ discussion });
  } catch (error) {
    console.error('Create discussion error:', error);
    res.status(500).json({ error: 'Gagal mengirim diskusi.' });
  }
});

// DELETE /api/discussions/:id — hapus komentar sendiri
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const item = await prisma.productDiscussion.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ error: 'Diskusi tidak ditemukan.' });
    if (item.userId !== req.user.id) return res.status(403).json({ error: 'Tidak diizinkan.' });

    await prisma.productDiscussion.delete({ where: { id } });
    res.json({ message: 'Diskusi dihapus.' });
  } catch (error) {
    console.error('Delete discussion error:', error);
    res.status(500).json({ error: 'Gagal menghapus diskusi.' });
  }
});

export default router;
