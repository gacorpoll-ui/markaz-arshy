import express from 'express';
import prisma from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import multer from 'multer';
import { spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { resolveCategory, CATEGORY_NAMES } from '../data/jakmall_categories.js';

const upload = multer({ dest: os.tmpdir() });

const router = express.Router();

router.use(requireAuth);
router.use(requireAdmin);

// GET /api/admin/physical-orders — list PHYSICAL orders with filters
router.get('/physical-orders', async (req, res) => {
  try {
    const { status, search, limit: reqLimit, offset } = req.query;
    const take = Math.min(parseInt(reqLimit) || 50, 200);
    const skip = parseInt(offset) || 0;

    const where = { type: 'PHYSICAL' };

    if (status) where.status = status;
    if (search) {
      where.OR = [
        { id: parseInt(search) || 0 },
        { resi: { contains: search } },
        { product: { name: { contains: search } } },
        { user: { name: { contains: search } } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, slug: true, imageUrl: true, jakmallProductId: true, weight: true, variants: true } },
          user: { select: { id: true, name: true, email: true, whatsapp: true } },
          shippingAddress: true,
        },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      prisma.order.count({ where }),
    ]);

    res.json({ orders, total, limit: take, offset: skip });
  } catch (error) {
    console.error('Fetch physical orders error:', error);
    res.status(500).json({ error: 'Gagal memuat pesanan fisik.' });
  }
});

// GET /api/admin/physical-orders/:id — single order detail
router.get('/physical-orders/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const order = await prisma.order.findFirst({
      where: { id, type: 'PHYSICAL' },
      include: {
        product: true,
        user: { select: { id: true, name: true, email: true, whatsapp: true } },
        shippingAddress: true,
      },
    });
    if (!order) return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
    res.json({ order });
  } catch (error) {
    console.error('Fetch physical order error:', error);
    res.status(500).json({ error: 'Gagal memuat detail pesanan.' });
  }
});

// PUT /api/admin/physical-orders/:id/approve-payment — PAYMENT_SUBMITTED → PENDING
router.put('/physical-orders/:id/approve-payment', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const order = await prisma.order.findFirst({ where: { id, type: 'PHYSICAL', status: 'PAYMENT_SUBMITTED' } });
    if (!order) return res.status(404).json({ error: 'Pesanan tidak ditemukan atau sudah diproses.' });

    const updated = await prisma.order.update({ where: { id }, data: { status: 'PENDING' } });
    res.json({ message: 'Pembayaran dikonfirmasi. Pesanan siap diproses.', order: updated });
  } catch (error) {
    console.error('Approve payment error:', error);
    res.status(500).json({ error: 'Gagal konfirmasi pembayaran.' });
  }
});

// PUT /api/admin/physical-orders/:id/reject-payment — AWAITING_PAYMENT/PAYMENT_SUBMITTED → CANCELLED
router.put('/physical-orders/:id/reject-payment', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const order = await prisma.order.findFirst({ where: { id, type: 'PHYSICAL', status: { in: ['AWAITING_PAYMENT', 'PAYMENT_SUBMITTED'] } } });
    if (!order) return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });

    await prisma.product.update({ where: { id: order.productId }, data: { stock: { increment: order.quantity } } });
    const updated = await prisma.order.update({ where: { id }, data: { status: 'CANCELLED' } });
    res.json({ message: 'Pesanan dibatalkan. Stok dikembalikan.', order: updated });
  } catch (error) {
    console.error('Reject payment error:', error);
    res.status(500).json({ error: 'Gagal membatalkan pesanan.' });
  }
});

// PUT /api/admin/physical-orders/:id/process — PENDING → PROCESSING
router.put('/physical-orders/:id/process', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const order = await prisma.order.findFirst({ where: { id, type: 'PHYSICAL', status: 'PENDING' } });
    if (!order) return res.status(404).json({ error: 'Pesanan tidak ditemukan atau sudah diproses.' });

    const updated = await prisma.order.update({
      where: { id },
      data: { status: 'PROCESSING' },
    });
    res.json({ message: 'Pesanan sedang diproses.', order: updated });
  } catch (error) {
    console.error('Process order error:', error);
    res.status(500).json({ error: 'Gagal memproses pesanan.' });
  }
});

// PUT /api/admin/physical-orders/:id/ship — PROCESSING → SHIPPING (input resi)
router.put('/physical-orders/:id/ship', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { resi } = req.body;
    if (!resi) return res.status(400).json({ error: 'Nomor resi wajib diisi.' });

    const order = await prisma.order.findFirst({ where: { id, type: 'PHYSICAL', status: 'PROCESSING' } });
    if (!order) return res.status(404).json({ error: 'Pesanan tidak ditemukan atau tidak dalam status PROCESSING.' });

    const updated = await prisma.order.update({
      where: { id },
      data: { status: 'SHIPPING', resi, shippedAt: new Date() },
    });
    res.json({ message: 'Resi berhasil disimpan, status pengiriman.', order: updated });
  } catch (error) {
    console.error('Ship order error:', error);
    res.status(500).json({ error: 'Gagal mengirim pesanan.' });
  }
});

// PUT /api/admin/physical-orders/:id/deliver — SHIPPING → DELIVERED
router.put('/physical-orders/:id/deliver', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const order = await prisma.order.findFirst({ where: { id, type: 'PHYSICAL', status: 'SHIPPING' } });
    if (!order) return res.status(404).json({ error: 'Pesanan tidak ditemukan atau tidak dalam status SHIPPING.' });

    const updated = await prisma.order.update({
      where: { id },
      data: { status: 'DELIVERED', deliveredAt: new Date() },
    });
    res.json({ message: 'Pesanan selesai.', order: updated });
  } catch (error) {
    console.error('Deliver order error:', error);
    res.status(500).json({ error: 'Gagal menyelesaikan pesanan.' });
  }
});

// ── POST /api/admin/import-jakmall — Import XLSX ──
// CATEGORY_MAP and CATEGORY_NAMES imported from ../data/jakmall_categories.js

function jakmallSlugify(text) {
  if (!text) return '';
  return text.toLowerCase()
    .replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').substring(0, 80);
}

async function ensureParentCategory(slug) {
  let cat = await prisma.category.findFirst({
    where: { OR: [{ slug }, { slug: `fisik-${slug}` }] },
  });
  if (!cat) {
    cat = await prisma.category.findFirst({
      where: { slug: { contains: slug.replace(/-/g, '') }, type: 'PHYSICAL' },
    });
  }
  if (!cat) {
    const name = CATEGORY_NAMES[slug] || slug;
    cat = await prisma.category.create({
      data: { name, slug: `fisik-${slug}`, type: 'PHYSICAL', order: 50 },
    });
  }
  return cat;
}

router.post('/import-jakmall', upload.single('file'), async (req, res) => {
  const f = req.file;
  if (!f) return res.status(400).json({ error: 'File XLSX diperlukan.' });
  if (!f.originalname.match(/\.(xlsx|xls)$/i)) {
    return res.status(400).json({ error: 'File harus format XLSX.' });
  }

  const xlsxPath = f.path;
  try {
    // Parse via Python
    const pyScript = `import pandas as pd, json, sys
xlsx = ${JSON.stringify(xlsxPath.replace(/\\/g, '/'))}
df = pd.read_excel(xlsx, engine='calamine')
df = df.fillna('')
rows = []
for _, row in df.iterrows():
  images = [row.get(f'Gambar {i}', '') for i in range(1, 11)]
  images = [u for u in images if u]
  rows.append({
    'nama': row['Nama Produk*'], 'kategori': row['Kategori'],
    'brand': str(row.get('Brand', '')), 'sku': str(row['Kode SKU']),
    'deskripsi': str(row['Deskripsi Produk'])[:2000],
    'harga': str(row['Harga (Rp)']), 'berat': str(row['Berat (Gram)']),
    'varian1_nama': str(row.get('Nama Varian 1', '')),
    'varian1_jenis': str(row.get('Jenis Varian 1', '')),
    'varian2_nama': str(row.get('Nama Varian 2', '')),
    'varian2_jenis': str(row.get('Jenis Varian 2', '')),
    'gambar': images,
  })
print(json.dumps(rows, ensure_ascii=False))`;

    const tmpPy = path.join(os.tmpdir(), `jakmall_import_${Date.now()}.py`);
    fs.writeFileSync(tmpPy, pyScript, 'utf-8');

    let products;
    try {
      const result = spawnSync('python', [tmpPy], {
        encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024,
        env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
      });
      if (result.error) throw result.error;
      if (result.status !== 0) throw new Error(result.stderr);
      products = JSON.parse(result.stdout.trim());
    } finally {
      try { fs.unlinkSync(tmpPy); } catch {}
    }

    let created = 0, updated = 0, skipped = 0;

    for (const p of products) {
      const sku = p.sku.replace(/\.0$/, '').trim();
      if (!sku || !p.nama) { skipped++; continue; }

      const parentSlug = resolveCategory(p.kategori);
      const parent = await ensureParentCategory(parentSlug);
      if (!parent) { skipped++; continue; }

      let variants = null;
      const v1n = p.varian1_nama || '', v1j = p.varian1_jenis || '';
      const v2n = p.varian2_nama || '', v2j = p.varian2_jenis || '';
      if (v1n && v1j) {
        const v = [{ name: v1n, options: v1j.split(/[,;\/]/).map(s => s.trim()).filter(Boolean) }];
        if (v2n && v2j) v.push({ name: v2n, options: v2j.split(/[,;\/]/).map(s => s.trim()).filter(Boolean) });
        variants = v;
      }

      const price = parseInt(p.harga) || 0;
      const desc = p.deskripsi.replace(/\\n/g, '\n').substring(0, 3000) || null;
      let slug = jakmallSlugify(p.nama) + '-' + sku.toLowerCase().substring(0, 12);
      if (!slug) slug = `fisik-${sku}`;

      const weight = parseFloat(p.berat) || null;
      const images = p.gambar || [];
      const imageUrl = images[0] || null;

      const data = {
        name: p.nama.substring(0, 200), slug, description: desc,
        priceUser: price, priceReseller: Math.round(price * 0.85),
        type: 'PHYSICAL', stock: 1, source: 'jakmall',
        jakmallProductId: sku, categoryJakmall: p.kategori,
        weight, variants, imageUrl,
        images: images.length > 0 ? JSON.stringify(images) : null,
        isActive: true, categoryId: parent.id,
      };

      const existing = await prisma.product.findUnique({ where: { jakmallProductId: sku } });
      if (existing) {
        data.slug = existing.slug;
        await prisma.product.update({ where: { id: existing.id }, data });
        updated++;
      } else {
        await prisma.product.create({ data });
        created++;
      }
    }

    res.json({ message: 'Import selesai.', created, updated, skipped, total: products.length });
  } catch (err) {
    console.error('Import error:', err);
    res.status(500).json({ error: 'Gagal import: ' + err.message });
  } finally {
    try { fs.unlinkSync(xlsxPath); } catch {}
  }
});

// ── POST /api/admin/sync-jakmall-stock — Download inventory export + update stock ──
router.post('/sync-jakmall-stock', async (req, res) => {
  const { mitraEmail, mitraPassword } = req.body;
  if (!mitraEmail || !mitraPassword) {
    return res.status(400).json({ error: 'Email dan password Jakmall mitra diperlukan.' });
  }

  const tmpDir = os.tmpdir();
  const cookieJar = path.join(tmpDir, `jakmall_cookies_${Date.now()}.txt`);
  const xlsxOut = path.join(tmpDir, `jakmall_sync_${Date.now()}.xlsx`);

  let loginPy, scrapePy;
  try {
    // Step 1: Login via Python requests
    loginPy = path.join(tmpDir, `jakmall_login_${Date.now()}.py`);
    fs.writeFileSync(loginPy, `
import requests, json, sys

session = requests.Session()
jar = requests.cookies.RequestsCookieJar()

# Get login page for CSRF
r = session.get('https://www.jakmall.com/mitra', headers={
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
})
csrf_match = __import__('re').search(r'name="_token" type="hidden" value="([^"]+)"', r.text)
csrf = csrf_match.group(1) if csrf_match else ''

# Login
r2 = session.post('https://www.jakmall.com/login', data={
    '_token': csrf, 'email': '${mitraEmail.replace(/'/g, "'\\''")}',
    'password': '${mitraPassword.replace(/'/g, "'\\''")}', 'remember': 'true'
}, headers={'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.jakmall.com/mitra'})

if 'Location' in r2.headers and r2.headers['Location'] == 'https://www.jakmall.com/mitra':
    # Follow redirect
    r2 = session.get('https://www.jakmall.com/mitra', headers={'User-Agent': 'Mozilla/5.0'})

# Save cookies
with open('${cookieJar.replace(/\\/g, '/')}', 'w') as f:
    for c in session.cookies:
        f.write(f"{c.name}={c.value}\\n")

print(json.dumps({'csrf': csrf, 'success': True, 'url': r2.url, 'status': r2.status_code}))
`);
    let loginResult = spawnSync('python', [loginPy], { encoding: 'utf-8', maxBuffer: 1024 * 1024 });
    if (loginResult.error || loginResult.status !== 0) {
      throw new Error('Gagal login ke Jakmall: ' + (loginResult.stderr || loginResult.error?.message));
    }

    // Step 2: Download inventory XLSX
    scrapePy = path.join(tmpDir, `jakmall_download_${Date.now()}.py`);
    fs.writeFileSync(scrapePy, `
import requests, json, sys

session = requests.Session()
# Load cookies
with open('${cookieJar.replace(/\\/g, '/')}', 'r') as f:
    for line in f:
        line = line.strip()
        if '=' in line:
            k, v = line.split('=', 1)
            session.cookies.set(k, v)

# Get CSRF from mitra page
r = session.get('https://www.jakmall.com/mitra', headers={
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
})
csrf_match = __import__('re').search(r'name="_token" type="hidden" value="([^"]+)"', r.text)
csrf = csrf_match.group(1) if csrf_match else ''

# Download inventory XLSX
headers = {
    'User-Agent': 'Mozilla/5.0',
    'Referer': 'https://www.jakmall.com/mitra/inventory?tab=inventory-export',
    'X-Requested-With': 'XMLHttpRequest',
}
r2 = session.get('https://www.jakmall.com/mitra/inventory/download', headers=headers)

with open('${xlsxOut.replace(/\\/g, '/')}', 'wb') as f:
    f.write(r2.content)

print(json.dumps({'size': len(r2.content), 'status': r2.status_code, 'type': r2.headers.get('Content-Type', '')}))
`);
    let dlResult = spawnSync('python', [scrapePy], { encoding: 'utf-8', maxBuffer: 1024 * 1024 });
    if (dlResult.error || dlResult.status !== 0) {
      throw new Error('Gagal download inventory: ' + (dlResult.stderr || dlResult.error?.message));
    }
    if (!fs.existsSync(xlsxOut) || fs.statSync(xlsxOut).size < 100) {
      throw new Error('File hasil download kosong atau tidak valid');
    }

    // Step 3: Parse XLSX and update stock
    const parsePy = path.join(tmpDir, `jakmall_parse_${Date.now()}.py`);
    fs.writeFileSync(parsePy, `
import pandas as pd, json
df = pd.read_excel('${xlsxOut.replace(/\\/g, '/')}', engine='calamine', dtype=str)
df = df.fillna('')
rows = []
for _, row in df.iterrows():
    sku = str(row.get('Kode SKU', '')).replace('.0', '').strip()
    status = str(row.get('Status', '')).strip()
    terjual = str(row.get('Terjual', '0')).replace('.0', '').strip()
    if sku:
        rows.append({'sku': sku, 'status': status, 'terjual': terjual})
print(json.dumps(rows, ensure_ascii=False))
`);
    let parseResult = spawnSync('python', [parsePy], { encoding: 'utf-8', maxBuffer: 1024 * 1024 });
    if (parseResult.error || parseResult.status !== 0) {
      throw new Error('Gagal parse XLSX: ' + (parseResult.stderr || parseResult.error?.message));
    }
    const inventoryItems = JSON.parse(parseResult.stdout.trim());

    // Step 4: Update stock in DB
    let stokTersedia = 0, stokHabis = 0, tidakDitemukan = 0;
    for (const item of inventoryItems) {
      const product = await prisma.product.findUnique({ where: { jakmallProductId: item.sku } });
      if (!product) { tidakDitemukan++; continue; }

      const isTersedia = item.status.toLowerCase().includes('tersedia') || item.status.toLowerCase().includes('ready');
      const newStock = isTersedia ? 1 : 0;

      if (product.stock !== newStock) {
        await prisma.product.update({
          where: { id: product.id },
          data: { stock: newStock },
        });
      }
      if (isTersedia) stokTersedia++; else stokHabis++;
    }

    res.json({
      message: 'Sinkronisasi stok selesai.',
      total: inventoryItems.length,
      tersedia: stokTersedia,
      habis: stokHabis,
      tidakDitemukan,
    });

  } catch (err) {
    console.error('Sync stock error:', err);
    res.status(500).json({ error: 'Gagal sync stok: ' + err.message });
  } finally {
    try { if (loginPy) fs.unlinkSync(loginPy); } catch {}
    try { if (scrapePy) fs.unlinkSync(scrapePy); } catch {}
    try { fs.unlinkSync(cookieJar); } catch {}
    try { fs.unlinkSync(xlsxOut); } catch {}
  }
});

export default router;
