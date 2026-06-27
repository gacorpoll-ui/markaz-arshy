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
import addressesRouter from './routes/addresses.js';
import prisma from './db.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy (needed because Cloudflare adds X-Forwarded-For header)
app.set('trust proxy', 1);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://markaz-arshy.com',
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
app.use('/api/addresses', addressesRouter);

// Initialize Cron Jobs
setupCronJobs();

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
