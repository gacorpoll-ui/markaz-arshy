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

/* ═══════════════════════════════════════
   WEBHOOK FOR USAGE TRACKING (from 9router)
   SINGLE SOURCE OF TRUTH for all usage recording
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

    // --- Webhook Authentication ---
    if (!WEBHOOK_SECRET) {
      console.error('[WEBHOOK] AI_WEBHOOK_SECRET not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    const authHeader = req.headers['x-webhook-secret'];
    if (!authHeader || authHeader !== WEBHOOK_SECRET) {
      return res.status(403).json({ error: 'Invalid webhook authentication' });
    }

    // --- Validate required fields ---
    if (!incomingApiKey || !requestId || !modelIdString) {
      return res.status(400).json({ error: 'Missing required webhook data (apiKey, requestId, model)' });
    }

    // Token counts can be 0 (valid for some requests), but must be numbers
    const inTokens = typeof inputTokens === 'number' ? inputTokens : 0;
    const outTokens = typeof outputTokens === 'number' ? outputTokens : 0;

    // --- Dedup by requestId (primary key) ---
    // This is the ONLY dedup mechanism — simple and reliable
    const existingUsage = await prisma.aIUsage.findFirst({
      where: { requestId },
    });
    if (existingUsage) {
      console.log(`[WEBHOOK] Skipping duplicate requestId: ${requestId}`);
      return res.status(200).json({ message: 'Usage already recorded', usageId: existingUsage.id });
    }

    // --- Find the API Key ---
    const apiKeyData = await prisma.aIApiKey.findUnique({
      where: { apiKey: incomingApiKey },
      include: { user: true },
    });

    if (!apiKeyData || !apiKeyData.isActive) {
      console.warn(`[WEBHOOK] API key not found or inactive (requestId: ${requestId})`);
      return res.status(200).json({ message: 'API key not found or inactive, usage not recorded' });
    }

    // --- Find or auto-create the model ---
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

      aiModel = await prisma.aIModel.create({
        data: {
          providerId: provider.id,
          name: modelIdString.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          modelId: modelIdString,
          inputPricePer1K: 150,
          outputPricePer1K: 450,
          contextWindow: 128000,
          isActive: true,
        },
      });
    }

    // --- Calculate cost ---
    const totalTokens = inTokens + outTokens;
    const inputCost = (inTokens / 1000) * aiModel.inputPricePer1K;
    const outputCost = (outTokens / 1000) * aiModel.outputPricePer1K;
    const totalCost = inputCost + outputCost;

    // --- Atomic transaction: record usage + deduct balance ---
    const result = await prisma.$transaction(async (tx) => {
      // Create usage record
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
          endpoint: metadata?.endpoint || '/webhook',
          statusCode: statusCode || 200,
          latencyMs: latencyMs || 0,
          errorMessage: errorMessage || null,
          metadata: metadata ? JSON.stringify(metadata) : null,
          createdAt: timestamp ? new Date(timestamp) : new Date(),
        },
      });

      // Deduct balance atomically
      const updatedKey = await tx.aIApiKey.update({
        where: { id: apiKeyData.id },
        data: {
          creditsBalance: { decrement: totalCost },
          lastUsedAt: new Date(),
        },
      });

      // Log transaction
      await tx.aITransaction.create({
        data: {
          userId: apiKeyData.userId,
          apiKeyId: apiKeyData.id,
          amount: -totalCost,
          type: 'USAGE',
          description: `Usage: ${aiModel.name}`,
          balanceBefore: apiKeyData.creditsBalance,
          balanceAfter: updatedKey.creditsBalance,
          relatedUsageId: newUsage.id,
        },
      });

      return { usageId: newUsage.id, newBalance: updatedKey.creditsBalance };
    });

    // --- Emit real-time events (after transaction commits) ---
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

    console.log(`[WEBHOOK] Recorded: requestId=${requestId} model=${modelIdString} tokens=${totalTokens} cost=Rp${Math.ceil(totalCost)}`);

    res.status(200).json({ message: 'Usage recorded successfully', usageId: result.usageId });
  } catch (error) {
    console.error('[WEBHOOK] Error processing usage:', error);
    // Return 500 so 9router retries — the requestId dedup prevents duplicates
    res.status(500).json({ error: 'Failed to record usage, please retry' });
  }
});

export default router;
