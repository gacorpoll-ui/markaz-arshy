import express from 'express';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import prisma from '../db.js';
import eventBus from '../sse/EventBus.js';

const router = express.Router();

// Rate limiting for webhook
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: { error: 'Too many webhook requests.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ═══════════════════════════════════════
// SMART PRICING — model-aware defaults
// ═══════════════════════════════════════
function getDefaultPricing(modelId) {
  const id = (modelId || '').toLowerCase();
  // Premium: large reasoning models
  if (id.includes('opus') || id.includes('o1') || id.includes('o3') || id.includes('pro'))
    return { input: 500, output: 2500, window: 200000 };
  // Mid: main workhorse models
  if (id.includes('sonnet') || id.includes('gpt-4o') || id.includes('gemini-1.5-pro') || id.includes('gemini-2'))
    return { input: 250, output: 1250, window: 128000 };
  // Cheap: fast/small models
  if (id.includes('haiku') || id.includes('mini') || id.includes('flash') || id.includes('nano'))
    return { input: 40, output: 200, window: 128000 };
  // Default fallback
  return { input: 150, output: 450, window: 128000 };
}

/* ═══════════════════════════════════════
   WEBHOOK FOR USAGE TRACKING (from 9router)
   SINGLE SOURCE OF TRUTH — debits User.balance
   ═══════════════════════════════════════ */
router.post('/webhook/usage', webhookLimiter, async (req, res) => {
  try {
    const {
      requestId,
      apiKey: incomingApiKey,
      model: modelIdString,
      inputTokens,
      outputTokens,
      statusCode,
      latencyMs,
      timestamp,
      errorMessage,
      metadata,
    } = req.body;

    const WEBHOOK_SECRET = process.env.AI_WEBHOOK_SECRET;

    // --- Webhook Authentication (constant-time) ---
    if (!WEBHOOK_SECRET) {
      console.error('[WEBHOOK] AI_WEBHOOK_SECRET not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    const authHeader = req.headers['x-webhook-secret'];
    if (!authHeader) {
      return res.status(403).json({ error: 'Invalid webhook authentication' });
    }
    const authBuf = Buffer.from(authHeader);
    const secretBuf = Buffer.from(WEBHOOK_SECRET);
    if (authBuf.length !== secretBuf.length || !crypto.timingSafeEqual(authBuf, secretBuf)) {
      return res.status(403).json({ error: 'Invalid webhook authentication' });
    }

    // --- Validate required fields ---
    if (!incomingApiKey || !requestId || !modelIdString) {
      return res.status(400).json({ error: 'Missing required webhook data (apiKey, requestId, model)' });
    }

    // Token counts can be 0 (valid for some requests), but must be numbers
    const inTokens = typeof inputTokens === 'number' ? inputTokens : 0;
    const outTokens = typeof outputTokens === 'number' ? outputTokens : 0;

    // --- Find the API Key ---
    const apiKeyData = await prisma.aIApiKey.findUnique({
      where: { apiKey: incomingApiKey },
    });

    if (!apiKeyData || !apiKeyData.isActive) {
      console.warn(`[WEBHOOK] API key not found or inactive (requestId: ${requestId})`);
      return res.status(200).json({ message: 'API key not found or inactive, usage not recorded' });
    }

    // --- Find or auto-create model (with smart pricing) ---
    let aiModel = await prisma.aIModel.findUnique({
      where: { modelId: modelIdString },
    });

    if (!aiModel) {
      console.warn(`[WEBHOOK] Auto-registering unknown model: ${modelIdString}`);

      let providerSlug = 'other';
      let providerName = 'Other Providers';
      if (modelIdString.startsWith('gpt') || modelIdString.startsWith('o1') || modelIdString.startsWith('o3')) {
        providerSlug = 'openai';
        providerName = 'OpenAI';
      } else if (modelIdString.includes('claude')) {
        providerSlug = 'anthropic';
        providerName = 'Anthropic';
      } else if (modelIdString.includes('gemini')) {
        providerSlug = 'google-ai';
        providerName = 'Google AI';
      }

      const provider = await prisma.aIProvider.upsert({
        where: { slug: providerSlug },
        update: {},
        create: { name: providerName, slug: providerSlug, description: 'Auto-created on usage webhook', isActive: true },
      });

      const pricing = getDefaultPricing(modelIdString);
      aiModel = await prisma.aIModel.create({
        data: {
          providerId: provider.id,
          name: modelIdString.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          modelId: modelIdString,
          inputPricePer1K: pricing.input,
          outputPricePer1K: pricing.output,
          contextWindow: pricing.window,
          isActive: true,
        },
      });
    }

    // --- Calculate cost (integer math) ---
    const totalTokens = inTokens + outTokens;
    const inputCost = Math.floor((inTokens * aiModel.inputPricePer1K) / 1000);
    const outputCost = Math.floor((outTokens * aiModel.outputPricePer1K) / 1000);
    const totalCost = inputCost + outputCost;

    // --- Atomic transaction: check quota + record usage + deduct User.balance ---
    const result = await prisma.$transaction(async (tx) => {
      // 1. Dedup by requestId — inside transaction for atomicity
      const existingUsage = await tx.aIUsage.findFirst({ where: { requestId } });
      if (existingUsage) {
        console.log(`[WEBHOOK] Skipping duplicate requestId: ${requestId}`);
        return null;
      }

      // 2. Enforce monthlyQuota on API key
      if (apiKeyData.monthlyQuota) {
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        const monthlyUsage = await tx.aIUsage.aggregate({
          where: { apiKeyId: apiKeyData.id, createdAt: { gte: monthStart } },
          _sum: { totalTokens: true },
        });
        const monthlyTokens = (monthlyUsage._sum.totalTokens || 0) + totalTokens;
        if (monthlyTokens > apiKeyData.monthlyQuota) {
          throw new Error('MONTHLY_QUOTA_EXCEEDED');
        }
      }

      // 3. Read current User.balance for balance check + deduction
      const user = await tx.user.findUnique({ where: { id: apiKeyData.userId } });
      if (!user) throw new Error('User not found');

      // Allow negative balance for small amounts (grace period), but cap at -50000
      if (totalCost > 0 && user.balance < -50000) {
        throw new Error('INSUFFICIENT_BALANCE');
      }

      // 4. Create usage record (with price snapshots)
      const newUsage = await tx.aIUsage.create({
        data: {
          requestId,
          apiKeyId: apiKeyData.id,
          userId: apiKeyData.userId,
          modelId: aiModel.id,
          inputTokens: inTokens,
          outputTokens: outTokens,
          totalTokens,
          inputCost,
          outputCost,
          totalCost,
          inputPricePer1K: aiModel.inputPricePer1K,
          outputPricePer1K: aiModel.outputPricePer1K,
          endpoint: metadata?.endpoint || '/webhook',
          statusCode: statusCode || 200,
          latencyMs: latencyMs || 0,
          errorMessage: errorMessage || null,
          metadata: metadata ? JSON.stringify(metadata) : null,
          createdAt: timestamp ? new Date(timestamp) : new Date(),
        },
      });

      // 5. Deduct from User.balance (SINGLE WALLET)
      const updatedUser = await tx.user.update({
        where: { id: apiKeyData.userId },
        data: { balance: { decrement: totalCost } },
      });

      // 6. Update key lastUsedAt
      await tx.aIApiKey.update({
        where: { id: apiKeyData.id },
        data: { lastUsedAt: new Date() },
      });

      // 7. Log transaction
      await tx.aITransaction.create({
        data: {
          userId: apiKeyData.userId,
          apiKeyId: apiKeyData.id,
          amount: -totalCost,
          type: 'USAGE',
          description: `Usage: ${aiModel.name} (${inTokens}in + ${outTokens}out)`,
          balanceBefore: user.balance,
          balanceAfter: updatedUser.balance,
          relatedUsageId: newUsage.id,
        },
      });

      return { usageId: newUsage.id, newBalance: updatedUser.balance };
    });

    // --- Emit real-time events (after transaction commits) ---
    if (!result) {
      return res.status(200).json({ message: 'Usage already recorded' });
    }

    eventBus.emitUsage(apiKeyData.userId, {
      id: result.usageId,
      model: { name: aiModel.name, modelId: modelIdString },
      inputTokens: inTokens,
      outputTokens: outTokens,
      totalTokens,
      totalCost,
      endpoint: metadata?.endpoint || '/webhook',
      statusCode: statusCode || 200,
      latencyMs: latencyMs || 0,
      createdAt: (timestamp ? new Date(timestamp) : new Date()).toISOString(),
      keyName: apiKeyData.keyName,
    });
    eventBus.emitBalanceUpdate(apiKeyData.userId, apiKeyData.id, result.newBalance);

    console.log(`[WEBHOOK] Recorded: requestId=${requestId} model=${modelIdString} tokens=${totalTokens} cost=Rp${Math.ceil(totalCost)} balance=Rp${result.newBalance}`);

    res.status(200).json({ message: 'Usage recorded successfully', usageId: result.usageId });
  } catch (error) {
    console.error('[WEBHOOK] Error processing usage:', error);

    // Specific error responses
    if (error.message === 'MONTHLY_QUOTA_EXCEEDED') {
      return res.status(429).json({ error: 'Monthly token quota exceeded' });
    }
    if (error.message === 'INSUFFICIENT_BALANCE') {
      return res.status(402).json({ error: 'Insufficient balance' });
    }

    // Return 500 so 9router retries — the requestId dedup prevents duplicates
    res.status(500).json({ error: 'Failed to record usage, please retry' });
  }
});

export default router;
