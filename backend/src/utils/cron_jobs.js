import cron from 'node-cron';
import { syncJakmallProducts } from '../../scripts/sync_jakmall_products.js';

export const setupCronJobs = () => {
  // Jakmall product sync — daily at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('[CRON] Starting daily Jakmall sync...');
    try {
      const result = await syncJakmallProducts();
      console.log('[CRON] Jakmall sync result:', JSON.stringify(result));
    } catch (error) {
      console.error('[CRON] Jakmall sync failed:', error.message);
    }
  });

  console.log('Cron jobs scheduled.');
};
