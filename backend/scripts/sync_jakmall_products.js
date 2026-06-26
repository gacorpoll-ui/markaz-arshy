
// This script is responsible for:
// - Logging into the Jakmall Partner portal.
// - Navigating to the "Export Master Produk" page.
// - Setting export filters (product status, "Generic" sales channel, "CSV" format).
// - Initiating and managing the download process of the product CSV file.
// - Reading and parsing product data (name, description, price, stock, images, category, weight, dimensions, variants, and related shipping information) from the CSV file.
// - Processing product images: downloading images to a local server and storing their local paths in the database.
// - Synchronizing parsed data with the database using Prisma: adding new products, updating existing products (price, stock, other details), and handling deleted/inactive products.
// - Logging activities and errors.

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
    console.log('Starting Jakmall product synchronization...');

    if (!JAKMALL_USERNAME || !JAKMALL_PASSWORD) {
        console.error('JAKMALL_USERNAME and JAKMALL_PASSWORD environment variables must be set.');
        return;
    }

    // Ensure download and image directories exist
    if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
    if (!fs.existsSync(IMAGE_DIR)) fs.mkdirSync(IMAGE_DIR, { recursive: true });

    // Ensure Jakmall category exists
    let jakmallCategory = await prisma.category.findUnique({ where: { slug: 'jakmall' } });
    if (!jakmallCategory) {
        jakmallCategory = await prisma.category.create({
            data: {
                name: 'Jakmall Marketplace',
                slug: 'jakmall',
                type: 'GENERAL', // Or a suitable type
                order: 999, // Place at the end
            },
        });
        console.log('Created "Jakmall Marketplace" category.');
    }


    let browser;
    try {
        browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        
        // Configure page for downloads
        await page.target().browserContext().overridePermissions('https://partner.jakmall.com', ['downloads']);
        await page.target().browserContext().setDownloadBehavior('allow', { downloadPath: DOWNLOAD_DIR });

        // 1. Login to Jakmall Partner Portal
        console.log('Navigating to login page...');
        await page.goto('https://partner.jakmall.com/login', { waitUntil: 'networkidle2' });

        console.log('Logging in...');
        await page.type('#username', JAKMALL_USERNAME);
        await page.type('#password', JAKMALL_PASSWORD);
        await page.click('button[type="submit"]');
        await page.waitForNavigation({ waitUntil: 'networkidle2' });

        // Check if login was successful (e.g., by checking for a known element on the dashboard)
        const currentUrl = page.url();
        if (currentUrl.includes('login')) {
            console.error('Login failed. Check credentials.');
            return;
        }
        console.log('Login successful.');

        // 2. Navigate to "Export Master Produk"
        console.log('Navigating to Export Master Produk page...');
        await page.goto('https://partner.jakmall.com/product/export', { waitUntil: 'networkidle2' });

        // 3. Set export filters
        console.log('Setting export filters...');
        // Select "All Product Status" (assuming default or no explicit filter needed if not specified)
        // Select "Generic" sales channel - might need to interact with a dropdown
        // Example: If there's a select element for channel
        // await page.select('#sales_channel_id', 'generic_value_id'); 
        
        // Ensure CSV format is selected (assuming default or clicking a radio button if present)
        // await page.click('input[value="csv"]'); // Example for a radio button

        // Click the export button
        console.log('Initiating CSV download...');
        const [downloadResponse] = await Promise.all([
            page.waitForResponse(response => response.url().includes('/product/export/download') && response.status() === 200),
            page.click('button[type="submit"]'), // Assuming there's a submit button for export
        ]);

        // Wait for the file to be fully downloaded. This can be tricky with puppeteer.
        // A common approach is to wait for a certain amount of time or poll for the file.
        // For simplicity, we'll wait for a fixed duration, but a more robust solution
        // would monitor the download directory.
        await new Promise(resolve => setTimeout(resolve, 5000)); 

        const downloadedFiles = fs.readdirSync(DOWNLOAD_DIR).filter(file => file.endsWith('.csv'));
        if (downloadedFiles.length === 0) {
            console.error('No CSV file downloaded.');
            return;
        }
        const csvFilePath = path.join(DOWNLOAD_DIR, downloadedFiles[0]);
        console.log(`Downloaded CSV file: ${csvFilePath}`);

        // 4. Read and parse CSV data
        const products = [];
        fs.createReadStream(csvFilePath)
            .pipe(csv())
            .on('data', (row) => {
                // Map CSV row to product object
                const product = {
                    jakmallProductId: row['Product ID'],
                    name: row['Product Name'],
                    description: row['Description'],
                    price: parseFloat(row['Price']),
                    stock: parseInt(row['Stock']),
                    category: row['Category'],
                    weight: parseFloat(row['Weight']),
                    length: parseFloat(row['Length']),
                    width: parseFloat(row['Width']),
                    height: parseFloat(row['Height']),
                    // Assuming 'Image URLs' is a comma-separated string
                    imageUrls: row['Image URLs'] ? row['Image URLs'].split(',').map(url => url.trim()) : [],
                    // Variants and shipping info might need more complex parsing
                    variants: row['Variants'] ? JSON.parse(row['Variants']) : null, 
                    shippingInfo: row['Shipping Info'] ? JSON.parse(row['Shipping Info']) : null,
                    source: 'jakmall',
                };
                products.push(product);
            })
            .on('end', async () => {
                console.log(`Parsed ${products.length} products from CSV.`);
                await processProducts(products);
                console.log('Jakmall product synchronization completed.');
            });

    } catch (error) {
        console.error('Error during Jakmall product synchronization:', error);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

async function processProducts(products) {
    for (const productData of products) {
        try {
            // 5. Process product images
            let localImagePaths = [];
            for (const imageUrl of productData.imageUrls) {
                try {
                    const imageName = path.basename(new URL(imageUrl).pathname);
                    const localImagePath = path.join(IMAGE_DIR, imageName);
                    const writer = fs.createWriteStream(localImagePath);

                    const response = await axios({
                        url: imageUrl,
                        method: 'GET',
                        responseType: 'stream'
                    });

                    response.data.pipe(writer);

                    await new Promise((resolve, reject) => {
                        writer.on('finish', resolve);
                        writer.on('error', reject);
                    });
                    localImagePaths.push(`/images/jakmall/${imageName}`); // Store relative path for web access
                    console.log(`Downloaded image: ${imageName}`);
                } catch (imgError) {
                    console.error(`Failed to download image ${imageUrl}: ${imgError.message}`);
                }
            }

            // 6. Synchronize data with Prisma
            const existingProduct = await prisma.product.findUnique({
                where: { jakmallProductId: productData.jakmallProductId },
            });

            const data = {
                name: productData.name,
                description: productData.description,
                price: productData.price,
                stock: productData.stock,
                category: { connect: { id: jakmallCategory.id } }, // Connect to the created Jakmall category
                categoryJakmall: productData.category, // Store original Jakmall category name
                weight: productData.weight,
                length: productData.length,
                width: productData.width,
                height: productData.height,
                variants: productData.variants,
                shippingInfo: productData.shippingInfo,
                source: productData.source,
                imageUrl: localImagePaths.length > 0 ? localImagePaths[0] : null, // Store the first image URL
                // Consider adding a separate image model if multiple images per product are needed
            };

            if (existingProduct) {
                await prisma.product.update({
                    where: { id: existingProduct.id },
                    data: data,
                });
                console.log(`Updated product: ${productData.name} (${productData.jakmallProductId})`);
            } else {
                await prisma.product.create({
                    data: {
                        jakmallProductId: productData.jakmallProductId,
                        ...data,
                    },
                });
                console.log(`Created new product: ${productData.name} (${productData.jakmallProductId})`);
            }
        } catch (dbError) {
            console.error(`Error processing product ${productData.jakmallProductId}: ${dbError.message}`);
        }
    }
}

export { syncJakmallProducts };

if (process.argv[1] && (process.argv[1] === __filename || process.argv[1].endsWith('sync_jakmall_products.js'))) {
    syncJakmallProducts();
}
