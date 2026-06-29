import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { setupCronJobs } from './utils/cron_jobs.js';

// Load environment variables
dotenv.config();

// Import routers
import authRouter from './routes/auth.js';
import catalogRouter from './routes/catalog.js';
import ordersRouter from './routes/orders.js';
import depositsRouter from './routes/deposits.js';
import reviewsRouter from './routes/reviews.js';
import adminRouter from './routes/admin.js';
import adminPaymentRouter from './routes/admin-payment.js';
import aiRouter from './routes/ai-router.js';
import aiRouterWebhook from './routes/ai-router-webhook.js';
import adminAIRouter from './routes/admin-ai.js';
import proxyAIRouter from './routes/proxy-ai.js';
import adminAgentsRouter from './routes/admin-agents.js';
import adminPhysicalRouter from './routes/admin-physical.js';
import addressesRouter from './routes/addresses.js';
import shippingRouter from './routes/shipping.js';
import cartRouter from './routes/cart.js';
import regionalRouter from './routes/regional.js';
import favoritesRouter from './routes/favorites.js';
import discussionsRouter from './routes/discussions.js';
import jakmallCategories from './data/jakmall_categories.json' with { type: 'json' };
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import prisma from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Serve frontend production build (jika folder dist ada)
const frontendDist = path.join(__dirname, '..', '..', 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    }
  }));
  console.log('✅ Serving frontend from:', frontendDist);
}

// Trust proxy (needed because Cloudflare adds X-Forwarded-For header)
app.set('trust proxy', 1);

// Middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'https://markaz-arshy.com',
    'https://markaz-arshy.com',
    'https://api.markaz-arshy.com',
    'http://localhost:5000',
    'http://localhost:5173',
  ],
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Serve uploads folder as static (restrict executable content)
app.use('/uploads', express.static('uploads', {
  setHeaders: (res) => {
    res.setHeader('Content-Security-Policy', "default-src 'none'");
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
}));

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Markaz-Arshy Server is running.' });
});

// AI Proxy: /v1/* — used by Claude Code, Cline, Cursor, etc.
// Mounted BEFORE other routes to intercept /v1/chat/completions, /v1/models
app.use('/v1', proxyAIRouter);

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/catalog', catalogRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/deposits', depositsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/admin', adminPaymentRouter);
app.use('/api/ai-router', aiRouter);
app.use('/api/ai-router-webhook', aiRouterWebhook);
app.use('/api/admin', adminAIRouter);
app.use('/api/admin', adminAgentsRouter);
app.use('/api/admin', adminPhysicalRouter);
app.use('/api/addresses', addressesRouter);
app.use('/api/shipping', shippingRouter);
app.use('/api/cart', cartRouter);
app.use('/api/regional', regionalRouter);
app.use('/api/favorites', favoritesRouter);
app.use('/api/discussions', discussionsRouter);
app.get('/api/jakmall/categories', (req, res) => {
  res.json(jakmallCategories);
});

// GET /api/physical/category-counts — count produk per fisik-* kategori
app.get('/api/physical/category-counts', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { type: 'PHYSICAL', isActive: true, source: 'jakmall' },
      select: { category: { select: { slug: true, name: true } } },
    });
    const counts = {};
    products.forEach(p => {
      const slug = p.category?.slug;
      if (slug) counts[slug] = (counts[slug] || 0) + 1;
    });
    res.json({ counts });
  } catch (e) {
    res.status(500).json({ error: 'Gagal' });
  }
});

// GET /api/physical/category-mapping — auto-generate sidebar category mapping
// Menerjemahkan leaf slug dari jakmall_categories.json → fisik-* slug di DB
// Berdasarkan data categoryJakmall dari produk yang sudah diimport
app.get('/api/physical/category-mapping', async (req, res) => {
  try {
    // Ambil semua produk jakmall dengan categoryJakmall + category slug
    const products = await prisma.product.findMany({
      where: { type: 'PHYSICAL', isActive: true, source: 'jakmall', categoryJakmall: { not: null } },
      select: { categoryJakmall: true, category: { select: { slug: true } } },
    });

    // Build map: jakmallCategoryName → fisik-* slug
    const rawMap = {};
    for (const p of products) {
      if (p.categoryJakmall && p.category?.slug) {
        rawMap[p.categoryJakmall] = p.category.slug;
      }
    }

    // Load jakmall_categories.json tree
    const tree = jakmallCategories.categories || [];

    // Flatten tree → semua leaf slug + name
    function flatten(cats, parentSlug = '') {
      const result = [];
      for (const c of cats) {
        result.push({ name: c.name, slug: c.slug, parentSlug });
        if (c.children) result.push(...flatten(c.children, c.slug));
      }
      return result;
    }
    const allLeaves = flatten(tree);

    // Match setiap leaf name ke rawMap untuk dapat fisik-* slug
    const leafMatch = {};
    for (const leaf of allLeaves) {
      // Coba exact match nama kategori Jakmall
      if (rawMap[leaf.name]) {
        leafMatch[leaf.slug] = rawMap[leaf.name];
        continue;
      }
      // Fallback: cocokkan dengan parent slug
      if (leaf.parentSlug) {
        const parentCats = tree.filter(c => c.slug === leaf.parentSlug);
        if (parentCats.length > 0) {
          // Cari parent name di rawMap
          const parentName = parentCats[0].name;
          // Map parent name → slug DB via children
          const childCategories = parentCats[0].children || [];
          for (const child of childCategories) {
            if (rawMap[child.name]) {
              leafMatch[leaf.slug] = rawMap[child.name];
              break;
            }
          }
          // Fallback: coba parent name langsung
          if (!leafMatch[leaf.slug] && rawMap[parentName]) {
            leafMatch[leaf.slug] = rawMap[parentName];
          }
        }
      }
      // Fallback akhir: parentSlug → fisik-parentSlug
      if (!leafMatch[leaf.slug]) {
        const parent = leaf.parentSlug || leaf.slug;
        // Coba cari parent di DB
        const dbCat = await prisma.category.findFirst({
          where: { OR: [{ slug: `fisik-${parent}` }, { slug: parent }] },
        });
        if (dbCat) leafMatch[leaf.slug] = dbCat.slug;
      }
    }

    res.json({
      mapping: leafMatch,
      totalLeaves: allLeaves.length,
      matched: Object.keys(leafMatch).length,
    });
  } catch (e) {
    console.error('Category mapping error:', e);
    res.status(500).json({ error: 'Gagal generate mapping' });
  }
});

// Initialize Cron Jobs
setupCronJobs();

// ── XML Sitemap ──
app.get(['/sitemap.xml', '/sitemap'], async (req, res) => {
  res.header('Content-Type', 'application/xml');
  try {
    const SITE = 'https://markaz-arshy.com';
    let cnt = 0;
    let x = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
    const staticPages = [['/',1],['/marketplace',0.9],['/catalog/smm',0.8],['/catalog/premium',0.8],['/catalog/vps-rdp',0.7],['/catalog/ai-router',0.7],['/docs/ai',0.6],['/deposit',0.5]];
    staticPages.forEach(p => { x += '<url><loc>' + SITE + p[0] + '</loc><priority>' + p[1] + '</priority><changefreq>daily</changefreq></url>'; cnt++; });
    const prods = await prisma.product.findMany({ where: { type: 'PHYSICAL', isActive: true }, select: { slug: true } });
    prods.forEach(p => { x += '<url><loc>' + SITE + '/catalog/fisik/' + p.slug + '</loc><priority>0.6</priority><changefreq>weekly</changefreq></url>'; cnt++; });
    x += '</urlset>';
    res.send(x + '<!-- COUNT:' + cnt + ' -->');
  } catch(e) { console.error('SITEMAP_ERROR:', e.message || e); res.status(500).send('Err: ' + (e.message || e)); }
});// ── Robots.txt ──// ── Robots.txt ──
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send('User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin/\nDisallow: /dashboard/\nDisallow: /cart\nDisallow: /checkout\nDisallow: /login\nDisallow: /register\n\nSitemap: https://markaz-arshy.com/sitemap.xml\n');
});



// SPA Fallback: serve index.html for any non-API request
app.use((req, res, next) => {
  if (req.path === '/sitemap.xml' || req.path === '/robots.txt' || req.path.startsWith('/api/') || req.path.startsWith('/v1/') || req.path.startsWith('/uploads/')) {
    return next();
  }
  const indexPath = path.join(frontendDist, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    next();
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error.' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`🚀 Server started on port http://localhost:${PORT}`);
  console.log(`===================================================`);
});
