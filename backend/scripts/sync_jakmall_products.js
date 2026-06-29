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

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function generateSlug(name) {
  let slug = slugify(name);
  if (!slug) slug = 'produk-' + Date.now();
  return slug;
}

function ensureTrailingSlug(slug) {
  // Ensure unique slug by appending random chars if needed
  // (caller should handle DB unique constraint fallback)
  return slug;
}

async function ensureCategory(jakmallCategoryName) {
  const slug = slugify(jakmallCategoryName) || 'uncategorized-fisik';
  const fullSlug = `fisik-${slug}`;

  let category = await prisma.category.findUnique({ where: { slug: fullSlug } });
  if (!category) {
    category = await prisma.category.create({
      data: {
        name: jakmallCategoryName,
        slug: fullSlug,
        type: 'PHYSICAL',
        order: 50,
      },
    });
    console.log(`  Created category: ${jakmallCategoryName} (${fullSlug})`);
  }
  return category;
}

async function downloadImage(imageUrl, index) {
  try {
    const urlObj = new URL(imageUrl);
    const ext = path.extname(urlObj.pathname).toLowerCase() || '.jpg';
    const imageName = `jakmall_${Date.now()}_${index}${ext}`;
    const localPath = path.join(IMAGE_DIR, imageName);
    const writer = fs.createWriteStream(localPath);
    const response = await axios({ url: imageUrl, method: 'GET', responseType: 'stream' });
    response.data.pipe(writer);
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
    return `/images/jakmall/${imageName}`;
  } catch (err) {
    console.error(`  Failed to download image ${imageUrl}: ${err.message}`);
    return null;
  }
}

async function syncJakmallProducts() {
  console.log('=== Jakmall Product Sync Started ===');

  if (!JAKMALL_USERNAME || !JAKMALL_PASSWORD) {
    throw new Error('JAKMALL_USERNAME and JAKMALL_PASSWORD must be set in .env');
  }

  if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  if (!fs.existsSync(IMAGE_DIR)) fs.mkdirSync(IMAGE_DIR, { recursive: true });

  // Clean old CSVs from download dir
  for (const f of fs.readdirSync(DOWNLOAD_DIR)) {
    if (f.endsWith('.csv')) fs.unlinkSync(path.join(DOWNLOAD_DIR, f));
  }

  // ── Step 1-3: Launch browser, login to Jakmall Partner Portal, export CSV ──
  const browser = await puppeteer.launch({ headless: true });
  let csvFilePath;

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Login
    console.log('Logging into Jakmall Partner Portal...');
    await page.goto('https://partner.jakmall.com/login', { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[name="username"]', { timeout: 15000 });
    await page.type('input[name="username"]', JAKMALL_USERNAME);
    await page.type('input[name="password"]', JAKMALL_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });

    if (page.url().includes('login')) {
      throw new Error('Login failed — still on login page');
    }
    console.log('Login successful.');

    // Navigate to Export page
    console.log('Navigating to product export page...');
    await page.goto('https://partner.jakmall.com/product/export', { waitUntil: 'networkidle2' });

    // Set filters and export
    console.log('Setting export filters & downloading CSV...');
    // Click "Export" or submit button
    await page.waitForSelector('button:has-text("Export"), button[type="submit"], .btn-export', { timeout: 15000 }).catch(() => {});

    // Trigger download
    await page.click('button[type="submit"]').catch(async () => {
      await page.evaluate(() => {
        const btn = document.querySelector('button:has-text("Export")');
        if (btn) btn.click();
      });
    });

    // Wait for download to finish (poll download directory)
    console.log('Waiting for CSV download...');
    let waited = 0;
    const filesBefore = new Set(fs.readdirSync(DOWNLOAD_DIR));
    while (waited < 60000) {
      await new Promise(r => setTimeout(r, 2000));
      waited += 2000;
      const currentFiles = fs.readdirSync(DOWNLOAD_DIR).filter(f => f.endsWith('.csv'));
      const newFiles = currentFiles.filter(f => !filesBefore.has(f));
      if (newFiles.length > 0) break;
      // Check if filesBefore is empty (fresh download)
      if (filesBefore.size === 0 && currentFiles.length > 0) break;
    }

    // Find downloaded CSV
    const files = fs.readdirSync(DOWNLOAD_DIR).filter(f => f.endsWith('.csv'));
    if (files.length === 0) {
      throw new Error('No CSV file was downloaded');
    }
    csvFilePath = path.join(DOWNLOAD_DIR, files[0]);
    console.log(`CSV downloaded: ${csvFilePath}`);
  } finally {
    await browser.close();
  }

  // ── Step 4: Parse CSV ──
  console.log('Parsing CSV...');
  const rows = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath, { encoding: 'utf-8' })
      .pipe(csv())
      .on('data', row => rows.push(row))
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`Parsed ${rows.length} rows from CSV.`);

  // ── Step 5-6: Process each row → upsert product ──
  const processedIds = [];
  let created = 0, updated = 0, skipped = 0;

  for (const row of rows) {
    const jakmallProductId = (row['Product ID'] || row['product_id'] || '').trim();
    const name = row['Product Name'] || row['name'] || '';
    const description = row['Description'] || row['description'] || '';
    const priceRaw = parseFloat(row['Price'] || row['price'] || '0');
    const stockRaw = parseInt(row['Stock'] || row['stock'] || '0', 10);
    const weightRaw = parseFloat(row['Weight'] || row['weight'] || '0');
    const lengthRaw = parseFloat(row['Length'] || row['length'] || '0');
    const widthRaw = parseFloat(row['Width'] || row['width'] || '0');
    const heightRaw = parseFloat(row['Height'] || row['height'] || '0');
    const categoryName = row['Category'] || row['category'] || 'Uncategorized';
    const imageUrlsRaw = row['Image URLs'] || row['image_urls'] || '';
    const variantsRaw = row['Variants'] || row['variants'] || '[]';
    const shippingInfoRaw = row['Shipping Info'] || row['shipping_info'] || '{}';

    if (!jakmallProductId || !name) {
      skipped++;
      continue;
    }

    // Ensure category
    const category = await ensureCategory(categoryName);

    // Download images
    const urls = imageUrlsRaw.split(',').map(u => u.trim()).filter(Boolean);
    const localImages = [];
    for (let i = 0; i < Math.min(urls.length, 5); i++) {
      const localPath = await downloadImage(urls[i], i);
      if (localPath) localImages.push(localPath);
    }

    // Parse JSON safely
    let variants = null;
    try { variants = JSON.parse(variantsRaw); } catch {}
    let shippingInfo = null;
    try { shippingInfo = JSON.parse(shippingInfoRaw); } catch {}

    // Price mapping
    const priceUser = Math.round(priceRaw);
    const priceReseller = Math.round(priceUser * 0.85);

    // Generate unique slug
    let slug = `fisik-${slugify(name)}-${jakmallProductId}`.replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (!slug) slug = `fisik-produk-${jakmallProductId}`;

    // Upsert
    const existing = await prisma.product.findUnique({ where: { jakmallProductId } });

    const data = {
      name,
      slug,
      description: description || null,
      priceUser,
      priceReseller,
      type: 'PHYSICAL',
      stock: Math.max(0, stockRaw),
      source: 'jakmall',
      jakmallProductId,
      categoryJakmall: categoryName,
      weight: weightRaw > 0 ? weightRaw : null,
      length: lengthRaw > 0 ? lengthRaw : null,
      width: widthRaw > 0 ? widthRaw : null,
      height: heightRaw > 0 ? heightRaw : null,
      variants,
      imageUrl: localImages[0] || null,
      shippingInfo,
      isActive: true,
      categoryId: category.id,
    };

    if (existing) {
      data.slug = existing.slug; // preserve original slug on update
      await prisma.product.update({ where: { id: existing.id }, data });
      updated++;
    } else {
      await prisma.product.create({ data });
      created++;
    }

    processedIds.push(jakmallProductId);
  }

  // ── Step 7: Deactivate products not in CSV ──
  const deactivated = await prisma.product.updateMany({
    where: {
      source: 'jakmall',
      isActive: true,
      jakmallProductId: { notIn: processedIds },
    },
    data: { isActive: false },
  });

  // Cleanup: remove the CSV
  try { fs.unlinkSync(csvFilePath); } catch {}

  const result = { created, updated, deactivated: deactivated.count, total: rows.length };
  console.log(`=== Sync Complete: ${created} created, ${updated} updated, ${deactivated.count} deactivated ===`);
  return result;
}

export { syncJakmallProducts };

// Run directly: node backend/scripts/sync_jakmall_products.js
if (process.argv[1] === __filename || process.argv[1]?.endsWith('sync_jakmall_products.js')) {
  syncJakmallProducts()
    .then(r => {
      console.log('Result:', JSON.stringify(r));
      process.exit(0);
    })
    .catch(e => {
      console.error('Fatal:', e.message);
      process.exit(1);
    });
}
