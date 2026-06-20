import express from 'express';
import multer from 'multer';
import path from 'path';
import prisma from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { createNotification, createAdminNotification } from '../utils/notificationService.js';

const router = express.Router();

// Setup Multer untuk upload bukti pembayaran
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/proofs/'); // Pastikan folder ini ada
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'proof-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Maksimal 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Hanya diperbolehkan mengupload gambar (JPG, PNG, WEBP)'));
    }
});


// 1. Get Payment Methods
router.get('/payment-methods', requireAuth, async (req, res) => {
    try {
        const methods = await prisma.paymentMethod.findMany({
            where: { isActive: true }
        });
        res.json({ paymentMethods: methods });
    } catch (error) {
        console.error('Fetch payment methods error:', error);
        res.status(500).json({ error: 'Gagal mengambil metode pembayaran' });
    }
});

// 2. Request Deposit (with image upload)
router.post('/request', requireAuth, upload.single('paymentProof'), async (req, res) => {
  const { amount, paymentMethodId } = req.body;
  const paymentProofFile = req.file;

  if (!amount || isNaN(amount) || amount < 10000) {
    return res.status(400).json({ error: 'Minimum deposit adalah Rp 10.000.' });
  }

  if (!paymentMethodId) {
    return res.status(400).json({ error: 'Pilih metode pembayaran.' });
  }

  if (!paymentProofFile) {
    return res.status(400).json({ error: 'Bukti transfer (gambar) wajib diupload.' });
  }

  try {
    const pMethod = await prisma.paymentMethod.findUnique({
        where: { id: parseInt(paymentMethodId) }
    });

    if (!pMethod) {
        return res.status(404).json({ error: 'Metode pembayaran tidak valid.' });
    }

    const proofPath = `/uploads/proofs/${paymentProofFile.filename}`;

    const deposit = await prisma.deposit.create({
      data: {
        userId: req.user.id,
        amount: parseFloat(amount),
        paymentMethod: pMethod.name,
        paymentMethodId: pMethod.id,
        paymentProof: proofPath,
        status: 'PENDING'
      }
    });

    // Notify admin about new pending deposit
    await createAdminNotification(
        'NEW_DEPOSIT',
        `Deposit baru dari ${req.user.name} sebesar Rp ${parseFloat(amount).toLocaleString('id-ID')} menunggu persetujuan.`,
        `/admin/deposits`
    );

    return res.status(201).json({
      message: 'Pengajuan deposit berhasil, mohon tunggu verifikasi admin.',
      deposit
    });
  } catch (error) {
    console.error('Deposit request error:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan saat mengajukan deposit.' });
  }
});

// 3. Get User's Deposit History
router.get('/history', requireAuth, async (req, res) => {
  try {
    const deposits = await prisma.deposit.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ deposits });
  } catch (error) {
    console.error('Fetch deposit history error:', error);
    return res.status(500).json({ error: 'Gagal memuat riwayat deposit.' });
  }
});

export default router;
