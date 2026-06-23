import fetch from 'node-fetch';
import prisma from './db.js';
import { createNotification } from './utils/notificationService.js';
import { checkRajaitemOrderStatus } from './utils/rajaitemService.js';
import { refundOrder } from './utils/refundService.js';
import { initAgentScheduler } from '../../agent-work/agent-marketing/scheduler.js';

const LOLIPOP_API_URL = process.env.LOLIPOP_API_URL || "https://lollipop-smm.com/api/v2";
const LOLIPOP_API_KEY = process.env.LOLIPOP_API_KEY;

// --- 1. CRON JOB: CEK STATUS ORDER (Setiap 5 Menit) ---
export async function checkOrderStatusCron() {
  const hasLolipop = !!LOLIPOP_API_KEY;
  const hasRajaitem = !!process.env.RAJAITEM_API_KEY;

  if (!hasLolipop && !hasRajaitem) return;

  // A. CEK ORDER SMM KE LOLIPOP
  if (hasLolipop) {
    try {
      // Cari semua order SMM yang masih PROCESSING
      const processingOrders = await prisma.order.findMany({
        where: { status: 'PROCESSING', type: 'SMM', providerOrderId: { not: null } }
      });

      if (processingOrders.length > 0) {
        console.log(`[CRON] Mengecek status ${processingOrders.length} order SMM ke Lolipop...`);
        for (const order of processingOrders) {
          if (order.providerOrderId.startsWith('SIM_')) continue; // Lewati order simulasi

          const response = await fetch(LOLIPOP_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              key: LOLIPOP_API_KEY,
              action: 'status',
              order: order.providerOrderId
            })
          });

          const data = await response.json();
          
          if (!data.error && data.status) {
            const lpStatus = data.status.toUpperCase();
            let finalStatus = 'PROCESSING';
            let notes = `Status Lolipop: ${data.status}`;
            
            if (lpStatus === 'COMPLETED') {
               finalStatus = 'COMPLETED';
               notes = `Berhasil! Start Count: ${data.start_count}, Remains: ${data.remains}`;
            } else if (lpStatus === 'CANCELED' || lpStatus === 'REFUNDED') {
               finalStatus = 'FAILED';
               notes = `Order dibatalkan/refund oleh server (Start: ${data.start_count}). Saldo telah dikembalikan.`;

               // REFUND SALDO via shared service
               try {
                 await refundOrder(order.id, 'Dibatalkan oleh Provider SMM');
               } catch (refundErr) {
                 console.error(`[CRON] Refund failed for order #${order.id}:`, refundErr.message);
               }
            } else if (lpStatus === 'PARTIAL') {
               finalStatus = 'COMPLETED';
               notes = `Selesai parsial. Remains: ${data.remains}`;
            }

            // Update database jika ada perubahan
            if (finalStatus !== order.status || notes !== order.notes) {
              await prisma.order.update({
                where: { id: order.id },
                data: { notes: notes, status: finalStatus }
              });

              // Send notification to user about status change
              await createNotification(
                order.userId,
                finalStatus === 'COMPLETED' ? 'ORDER_COMPLETED' : 'ORDER_FAILED',
                `Status pesanan #${order.id} Anda telah berubah menjadi ${finalStatus}. ${notes}`,
                '/dashboard'
              );

              console.log(`[CRON] Order #${order.id} update: ${finalStatus}`);
            }
          }
        }
      }
    } catch (error) {
      console.error('[CRON] Error cek status SMM Lolipop:', error);
    }
  }

  // B. CEK ORDER PREMIUM KE PROVIDER
  if (hasRajaitem) {
    try {
      const processingPremiumOrders = await prisma.order.findMany({
        where: { status: 'PROCESSING', type: 'PREMIUM', providerOrderId: { not: null } }
      });

      if (processingPremiumOrders.length > 0) {
        console.log(`[CRON] Mengecek status ${processingPremiumOrders.length} order PREMIUM ke Provider...`);
        for (const order of processingPremiumOrders) {
          if (order.providerOrderId.startsWith('SIM_')) continue; // Lewati order simulasi

          let refId = undefined;
          if (order.notes) {
            const refMatch = order.notes.match(/Ref ID:\s*(MRK-\S+)/);
            if (refMatch) refId = refMatch[1];
          }

          const response = await checkRajaitemOrderStatus(order.providerOrderId, refId);

          if (response && response.status === true && response.data) {
            const status = String(response.data.status).toLowerCase();

            if (status === 'success' || status === 'sukses' || status === 'completed' || status === 'selesai') {
              const sn = response.data.note || response.data.sn || response.data.keterangan || '';
              const notes = sn;
              let accountId = null;

              let parsedEmail = "Akun Premium";
              let parsedPassword = "Lihat Catatan/SN";
              const emailPassMatch = sn.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)[:|]([^|\s\n\r]+)/);
              if (emailPassMatch) {
                parsedEmail = emailPassMatch[1];
                parsedPassword = emailPassMatch[2];
              }

              await prisma.$transaction(async (tx) => {
                const newAccount = await tx.account.create({
                  data: {
                    productId: order.productId,
                    email: parsedEmail,
                    password: parsedPassword,
                    extraInfo: sn,
                    isSold: true,
                    soldToUserId: order.userId,
                    soldAt: new Date()
                  }
                });
                accountId = newAccount.id;

                await tx.order.update({
                  where: { id: order.id },
                  data: {
                    status: 'COMPLETED',
                    accountId: accountId,
                    notes: notes,
                    providerStatus: status
                  }
                });
              });

              await createNotification(
                order.userId,
                'ORDER_COMPLETED',
                `Pesanan Akun Premium #${order.id} Anda telah berhasil diproses! Silakan periksa detail akun di dashboard.`,
                '/dashboard'
              );

              console.log(`[CRON] Premium Order #${order.id} successfully completed via H2H.`);
            } else if (status === 'failed' || status === 'cancel' || status === 'batal' || status === 'canceled' || status === 'error') {
              console.log(`[CRON] Premium Order #${order.id} failed on Provider. Initiating refund...`);

              try {
                await refundOrder(order.id, `Provider gagal: ${response.data.keterangan || 'Dibatalkan oleh provider'}`);
              } catch (refundErr) {
                console.error(`[CRON] Refund failed for premium order #${order.id}:`, refundErr.message);
              }

              await createNotification(
                order.userId,
                'ORDER_FAILED',
                `Pesanan Akun Premium #${order.id} Anda gagal diproses oleh provider. Saldo Anda sebesar Rp ${order.amount.toLocaleString('id-ID')} telah dikembalikan.`,
                '/dashboard'
              );
            }
          }
        }
      }
    } catch (error) {
      console.error('[CRON] Error cek status Premium Provider:', error);
    }
  }
}

// --- 2. CRON JOB: SINKRONISASI KATALOG HARIAN ---
export async function syncCatalogCron() {
  if (!LOLIPOP_API_KEY) return;
  console.log("[CRON] Menjalankan Sinkronisasi Katalog Lolipop otomatis...");

  try {
    const response = await fetch(LOLIPOP_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: LOLIPOP_API_KEY, action: 'services' })
    });
    const services = await response.json();
    
    if (services.error) return;

    let updatedCount = 0;
    const activeServiceIds = services.map(s => String(s.service));

    // A. Masukkan/Update layanan yang ada di API
    for (const service of services) {
      if (!service.category) continue;

      const categoryName = service.category;
      const categorySlug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      let category = await prisma.category.findUnique({ where: { slug: categorySlug } });

      if (!category) {
        category = await prisma.category.create({
          data: { name: categoryName, slug: categorySlug, type: 'SMM', order: 0 }
        });
      }

      const basePricePer1000 = Math.round(parseFloat(service.rate));
      const priceUser = Math.round(basePricePer1000 * 1.2);
      const priceReseller = Math.round(basePricePer1000 * 1.1);

      const productData = {
        categoryId: category.id,
        name: service.name,
        slug: `${categorySlug}-svc-${service.service}`,
        description: service.description || `Layanan untuk ${service.name}. Minimum pemesanan: ${service.min}, Maksimum: ${service.max}.`,
        priceUser, priceReseller, type: 'SMM', providerServiceId: String(service.service),
        minOrder: parseInt(service.min), maxOrder: parseInt(service.max), isActive: true
      };

      const existingProduct = await prisma.product.findFirst({
        where: { providerServiceId: String(service.service) }
      });

      if (existingProduct) {
        await prisma.product.update({ where: { id: existingProduct.id }, data: productData });
      } else {
        await prisma.product.create({ data: productData });
      }
      updatedCount++;
    }

    // B. Matikan produk yang sudah tidak ada di API (Cleanup)
    const localSmmProducts = await prisma.product.findMany({ where: { type: 'SMM', isActive: true } });
    let deactivatedCount = 0;
    for (const product of localSmmProducts) {
      if (!activeServiceIds.includes(product.providerServiceId)) {
        await prisma.product.update({ where: { id: product.id }, data: { isActive: false } });
        deactivatedCount++;
      }
    }

    console.log(`[CRON] Sinkronisasi Selesai. Diupdate/Dibuat: ${updatedCount}. Dinonaktifkan: ${deactivatedCount}`);

  } catch (error) {
    console.error("[CRON] Gagal sinkronisasi katalog:", error);
  }
}

export function initCrons() {
   // Cek Status Order: Setiap 5 menit (300000 ms)
   setInterval(checkOrderStatusCron, 300000);

   // Cek Katalog Sinkron: Setiap 12 Jam (43200000 ms)
   setInterval(syncCatalogCron, 43200000);

   // Agent Scheduler — wrapped in try/catch so existing crons still work
   try {
     initAgentScheduler().catch(err => console.error('[CRON] Agent scheduler init failed:', err.message));
   } catch (err) {
     console.error('[CRON] Agent scheduler init failed:', err.message);
   }
}
