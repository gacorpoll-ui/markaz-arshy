import express from 'express';
import crypto from 'crypto';
import prisma from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// 9router proxy config
const NINE_ROUTER_KEY = process.env.AI_ROUTER_9KEY || 'sk-576a1c43755b51a6-bnts4h-1428de35';
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
            inputPricePerToken: true,
            outputPricePerToken: true,
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
      const providerData = await prisma.aIProvider.findUnique({
        where: { slug: provider },
      });
      if (providerData) {
        where.providerId = providerData.id;
      }
    }

    const models = await prisma.aIModel.findMany({
      where,
      include: {
        provider: {
          select: { name: true, slug: true },
        },
      },
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
    const { keyName, tier = 'BASIC', modelId, initialCredits = 0 } = req.body;
    const userId = req.user.id;

    if (!keyName) return res.status(400).json({ error: 'Key name is required' });

    // ═══ Create key on 9router ═══
    let skKey = null;
    try {
      const loginRes = await fetch(`${NINE_ROUTER_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin', password: 'Riri@150187' }),
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
          console.log(`[AI ROUTE] Created 9router key for user ${userId}: ${skKey.slice(0, 15)}...`);
        }
      }
    } catch (err) {
      console.error('[AI ROUTE] Failed to create 9router key:', err.message);
    }

    if (!skKey) {
      return res.status(500).json({ error: 'Failed to create API key on router' });
    }

    // Deduct initial credits from user balance if needed
    if (initialCredits > 0) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user.balance < initialCredits) {
        return res.status(400).json({ error: 'Insufficient balance' });
      }
      await prisma.user.update({
        where: { id: userId },
        data: { balance: { decrement: initialCredits } },
      });
      await prisma.balanceTransaction.create({
        data: { userId, amount: -initialCredits, type: 'AI_TOPUP', description: `Top-up AI credits for "${keyName}"` },
      });
    }

    // Store sk-* key directly in Markaz Arshy DB
    const newKey = await prisma.aIApiKey.create({
      data: {
        userId,
        modelId: modelId || null,
        keyName,
        apiKey: skKey, // sk-* key directly!
        nineRouterKey: skKey,
        tier,
        rateLimit: 300,
        creditsBalance: initialCredits,
        isActive: true,
      },
      include: { model: { select: { name: true, modelId: true } } },
    });

    res.status(201).json({
      id: newKey.id,
      apiKey: newKey.apiKey, // This IS the sk-* key
      keyName: newKey.keyName,
      tier: newKey.tier,
      rateLimit: newKey.rateLimit,
      creditsBalance: newKey.creditsBalance,
      model: newKey.model,
      baseUrl: 'https://ai.markaz-arshy.com/v1',
    });
  } catch (error) {
    console.error('Error creating API key:', error);
    res.status(500).json({ error: 'Failed to create API key' });
  }
});

/* ═══════════════════════════════════════
   GET USER'S FULL API KEYS (unmasked, for CLI tool config generation)
   ═══════════════════════════════════════ */
router.get('/keys/mine', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const keys = await prisma.aIApiKey.findMany({
      where: { userId, isActive: true },
      select: {
        id: true,
        keyName: true,
        apiKey: true,  // Full key — only returned for the user's own keys
        tier: true,
        creditsBalance: true,
        model: {
          select: { name: true, modelId: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(keys);
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

    const keys = await prisma.aIApiKey.findMany({
      where: { userId },
      include: {
        model: {
          select: { name: true, modelId: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Return full sk-* key so user can copy it for use in Cursor/Claude Code
    res.json(keys);
  } catch (error) {
    console.error('Error fetching API keys:', error);
    res.status(500).json({ error: 'Failed to fetch API keys' });
  }
});

/* ═══════════════════════════════════════
   GLOBAL USAGE SUMMARY (all keys, optional filter)
   GET /usage/summary?apiKeyId=&startDate=&endDate=
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

    const [agg, byModel, byDay] = await Promise.all([
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
    const models = await prisma.aIModel.findMany({ where: { id: { in: modelIds } }, select: { id: true, name: true, modelId: true } });
    const modelMap = Object.fromEntries(models.map(m => [m.id, m]));

    const enrichedByModel = byModel.map(m => ({
      model: modelMap[m.modelId] || { name: 'Unknown', modelId: 'unknown' },
      totalTokens: m._sum.totalTokens || 0,
      totalCost: m._sum.totalCost || 0,
      requestCount: m._count,
    }));

    // Group by day
    const dailyMap = {};
    for (const d of byDay) {
      const day = d.createdAt.toISOString().slice(0, 10);
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
   USAGE LOGS (per-request detail)
   GET /usage/logs?apiKeyId=&startDate=&endDate=&limit=50
   ═══════════════════════════════════════ */
router.get('/usage/logs', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { apiKeyId, startDate, endDate, limit = '50' } = req.query;

    const where = { userId };
    if (apiKeyId) where.apiKeyId = parseInt(apiKeyId);
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const logs = await prisma.aIUsage.findMany({
      where,
      include: {
        model: { select: { name: true, modelId: true } },
        apiKey: { select: { keyName: true, apiKey: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
    });

    res.json(logs);
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

    // Verify ownership
    const existingKey = await prisma.aIApiKey.findFirst({
      where: { id: parseInt(id), userId },
    });

    if (!existingKey) {
      return res.status(404).json({ error: 'API key not found' });
    }

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

    // Verify ownership
    const existingKey = await prisma.aIApiKey.findFirst({
      where: { id: parseInt(id), userId },
    });

    if (!existingKey) {
      return res.status(404).json({ error: 'API key not found' });
    }

    await prisma.aIApiKey.update({
      where: { id: parseInt(id) },
      data: { isActive: false },
    });

    res.json({ message: 'API key deleted successfully' });
  } catch (error) {
    console.error('Error deleting API key:', error);
    res.status(500).json({ error: 'Failed to delete API key' });
  }
});

/* ═══════════════════════════════════════
   TOP-UP API KEY CREDITS
   ═══════════════════════════════════════ */
router.post('/credits/top-up', requireAuth, async (req, res) => {
  try {
    const { apiKeyId, amount } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Verify API key ownership
    const apiKeyData = await prisma.aIApiKey.findFirst({
      where: { id: apiKeyId, userId },
    });

    if (!apiKeyData) {
      return res.status(404).json({ error: 'API key not found' });
    }

    // Check user balance
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Deduct from user balance
    await prisma.user.update({
      where: { id: userId },
      data: { balance: { decrement: amount } },
    });

    // Add to API key credits
    const updatedKey = await prisma.aIApiKey.update({
      where: { id: apiKeyId },
      data: { creditsBalance: { increment: amount } },
    });

    // Create transactions
    await prisma.balanceTransaction.create({
      data: {
        userId,
        amount: -amount,
        type: 'AI_TOPUP',
        description: `Top-up AI credits for "${apiKeyData.keyName}"`,
      },
    });

    await prisma.aITransaction.create({
      data: {
        userId,
        apiKeyId,
        amount,
        type: 'TOP_UP',
        description: `Top-up from main balance`,
        balanceBefore: apiKeyData.creditsBalance,
        balanceAfter: updatedKey.creditsBalance,
      },
    });

    res.json({
      message: 'Credits topped up successfully',
      newBalance: updatedKey.creditsBalance,
    });
  } catch (error) {
    console.error('Error topping up credits:', error);
    res.status(500).json({ error: 'Failed to top up credits' });
  }
});

/* ═══════════════════════════════════════
   GET CREDITS HISTORY
   ═══════════════════════════════════════ */
router.get('/credits/history', requireAuth, async (req, res) => {
  try {
    const { apiKeyId } = req.query;
    const userId = req.user.id;

    const where = { userId };
    if (apiKeyId) {
      where.apiKeyId = parseInt(apiKeyId);
    }

    const transactions = await prisma.aITransaction.findMany({
      where,
      include: {
        apiKey: {
          select: { keyName: true },
        },
      },
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
   GET USAGE SUMMARY
   ═══════════════════════════════════════ */
router.get('/usage/summary', requireAuth, async (req, res) => {
  try {
    const { apiKeyId, startDate, endDate } = req.query;
    const userId = req.user.id;

    if (!apiKeyId) {
      return res.status(400).json({ error: 'apiKeyId is required' });
    }

    // Verify key ownership
    const key = await prisma.aIApiKey.findFirst({
      where: { id: parseInt(apiKeyId), userId },
    });

    if (!key) {
      return res.status(404).json({ error: 'API key not found' });
    }

    const where = {
      apiKeyId: parseInt(apiKeyId),
      userId,
      ...(startDate && endDate && {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
    };

    // Calculate sum of tokens and costs
    const aggregate = await prisma.aIUsage.aggregate({
      where,
      _sum: {
        totalTokens: true,
        totalCost: true,
      },
      _count: {
        id: true,
      },
    });

    // Get breakdown by model
    const usages = await prisma.aIUsage.findMany({
      where,
      include: {
        model: {
          select: { name: true, modelId: true },
        },
      },
    });

    // Group by model
    const breakdown = {};
    usages.forEach((usage) => {
      const modelName = usage.model.name;
      if (!breakdown[modelName]) {
        breakdown[modelName] = { requests: 0, tokens: 0, cost: 0 };
      }
      breakdown[modelName].requests += 1;
      breakdown[modelName].tokens += usage.totalTokens;
      breakdown[modelName].cost += usage.totalCost;
    });

    // Generate chart data (group by day)
    const chartDataMap = {};
    usages.forEach((usage) => {
      const dateStr = usage.createdAt.toISOString().split('T')[0];
      if (!chartDataMap[dateStr]) {
        chartDataMap[dateStr] = { date: dateStr, requests: 0, cost: 0, tokens: 0 };
      }
      chartDataMap[dateStr].requests += 1;
      chartDataMap[dateStr].cost += usage.totalCost;
      chartDataMap[dateStr].tokens += usage.totalTokens;
    });

    const chartData = Object.values(chartDataMap).sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      totalRequests: aggregate._count.id || 0,
      totalTokens: aggregate._sum.totalTokens || 0,
      totalCost: aggregate._sum.totalCost || 0,
      breakdown,
      chartData,
    });
  } catch (error) {
    console.error('Error fetching usage summary:', error);
    res.status(500).json({ error: 'Failed to fetch usage summary' });
  }
});

/* ═══════════════════════════════════════
   GET USAGE LOGS
   ═══════════════════════════════════════ */
router.get('/usage/logs', requireAuth, async (req, res) => {
  try {
    const { apiKeyId, startDate, endDate } = req.query;
    const userId = req.user.id;

    if (!apiKeyId) {
      return res.status(400).json({ error: 'apiKeyId is required' });
    }

    // Verify key ownership
    const key = await prisma.aIApiKey.findFirst({
      where: { id: parseInt(apiKeyId), userId },
    });

    if (!key) {
      return res.status(404).json({ error: 'API key not found' });
    }

    const where = {
      apiKeyId: parseInt(apiKeyId),
      userId,
      ...(startDate && endDate && {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
    };

    const logs = await prisma.aIUsage.findMany({
      where,
      include: {
        model: {
          select: { name: true, modelId: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    res.json(logs);
  } catch (error) {
    console.error('Error fetching usage logs:', error);
    res.status(500).json({ error: 'Failed to fetch usage logs' });
  }
});

/* ═══════════════════════════════════════
   VALIDATE API KEY (called by 9router)
   ═══════════════════════════════════════ */
router.all('/validate-key', async (req, res) => {
  try {
    // Extract key from headers, body, or query params
    let apiKey = req.headers['x-api-key'] || req.headers['authorization'];
    if (apiKey && apiKey.startsWith('Bearer ')) {
      apiKey = apiKey.slice(7);
    }
    if (!apiKey && req.body) {
      apiKey = req.body.apiKey || req.body.key || req.body.token;
    }
    if (!apiKey) {
      apiKey = req.query.apiKey || req.query.key || req.query.token;
    }

    if (!apiKey) {
      return res.status(400).json({ valid: false, error: 'API key is required' });
    }

    // Find the API Key in database
    const apiKeyData = await prisma.aIApiKey.findUnique({
      where: { apiKey },
      include: {
        model: true,
      },
    });

    if (!apiKeyData) {
      return res.status(401).json({ valid: false, error: 'Invalid API key' });
    }

    if (!apiKeyData.isActive) {
      return res.status(403).json({ valid: false, error: 'API key is inactive' });
    }

    if (apiKeyData.creditsBalance <= 0) {
      return res.status(402).json({ valid: false, error: 'Insufficient credits' });
    }

    // Return the response for 9router
    res.json({
      valid: true,
      keyName: apiKeyData.keyName,
      tier: apiKeyData.tier,
      rateLimit: apiKeyData.rateLimit,
      creditsBalance: apiKeyData.creditsBalance,
      userId: apiKeyData.userId,
      allowedModel: apiKeyData.model ? apiKeyData.model.modelId : null
    });
  } catch (error) {
    console.error('Error validating API key:', error);
    res.status(500).json({ valid: false, error: 'Internal server error' });
  }
});

export default router;
