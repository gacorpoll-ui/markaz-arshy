import express from 'express';
import prisma from '../db.js';

const router = express.Router();

router.get('/categories', async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { order: 'asc' }
        });
        res.json({ categories });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch categories.' });
    }
});

router.get('/products', async (req, res) => {
    const { type, categorySlug, source } = req.query;
    try {
        const where = { isActive: true };
        if (type) where.type = type.toUpperCase();
        if (categorySlug) where.category = { slug: categorySlug };
        if (source) where.source = source;

        const products = await prisma.product.findMany({
            where,
            include: {
                category: { select: { name: true, slug: true, type: true } },
                accounts: { where: { isSold: false }, select: { id: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        const productsWithStock = products.map(p => ({
            ...p,
            stockCount: p.type === 'PHYSICAL' ? (p.stock || 0) : p.accounts.length
        }));

        res.json({ products: productsWithStock });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch products.' });
    }
});

router.get('/products/:slug', async (req, res) => {
    try {
        const product = await prisma.product.findUnique({
            where: { slug: req.params.slug, isActive: true },
            include: {
                category: { select: { name: true, slug: true } },
            }
        });
        if (!product) return res.status(404).json({ error: 'Product not found.' });
        res.json({ product });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch product.' });
    }
});

export default router;
