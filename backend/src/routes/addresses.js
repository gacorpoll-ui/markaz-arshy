import express from 'express';
import prisma from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAuth);

// List user's addresses
router.get('/', async (req, res) => {
  try {
    const addresses = await prisma.userAddress.findMany({
      where: { userId: req.user.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    res.json({ addresses });
  } catch (error) {
    console.error('Fetch addresses error:', error);
    res.status(500).json({ error: 'Gagal memuat alamat.' });
  }
});

// Create address
router.post('/', async (req, res) => {
  const { label, recipientName, phoneNumber, province, city, district, village, villageCode, fullAddress, postalCode, isDefault } = req.body;
  if (!recipientName || !phoneNumber || !province || !city || !district || !village || !fullAddress) {
    return res.status(400).json({ error: 'Lengkapi semua field alamat.' });
  }
  try {
    if (isDefault) {
      await prisma.userAddress.updateMany({
        where: { userId: req.user.id, isDefault: true },
        data: { isDefault: false },
      });
    }
    const address = await prisma.userAddress.create({
      data: {
        userId: req.user.id,
        label: label || 'Alamat',
        recipientName,
        phoneNumber,
        province,
        city,
        district,
        village,
        villageCode,
        fullAddress,
        postalCode,
        isDefault: isDefault || false,
      },
    });
    res.status(201).json({ address });
  } catch (error) {
    console.error('Create address error:', error);
    res.status(500).json({ error: 'Gagal menyimpan alamat.' });
  }
});

// Update address
router.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { label, recipientName, phoneNumber, province, city, district, village, villageCode, fullAddress, postalCode, isDefault } = req.body;
  try {
    const existing = await prisma.userAddress.findFirst({ where: { id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ error: 'Alamat tidak ditemukan.' });

    if (isDefault) {
      await prisma.userAddress.updateMany({
        where: { userId: req.user.id, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }
    const address = await prisma.userAddress.update({
      where: { id },
      data: {
        label, recipientName, phoneNumber,
        province, city, district, village, villageCode,
        fullAddress, postalCode, isDefault,
      },
    });
    res.json({ address });
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({ error: 'Gagal memperbarui alamat.' });
  }
});

// Delete address
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const existing = await prisma.userAddress.findFirst({ where: { id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ error: 'Alamat tidak ditemukan.' });
    await prisma.userAddress.delete({ where: { id } });
    res.json({ message: 'Alamat berhasil dihapus.' });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({ error: 'Gagal menghapus alamat.' });
  }
});

// Set as default
router.put('/:id/default', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const existing = await prisma.userAddress.findFirst({ where: { id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ error: 'Alamat tidak ditemukan.' });
    await prisma.userAddress.updateMany({
      where: { userId: req.user.id, isDefault: true },
      data: { isDefault: false },
    });
    const address = await prisma.userAddress.update({
      where: { id },
      data: { isDefault: true },
    });
    res.json({ address });
  } catch (error) {
    console.error('Set default address error:', error);
    res.status(500).json({ error: 'Gagal mengatur alamat default.' });
  }
});

export default router;
