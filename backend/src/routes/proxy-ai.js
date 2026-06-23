import express from 'express';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import prisma from '../db.js';
import eventBus from '../sse/EventBus.js';

const router = express.Router();
const NINE_ROUTER_URL = process.env.AI_ROUTER_URL || 'http://localhost:20128';

// Rate limiting
const proxyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Terlalu banyak request.' },
  standardHeaders: true,
  legacyHeaders: false,
});

function maskKey(key) {
  if (!key || key.length < 8) return '***';
  return key.slice(0, 4) + '...' + key.slice(-4);
}

// ═══════════════════════════════════════
// TOKEN EXTRACTION — Support OpenAI, Anthropic, Gemini
// ═══════════════════════════════════════
function extractTokens(responseBody) {
  if (!responseBody) return { inputTokens: 0, outputTokens: 0 };
  if (responseBody.usage?.prompt_tokens !== undefined) return { inputTokens: responseBody.usage.prompt_tokens || 0, outputTokens: responseBody.usage.completion_tokens || 0 };
  if (responseBody.usage?.input_tokens !== undefined) return { inputTokens: responseBody.usage.input_tokens || 0, outputTokens: responseBody.usage.output_tokens || 0 };
  if (responseBody.usageMetadata) return { inputTokens: responseBody.usageMetadata.promptTokenCount || 0, outputTokens: responseBody.usageMetadata.candidatesTokenCount || 0 };
  return { inputTokens: 0, outputTokens: 0 };
}

// ═══════════════════════════════════════
// SMART PRICING — model-aware defaults
// ═══════════════════════════════════════
function getDefaultPricing(modelId) {
  const id = (modelId || '').toLowerCase();
  if (id.includes('opus') || id.includes('o1') || id.includes('o3') || id.includes('pro')) return { input: 500, output: 2500, window: 200000 };
  if (id.includes('sonnet') || id.includes('gpt-4o') || id.includes('gemini-1.5-pro') || id.includes('gemini-2')) return { input: 250, output: 1250, window: 128000 };
  if (id.includes('haiku') || id.includes('mini') || id.includes('flash') || id.includes('nano')) return { input: 40, output: 200, window: 128000 };
  return { input: 150, output: 450, window: 128000 };
}

// ═══════════════════════════════════════
// RECORD USAGE (Proxy-side) — fallback if webhook isn't configured/sent
// ═══════════════════════════════════════
async function recordUsage({ apiKey, requestId, endpoint, body, responseStatus, latencyMs, inputTokens, outputTokens, modelId }) {
  try {
    const keyData = await prisma.aIApiKey.findUnique({ where: { apiKey } });
    if (!keyData) return;

    // Find or auto-create model (with smart pricing)
    let aiModel = await prisma.aIModel.findUnique({ where: { modelId } });
    if (!aiModel) {
      console.warn(`[PROXY] Auto-registering unknown model: ${modelId}`);
      let providerSlug = 'other';
      let providerName = 'Other Providers';
      if (modelId.startsWith('gpt') || modelId.startsWith('o1') || modelId.startsWith('o3')) {
        providerSlug = 'openai'; providerName = 'OpenAI';
      } else if (modelId.includes('claude')) {
        providerSlug = 'anthropic'; providerName = 'Anthropic';
      } else if (modelId.includes('gemini')) {
        providerSlug = 'google-ai'; providerName = 'Google AI';
      }

      const provider = await prisma.aIProvider.upsert({
        where: { slug: providerSlug },
        update: {},
        create: { name: providerName, slug: providerSlug, description: 'Auto-created on usage', isActive: true },
      });
      const pricing = getDefaultPricing(modelId);
      aiModel = await prisma.aIModel.create({
        data: {
          providerId: provider.id, name: modelId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          modelId, inputPricePer1K: pricing.input, outputPricePer1K: pricing.output, contextWindow: pricing.window, isActive: true,
        },
      });
    }

    // Calculate cost (integer math)
    const totalTokens = inputTokens + outputTokens;
    const inputCost = Math.floor((inputTokens * aiModel.inputPricePer1K) / 1000);
    const outputCost = Math.floor((outputTokens * aiModel.outputPricePer1K) / 1000);
    const totalCost = inputCost + outputCost;

    // --- Atomic transaction: check quota + record usage + deduct User.balance ---
    const result = await prisma.$transaction(async (tx) => {
      // 1. Dedup by requestId — crucial for webhook fallback scenarios
      const existing = await tx.aIUsage.findFirst({ where: { requestId } });
      if (existing) {
        console.log(`[PROXY] Skipping duplicate requestId: ${requestId} (already recorded, possibly by webhook)`);
        return null;
      }

      // 2. Enforce monthlyQuota on API key
      if (keyData.monthlyQuota) {
        const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
        const monthlyUsage = await tx.aIUsage.aggregate({
          where: { apiKeyId: keyData.id, createdAt: { gte: monthStart } },
          _sum: { totalTokens: true },
        });
        const monthlyTokens = (monthlyUsage._sum.totalTokens || 0) + totalTokens;
        if (monthlyTokens > keyData.monthlyQuota) {
          throw new Error('MONTHLY_QUOTA_EXCEEDED');
        }
      }

      // 3. Read current User.balance for balance check + deduction
      const user = await tx.user.findUnique({ where: { id: keyData.userId } });
      if (!user) throw new Error('User not found');
      if (totalCost > 0 && user.balance < -50000) { // Allow temporary negative balance but cap at -50000
        throw new Error('INSUFFICIENT_BALANCE');
      }

      // 4. Create usage record (with price snapshots)
      const newUsage = await tx.aIUsage.create({
        data: {
          requestId, apiKeyId: keyData.id, userId: keyData.userId, modelId: aiModel.id,
          inputTokens, outputTokens, totalTokens, inputCost, outputCost, totalCost,
          inputPricePer1K: aiModel.inputPricePer1K, outputPricePer1K: aiModel.outputPricePer1K,
          endpoint, statusCode: responseStatus, latencyMs,
          metadata: JSON.stringify({ requestedModel: body?.model, actualModel: modelId }),
        },
      });

      // 5. Deduct from User.balance (SINGLE WALLET)
      const updatedUser = await tx.user.update({
        where: { id: keyData.userId },
        data: { balance: { decrement: totalCost } },
      });

      // 6. Update key lastUsedAt
      await tx.aIApiKey.update({ where: { id: keyData.id }, data: { lastUsedAt: new Date() } });

      // 7. Log transaction
      await tx.aITransaction.create({
        data: {
          userId: keyData.userId, apiKeyId: keyData.id, amount: -totalCost, type: 'USAGE',
          description: `Usage: ${aiModel.name} (${inputTokens}in + ${outputTokens}out)`,
          balanceBefore: user.balance, balanceAfter: updatedUser.balance, relatedUsageId: newUsage.id,
        },
      });

      return { usageId: newUsage.id, newBalance: updatedUser.balance };
    });

    // Emit real-time events (after transaction commits)
    if (!result) return; // Dedup: usage already recorded

    eventBus.emitUsage(keyData.userId, {
      id: result.usageId, model: { name: aiModel.name, modelId },
      inputTokens, outputTokens, totalTokens, totalCost, endpoint, statusCode: responseStatus, latencyMs,
      createdAt: new Date().toISOString(), keyName: keyData.keyName,
    });
    eventBus.emitBalanceUpdate(keyData.userId, keyData.id, result.newBalance);

    console.log(`[PROXY] Recorded: requestId=${requestId} model=${modelId} tokens=${totalTokens} cost=Rp${Math.ceil(totalCost)} balance=Rp${result.newBalance}`);
  } catch (err) {
    console.error('[PROXY] Record usage failed:', maskKey(apiKey), err.message);
    if (err.message === 'MONTHLY_QUOTA_EXCEEDED') throw new Error('Monthly token quota exceeded');
    if (err.message === 'INSUFFICIENT_BALANCE') throw new Error('Insufficient balance');
    // Don't rethrow other errors, just log and allow proxy to continue
  }
}

// ═══════════════════════════════════════
// POST /chat/completions
// ═══════════════════════════════════════
router.post('/chat/completions', proxyLimiter, async (req, res) => {
  const startTime = Date.now();
  const requestId = `req_${crypto.randomBytes(8).toString('hex')}`;
  try {
    const apiKey = (req.headers['authorization'] || '').replace('Bearer ', '');
    if (!apiKey) return res.status(401).json({ error: { message: 'API key required', type: 'authentication_error' } });

    const response = await fetch(`${NINE_ROUTER_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`, 'X-Request-Id': requestId },
      body: JSON.stringify(req.body),
    });

    const ct = response.headers.get('content-type') || '';
    const actualModel = response.headers.get('x-openai-model') || req.body.model || 'unknown';

    if (ct.includes('text/event-stream')) {
      // ═══ STREAMING ═══
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.status(response.status);

      let fullContent = '';
      let totalInputTokens = 0;
      let totalOutputTokens = 0;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop();
        for (const l of lines) {
          res.write(l + '\n');
          if (l.startsWith('data: ')) {
            try {
              const chunk = JSON.parse(l.slice(6));
              if (chunk.choices?.[0]?.delta?.content) fullContent += chunk.choices[0].delta.content;
              if (chunk.usage) {
                const tokens = extractTokens(chunk);
                totalInputTokens += tokens.inputTokens;
                totalOutputTokens += tokens.outputTokens;
              }
            } catch {}
          }
        }
      }
      if (buf) res.write(buf);
      res.end();

      // Record usage after stream ends
      await recordUsage({
        apiKey, requestId, endpoint: '/v1/chat/completions',
        body: req.body, responseStatus: response.status, latencyMs: Date.now() - startTime,
        inputTokens: totalInputTokens || Math.ceil(fullContent.length / 4) || 1, // Fallback token estimation
        outputTokens: totalOutputTokens || Math.ceil(fullContent.length / 4) || 1,
        modelId: actualModel,
      });

    } else {
      // ═══ NON-STREAMING ═══
      const data = await response.json();
      res.status(response.status).json(data);

      if (response.ok && data) {
        const tokens = extractTokens(data);
        await recordUsage({
          apiKey, requestId, endpoint: '/v1/chat/completions',
          body: req.body, responseStatus: response.status, latencyMs: Date.now() - startTime,
          inputTokens: tokens.inputTokens || 1,
          outputTokens: tokens.outputTokens || 1,
          modelId: data.model || actualModel,
        });
      }
    }
    console.log(`[PROXY] chat: ${maskKey(apiKey)} model=${actualModel}`);
  } catch (error) {
    console.error('[PROXY] chat error:', error.message);
    if (error.message === 'MONTHLY_QUOTA_EXCEEDED' || error.message === 'INSUFFICIENT_BALANCE') {
      return res.status(400).json({ error: { message: error.message, type: 'billing_error' } });
    }
    res.status(500).json({ error: { message: 'Internal proxy error.' } });
  }
});

// ═══════════════════════════════════════
// GET /models
// ═══════════════════════════════════════
router.get('/models', async (req, res) => {
  try {
    const apiKey = (req.headers['x-api-key'] || req.headers['authorization'] || '').replace('Bearer ', '');
    const response = await fetch(`${NINE_ROUTER_URL}/v1/models`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: { message: 'Proxy error' } });
  }
});

// ═══════════════════════════════════════
// POST /messages — Anthropic Messages API
// ═══════════════════════════════════════
router.post('/messages', proxyLimiter, async (req, res) => {
  const startTime = Date.now();
  const requestId = `req_${crypto.randomBytes(8).toString('hex')}`;
  try {
    const apiKey = req.headers['x-api-key'] || (req.headers['authorization'] || '').replace('Bearer ', '');
    if (!apiKey) return res.status(401).json({ type: 'error', error: { type: 'authentication_error', message: 'API key required' } });

    const { model, messages, max_tokens, system, stream, temperature } = req.body;

    // Anthropic → OpenAI format
    const openaiMessages = [];
    if (system) {
      const t = typeof system === 'string' ? system : Array.isArray(system) ? system.map(s => s.text || '').join('\n') : String(system);
      openaiMessages.push({ role: 'system', content: t });
    }
    if (messages) {
      for (const m of messages) {
        let c = m.content;
        if (Array.isArray(c)) c = c.filter(b => b.type === 'text').map(b => b.text).join('\n');
        openaiMessages.push({ role: m.role, content: c });
      }
    }

    const body = { model: model || 'code', messages: openaiMessages, max_tokens: max_tokens || 4096, stream: !!stream };
    if (temperature !== undefined) body.temperature = temperature;

    const response = await fetch(`${NINE_ROUTER_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`, 'X-Request-Id': requestId },
      body: JSON.stringify(body),
    });

    const ct = response.headers.get('content-type') || '';
    const actualModel = response.headers.get('x-openai-model') || model || 'unknown';

    if (stream && ct.includes('text/event-stream')) {
      // ═══ STREAMING ═══
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.status(response.status);

      const msgId = `msg_${crypto.randomBytes(12).toString('hex')}`;
      res.write(`event: message_start\ndata: ${JSON.stringify({ type: 'message_start', message: { id: msgId, type: 'message', role: 'assistant', content: [], model: model || 'code', stop_reason: null, usage: { input_tokens: 0, output_tokens: 0 } } })}\n\n`);
      res.write(`event: content_block_start\ndata: ${JSON.stringify({ type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } })}\n\n`);

      let fullContent = '';
      let totalInputTokens = 0;
      let totalOutputTokens = 0;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split('\n');
          buf = lines.pop();
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const d = line.slice(6).trim();
            if (d === '[DONE]') continue;
            try {
              const chunk = JSON.parse(d);
              if (chunk.choices?.[0]?.delta?.content) fullContent += chunk.choices[0].delta.content;
              if (chunk.usage) {
                const tokens = extractTokens(chunk);
                totalInputTokens += tokens.inputTokens;
                totalOutputTokens += tokens.outputTokens;
              }
              // Send Anthropic-style stream events
              if (chunk.choices?.[0]?.delta?.content) {
                res.write(`event: content_block_delta\ndata: ${JSON.stringify({ type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: chunk.choices[0].delta.content } })}\n\n`);
              }
              if (chunk.choices?.[0]?.finish_reason) {
                const sr = chunk.choices[0].finish_reason === 'length' ? 'max_tokens' : 'end_turn';
                res.write(`event: content_block_stop\ndata: ${JSON.stringify({ type: 'content_block_stop', index: 0 })}\n\n`);
                res.write(`event: message_delta\ndata: ${JSON.stringify({ type: 'message_delta', delta: { stop_reason: sr, stop_sequence: null }, usage: { output_tokens: chunk.usage?.completion_tokens || 0 } })}\n\n`);
                res.write(`event: message_stop\ndata: ${JSON.stringify({ type: 'message_stop' })}\n\n`);
              }
            } catch {}
          }
        }
      } catch (e) { console.error('[PROXY] Anthropic Stream error:', e.message); }
      res.end();

      // Record usage after stream ends
      await recordUsage({
        apiKey, requestId, endpoint: '/v1/messages',
        body: req.body, responseStatus: response.status, latencyMs: Date.now() - startTime,
        inputTokens: totalInputTokens || Math.ceil(fullContent.length / 4) || 1,
        outputTokens: totalOutputTokens || Math.ceil(fullContent.length / 4) || 1,
        modelId: actualModel,
      });

    } else {
      // ═══ NON-STREAMING ═══
      const data = await response.json();
      res.status(response.status).json(data);

      if (response.ok && data) {
        const tokens = extractTokens(data);
        await recordUsage({
          apiKey, requestId, endpoint: '/v1/messages',
          body: req.body, responseStatus: response.status, latencyMs: Date.now() - startTime,
          inputTokens: tokens.inputTokens || 1,
          outputTokens: tokens.outputTokens || 1,
          modelId: data.model || actualModel,
        });
      }
    }
    console.log(`[PROXY] messages: ${maskKey(apiKey)} model=${actualModel} stream=${!!stream}`);
  } catch (error) {
    console.error('[PROXY] messages error:', error.message);
    if (error.message === 'MONTHLY_QUOTA_EXCEEDED' || error.message === 'INSUFFICIENT_BALANCE') {
      return res.status(400).json({ type: 'error', error: { type: 'billing_error', message: error.message } });
    }
    res.status(500).json({ type: 'error', error: { type: 'api_error', message: 'Internal proxy error.' } });
  }
});

export default router;
