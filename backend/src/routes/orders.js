import express from 'express';
import prisma from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import fetch from 'node-fetch'; // Menggunakan fetch untuk call API Lolipop
import { createNotification, createAdminNotification } from '../utils/notificationService.js';
import { placeRajaitemPrepaidOrder } from '../utils/rajaitemService.js';


const router = express.Router();

const LOLIPOP_API_URL = process.env.LOLIPOP_API_URL || "https://lollipop-smm.com/api/v2";
const LOLIPOP_API_KEY = process.env.LOLIPOP_API_KEY;

// Helper function to call Lolipop SMM API
async function placeLolipopOrder(serviceId, targetUrl, quantity) {
  if (!LOLIPOP_API_KEY || !serviceId) {
    console.warn("Lolipop API Key or Service ID is missing. Falling back to simulation.");
    return null; // Return null causes simulated fallback below
  }

  try {
    const response = await fetch(LOLIPOP_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key: LOLIPOP_API_KEY,
        action: 'add',
        service: serviceId,
        link: targetUrl,
        quantity: quantity
      })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Lolipop API Error:", error);
    throw new Error("Gagal terhubung ke API Provider.");
  }
}

// Helper function to fetch real-time price from Lolipop
async function getRealtimeServiceRate(serviceId) {
    if (!LOLIPOP_API_KEY || !serviceId) return null;

    try {
        const response = await fetch(LOLIPOP_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                key: LOLIPOP_API_KEY,
                action: 'services'
            })
        });
        const services = await response.json();

        if (services.error) return null;

        const service = services.find(s => String(s.service) === String(serviceId));
        if (!service) return 'NOT_FOUND';

        return Math.round(parseFloat(service.rate));
    } catch (error) {
        console.error("Lolipop Fetch Services Error:", error);
        return null;
    }
}


// Create Order (SMM or Premium Account)
router.post('/create', requireAuth, async (req, res) => {
  const { productId, quantity, targetUrl, selectedDuration, selectedOs } = req.body;

  if (!productId) {
    return res.status(400).json({ error: 'Product ID is required.' });
  }

  try {
    // We execute everything inside a transaction to prevent race conditions (e.g. double spending, double stock allocation)
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch User (with latest balance)
      const user = await tx.user.findUnique({
        where: { id: req.user.id },
      });

      if (!user) {
        throw new Error('User not found.');
      }

      // 2. Fetch Product
      const product = await tx.product.findUnique({
        where: { id: parseInt(productId) },
      });

      if (!product || !product.isActive) {
        throw new Error('Product is unavailable or inactive.');
      }

      // 3. Determine Price based on User Role
      const unitPrice = user.role === 'RESELLER' ? product.priceReseller : product.priceUser;
      let orderAmount = 0;
      let accountToDeliver = null;
      let isExternalFulfillment = false;

      if (product.type === 'PREMIUM') {
        const qty = parseInt(quantity) || 1;
        if (qty !== 1) {
          throw new Error('Premium accounts can only be purchased one at a time.');
        }
        orderAmount = unitPrice;

        // Jika produk punya pilihan durasi, kalikan harga dengan priceMultiplier
        if (product.durationOptions && selectedDuration) {
          try {
            const durations = JSON.parse(product.durationOptions);
            const chosenDuration = durations.find(d => d.label === selectedDuration);
            if (chosenDuration && chosenDuration.priceMultiplier) {
              orderAmount = unitPrice * chosenDuration.priceMultiplier;
            }
          } catch (e) {
            console.error('Error parsing durationOptions:', e);
          }
        }

        // Find one unsold account
        const availableAccount = await tx.account.findFirst({
          where: {
            productId: product.id,
            isSold: false,
          },
        });

        if (!availableAccount) {
          if (product.providerServiceId && process.env.RAJAITEM_API_KEY) {
            isExternalFulfillment = true;
          } else {
            throw new Error('This premium account is currently out of stock.');
          }
        }

        accountToDeliver = availableAccount;
      } else if (product.type === 'SMM') {
        const qty = parseInt(quantity);
        if (isNaN(qty) || qty < product.minOrder || qty > product.maxOrder) {
          throw new Error(`Quantity must be between ${product.minOrder} and ${product.maxOrder}.`);
        }

        if (!targetUrl || targetUrl.trim() === '') {
          throw new Error('Target link/URL is required for SMM services.');
        }

        // --- VALIDASI HARGA REAL-TIME UNTUK MENCEGAH KERUGIAN ---
        if (product.providerServiceId) {
            console.log(`[REALTIME-CHECK] Verifikasi harga untuk Layanan #${product.providerServiceId}...`);
            const realtimeRate = await getRealtimeServiceRate(product.providerServiceId);

            if (realtimeRate === 'NOT_FOUND') {
                throw new Error("Layanan ini sudah tidak tersedia di pusat. Silakan pilih layanan lain.");
            }

            if (realtimeRate !== null) {
                // Harga lokal di DB kita vs Harga terbaru di Lolipop (per 1000)
                // Kita markup 20% untuk user biasa, 10% untuk reseller
                const margin = user.role === 'RESELLER' ? 0.1 : 0.2;
                const expectedLocalPrice = realtimeRate + (realtimeRate * margin);

                // Jika harga lokal (per 1000) di DB meleset jauh dari hitungan real-time (markup berubah)
                // Di sini kita cek product.priceUser atau priceReseller (yang mana yang relevan)
                const currentLocalPriceInDB = user.role === 'RESELLER' ? product.priceReseller : product.priceUser;

                // Toleransi perbedaan harga sangat kecil (misal 1 perak karena pembulatan)
                if (Math.abs(currentLocalPriceInDB - expectedLocalPrice) > 1) {
                    // Otomatis sinkronkan harga di DB agar user bisa mencoba lagi dengan harga baru
                    await tx.product.update({
                        where: { id: product.id },
                        data: {
                            priceUser: realtimeRate + (realtimeRate * 0.2),
                            priceReseller: realtimeRate + (realtimeRate * 0.1)
                        }
                    });
                    throw new Error("Maaf, terjadi perubahan harga dari pusat. Database kami telah diperbarui, silakan tekan tombol beli sekali lagi.");
                }
            }
        }

        orderAmount = Math.floor((unitPrice * qty) / 1000);
      } else {
        throw new Error('Invalid product type.');
      }

      // 4. Check user balance
      if (user.balance < orderAmount) {
        throw new Error(`Insufficient balance. This order costs Rp ${orderAmount.toLocaleString('id-ID')}, but your balance is Rp ${user.balance.toLocaleString('id-ID')}.`);
      }

      // 5. Deduct user balance
      const balanceBefore = user.balance;
      const balanceAfter = user.balance - orderAmount;

      await tx.user.update({
        where: { id: user.id },
        data: { balance: balanceAfter },
      });

      // 6. Record transaction
      const balanceTx = await tx.balanceTransaction.create({
        data: {
          userId: user.id,
          type: 'DEDUCTION',
          amount: orderAmount,
          balanceBefore,
          balanceAfter,
          description: `Pembelian ${product.name}`,
        },
      });

      let orderStatus = 'PENDING';
      let accountId = null;
      let providerOrderId = null;
      let notes = product.type === 'PREMIUM' ? 'Akun berhasil dikirim otomatis.' : 'Sedang diproses oleh server SMM.';

      if (product.type === 'PREMIUM') {
        if (!isExternalFulfillment) {
          orderStatus = 'COMPLETED';
          accountId = accountToDeliver.id;

          // Mark account as sold
          await tx.account.update({
            where: { id: accountToDeliver.id },
            data: {
              isSold: true,
              soldToUserId: user.id,
              soldAt: new Date(),
            },
          });
        } else {
          // External H2H fulfillment
          orderStatus = 'PROCESSING';
          const refId = `MRK-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
          
          // Logika Penentuan Target (No WA Default vs Email Pribadi vs No OTP)
          let target = "";
          const productNameLower = product.name.toLowerCase();
          const requiresEmail = productNameLower.includes('upgrade') || 
                                productNameLower.includes('email pribadi') || 
                                productNameLower.includes('invite');
          const requiresOtp = productNameLower.includes('hotstar') || 
                              productNameLower.includes('otp');

          if (requiresEmail) {
            target = targetUrl || user.email; // Gunakan email input atau email profil
          } else if (requiresOtp) {
            target = targetUrl || ""; // Wajib nomor HP pembeli untuk OTP
            if (!target) {
              throw new Error("Nomor HP aktif diperlukan untuk produk dengan verifikasi OTP.");
            }
          } else {
            // Untuk akun jadi standar, SELALU gunakan nomor WA Admin agar aman dari paparan supplier ke pembeli
            target = process.env.RAJAITEM_DEFAULT_TARGET || "085175450863";
          }
          console.log(`[H2H-ORDER] Mengirim order Prepaid ke Provider untuk code ${product.providerServiceId} dengan target: ${target}...`);

          try {
            const apiResponse = await placeRajaitemPrepaidOrder(refId, product.providerServiceId, target);
            if (apiResponse && apiResponse.status === true) {
              providerOrderId = String(apiResponse.data.order_id);
              notes = `Order diproses. Ref ID: ${refId}.`;

              // Jika transaksi langsung selesai dan ada kredensial di sn
              if (apiResponse.data.status === 'success' && apiResponse.data.sn) {
                orderStatus = 'COMPLETED';
                const sn = apiResponse.data.sn;
                notes = sn;

                let parsedEmail = "Akun Premium";
                let parsedPassword = "Lihat Catatan/SN";
                const emailPassMatch = sn.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)[:|]([^|\s\n\r]+)/);
                if (emailPassMatch) {
                  parsedEmail = emailPassMatch[1];
                  parsedPassword = emailPassMatch[2];
                }

                const newAccount = await tx.account.create({
                  data: {
                    productId: product.id,
                    email: parsedEmail,
                    password: parsedPassword,
                    extraInfo: sn,
                    isSold: true,
                    soldToUserId: user.id,
                    soldAt: new Date()
                  }
                });
                accountId = newAccount.id;
              }
            } else {
              const errMsg = apiResponse ? apiResponse.message : "Tidak ada respon dari Provider";
              throw new Error(`Koneksi H2H Gagal: ${errMsg}`);
            }
          } catch (apiError) {
            console.error("H2H Order Placement Error:", apiError);
            throw new Error(`Gagal memesan produk premium: ${apiError.message}`);
          }
        }
      } else {
        // SMM panel
        orderStatus = 'PROCESSING';

        // Panggil API Lolipop jika providerServiceId ada
        if (product.providerServiceId && LOLIPOP_API_KEY) {
          console.log(`[SMM-ORDER] Mengirim order SMM ke Lolipop untuk service ID ${product.providerServiceId}...`);
          const apiResponse = await placeLolipopOrder(product.providerServiceId, targetUrl, quantity);

          if (apiResponse && apiResponse.order) {
            // Berhasil mendapat order ID dari Lolipop SMM
            providerOrderId = String(apiResponse.order);
            notes = `Order berhasil dikirim ke provider dengan ID: ${providerOrderId}.`;
          } else if (apiResponse && apiResponse.error) {
            // Error dari Lolipop API — refund via shared service (outside transaction)
            throw new Error(`Gagal mengirim order ke provider: ${apiResponse.error}`);
          } else {
            // Fallback (simulasi) jika ada masalah lain dengan respons API
            providerOrderId = 'SIM_' + Math.floor(100000 + Math.random() * 900000);
            notes = 'Order disimulasikan karena masalah API Provider atau API Key tidak ada.';
          }
        } else {
          // Fallback (simulasi) jika API Key tidak ada di .env
          providerOrderId = 'SIM_' + Math.floor(100000 + Math.random() * 900000);
          notes = 'Order disimulasikan karena API Key Lolipop tidak diset.';
        }
      }

      // 7. Create order record
      const order = await tx.order.create({
        data: {
          userId: user.id,
          productId: product.id,
          type: product.type,
          targetUrl: product.type === 'SMM' ? targetUrl : null,
          quantity: product.type === 'SMM' ? parseInt(quantity) : 1,
          accountId,
          amount: orderAmount,
          status: orderStatus,
          providerOrderId,
          providerStatus: product.type === 'SMM' ? 'pending' : null,
          notes: notes,
          selectedDuration: product.type === 'PREMIUM' ? (selectedDuration || null) : null,
          selectedOs: product.type === 'PREMIUM' ? (selectedOs || null) : null,
        },
      });

      // Update the transaction referenceId
      await tx.balanceTransaction.update({
        where: { id: balanceTx.id },
        data: { referenceId: String(order.id) },
      });

      return {
        order,
        accountDetails: accountToDeliver
          ? {
              email: accountToDeliver.email,
              password: accountToDeliver.password,
              extraInfo: accountToDeliver.extraInfo,
            }
          : null,
      };
    });

    // Notify user about successful order
    await createNotification(
        req.user.id,
        'ORDER_SUCCESS',
        `Pesanan ${result.order.type === 'SMM' ? 'SMM' : 'Premium'} #${result.order.id} (${result.order.status}) berhasil dibuat.`,
        '/dashboard'
    );

    return res.status(201).json({
      message: 'Order created successfully.',
      order: result.order,
      accountDetails: result.accountDetails,
    });
  } catch (error) {
    console.error('Order creation error:', error);
    return res.status(400).json({ error: error.message || 'Error processing your order.' });
  }
});

// Get user orders history (with pagination)
router.get('/history', requireAuth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;

    const where = { userId: req.user.id };
    if (req.query.type) where.type = req.query.type;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          product: {
            select: {
              name: true,
              slug: true,
            },
          },
          account: {
            select: {
              email: true,
              password: true,
              extraInfo: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.order.count({ where }),
    ]);

    return res.json({ orders, total, limit, offset });

    return res.json({ orders });
  } catch (error) {
    console.error('Fetch order history error:', error);
    return res.status(500).json({ error: 'Internal server error fetching orders.' });
  }
});

// ── PHYSICAL CHECKOUT ──
router.post('/physical-checkout', requireAuth, async (req, res) => {
  const { cartId, addressId, courier, courierService, courierServiceName, shippingCost, paymentMethod, selectedVariant } = req.body;

  if (!cartId || !addressId || !courier || !courierService || shippingCost === undefined) {
    return res.status(400).json({ error: 'Semua field checkout wajib diisi.' });
  }
  const method = paymentMethod || 'wallet';

  try {
    // 1. Get cart with items
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: { items: { include: { product: true } } },
    });
    if (!cart || cart.userId !== req.user.id) {
      return res.status(404).json({ error: 'Keranjang tidak ditemukan.' });
    }
    if (cart.items.length === 0) {
      return res.status(400).json({ error: 'Keranjang kosong.' });
    }

    // 2. Validate address
    const address = await prisma.userAddress.findFirst({
      where: { id: addressId, userId: req.user.id },
    });
    if (!address) return res.status(404).json({ error: 'Alamat tidak ditemukan.' });

    // 3. Validate stock and calculate total
    let subtotal = 0;
    for (const item of cart.items) {
      if (item.product.type !== 'PHYSICAL') {
        return res.status(400).json({ error: `Produk ${item.product.name} bukan produk fisik.` });
      }
      if (item.product.stock < item.quantity) {
        return res.status(400).json({ error: `Stok ${item.product.name} tidak mencukupi. Tersedia: ${item.product.stock}` });
      }
      subtotal += item.product.priceUser * item.quantity;
    }

    const total = subtotal + shippingCost;

    // 4. Payment logic
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (method === 'wallet') {
      // Wallet payment — deduct balance immediately
      if (user.balance < total) {
        return res.status(400).json({ error: `Saldo tidak mencukupi. Dibutuhkan Rp ${total.toLocaleString('id-ID')}, saldo Rp ${user.balance.toLocaleString('id-ID')}` });
      }

      await prisma.user.update({
        where: { id: req.user.id },
        data: { balance: user.balance - total },
      });

      await prisma.balanceTransaction.create({
        data: {
          userId: req.user.id,
          type: 'PHYSICAL_ORDER',
          amount: -total,
          balanceBefore: user.balance,
          balanceAfter: user.balance - total,
          description: `Pembelian fisik (${cart.items.length} item) ongkir Rp ${shippingCost.toLocaleString('id-ID')}`,
        },
      });
    }

    // 5. Create orders (one per cart item)
    const orders = [];
    for (const item of cart.items) {
      const order = await prisma.order.create({
        data: {
          userId: req.user.id,
          productId: item.productId,
          type: 'PHYSICAL',
          quantity: item.quantity,
          amount: item.product.priceUser * item.quantity + (item === cart.items[cart.items.length - 1] ? shippingCost : 0),
          status: method === 'transfer' ? 'AWAITING_PAYMENT' : 'PENDING',
          shippingAddressId: addressId,
          shippingSnapshot: JSON.parse(JSON.stringify(address)),
          courier,
          courierService,
          courierServiceName,
          shippingCost: item === cart.items[cart.items.length - 1] ? shippingCost : 0,
          notes: method === 'transfer' ? 'Menunggu pembayaran via transfer bank' : null,
          selectedVariant: selectedVariant ? JSON.stringify(selectedVariant) : null,
        },
      });
      orders.push(order);

      // Decrement stock
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    // 6. Clear cart
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    if (method === 'transfer') {
      // Use the selected bank or fallback to random
      let bank;
      if (req.body.bankId) {
        bank = await prisma.paymentMethod.findUnique({ where: { id: parseInt(req.body.bankId) } });
      }
      if (!bank) {
        const activeMethods = await prisma.paymentMethod.findMany({ where: { isActive: true } });
        bank = activeMethods.length > 0
          ? activeMethods[Math.floor(Math.random() * activeMethods.length)]
          : null;
      }
      if (!bank) bank = { name: 'BCA', accountNumber: '1234567890', accountName: 'CV Markaz Arshy' };

      res.status(201).json({
        message: 'Pesanan dibuat, menunggu pembayaran.',
        orders,
        paymentInfo: { bank: bank.name, accountNumber: bank.accountNumber, accountName: bank.accountName, qrisImage: bank.qrImage || null },
      });
    } else {
      res.status(201).json({
        message: 'Pesanan berhasil dibuat.',
        orders,
      });
    }
  } catch (error) {
    console.error('Physical checkout error:', error);
    res.status(500).json({ error: 'Gagal memproses checkout.' });
  }
});

// ── POST /orders/:id/verify-payment — upload bukti bayar ──
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const proofDir = path.join(process.cwd(), 'uploads', 'payment-proofs');
if (!fs.existsSync(proofDir)) fs.mkdirSync(proofDir, { recursive: true });

const proofStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, proofDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `proof-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});
const uploadProof = multer({
  storage: proofStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/jpeg|jpg|png|webp|gif/.test(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Hanya gambar (JPG, PNG, WEBP) yang diperbolehkan'));
    }
  },
});

router.post('/:id/verify-payment', requireAuth, uploadProof.single('paymentProof'), async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const order = await prisma.order.findFirst({ where: { id: orderId, userId: req.user.id, type: 'PHYSICAL' } });
    if (!order) return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
    if (!['AWAITING_PAYMENT', 'PAYMENT_SUBMITTED'].includes(order.status)) {
      return res.status(400).json({ error: 'Pesanan tidak dalam status menunggu pembayaran.' });
    }

    const proofUrl = req.file ? `/uploads/payment-proofs/${req.file.filename}` : null;
    const { bankName, accountName } = req.body;
    const proofData = JSON.stringify({
      paymentProof: proofUrl,
      bankName: bankName || null,
      accountName: accountName || null,
      submittedAt: new Date().toISOString(),
    });

    // Update ALL orders from same user with AWAITING_PAYMENT status (same cart batch)
    const updated = await prisma.order.updateMany({
      where: { userId: req.user.id, type: 'PHYSICAL', status: 'AWAITING_PAYMENT' },
      data: { notes: proofData, status: 'PAYMENT_SUBMITTED' },
    });

    res.json({ message: 'Bukti pembayaran terkirim. Menunggu verifikasi admin.', updatedCount: updated.count });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ error: 'Gagal mengirim bukti pembayaran.' });
  }
});

export default router;
