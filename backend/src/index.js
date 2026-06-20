import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initCrons } from './cron.js';

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
import prisma from './db.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
// Serve uploads folder as static
app.use('/uploads', express.static('uploads'));

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Markaz-Arshy Server is running.' });
});

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

// Initialize Cron Jobs
initCrons();

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
