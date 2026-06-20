import express from 'express';
import multer from 'multer';
import path from 'path';
import prisma from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireAdmin);

// Setup Multer untuk upload QRIS Admin
const qrisStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/qris/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'qris-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const uploadQris = multer({ 
    storage: qrisStorage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        if (extname) return cb(null, true);
        cb(new Error('Hanya diperbolehkan mengupload gambar (JPG, PNG, WEBP)'));
    }
});

// Create new Payment Method (Support QRIS image upload)
router.post('/payment-methods', uploadQris.single('qrImage'), async (req, res) => {
    const { name, accountName, accountNumber, instructions } = req.body;
    const qrFile = req.file;
    
    if (!name || !accountName || !accountNumber) {
        return res.status(400).json({ error: 'Name, Account Name, and Account Number are required.' });
    }

    try {
        let qrImagePath = null;
        if (qrFile) {
            qrImagePath = `/uploads/qris/${qrFile.filename}`;
        }

        const pm = await prisma.paymentMethod.create({
            data: {
                name,
                accountName,
                accountNumber,
                instructions,
                qrImage: qrImagePath,
                isActive: true
            }
        });
        return res.status(201).json({ paymentMethod: pm });
    } catch (error) {
        console.error('Create payment method error:', error);
        return res.status(500).json({ error: 'Failed to create payment method.' });
    }
});

// Toggle Payment Method status
router.patch('/payment-methods/:id/toggle', async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const pm = await prisma.paymentMethod.findUnique({ where: { id } });
        if (!pm) return res.status(404).json({ error: 'Payment method not found.' });

        const updated = await prisma.paymentMethod.update({
            where: { id },
            data: { isActive: !pm.isActive }
        });
        return res.json({ paymentMethod: updated });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to toggle payment method.' });
    }
});

export default router;
