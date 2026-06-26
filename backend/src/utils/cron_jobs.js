
import cron from 'node-cron';
import { syncJakmallProducts } from '../../scripts/sync_jakmall_products.js';

export const setupCronJobs = () => {
    // Schedule Jakmall product synchronization to run every 2 hours
    cron.schedule('0 */2 * * *', () => {
        console.log('Running Jakmall product sync cron job...');
        syncJakmallProducts();
    });

    console.log('Cron jobs scheduled.');
};
