import express from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import prisma from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import eventBus from '../sse/EventBus.js';

const router = express.Router();

// 9router proxy config
const NINE_ROUTER_KEY = process.env.AI_ROUTER_9KEY;
const NINE_ROUTER_URL = process.env.AI_ROUTER_URL || 'http://localhost:20128';

/* ═══════════════════════════════════════
   GET AI PROVIDERS
   ═══════════════════════════════════════ */
router.get('/providers', async (req, res) => {
  try {
    const providers = await prisma.aIProvider.findMany({
      where: { isActive: true },
      include: {
        models: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            modelId: true,
            inputPricePer1K: true,
            outputPricePer1K: true,
            contextWindow: true,
          },
        },
      },
    });
    res.json(providers);
  } catch (error) {
    console.error('Error fetching AI providers:', error);
    res.status(500).json({ error: 'Failed to fetch AI providers' });
  }
});

/* ═══════════════════════════════════════
   GET AI MODELS
   ═══════════════════════════════════════ */
router.get('/models', async (req, res) => {
  try {
    const { provider } = req.query;
    const where = { isActive: true };
    if (provider) {
      const providerData = await prisma.aIProvider.findUnique({ where: { slug: provider } });
      if (providerData) where.providerId = providerData.id;
    }
    const models = await prisma.aIModel.findMany({
      where,
      include: { provider: { select: { name: true, slug: true } } },
    });
    res.json(models);
  } catch (error) {
    console.error('Error fetching AI models:', error);
    res.status(500).json({ error: 'Failed to fetch AI models' });
  }
});

/* ═══════════════════════════════════════
   CREATE API KEY
   ═══════════════════════════════════════ */
router.post('/keys/create', requireAuth, async (req, res) => {
  try {
    const { keyName, tier = 'BASIC', modelId } = req.body;
    const userId = req.user.id;

    if (!keyName) return res.status(400).json({ error: 'Key name is required' });

    // Create key on 9router
    let skKey = null;
    try {
      const loginRes = await fetch(`${NINE_ROUTER_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: process.env.NINE_ROUTER_ADMIN_EMAIL || 'admin', password: process.env.NINE_ROUTER_ADMIN_PASSWORD }),
      });
      const setCookie = loginRes.headers.get('set-cookie');
      if (setCookie) {
        const cookie = setCookie.split(';')[0];
        const keyRes = await fetch(`${NINE_ROUTER_URL}/api/keys`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
          body: JSON.stringify({ name: keyName }),
        });
        if (keyRes.ok) {
          const keyData = await keyRes.json();
          skKey = keyData.key;
          console.log(`[AI ROUTE] Created 9router key for user ${userId}`);
        }
      }
    } catch (err) {
      console.error('[AI ROUTE] Failed to create 9router key:', err.message);
    }

    if (!skKey) {
      return res.status(500).json({ error: 'Failed to create API key on router' });
    }

    // Store key — creditsBalance is DEPRECATED, all billing goes through User.balance
    const newKey = await prisma.aIApiKey.create({
      data: {
        userId,
        modelId: modelId || null,
        keyName,
        apiKey: skKey,
        nineRouterKey: skKey,
        tier,
        rateLimit: 300,
        creditsBalance: 0, // DEPRECATED: kept for schema compatibility
        isActive: true,
      },
      include: { model: { select: { name: true, modelId: true } } },
    });

    // Fetch user balance for response
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { balance: true } });

    res.status(201).json({
      id: newKey.id,
      apiKey: newKey.apiKey,
      keyName: newKey.keyName,
      tier: newKey.tier,
      rateLimit: newKey.rateLimit,
      balance: user.balance, // Unified wallet balance
      model: newKey.model,
      baseUrl: 'https://ai.markaz-arshy.com/v1',
    });
  } catch (error) {
    console.error('Error creating API key:', error);
    res.status(500).json({ error: 'Failed to create API key' });
  }
});

/* ═══════════════════════════════════════
   GET USER'S FULL API KEYS (unmasked)
   ═══════════════════════════════════════ */
router.get('/keys/mine', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const [keys, user] = await Promise.all([
      prisma.aIApiKey.findMany({
        where: { userId },
        select: {
          id: true,
          keyName: true,
          apiKey: true,
          tier: true,
          isActive: true,
          monthlyQuota: true,
          lastUsedAt: true,
          createdAt: true,
          model: { select: { name: true, modelId: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.findUnique({ where: { id: userId }, select: { balance: true } }),
    ]);

    // Attach unified balance to each key
    const enriched = keys.map(k => ({ ...k, balance: user.balance }));
    res.json(enriched);
  } catch (error) {
    console.error('Error fetching API keys:', error);
    res.status(500).json({ error: 'Failed to fetch API keys' });
  }
});

/* ═══════════════════════════════════════
   GET USER'S API KEYS (masked)
   ═══════════════════════════════════════ */
router.get('/keys', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const [keys, user] = await Promise.all([
      prisma.aIApiKey.findMany({
        where: { userId },
        select: {
          id: true,
          keyName: true,
          apiKey: true,
          tier: true,
          rateLimit: true,
          monthlyQuota: true,
          isActive: true,
          expiresAt: true,
          lastUsedAt: true,
          createdAt: true,
          model: { select: { name: true, modelId: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.findUnique({ where: { id: userId }, select: { balance: true } }),
    ]);

    // Mask keys + attach unified balance
    const masked = keys.map(k => ({
      ...k,
      apiKey: k.apiKey.slice(0, 8) + '...' + k.apiKey.slice(-4),
      balance: user.balance,
    }));

    res.json(masked);
  } catch (error) {
    console.error('Error fetching API keys:', error);
    res.status(500).json({ error: 'Failed to fetch API keys' });
  }
});

/* ═══════════════════════════════════════
   GLOBAL USAGE SUMMARY
   ═══════════════════════════════════════ */
router.get('/usage/summary', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { apiKeyId, startDate, endDate } = req.query;

    const where = { userId };
    if (apiKeyId) where.apiKeyId = parseInt(apiKeyId);
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [agg, byModel, rawByDay] = await Promise.all([
      prisma.aIUsage.aggregate({
        where,
        _sum: { inputTokens: true, outputTokens: true, totalTokens: true, totalCost: true },
        _count: true,
      }),
      prisma.aIUsage.groupBy({
        by: ['modelId'],
        where,
        _sum: { totalTokens: true, totalCost: true },
        _count: true,
      }),
      prisma.aIUsage.groupBy({
        by: ['createdAt'],
        where,
        _sum: { totalTokens: true, totalCost: true },
        _count: true,
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    // Enrich model data
    const modelIds = byModel.map(m => m.modelId);
    const models = modelIds.length > 0
      ? await prisma.aIModel.findMany({ where: { id: { in: modelIds } }, select: { id: true, name: true, modelId: true } })
      : [];
    const modelMap = Object.fromEntries(models.map(m => [m.id, m]));

    const enrichedByModel = byModel.map(m => ({
      model: modelMap[m.modelId] || { name: 'Unknown', modelId: 'unknown' },
      totalTokens: m._sum.totalTokens || 0,
      totalCost: m._sum.totalCost || 0,
      requestCount: m._count,
    }));

    // Group by day (WIB timezone)
    const dailyMap = {};
    for (const d of rawByDay) {
      const day = new Date(d.createdAt).toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
      if (!dailyMap[day]) dailyMap[day] = { date: day, tokens: 0, cost: 0, requests: 0 };
      dailyMap[day].tokens += d._sum.totalTokens || 0;
      dailyMap[day].cost += d._sum.totalCost || 0;
      dailyMap[day].requests += d._count;
    }

    res.json({
      totalRequests: agg._count || 0,
      totalTokens: (agg._sum.inputTokens || 0) + (agg._sum.outputTokens || 0),
      inputTokens: agg._sum.inputTokens || 0,
      outputTokens: agg._sum.outputTokens || 0,
      totalCost: agg._sum.totalCost || 0,
      byModel: enrichedByModel,
      chartData: Object.values(dailyMap),
    });
  } catch (error) {
    console.error('Error fetching usage summary:', error);
    res.status(500).json({ error: 'Failed to fetch usage summary' });
  }
});

/* ═══════════════════════════════════════
   USAGE LOGS (per-request detail, with pagination)
   ═══════════════════════════════════════ */
router.get('/usage/logs', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { apiKeyId, startDate, endDate, limit = '50', offset = '0' } = req.query;
    const take = Math.min(parseInt(limit) || 50, 200);
    const skip = parseInt(offset) || 0;

    const where = { userId };
    if (apiKeyId) where.apiKeyId = parseInt(apiKeyId);
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      prisma.aIUsage.findMany({
        where,
        include: {
          model: { select: { name: true, modelId: true } },
          apiKey: { select: { keyName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      prisma.aIUsage.count({ where }),
    ]);

    // Use snapshot pricing from the usage record itself
    const enriched = logs.map(l => {
      let meta = {};
      try { meta = JSON.parse(l.metadata || '{}'); } catch {}

      const inputPricePer1K = l.inputPricePer1K || 150;  // snapshot or fallback
      const outputPricePer1K = l.outputPricePer1K || 450;

      return {
        id: l.id,
        createdAt: l.createdAt,
        apiKey: l.apiKey,
        model: l.model,
        inputTokens: l.inputTokens,
        outputTokens: l.outputTokens,
        totalTokens: l.totalTokens,
        totalCost: l.totalCost,
        statusCode: l.statusCode,
        latencyMs: l.latencyMs,
        actualModel: meta.actualModel || l.model?.modelId || 'unknown',
        requestedModel: meta.requestedModel || l.model?.modelId || 'unknown',
        pricing: {
          inputPricePer1K,
          outputPricePer1K,
          calculatedInputCost: l.inputCost,
          calculatedOutputCost: l.outputCost,
        },
      };
    });

    res.json({ logs: enriched, total, limit: take, offset: skip });
  } catch (error) {
    console.error('Error fetching usage logs:', error);
    res.status(500).json({ error: 'Failed to fetch usage logs' });
  }
});

/* ═══════════════════════════════════════
   UPDATE API KEY
   ═══════════════════════════════════════ */
router.put('/keys/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { keyName, isActive } = req.body;
    const userId = req.user.id;

    const existingKey = await prisma.aIApiKey.findFirst({ where: { id: parseInt(id), userId } });
    if (!existingKey) return res.status(404).json({ error: 'API key not found' });

    const updatedKey = await prisma.aIApiKey.update({
      where: { id: parseInt(id) },
      data: {
        ...(keyName && { keyName }),
        ...(typeof isActive === 'boolean' && { isActive }),
      },
    });
    res.json(updatedKey);
  } catch (error) {
    console.error('Error updating API key:', error);
    res.status(500).json({ error: 'Failed to update API key' });
  }
});

/* ═══════════════════════════════════════
   DELETE API KEY (soft delete)
   ═══════════════════════════════════════ */
router.delete('/keys/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existingKey = await prisma.aIApiKey.findFirst({ where: { id: parseInt(id), userId } });
    if (!existingKey) return res.status(404).json({ error: 'API key not found' });

    await prisma.aIApiKey.update({ where: { id: parseInt(id) }, data: { isActive: false } });
    res.json({ message: 'API key deleted successfully' });
  } catch (error) {
    console.error('Error deleting API key:', error);
    res.status(500).json({ error: 'Failed to delete API key' });
  }
});

/* ═══════════════════════════════════════
   GET CREDITS/USAGE HISTORY
   ═══════════════════════════════════════ */
router.get('/credits/history', requireAuth, async (req, res) => {
  try {
    const { apiKeyId } = req.query;
    const userId = req.user.id;

    const where = { userId };
    if (apiKeyId) where.apiKeyId = parseInt(apiKeyId);

    const transactions = await prisma.aITransaction.findMany({
      where,
      include: { apiKey: { select: { keyName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching credits history:', error);
    res.status(500).json({ error: 'Failed to fetch credits history' });
  }
});

/* ═══════════════════════════════════════
   VALIDATE API KEY (called by 9router)
   ═══════════════════════════════════════ */
router.all('/validate-key', async (req, res) => {
  try {
    // Authenticate: only 9router service should call this endpoint
    const webhookSecret = req.headers['x-webhook-secret'];
    const expectedSecret = process.env.AI_WEBHOOK_SECRET;
    if (!webhookSecret || !expectedSecret) {
      return res.status(403).json({ valid: false, error: 'Unauthorized' });
    }
    const secretBuf = Buffer.from(webhookSecret);
    const expectedBuf = Buffer.from(expectedSecret);
    if (secretBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(secretBuf, expectedBuf)) {
      return res.status(403).json({ valid: false, error: 'Unauthorized' });
    }

    // Extract key from headers, body, or query params
    let apiKey = req.headers['x-api-key'] || req.headers['authorization'];
    if (apiKey && apiKey.startsWith('Bearer ')) apiKey = apiKey.slice(7);
    if (!apiKey && req.body) apiKey = req.body.apiKey || req.body.key || req.body.token;
    if (!apiKey) apiKey = req.query.apiKey || req.query.key || req.query.token;

    if (!apiKey) return res.status(400).json({ valid: false, error: 'API key is required' });

    const apiKeyData = await prisma.aIApiKey.findUnique({
      where: { apiKey },
      include: { model: true },
    });

    if (!apiKeyData) return res.status(401).json({ valid: false, error: 'Invalid API key' });
    if (!apiKeyData.isActive) return res.status(403).json({ valid: false, error: 'API key is inactive' });

    // Check expiry
    if (apiKeyData.expiresAt && new Date(apiKeyData.expiresAt) < new Date()) {
      return res.status(403).json({ valid: false, error: 'API key has expired' });
    }

    // UNIFIED WALLET: Check User.balance
    const user = await prisma.user.findUnique({ where: { id: apiKeyData.userId } });
    if (!user) return res.status(401).json({ valid: false, error: 'User not found' });
    if (user.balance < -50000) {
      return res.status(402).json({ valid: false, error: 'Insufficient balance' });
    }

    // Check monthly quota
    let monthlyTokensUsed = 0;
    let monthlyQuotaRemaining = null;
    if (apiKeyData.monthlyQuota) {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const monthlyUsage = await prisma.aIUsage.aggregate({
        where: { apiKeyId: apiKeyData.id, createdAt: { gte: monthStart } },
        _sum: { totalTokens: true },
      });
      monthlyTokensUsed = monthlyUsage._sum.totalTokens || 0;
      monthlyQuotaRemaining = Math.max(0, apiKeyData.monthlyQuota - monthlyTokensUsed);
    }

    res.json({
      valid: true,
      keyName: apiKeyData.keyName,
      tier: apiKeyData.tier,
      rateLimit: apiKeyData.rateLimit,
      balance: user.balance,
      userId: apiKeyData.userId,
      allowedModel: apiKeyData.model ? apiKeyData.model.modelId : null,
      monthlyQuota: apiKeyData.monthlyQuota,
      monthlyTokensUsed,
      monthlyQuotaRemaining,
    });
  } catch (error) {
    console.error('Error validating API key:', error);
    res.status(500).json({ valid: false, error: 'Internal server error' });
  }
});

/* ═══════════════════════════════════════
   SSE STREAM — Real-time usage events
   ═══════════════════════════════════════ */
router.get('/events/stream', async (req, res) => {
  // Auth: Accept token from query param (EventSource can't set headers)
  let token = req.query.token;
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) token = authHeader.slice(7);
  }
  if (!token) return res.status(401).json({ error: 'Token required' });

  let userId;
  try {
    if (!process.env.JWT_SECRET) return res.status(500).json({ error: 'Server configuration error' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return res.status(401).json({ error: 'User not found' });
    userId = user.id;
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  res.write(':ok\n\n');

  const onUsage = (event) => {
    if (event.userId !== userId) return;
    try {
      res.write(`event: usage\ndata: ${JSON.stringify({
        id: event.id,
        model: event.model,
        totalTokens: event.totalTokens,
        totalCost: event.totalCost,
        inputTokens: event.inputTokens,
        outputTokens: event.outputTokens,
        latencyMs: event.latencyMs,
        statusCode: event.statusCode,
        createdAt: event.createdAt,
        keyName: event.keyName,
      })}\n\n`);
    } catch {}
  };

  const onBalance = (event) => {
    if (event.userId !== userId) return;
    try {
      res.write(`event: balance\ndata: ${JSON.stringify({
        keyId: event.keyId,
        balance: event.newBalance,
      })}\n\n`);
    } catch {}
  };

  eventBus.on('usage:recorded', onUsage);
  eventBus.on('balance:updated', onBalance);

  const keepalive = setInterval(() => {
    try { res.write(':ping\n\n'); } catch {}
  }, 30000);

  req.on('close', () => {
    clearInterval(keepalive);
    eventBus.off('usage:recorded', onUsage);
    eventBus.off('balance:updated', onBalance);
  });
});

export default router;
