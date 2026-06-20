import express from 'express';
import crypto from 'crypto';
import prisma from '../db.js';

const router = express.Router();

// 9router config — internal key for proxying
const NINE_ROUTER_KEY = process.env.AI_ROUTER_9KEY || 'sk-576a1c43755b51a6-bnts4h-1428de35';
const NINE_ROUTER_URL = process.env.AI_ROUTER_URL || 'http://localhost:20128';

// Model mapping: Claude Code valid IDs → 9router model names
const MODEL_MAP = {
  'claude-sonnet-4-20250514': 'Claude-sonnet-4.6',
  'claude-3-5-sonnet-20241022': 'Claude-sonnet-4.6',
  'claude-3-5-sonnet-latest': 'Claude-sonnet-4.6',
  'claude-3-5-haiku-20241022': 'Gemini-3.5-Flash-High',
  'claude-3-haiku-20240307': 'Gemini-3.5-Flash-High',
  'claude-opus-4-20250514': 'code',
  'claude-3-opus-20240229': 'code',
  'code': 'code',
  'Claude-sonnet-4.6': 'Claude-sonnet-4.6',
  'Gemini-3.5-Flash-High': 'Gemini-3.5-Flash-High',
};

function mapModel(model) {
  if (!model) return 'code';
  return MODEL_MAP[model] || model;
}

/**
 * AI Proxy Router
 * Mount at /v1 — accepts ma-* keys from Markaz Arshy users,
 * validates in DB, then forwards to 9router with sk-* key.
 *
 * Flow:
 *   Claude Code → api.markaz-arshy.com/v1 (ma-* key)
 *     → Backend validates ma-* key in DB
 *     → Forwards to localhost:20128 (sk-* key)
 *     → AI Provider
 */

/* ═══════════════════════════════════════
   POST /chat/completions — Main AI proxy
   ═══════════════════════════════════════ */
router.post('/chat/completions', async (req, res) => {
  try {
    // 1. Extract API key
    let apiKey = req.headers['authorization'] || '';
    if (apiKey.startsWith('Bearer ')) apiKey = apiKey.slice(7);

    if (!apiKey) {
      return res.status(401).json({
        error: { message: 'API key required', type: 'authentication_error' },
      });
    }

    // 2. Validate ma-* key in our database
    const keyData = await prisma.aIApiKey.findUnique({
      where: { apiKey },
      include: { model: true },
    });

    if (!keyData) {
      return res.status(401).json({
        error: { message: 'Invalid API key', type: 'authentication_error' },
      });
    }
    if (!keyData.isActive) {
      return res.status(403).json({
        error: { message: 'API key is inactive', type: 'authentication_error' },
      });
    }
    if (keyData.creditsBalance <= 0) {
      return res.status(402).json({
        error: { message: 'Insufficient credits', type: 'billing_error' },
      });
    }

    // 3. Forward to 9router with internal sk-* key
    const targetUrl = `${NINE_ROUTER_URL}/v1/chat/completions`;
    console.log(`[AI PROXY] ${apiKey.slice(0, 10)}... → ${targetUrl}`);

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NINE_ROUTER_KEY}`,
      },
      body: JSON.stringify(req.body),
    });

    // 4. Handle response (SSE streaming or JSON)
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('text/event-stream')) {
      // Stream SSE response back to client
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.status(response.status);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop(); // keep incomplete line
          for (const line of lines) {
            res.write(line + '\n');
          }
        }
        if (buffer) res.write(buffer);
      } catch (streamErr) {
        console.error('[AI PROXY] Stream error:', streamErr.message);
      }

      res.end();
    } else {
      // Non-streaming JSON response
      const data = await response.json();
      res.status(response.status).json(data);
    }

    // 5. Record usage (fire-and-forget)
    if (response.ok) {
      const msgs = req.body.messages || [];
      const inputTokens = msgs.reduce((sum, m) => {
        const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content || '');
        return sum + Math.ceil(content.length / 4);
      }, 0);

      prisma.aIUsage.create({
        data: {
          userId: keyData.userId,
          apiKeyId: keyData.id,
          modelId: keyData.modelId,
          inputTokens,
          outputTokens: 0,
          totalTokens: inputTokens,
          totalCost: 0,
        },
      }).catch(err => console.error('[AI PROXY] Usage record failed:', err.message));
    }
  } catch (error) {
    console.error('[AI PROXY] Error:', error.message);
    res.status(500).json({
      error: { message: 'Proxy error: ' + error.message, type: 'server_error' },
    });
  }
});

/* ═══════════════════════════════════════
   GET /models — List available models
   ═══════════════════════════════════════ */
router.get('/models', async (req, res) => {
  try {
    let apiKey = req.headers['authorization'] || '';
    if (apiKey.startsWith('Bearer ')) apiKey = apiKey.slice(7);

    if (!apiKey) {
      return res.status(401).json({
        error: { message: 'API key required', type: 'authentication_error' },
      });
    }

    const keyData = await prisma.aIApiKey.findUnique({ where: { apiKey } });
    if (!keyData) {
      return res.status(401).json({
        error: { message: 'Invalid API key', type: 'authentication_error' },
      });
    }

    // Forward to 9router
    const response = await fetch(`${NINE_ROUTER_URL}/v1/models`, {
      headers: {
        'Authorization': `Bearer ${NINE_ROUTER_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('[AI PROXY] Models error:', error.message);
    res.status(500).json({ error: { message: 'Proxy error' } });
  }
});

/* ═══════════════════════════════════════════════════════════════
   POST /messages — Anthropic Messages API (used by Claude Code)
   Converts Anthropic format → OpenAI format → 9router → Anthropic format
   ═══════════════════════════════════════════════════════════════ */
router.post('/messages', async (req, res) => {
  try {
    // 1. Extract API key (Anthropic uses x-api-key header OR Authorization: Bearer)
    let apiKey = req.headers['x-api-key'] || '';
    if (!apiKey) {
      const auth = req.headers['authorization'] || '';
      if (auth.startsWith('Bearer ')) apiKey = auth.slice(7);
    }

    if (!apiKey) {
      return res.status(401).json({
        type: 'error',
        error: { type: 'authentication_error', message: 'API key required' },
      });
    }

    // 2. Validate ma-* key
    const keyData = await prisma.aIApiKey.findUnique({
      where: { apiKey },
      include: { model: true },
    });

    if (!keyData) {
      return res.status(401).json({
        type: 'error',
        error: { type: 'authentication_error', message: 'Invalid API key' },
      });
    }
    if (!keyData.isActive) {
      return res.status(403).json({
        type: 'error',
        error: { type: 'authentication_error', message: 'API key is inactive' },
      });
    }
    if (keyData.creditsBalance <= 0) {
      return res.status(402).json({
        type: 'error',
        error: { type: 'billing_error', message: 'Insufficient credits' },
      });
    }

    // 3. Convert Anthropic Messages format → OpenAI Chat Completions format
    const { model, messages, max_tokens, system, stream, temperature } = req.body;

    // Build OpenAI messages array (prepend system if present)
    const openaiMessages = [];
    if (system) {
      const sysText = typeof system === 'string'
        ? system
        : Array.isArray(system) ? system.map(s => s.text || '').join('\n') : String(system);
      openaiMessages.push({ role: 'system', content: sysText });
    }
    if (messages) {
      for (const msg of messages) {
        // Anthropic allows content as array of blocks, OpenAI wants string or array
        let content = msg.content;
        if (Array.isArray(content)) {
          // Extract text from content blocks
          content = content
            .filter(b => b.type === 'text')
            .map(b => b.text)
            .join('\n');
        }
        openaiMessages.push({ role: msg.role, content });
      }
    }

    const openaiBody = {
      model: model || 'code',
      messages: openaiMessages,
      max_tokens: max_tokens || 4096,
      stream: !!stream,
    };
    if (temperature !== undefined) openaiBody.temperature = temperature;

    // 4. Forward to 9router
    const targetUrl = `${NINE_ROUTER_URL}/v1/chat/completions`;
    console.log(`[AI PROXY] Anthropic→OpenAI: ${apiKey.slice(0, 10)}... model=${model} stream=${!!stream}`);

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NINE_ROUTER_KEY}`,
      },
      body: JSON.stringify(openaiBody),
    });

    const contentType = response.headers.get('content-type') || '';

    // 5. Handle streaming: convert OpenAI SSE → Anthropic SSE
    if (stream && contentType.includes('text/event-stream')) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.status(response.status);

      const msgId = `msg_${crypto.randomBytes(12).toString('hex')}`;
      let sentStart = false;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        // Send message_start event first
        const startEvent = JSON.stringify({
          type: 'message_start',
          message: {
            id: msgId,
            type: 'message',
            role: 'assistant',
            content: [],
            model: model || 'code',
            stop_reason: null,
            stop_sequence: null,
            usage: { input_tokens: 0, output_tokens: 0 },
          },
        });
        res.write(`event: message_start\ndata: ${startEvent}\n\n`);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop();

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;

            try {
              const chunk = JSON.parse(data);
              const delta = chunk.choices?.[0]?.delta;
              if (delta?.content) {
                // Send content_block_delta
                const blockDelta = JSON.stringify({
                  type: 'content_block_delta',
                  index: 0,
                  delta: { type: 'text_delta', text: delta.content },
                });
                res.write(`event: content_block_delta\ndata: ${blockDelta}\n\n`);
              }
              if (chunk.choices?.[0]?.finish_reason) {
                // Send message_delta with stop_reason
                const stopReason = chunk.choices[0].finish_reason === 'length' ? 'max_tokens' : 'end_turn';
                const msgDelta = JSON.stringify({
                  type: 'message_delta',
                  delta: { stop_reason: stopReason, stop_sequence: null },
                  usage: { output_tokens: chunk.usage?.completion_tokens || 0 },
                });
                res.write(`event: message_delta\ndata: ${msgDelta}\n\n`);
                res.write(`event: message_stop\ndata: ${JSON.stringify({ type: 'message_stop' })}\n\n`);
              }
            } catch {}
          }
        }
        // Handle remaining buffer
        if (buffer.startsWith('data: ')) {
          const data = buffer.slice(6).trim();
          if (data !== '[DONE]') {
            try {
              const chunk = JSON.parse(data);
              const delta = chunk.choices?.[0]?.delta;
              if (delta?.content) {
                const blockDelta = JSON.stringify({
                  type: 'content_block_delta',
                  index: 0,
                  delta: { type: 'text_delta', text: delta.content },
                });
                res.write(`event: content_block_delta\ndata: ${blockDelta}\n\n`);
              }
            } catch {}
          }
        }
      } catch (streamErr) {
        console.error('[AI PROXY] Anthropic stream error:', streamErr.message);
      }

      res.end();
    } else {
      // 6. Non-streaming: convert OpenAI response → Anthropic response
      const data = await response.json();

      if (data.error) {
        return res.status(response.status).json({
          type: 'error',
          error: { type: 'api_error', message: data.error.message || 'Unknown error' },
        });
      }

      const msgId = `msg_${crypto.randomBytes(12).toString('hex')}`;
      const content = data.choices?.[0]?.message?.content || '';

      const anthropicResponse = {
        id: msgId,
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: content }],
        model: model || 'code',
        stop_reason: data.choices?.[0]?.finish_reason === 'length' ? 'max_tokens' : 'end_turn',
        stop_sequence: null,
        usage: {
          input_tokens: data.usage?.prompt_tokens || 0,
          output_tokens: data.usage?.completion_tokens || 0,
        },
      };

      res.status(200).json(anthropicResponse);
    }

    // 7. Record usage
    if (response.ok) {
      prisma.aIUsage.create({
        data: {
          userId: keyData.userId,
          apiKeyId: keyData.id,
          modelId: keyData.modelId,
          inputTokens: req.body.messages?.length || 0,
          outputTokens: 0,
          totalTokens: req.body.messages?.length || 0,
          totalCost: 0,
        },
      }).catch(err => console.error('[AI PROXY] Usage record failed:', err.message));
    }
  } catch (error) {
    console.error('[AI PROXY] Messages error:', error.message);
    res.status(500).json({
      type: 'error',
      error: { type: 'api_error', message: 'Proxy error: ' + error.message },
    });
  }
});

export default router;
