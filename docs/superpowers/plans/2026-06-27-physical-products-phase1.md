# Physical Products — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Lay the foundation for physical product dropship: database schema migration, address management, shipping cost calculation, and Jakmall product sync.

**Architecture:** New models (UserAddress, Cart, CartItem) + extended Order/Product models + Puppeteer-based sync script + api.co.id shipping cost integration.

**Tech Stack:** Prisma ORM, SQLite, Express.js (ESM), Puppeteer, node-cron, api.co.id REST API

## Global Constraints

- All new backend routes use ESM imports (existing pattern)
- All frontend components use React 19 + JSX
- Prisma migrations must be backwards-compatible with existing SMM/PREMIUM data
- `type: "PHYSICAL"` on Product and Order — do NOT change existing type values
- White-label: no "Jakmall" name visible anywhere to customers
- "Gratis ongkir" = shippingCost: 0 in order

---

### Task 1: Prisma Schema Migration

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Execute: `npx prisma migrate dev --name add_physical_product_models`

**Interfaces:**
- Produces: `UserAddress`, `Cart`, `CartItem` models; extended `Order` fields; `Product.stock` field

- [ ] **Step 1: Add UserAddress model to schema.prisma**

Insert after model `User` (line 34):

```prisma
model UserAddress {
  id              Int       @id @default(autoincrement())
  userId          Int
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  label           String    // "Rumah", "Kantor", etc
  recipientName   String
  phoneNumber     String
  province        String
  city            String
  district        String
  village         String
  villageCode     String?
  fullAddress     String
  postalCode      String?
  isDefault       Boolean   @default(false)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  orders          Order[]   @relation("ShippingAddress")

  @@index([userId])
}
```

- [ ] **Step 2: Add Cart & CartItem models to schema.prisma**

Insert after UserAddress block:

```prisma
model Cart {
  id              Int       @id @default(autoincrement())
  userId          Int       @unique
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  items           CartItem[]
}

model CartItem {
  id              Int       @id @default(autoincrement())
  cartId          Int
  cart            Cart      @relation(fields: [cartId], references: [id], onDelete: Cascade)
  productId       Int
  product         Product   @relation(fields: [productId], references: [id])
  quantity        Int       @default(1)
  selectedVariant Json?     // {"color": "Hitam", "size": "XL"}
  createdAt       DateTime  @default(now())

  @@unique([cartId, productId])
  @@index([cartId])
}
```

- [ ] **Step 3: Add Order model fields**

Add to model `Order` after `selectedOs` field (around line 129):

```prisma
  // PHYSICAL order fields
  shippingAddressId   Int?
  shippingAddress     UserAddress? @relation("ShippingAddress", fields: [shippingAddressId], references: [id])
  shippingSnapshot    Json?
  courier             String?
  courierService      String?
  courierServiceName  String?
  shippingCost        Int?
  resi                String?
  shippedAt           DateTime?
  deliveredAt         DateTime?
```

- [ ] **Step 4: Add Product.stock field**

Add to model `Product` after `type` field (around line 57):

```prisma
  stock               Int       @default(0)
```

- [ ] **Step 5: Run migration**

```bash
cd D:/follower-store
npx prisma migrate dev --name add_physical_product_models
```

Expected: new migration created, schema synced to SQLite.

- [ ] **Step 6: Rebuild Prisma Client**

```bash
npx prisma generate
```

Expected: `@prisma/client` updated with new models.

- [ ] **Step 7: Commit**

```bash
git add backend/prisma/
git commit -m "feat: add UserAddress, Cart, CartItem models + physical order/product fields"
```

---

### Task 2: Address CRUD API

**Files:**
- Create: `backend/src/routes/addresses.js`
- Modify: `backend/src/index.js` (mount new router)

**Interfaces:**
- Consumes: UserAddress model from Task 1, `requireAuth` middleware
- Produces: REST endpoints at `/api/addresses`

- [ ] **Step 1: Create `backend/src/routes/addresses.js`**

```javascript
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
    // If this is default, unset other defaults
    if (isDefault) {
      await prisma.userAddress.updateMany({
        where: { userId: req.user.id, isDefault: true },
        data: { isDefault: false },
      });
    }
    const address = await prisma.userAddress.create({
      data: { userId: req.user.id, label, recipientName, phoneNumber, province, city, district, village, villageCode, fullAddress, postalCode, isDefault: isDefault || false },
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
      data: { label, recipientName, phoneNumber, province, city, district, village, villageCode, fullAddress, postalCode, isDefault },
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

// Set default
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
    res.status(500).json({ error: 'Gagal mengatur alamat default.' });
  }
});

export default router;
```

- [ ] **Step 2: Mount router in `backend/src/index.js`**

Add import (after line 22 `import adminAgentsRouter ...`):
```javascript
import addressesRouter from './routes/addresses.js';
```

Add route (after line 76 `app.use('/api/admin', adminAgentsRouter);`):
```javascript
app.use('/api/addresses', addressesRouter);
```

- [ ] **Step 3: Test API manually**

```bash
# Test: create address
curl -s -X POST http://localhost:5000/api/addresses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(node -e "console.log(require('jsonwebtoken').sign({id:1}, process.env.JWT_SECRET || 'fallback-secret', {expiresIn:'1h'}))")" \
  -d '{"label":"Rumah","recipientName":"Budi","phoneNumber":"08123456789","province":"DKI Jakarta","city":"Jakarta Selatan","district":"Kebayoran Baru","village":"Senayan","fullAddress":"Jl. Mawar No. 5","postalCode":"12190"}'
```

Expected: returns the created address object.

- [ ] **Step 4: Commit**

```bash
git add backend/src/routes/addresses.js backend/src/index.js
git commit -m "feat: add address CRUD API"
```

---

### Task 3: Shipping Cost API (api.co.id Integration)

**Files:**
- Create: `backend/src/routes/shipping.js`
- Modify: `backend/src/index.js` (mount router)
- Modify: `backend/.env` (add API_KEY_SHIPPING)

**Interfaces:**
- Consumes: `requireAuth` middleware, `API_KEY_SHIPPING` env var
- Produces: `POST /api/shipping/cost` endpoint

- [ ] **Step 1: Create `backend/src/routes/shipping.js`**

```javascript
import express from 'express';
import fetch from 'node-fetch';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAuth);

const API_CO_ID_BASE = 'https://api.co.id';
const API_KEY = process.env.API_KEY_SHIPPING;

// Calculate shipping cost
router.post('/cost', async (req, res) => {
  const { originVillageCode, destinationVillageCode, weight } = req.body;

  if (!destinationVillageCode || !weight) {
    return res.status(400).json({ error: 'destinationVillageCode dan weight wajib diisi.' });
  }

  if (!API_KEY) {
    return res.status(500).json({ error: 'API Key ongkir belum dikonfigurasi.' });
  }

  try {
    const params = new URLSearchParams();
    if (originVillageCode) params.append('origin_village_code', originVillageCode);
    params.append('destination_village_code', destinationVillageCode);
    params.append('weight', Math.max(1, Math.round(parseFloat(weight))).toString());

    const response = await fetch(`${API_CO_ID_BASE}/expedition/shipping-cost`, {
      method: 'POST',
      headers: {
        'x-api-co-id': API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('api.co.id error:', response.status, text);
      return res.status(502).json({ error: 'Gagal menghitung ongkos kirim.' });
    }

    const data = await response.json();

    // Normalize response: return array of couriers with services
    const couriers = (data.data || []).map(c => ({
      courier: c.courier_code || c.code,
      courierName: c.courier_name || c.name,
      services: (c.services || []).map(s => ({
        service: s.service_code || s.code,
        serviceName: s.service_name || s.name || s.service,
        cost: s.price || s.cost || 0,
        etd: s.etd || '',
        description: s.description || '',
      })),
    }));

    res.json({ couriers });
  } catch (error) {
    console.error('Shipping cost error:', error);
    res.status(502).json({ error: 'Gagal terhubung ke server ongkir.' });
  }
});

export default router;
```

- [ ] **Step 2: Mount in `backend/src/index.js`**

Add import:
```javascript
import shippingRouter from './routes/shipping.js';
```

Add route:
```javascript
app.use('/api/shipping', shippingRouter);
```

- [ ] **Step 3: Add API key to `.env`**

Append to `backend/.env`:
```
API_KEY_SHIPPING=LDOPuhmy2MGdad8Y4geL4CFU0JnlZWAccrczFPsQqBdlZJ0taq
```

- [ ] **Step 4: Test shipping API**

```bash
curl -s -X POST http://localhost:5000/api/shipping/cost \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"destinationVillageCode":"3171010001","weight":1000}'
```

Expected: returns array of couriers with services, prices, and ETD.

- [ ] **Step 5: Commit**

```bash
git add backend/src/routes/shipping.js backend/src/index.js backend/.env
git commit -m "feat: add shipping cost API (api.co.id)"
```

---

### Task 4: Fix & Re-enable Jakmall Sync Script

**Files:**
- Modify: `backend/scripts/sync_jakmall_products.js` (fix and update)
- Modify: `backend/src/utils/cron_jobs.js` (re-enable sync)
- Modify: `backend/package.json` (verify script path)

**Interfaces:**
- Consumes: Prisma, Puppeteer, env vars `JAKMALL_USERNAME`, `JAKMALL_PASSWORD`
- Produces: Physical products in DB with `source: "jakmall"`, `type: "PHYSICAL"` (not GENERAL)

- [ ] **Step 1: Rewrite sync_jakmall_products.js**

Key changes from existing script:
- Products saved with `type: "PHYSICAL"` instead of no type
- Create category by Jakmall's category name (auto-map)
- Price stored in `priceUser`, auto-calculate `priceReseller` as 85%
- All products get `source: "jakmall"` and `isActive: true`
- Nonaktifkan produk yang tidak ada di CSV terbaru

Replace entire file content:

```javascript
import puppeteer from 'puppeteer';
import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

const JAKMALL_USERNAME = process.env.JAKMALL_USERNAME;
const JAKMALL_PASSWORD = process.env.JAKMALL_PASSWORD;
const DOWNLOAD_DIR = path.join(__dirname, '..', '..', 'downloads');
const IMAGE_DIR = path.join(__dirname, '..', '..', 'public', 'images', 'jakmall');

async function syncJakmallProducts() {
  console.log('=== Jakmall Product Sync Started ===');

  if (!JAKMALL_USERNAME || !JAKMALL_PASSWORD) {
    console.error('JAKMALL_USERNAME and JAKMALL_PASSWORD must be set in .env');
    return { created: 0, updated: 0, deactivated: 0, errors: [] };
  }

  if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  if (!fs.existsSync(IMAGE_DIR)) fs.mkdirSync(IMAGE_DIR, { recursive: true });

  let browser;
  let stats = { created: 0, updated: 0, deactivated: 0, errors: [] };

  try {
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Login
    console.log('Logging in to Jakmall Partner Portal...');
    await page.goto('https://partner.jakmall.com/login', { waitUntil: 'networkidle2', timeout: 30000 });
    await page.type('input[name="username"], #username', JAKMALL_USERNAME);
    await page.type('input[name="password"], #password', JAKMALL_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });

    if (page.url().includes('login')) {
      throw new Error('Login gagal. Periksa kredensial Jakmall.');
    }
    console.log('Login berhasil.');

    // Navigate to export page
    await page.goto('https://partner.jakmall.com/product/export', { waitUntil: 'networkidle2', timeout: 30000 });

    // Trigger CSV download
    const [download] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/product/export/download') && r.status() === 200, { timeout: 30000 }),
      page.click('button[type="submit"]'),
    ]);

    // Wait for download to finish
    await new Promise(r => setTimeout(r, 8000));

    const files = fs.readdirSync(DOWNLOAD_DIR).filter(f => f.endsWith('.csv'));
    if (files.length === 0) throw new Error('Tidak ada file CSV yang terdownload.');
    const csvFile = path.join(DOWNLOAD_DIR, files.sort((a, b) => fs.statSync(path.join(DOWNLOAD_DIR, b)).mtime - fs.statSync(path.join(DOWNLOAD_DIR, a)).mtime)[0]);
    console.log(`CSV: ${csvFile}`);

    // Parse CSV
    const rows = await new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(csvFile, { encoding: 'utf-8' })
        .pipe(csv())
        .on('data', row => results.push(row))
        .on('end', () => resolve(results))
        .on('error', reject);
    });

    console.log(`Parsed ${rows.length} products from CSV.`);

    // Collect all Jakmall product IDs from CSV
    const csvIds = new Set();

    for (const row of rows) {
      const jakmallProductId = row['Product ID'] || row['product_id'];
      if (!jakmallProductId) continue;
      csvIds.add(jakmallProductId);

      try {
        const name = row['Product Name'] || row['name'];
        const description = row['Description'] || row['description'] || '';
        const price = parseFloat(row['Price'] || row['price'] || 0);
        const stock = parseInt(row['Stock'] || row['stock'] || 0);
        const categoryName = row['Category'] || row['category'] || 'Umum';
        const weight = parseFloat(row['Weight'] || row['weight'] || 0);
        const length = parseFloat(row['Length'] || row['length'] || 0);
        const width = parseFloat(row['Width'] || row['width'] || 0);
        const height = parseFloat(row['Height'] || row['height'] || 0);
        const imageUrlRaw = row['Image URLs'] || row['image_urls'] || '';
        const variantsRaw = row['Variants'] || row['variants'] || '';

        // Ensure category exists (auto-map from Jakmall's category name)
        const catSlug = 'fisik-' + categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        let category = await prisma.category.findUnique({ where: { slug: catSlug } });
        if (!category) {
          category = await prisma.category.create({
            data: { name: categoryName, slug: catSlug, type: 'PHYSICAL', order: 50 },
          });
          console.log(`Created category: ${categoryName} (${catSlug})`);
        }

        // Download first image
        let imageUrl = null;
        const urls = imageUrlRaw.split(',').map(u => u.trim()).filter(Boolean);
        if (urls.length > 0) {
          try {
            const imgName = `jakmall_${jakmallProductId}_0.jpg`;
            const localPath = path.join(IMAGE_DIR, imgName);
            if (!fs.existsSync(localPath)) {
              const response = await axios({ url: urls[0], method: 'GET', responseType: 'stream', timeout: 10000 });
              const writer = fs.createWriteStream(localPath);
              response.data.pipe(writer);
              await new Promise((resolve, reject) => { writer.on('finish', resolve); writer.on('error', reject); });
            }
            imageUrl = `/images/jakmall/${imgName}`;
          } catch (imgErr) {
            console.error(`Image download failed for product ${jakmallProductId}: ${imgErr.message}`);
          }
        }

        // Parse variants JSON
        let variants = null;
        if (variantsRaw) {
          try { variants = JSON.parse(variantsRaw); } catch { variants = null; }
        }

        // Upsert product
        const existing = await prisma.product.findUnique({ where: { jakmallProductId } });

        const data = {
          name,
          description,
          priceUser: Math.round(price),
          priceReseller: Math.round(price * 0.85),
          type: 'PHYSICAL',
          categoryId: category.id,
          source: 'jakmall',
          categoryJakmall: categoryName,
          weight,
          length,
          width,
          height,
          stock,
          imageUrl,
          variants,
          isActive: true,
          minOrder: 1,
          maxOrder: 99999,
        };

        if (existing) {
          await prisma.product.update({ where: { id: existing.id }, data });
          stats.updated++;
        } else {
          await prisma.product.create({
            data: { ...data, jakmallProductId, slug: `jakmall-${jakmallProductId}-${Date.now()}` },
          });
          stats.created++;
        }
      } catch (err) {
        console.error(`Error processing product ${jakmallProductId}:`, err.message);
        stats.errors.push({ id: jakmallProductId, error: err.message });
      }
    }

    // Deactivate products that are no longer in CSV
    const activeJakmallProducts = await prisma.product.findMany({
      where: { source: 'jakmall', isActive: true },
      select: { id: true, jakmallProductId: true },
    });
    for (const prod of activeJakmallProducts) {
      if (prod.jakmallProductId && !csvIds.has(prod.jakmallProductId)) {
        await prisma.product.update({
          where: { id: prod.id },
          data: { isActive: false },
        });
        stats.deactivated++;
        console.log(`Deactivated product #${prod.id} (${prod.jakmallProductId}) — no longer in CSV.`);
      }
    }

  } catch (error) {
    console.error('Sync error:', error.message);
    stats.errors.push({ id: 'global', error: error.message });
  } finally {
    if (browser) await browser.close();
    // Cleanup old CSV files
    if (fs.existsSync(DOWNLOAD_DIR)) {
      fs.readdirSync(DOWNLOAD_DIR).filter(f => f.endsWith('.csv')).forEach(f => {
        try { fs.unlinkSync(path.join(DOWNLOAD_DIR, f)); } catch {}
      });
    }
  }

  console.log(`=== Sync complete: ${stats.created} created, ${stats.updated} updated, ${stats.deactivated} deactivated, ${stats.errors.length} errors ===`);
  return stats;
}

export { syncJakmallProducts };

// Run directly: node backend/scripts/sync_jakmall_products.js
if (process.argv[1] && (process.argv[1] === __filename || process.argv[1].endsWith('sync_jakmall_products.js'))) {
  syncJakmallProducts().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}
```

- [ ] **Step 2: Re-enable cron in `backend/src/utils/cron_jobs.js`**

```javascript
import cron from 'node-cron';
import { syncJakmallProducts } from '../scripts/sync_jakmall_products.js';

export const setupCronJobs = () => {
  // Sync Jakmall products every day at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('[CRON] Starting Jakmall product sync...');
    const stats = await syncJakmallProducts();
    console.log('[CRON] Jakmall sync result:', JSON.stringify(stats));
  });

  console.log('Cron jobs scheduled.');
};
```

- [ ] **Step 3: Ensure puppeteer & csv-parser are in dependencies**

Check `backend/package.json` — puppeteer ^22.9.0 and csv-parser ^3.0.0 should already be listed. If not:
```bash
cd D:/follower-store/backend && npm install puppeteer csv-parser
```

- [ ] **Step 4: Manual test**

```bash
cd D:/follower-store
node backend/scripts/sync_jakmall_products.js
```

Expected: connects to Jakmall, downloads CSV, syncs products. Check DB with `npx prisma studio`.

- [ ] **Step 5: Commit**

```bash
git add backend/scripts/sync_jakmall_products.js backend/src/utils/cron_jobs.js
git commit -m "fix: re-enable Jakmall sync with PHYSICAL type, auto-category, white-label"
```

---

### Task 5: Admin Sync Button & Status

**Files:**
- Create: `frontend/src/components/AdminPhysicalSync.jsx` (UI component)
- Modify: `backend/src/routes/admin.js` (add sync endpoint)
- Modify: `frontend/src/pages/AdminDashboard.jsx` (mount in routes + nav)
- Modify: `frontend/src/styles/pages/dashboard.css` (add physical order styles)

- [ ] **Step 1: Add admin sync endpoint to `backend/src/routes/admin.js`**

Add before `export default router`:

```javascript
// Physical product sync trigger (admin)
router.post('/sync-jakmall', async (req, res) => {
  try {
    const { syncJakmallProducts } = await import('../scripts/sync_jakmall_products.js');
    const stats = await syncJakmallProducts();
    res.json({ message: 'Sinkronisasi selesai.', stats });
  } catch (error) {
    console.error('Admin sync error:', error);
    res.status(500).json({ error: 'Gagal sinkronisasi: ' + error.message });
  }
});
```

- [ ] **Step 2: Create `AdminPhysicalSync.jsx` component**

```javascript
import React, { useState } from 'react';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

export default function AdminPhysicalSync({ token }) {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSync = async () => {
    setSyncing(true);
    setResult(null);
    setError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/sync-jakmall`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data.stats);
    } catch (err) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="adm-card">
      <div className="adm-card-header" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <RefreshCw size={18} style={{ color: 'var(--accent-primary)' }} />
        Sinkronisasi Produk Fisik (Jakmall)
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
        Tarik data produk terbaru: nama, harga, stok, varian, gambar, dan berat.
      </p>

      <button onClick={handleSync} className="btn btn-primary" disabled={syncing}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', fontSize: 13 }}>
        <RefreshCw size={16} className={syncing ? 'spin' : ''} />
        {syncing ? 'Menyinkronkan...' : 'Sinkron Sekarang'}
      </button>

      {error && (
        <div className="adm-alert" style={{ marginTop: 16, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.15)', color: '#dc2626' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {result && (
        <div style={{ marginTop: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div className="adm-stat-card" style={{ flex: 1, minWidth: 120, gap: 4, padding: 16 }}>
            <CheckCircle size={18} style={{ color: '#16a34a' }} />
            <div className="adm-stat-value" style={{ fontSize: 20 }}>{result.created}</div>
            <div className="adm-stat-label">Produk Baru</div>
          </div>
          <div className="adm-stat-card" style={{ flex: 1, minWidth: 120, gap: 4, padding: 16 }}>
            <RefreshCw size={18} style={{ color: 'var(--accent-primary)' }} />
            <div className="adm-stat-value" style={{ fontSize: 20 }}>{result.updated}</div>
            <div className="adm-stat-label">Diperbarui</div>
          </div>
          <div className="adm-stat-card" style={{ flex: 1, minWidth: 120, gap: 4, padding: 16 }}>
            <AlertCircle size={18} style={{ color: result.deactivated > 0 ? '#d97706' : 'var(--text-muted)' }} />
            <div className="adm-stat-value" style={{ fontSize: 20 }}>{result.deactivated}</div>
            <div className="adm-stat-label">Dinonaktifkan</div>
          </div>
          <div className="adm-stat-card" style={{ flex: 1, minWidth: 120, gap: 4, padding: 16 }}>
            <AlertCircle size={18} style={{ color: result.errors?.length > 0 ? '#dc2626' : '#16a34a' }} />
            <div className="adm-stat-value" style={{ fontSize: 20 }}>{result.errors?.length || 0}</div>
            <div className="adm-stat-label">Error</div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Add to AdminDashboard**

In `AdminDashboard.jsx`:
- Add import: `import AdminPhysicalSync from '../components/AdminPhysicalSync';`
- Add nav item: 
  ```javascript
  { to: '/admin/physical-sync', end: false, icon: RefreshCw, label: 'Sync Fisik', badge: null },
  ```
- Add route:
  ```jsx
  <Route path="/physical-sync" element={<AdminPhysicalSync token={token} />} />
  ```

- [ ] **Step 4: Add physical order styles to `dashboard.css`**

Add before the responsive section:

```css
/* ── Physical Orders ── */
.adm-physical-status-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.adm-ship-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 18px;
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  font-size: 13px;
  flex: 1;
  min-width: 140px;
}
.adm-ship-card .label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; }
.adm-ship-card .value { font-size: 15px; font-weight: 700; }
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/AdminPhysicalSync.jsx backend/src/routes/admin.js frontend/src/pages/AdminDashboard.jsx frontend/src/styles/pages/dashboard.css
git commit -m "feat: admin sync button for Jakmall products"
```

---

## Self-Review Checklist

1. **Spec coverage:** All Phase 1 items covered:
   - ✅ Database migration (UserAddress, Cart, CartItem, Order fields, Product.stock)
   - ✅ Address CRUD API
   - ✅ Shipping cost API (api.co.id)
   - ✅ Jakmall sync script fix
   - ✅ Admin sync button
   - ✅ Cron schedule

2. **Placeholder scan:** No TBD, TODO, or placeholders. Every step has complete code.

3. **Type consistency:** 
   - `UserAddress` model used consistently across Tasks 1-2
   - `requireAuth` imported everywhere
   - `type: "PHYSICAL"` consistent across sync script and product model
   - `source: "jakmall"` used for white-label filtering
   - `API_KEY_SHIPPING` env var name consistent
