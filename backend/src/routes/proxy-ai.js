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

  // OpenAI format: usage.prompt_tokens + usage.completion_tokens
  if (responseBody.usage?.prompt_tokens !== undefined) {
    return {
      inputTokens: responseBody.usage.prompt_tokens || 0,
      outputTokens: responseBody.usage.completion_tokens || 0,
    };
  }

  // Anthropic format: usage.input_tokens + usage.output_tokens
  if (responseBody.usage?.input_tokens !== undefined) {
    return {
      inputTokens: responseBody.usage.input_tokens || 0,
      outputTokens: responseBody.usage.output_tokens || 0,
    };
  }

  // Gemini format: usageMetadata.promptTokenCount + candidatesTokenCount
  if (responseBody.usageMetadata) {
    return {
      inputTokens: responseBody.usageMetadata.promptTokenCount || 0,
      outputTokens: responseBody.usageMetadata.candidatesTokenCount || 0,
    };
  }

  return { inputTokens: 0, outputTokens: 0 };
}

// ═══════════════════════════════════════
// RECORD USAGE — Single source of truth
// ═══════════════════════════════════════
async function recordUsage({ apiKey, requestId, endpoint, body, responseStatus, latencyMs, inputTokens, outputTokens, modelId }) {
  try {
    const keyData = await prisma.aIApiKey.findUnique({ where: { apiKey } });
    if (!keyData) return;

    // Dedup by requestId
    const existing = await prisma.aIUsage.findFirst({ where: { requestId } });
    if (existing) return;

    // Find or auto-create model
    let aiModel = await prisma.aIModel.findUnique({ where: { modelId } });
    if (!aiModel) {
      const provider = await prisma.aIProvider.upsert({
        where: { slug: 'other' },
        update: {},
        create: { name: 'Other', slug: 'other', isActive: true },
      });
      aiModel = await prisma.aIModel.create({
        data: {
          providerId: provider.id,
          name: modelId,
          modelId,
          inputPricePer1K: 150,
          outputPricePer1K: 450,
          contextWindow: 128000,
          isActive: true,
        },
      });
    }

    const totalTokens = inputTokens + outputTokens;
    const inputCost = (inputTokens / 1000) * aiModel.inputPricePer1K;
    const outputCost = (outputTokens / 1000) * aiModel.outputPricePer1K;
    const totalCost = inputCost + outputCost;

    const result = await prisma.$transaction(async (tx) => {
      const newUsage = await tx.aIUsage.create({
        data: {
          requestId,
          apiKeyId: keyData.id,
          userId: keyData.userId,
          modelId: aiModel.id,
          inputTokens,
          outputTokens,
          totalTokens,
          inputCost,
          outputCost,
          totalCost,
          endpoint,
          statusCode: responseStatus,
          latencyMs,
          metadata: JSON.stringify({ requestedModel: body?.model, actualModel: modelId }),
        },
      });

      const updatedKey = await tx.aIApiKey.update({
        where: { id: keyData.id },
        data: {
          creditsBalance: { decrement: totalCost },
          lastUsedAt: new Date(),
        },
      });

      await tx.aITransaction.create({
        data: {
          userId: keyData.userId,
          apiKeyId: keyData.id,
          amount: -totalCost,
          type: 'USAGE',
          description: `Usage: ${modelId}`,
          balanceBefore: keyData.creditsBalance,
          balanceAfter: updatedKey.creditsBalance,
          relatedUsageId: newUsage.id,
        },
      });

      return { usageId: newUsage.id, newBalance: updatedKey.creditsBalance };
    });

    eventBus.emitUsage(keyData.userId, {
      id: result.usageId,
      model: { name: aiModel.name, modelId },
      inputTokens,
      outputTokens,
      totalTokens,
      totalCost,
      endpoint,
      statusCode: responseStatus,
      latencyMs,
      createdAt: new Date().toISOString(),
      keyName: keyData.keyName,
    });
    eventBus.emitBalanceUpdate(keyData.userId, keyData.id, result.newBalance);

    console.log(`[USAGE] ${maskKey(apiKey)} model=${modelId} tokens=${totalTokens} cost=Rp${Math.ceil(totalCost)}`);
  } catch (err) {
    console.error('[USAGE] Record failed:', maskKey(apiKey), err.message);
  }
}

// ═══════════════════════════════════════
// POST /chat/completions
// ═══════════════════════════════════════
router.post('/chat/completions', proxyLimiter, async (req, res) => {
  const startTime = Date.now();
  try {
    const apiKey = (req.headers['authorization'] || '').replace('Bearer ', '');
    if (!apiKey) return res.status(401).json({ error: { message: 'API key required', type: 'authentication_error' } });

    const response = await fetch(`${NINE_ROUTER_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify(req.body),
    });

    const requestId = `req_${crypto.randomBytes(8).toString('hex')}`;
    const ct = response.headers.get('content-type') || '';

    if (ct.includes('text/event-stream')) {
      // ═══ STREAMING ═══
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.status(response.status);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let fullContent = '';
      let usageRecorded = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop();
        for (const l of lines) {
          res.write(l + '\n');
          if (l.startsWith('data: ') && !usageRecorded) {
            try {
              const chunk = JSON.parse(l.slice(6));
              if (chunk.choices?.[0]?.delta?.content) {
                fullContent += chunk.choices[0].delta.content;
              }
              // Check for usage data in any chunk
              if (chunk.usage) {
                const tokens = extractTokens(chunk);
                if (tokens.inputTokens > 0 || tokens.outputTokens > 0) {
                  await recordUsage({
                    apiKey, requestId, endpoint: '/v1/chat/completions',
                    body: req.body, responseStatus: response.status,
                    latencyMs: Date.now() - startTime,
                    inputTokens: tokens.inputTokens,
                    outputTokens: tokens.outputTokens,
                    modelId: req.body.model || chunk.model || 'unknown',
                  });
                  usageRecorded = true;
                }
              }
            } catch {}
          }
        }
      }
      if (buf) res.write(buf);
      res.end();

      // Fallback: if no usage recorded, estimate from content length
      if (!usageRecorded) {
        const inputText = (req.body.messages || []).map(m => typeof m.content === 'string' ? m.content : '').join('');
        await recordUsage({
          apiKey, requestId, endpoint: '/v1/chat/completions',
          body: req.body, responseStatus: response.status,
          latencyMs: Date.now() - startTime,
          inputTokens: Math.ceil(inputText.length / 4) || 1,
          outputTokens: Math.ceil(fullContent.length / 4) || 1,
          modelId: req.body.model || 'unknown',
        });
      }
    } else {
      // ═══ NON-STREAMING ═══
      const data = await response.json();
      const latencyMs = Date.now() - startTime;
      res.status(response.status).json(data);

      if (response.ok && data) {
        const tokens = extractTokens(data);
        await recordUsage({
          apiKey, requestId, endpoint: '/v1/chat/completions',
          body: req.body, responseStatus: response.status, latencyMs,
          inputTokens: tokens.inputTokens || 1,
          outputTokens: tokens.outputTokens || 1,
          modelId: data.model || req.body.model || 'unknown',
        });
      }
    }
    console.log(`[PROXY] chat: ${maskKey(apiKey)} model=${req.body.model}`);
  } catch (error) {
    console.error('[PROXY] chat error:', error.message);
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
  try {
    const apiKey = req.headers['x-api-key'] || (req.headers['authorization'] || '').replace('Bearer ', '');
    if (!apiKey) return res.status(401).json({ type: 'error', error: { type: 'authentication_error', message: 'API key required' } });

    const { model, messages, max_tokens, system, stream, temperature } = req.body;
    const requestId = `req_${crypto.randomBytes(8).toString('hex')}`;

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
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify(body),
    });

    const ct = response.headers.get('content-type') || '';

    if (stream && ct.includes('text/event-stream')) {
      // ═══ STREAMING ═══
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.status(response.status);

      const msgId = `msg_${crypto.randomBytes(12).toString('hex')}`;
      res.write(`event: message_start\ndata: ${JSON.stringify({ type: 'message_start', message: { id: msgId, type: 'message', role: 'assistant', content: [], model: model || 'code', stop_reason: null, usage: { input_tokens: 0, output_tokens: 0 } } })}\n\n`);
      res.write(`event: content_block_start\ndata: ${JSON.stringify({ type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } })}\n\n`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let fullContent = '';
      let usageRecorded = false;

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
              const delta = chunk.choices?.[0]?.delta;
              if (delta?.content) {
                fullContent += delta.content;
                res.write(`event: content_block_delta\ndata: ${JSON.stringify({ type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: delta.content } })}\n\n`);
              }
              if (chunk.choices?.[0]?.finish_reason && !usageRecorded) {
                const sr = chunk.choices[0].finish_reason === 'length' ? 'max_tokens' : 'end_turn';
                res.write(`event: content_block_stop\ndata: ${JSON.stringify({ type: 'content_block_stop', index: 0 })}\n\n`);
                res.write(`event: message_delta\ndata: ${JSON.stringify({ type: 'message_delta', delta: { stop_reason: sr, stop_sequence: null }, usage: { output_tokens: chunk.usage?.completion_tokens || 0 } })}\n\n`);
                res.write(`event: message_stop\ndata: ${JSON.stringify({ type: 'message_stop' })}\n\n`);

                const tokens = extractTokens(chunk);
                if (tokens.inputTokens > 0 || tokens.outputTokens > 0) {
                  await recordUsage({
                    apiKey, requestId, endpoint: '/v1/messages',
                    body: req.body, responseStatus: response.status,
                    latencyMs: Date.now() - startTime,
                    inputTokens: tokens.inputTokens,
                    outputTokens: tokens.outputTokens,
                    modelId: model || 'unknown',
                  });
                  usageRecorded = true;
                }
              }
            } catch {}
          }
        }
      } catch (e) { console.error('[PROXY] Stream error:', e.message); }
      res.end();

      if (!usageRecorded) {
        const inputText = messages?.map(m => typeof m.content === 'string' ? m.content : Array.isArray(m.content) ? m.content.map(b => b.text || '').join('') : '').join('') || '';
        await recordUsage({
          apiKey, requestId, endpoint: '/v1/messages',
          body: req.body, responseStatus: response.status,
          latencyMs: Date.now() - startTime,
          inputTokens: Math.ceil(inputText.length / 4) || 1,
          outputTokens: Math.ceil(fullContent.length / 4) || 1,
          modelId: model || 'unknown',
        });
      }
    } else {
      // ═══ NON-STREAMING ═══
      const data = await response.json();
      const latencyMs = Date.now() - startTime;
      if (data.error) return res.status(response.status).json({ type: 'error', error: { type: 'api_error', message: data.error.message || 'Unknown error' } });

      const tokens = extractTokens(data);
      await recordUsage({
        apiKey, requestId, endpoint: '/v1/messages',
        body: req.body, responseStatus: response.status, latencyMs,
        inputTokens: tokens.inputTokens || 1,
        outputTokens: tokens.outputTokens || 1,
        modelId: data.model || model || 'unknown',
      });

      const content = data.choices?.[0]?.message?.content || '';
      res.status(200).json({
        id: `msg_${crypto.randomBytes(12).toString('hex')}`,
        type: 'message', role: 'assistant',
        content: [{ type: 'text', text: content }],
        model: model || 'code',
        stop_reason: data.choices?.[0]?.finish_reason === 'length' ? 'max_tokens' : 'end_turn',
        stop_sequence: null,
        usage: { input_tokens: data.usage?.prompt_tokens || 0, output_tokens: data.usage?.completion_tokens || 0 },
      });
    }
    console.log(`[PROXY] messages: ${maskKey(apiKey)} model=${model} stream=${!!stream}`);
  } catch (error) {
    console.error('[PROXY] messages error:', error.message);
    res.status(500).json({ type: 'error', error: { type: 'api_error', message: 'Internal proxy error.' } });
  }
});

export default router;
