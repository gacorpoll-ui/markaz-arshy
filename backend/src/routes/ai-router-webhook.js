import express from 'express';
import crypto from 'crypto';
import prisma from '../db.js';
import eventBus from '../sse/EventBus.js';
import { wasRecorded, markRecorded, makeDedupKey } from '../sse/requestDedup.js';

const router = express.Router();

/* ═══════════════════════════════════════
   WEBHOOK FOR USAGE TRACKING (from 9router)
   ═══════════════════════════════════════ */
router.post('/webhook/usage', async (req, res) => {
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

    // --- Webhook Signature Verification (optional but recommended) ---
    // If 9router sends a signature, verify it here.
    // For now, we'll assume a shared secret for simplicity.
    // const signature = req.headers['x-9router-signature'];
    // if (!signature || !verifySignature(req.rawBody, signature, WEBHOOK_SECRET)) {
    //   return res.status(403).json({ error: 'Invalid webhook signature' });
    // }

    if (!incomingApiKey || !requestId || !modelIdString || !inputTokens || !outputTokens) {
      return res.status(400).json({ error: 'Missing required webhook data' });
    }

    // Find the API Key
    const apiKeyData = await prisma.aIApiKey.findUnique({
      where: { apiKey: incomingApiKey },
      include: {
        user: true,
        model: true,
      },
    });

    if (!apiKeyData || !apiKeyData.isActive) {
      // Log this for auditing, but don't error out loudly to sender
      console.warn('Webhook received for inactive or invalid API key:', incomingApiKey);
      return res.status(200).json({ message: 'API key not found or inactive, usage not recorded' });
    }

    // Find the model
    let aiModel = await prisma.aIModel.findUnique({
      where: { modelId: modelIdString },
    });

    if (!aiModel) {
      console.warn('Webhook received for unknown AI model, auto-registering:', modelIdString);
      
      // Inferred provider details
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

      // Upsert provider in database
      const provider = await prisma.aIProvider.upsert({
        where: { slug: providerSlug },
        update: {},
        create: {
          name: providerName,
          slug: providerSlug,
          description: 'Auto-created provider on usage webhook',
          isActive: true
        }
      });

      // Create model with generic fallback rates (e.g. $0.01 / 1K input, $0.03 / 1K output)
      aiModel = await prisma.aIModel.create({
        data: {
          providerId: provider.id,
          name: modelIdString.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          modelId: modelIdString,
          inputPricePerToken: 0.00001, // default $0.01 per 1K input tokens
          outputPricePerToken: 0.00003, // default $0.03 per 1K output tokens
          contextWindow: 128000,
          isActive: true
        }
      });
    }

    const EXCHANGE_RATE = 15000;
    const totalTokens = inputTokens + outputTokens;
    const inputCostUSD = (inputTokens / 1000) * aiModel.inputPricePerToken;
    const outputCostUSD = (outputTokens / 1000) * aiModel.outputPricePerToken;
    const inputCost = inputCostUSD * EXCHANGE_RATE;
    const outputCost = outputCostUSD * EXCHANGE_RATE;
    const totalCost = inputCost + outputCost;

    // Dedup check: skip if proxy already recorded this request
    const dedupKey = makeDedupKey(apiKeyData.id, req.body?.endpoint || 'unknown', statusCode, new Date(timestamp).getTime());
    if (wasRecorded(dedupKey)) {
      console.log(`[WEBHOOK] Skipping duplicate usage for key ${apiKeyData.id} (already recorded by proxy)`);
      return res.status(200).json({ message: 'Usage already recorded by proxy' });
    }
    markRecorded(dedupKey);

    const newBalance = apiKeyData.creditsBalance - totalCost;

    // Ensure we are inside a transaction for atomic updates
    await prisma.$transaction(async (tx) => {
      // Log AI Usage
      const newUsage = await tx.aIUsage.create({
        data: {
          requestId,
          apiKeyId: apiKeyData.id,
          userId: apiKeyData.userId,
          modelId: aiModel.id,
          inputTokens,
          outputTokens,
          totalTokens,
          inputCost,
          outputCost,
          totalCost,
          statusCode,
          latencyMs,
          errorMessage,
          metadata: metadata ? JSON.stringify(metadata) : null,
          createdAt: new Date(timestamp),
        },
      });

      // Deduct from API Key's credits balance
      await tx.aIApiKey.update({
        where: { id: apiKeyData.id },
        data: {
          creditsBalance: { decrement: totalCost },
          lastUsedAt: new Date(),
        },
      });

      // Log AI Transaction for usage
      await tx.aITransaction.create({
        data: {
          userId: apiKeyData.userId,
          apiKeyId: apiKeyData.id,
          amount: -totalCost,
          type: 'USAGE',
          description: `Usage for model ${aiModel.name} (req: ${requestId})`,
          balanceBefore: apiKeyData.creditsBalance,
          balanceAfter: newBalance,
          relatedUsageId: newUsage.id,
        },
      });
    }); // End of transaction

    // Emit real-time events AFTER transaction commits
    eventBus.emitUsage(apiKeyData.userId, {
      id: null, // webhook doesn't return the usage ID easily, frontend will get it on next refresh
      model: { name: aiModel.name, modelId: modelIdString },
      inputTokens,
      outputTokens,
      totalTokens,
      totalCost,
      statusCode,
      latencyMs,
      createdAt: new Date(timestamp).toISOString(),
      keyName: apiKeyData.keyName,
    });
    eventBus.emitBalanceUpdate(apiKeyData.userId, apiKeyData.id, newBalance);

    res.status(200).json({ message: 'Usage recorded successfully' });
  } catch (error) {
    console.error('Error processing AI webhook:', error);
    // Don't return 500 to webhook sender, as it might retry indefinitely.
    // Instead, log and return 200 with a warning, or a specific error code for the webhook system.
    res.status(200).json({ message: 'Error processing webhook, please check server logs' });
  }
});

// Helper for signature verification if implemented later
// function verifySignature(rawBody, signature, secret) {
//   const hmac = crypto.createHmac('sha256', secret);
//   hmac.update(rawBody);
//   const digest = `sha256=${hmac.digest('hex')}`;
//   return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
// }

export default router;
