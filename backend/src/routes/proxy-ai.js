import express from 'express';
import crypto from 'crypto';
import prisma from '../db.js';

const router = express.Router();

const NINE_ROUTER_URL = process.env.AI_ROUTER_URL || 'http://localhost:20128';
const NINE_ROUTER_EMAIL = 'admin';
const NINE_ROUTER_PASSWORD = 'Riri@150187';

// ═══════════════════════════════════════
// 9router Session
// ═══════════════════════════════════════
let _cookie = null;
let _expires = 0;

async function login9Router() {
  if (_cookie && Date.now() < _expires) return _cookie;
  const res = await fetch(`${NINE_ROUTER_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: NINE_ROUTER_EMAIL, password: NINE_ROUTER_PASSWORD }),
  });
  if (!res.ok) throw new Error(`9router login failed: ${res.status}`);
  const sc = res.headers.get('set-cookie');
  if (!sc) throw new Error('No cookie');
  _cookie = sc.split(';')[0];
  _expires = Date.now() + 23 * 60 * 60 * 1000;
  return _cookie;
}

// ═══════════════════════════════════════
// Resolve ma-* → sk-* (auto-create if missing)
// ═══════════════════════════════════════
async function resolveKey(apiKey) {
  if (!apiKey.startsWith('ma-')) return apiKey; // already sk-*

  const keyData = await prisma.aIApiKey.findUnique({ where: { apiKey } });
  if (!keyData || !keyData.isActive) return null;

  if (keyData.nineRouterKey) return keyData.nineRouterKey;

  // Auto-create on 9router
  try {
    const cookie = await login9Router();
    const r = await fetch(`${NINE_ROUTER_URL}/api/keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
      body: JSON.stringify({ name: `ma-${keyData.keyName || keyData.id}` }),
    });
    if (r.ok) {
      const d = await r.json();
      await prisma.aIApiKey.update({ where: { apiKey }, data: { nineRouterKey: d.key } });
      console.log(`[PROXY] Auto-created 9router key for ${apiKey.slice(0, 15)}...`);
      return d.key;
    }
  } catch (e) { console.error('[PROXY] Auto-create failed:', e.message); }
  return null;
}

// ═══════════════════════════════════════
// POST /chat/completions
// ═══════════════════════════════════════
router.post('/chat/completions', async (req, res) => {
  try {
    const apiKey = (req.headers['authorization'] || '').replace('Bearer ', '');
    if (!apiKey) return res.status(401).json({ error: { message: 'API key required', type: 'authentication_error' } });

    const routerKey = await resolveKey(apiKey);
    if (!routerKey) return res.status(401).json({ error: { message: 'Invalid or inactive API key', type: 'authentication_error' } });

    const response = await fetch(`${NINE_ROUTER_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${routerKey}` },
      body: JSON.stringify(req.body),
    });

    const ct = response.headers.get('content-type') || '';
    if (ct.includes('text/event-stream')) {
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
        for (const l of lines) res.write(l + '\n');
      }
      if (buf) res.write(buf);
      res.end();
    } else {
      const data = await response.json();
      res.status(response.status).json(data);
    }
    console.log(`[PROXY] chat: ${apiKey.slice(0, 15)}... model=${req.body.model}`);
  } catch (error) {
    console.error('[PROXY] chat error:', error.message);
    res.status(500).json({ error: { message: 'Proxy error: ' + error.message } });
  }
});

// ═══════════════════════════════════════
// GET /models
// ═══════════════════════════════════════
router.get('/models', async (req, res) => {
  try {
    const apiKey = (req.headers['x-api-key'] || req.headers['authorization'] || '').replace('Bearer ', '');
    const routerKey = await resolveKey(apiKey).catch(() => apiKey);
    const response = await fetch(`${NINE_ROUTER_URL}/v1/models`, {
      headers: { 'Authorization': `Bearer ${routerKey || ''}` },
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: { message: 'Proxy error' } });
  }
});

// ═══════════════════════════════════════
// POST /messages (Anthropic → OpenAI → 9router → Anthropic)
// ═══════════════════════════════════════
router.post('/messages', async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'] || (req.headers['authorization'] || '').replace('Bearer ', '');
    if (!apiKey) return res.status(401).json({ type: 'error', error: { type: 'authentication_error', message: 'API key required' } });

    const routerKey = await resolveKey(apiKey);
    if (!routerKey) return res.status(401).json({ type: 'error', error: { type: 'authentication_error', message: 'Invalid or inactive API key' } });

    const { model, messages, max_tokens, system, stream, temperature } = req.body;

    // Anthropic → OpenAI
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
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${routerKey}` },
      body: JSON.stringify(body),
    });

    const ct = response.headers.get('content-type') || '';

    // Streaming: OpenAI SSE → Anthropic SSE
    if (stream && ct.includes('text/event-stream')) {
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
      // Non-streaming: OpenAI → Anthropic
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

    console.log(`[PROXY] Anthropic→OpenAI: ${apiKey.slice(0, 15)}... model=${model} stream=${!!stream}`);
  } catch (error) {
    console.error('[PROXY] Messages error:', error.message);
    res.status(500).json({ type: 'error', error: { type: 'api_error', message: 'Proxy error: ' + error.message } });
  }
});

export default router;
