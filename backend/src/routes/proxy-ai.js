import express from 'express';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';

const router = express.Router();

const NINE_ROUTER_URL = process.env.AI_ROUTER_URL || 'http://localhost:20128';

// Rate limiting for AI proxy
const proxyLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute per IP
  message: { error: 'Terlalu banyak request. Silakan tunggu sebentar.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Mask API key for logging (never log full keys)
function maskKey(key) {
  if (!key || key.length < 8) return '***';
  return key.slice(0, 4) + '...' + key.slice(-4);
}

// ═══════════════════════════════════════
// POST /chat/completions
// ═══════════════════════════════════════
router.post('/chat/completions', proxyLimiter, async (req, res) => {
  try {
    const apiKey = (req.headers['authorization'] || '').replace('Bearer ', '');
    if (!apiKey) return res.status(401).json({ error: { message: 'API key required', type: 'authentication_error' } });

    const response = await fetch(`${NINE_ROUTER_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify(req.body),
    });

    const ct = response.headers.get('content-type') || '';
    if (ct.includes('text/event-stream')) {
      // Streaming: pipe directly to client — webhook handles usage recording
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.status(response.status);
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
        }
      }
      if (buf) res.write(buf);
      res.end();
    } else {
      // Non-streaming: pipe response — webhook handles usage recording
      const data = await response.json();
      res.status(response.status).json(data);
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
// POST /messages — Anthropic Messages API (Claude Code)
// ═══════════════════════════════════════
router.post('/messages', proxyLimiter, async (req, res) => {
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
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify(body),
    });

    const ct = response.headers.get('content-type') || '';

    if (stream && ct.includes('text/event-stream')) {
      // Streaming: pipe SSE events to client, converting to Anthropic format
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
                res.write(`event: content_block_delta\ndata: ${JSON.stringify({ type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: delta.content } })}\n\n`);
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
      } catch (e) { console.error('[PROXY] Stream error:', e.message); }
      res.end();

    } else {
      // Non-streaming: pipe response, converting to Anthropic format
      const data = await response.json();
      if (data.error) return res.status(response.status).json({ type: 'error', error: { type: 'api_error', message: data.error.message || 'Unknown error' } });

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
