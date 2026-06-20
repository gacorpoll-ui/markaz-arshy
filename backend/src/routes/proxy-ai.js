import express from 'express';
import prisma from '../db.js';

const router = express.Router();

// ═══════════════════════════════════════
// 9router Config
// ═══════════════════════════════════════
const NINE_ROUTER_URL = process.env.AI_ROUTER_URL || 'http://localhost:20128';
const NINE_ROUTER_EMAIL = 'admin';
const NINE_ROUTER_PASSWORD = 'Riri@150187';

// ═══════════════════════════════════════
// 9router Session Management
// ═══════════════════════════════════════
let _sessionCookie = null;
let _sessionExpiresAt = 0;

async function login9Router() {
  if (_sessionCookie && Date.now() < _sessionExpiresAt) return _sessionCookie;
  try {
    const res = await fetch(`${NINE_ROUTER_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: NINE_ROUTER_EMAIL, password: NINE_ROUTER_PASSWORD }),
    });
    if (!res.ok) throw new Error(`Login failed: ${res.status}`);
    const setCookie = res.headers.get('set-cookie');
    if (!setCookie) throw new Error('No session cookie');
    _sessionCookie = setCookie.split(';')[0];
    _sessionExpiresAt = Date.now() + 23 * 60 * 60 * 1000;
    console.log('[9ROUTER] Session established');
    return _sessionCookie;
  } catch (err) {
    console.error('[9ROUTER] Login failed:', err.message);
    throw err;
  }
}

/**
 * POST /create-key
 * Creates an API key on 9router on behalf of a Markaz Arshy user.
 * 
 * Flow:
 *   1. User POST /create-key with ma-* key + name
 *   2. Markaz Arshy validates ma-* in DB
 *   3. Logs into 9router, creates sk-* key
 *   4. Saves sk-* → userId mapping in DB
 *   5. Returns sk-* key to user
 */
router.post('/create-key', async (req, res) => {
  try {
    const { name } = req.body;
    
    // 1. Extract & validate ma-* key
    let apiKey = req.headers['x-api-key'] || '';
    if (!apiKey) {
      const auth = req.headers['authorization'] || '';
      if (auth.startsWith('Bearer ')) apiKey = auth.slice(7);
    }
    if (!apiKey || !apiKey.startsWith('ma-')) {
      return res.status(401).json({ error: 'Valid ma-* API key required. Get one from markaz-arshy.com' });
    }

    const keyData = await prisma.aIApiKey.findUnique({ where: { apiKey } });
    if (!keyData) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    if (!keyData.isActive) {
      return res.status(403).json({ error: 'API key is inactive' });
    }

    // 2. Create key on 9router
    const keyName = name || `user-${keyData.userId}-${Date.now()}`;
    const result = await create9RouterKey(keyName);
    
    // 3. Save mapping in Markaz Arshy DB
    // Store the 9router sk-* key associated with this user
    const skKey = result.key;
    
    // Update the AIApiKey record to include the 9router key
    await prisma.aIApiKey.update({
      where: { apiKey },
      data: { keyName: `${keyData.keyName} → ${skKey.slice(0, 15)}...` },
    }).catch(() => {}); // Non-fatal

    console.log(`[AI PROXY] Created 9router key for user ${keyData.userId}: ${skKey.slice(0, 15)}...`);

    res.status(201).json({
      success: true,
      key: skKey,
      name: result.name,
      baseUrl: 'https://ai.markaz-arshy.com/v1',
      usage: `Set your API key to: ${skKey}\nSet your base URL to: https://ai.markaz-arshy.com/v1`,
    });
  } catch (error) {
    console.error('[AI PROXY] Create key error:', error.message);
    res.status(500).json({ error: 'Failed to create key: ' + error.message });
  }
});

/**
 * POST /v1/chat/completions — Pass-through to 9router
 * 
 * User sends sk-* key → proxy forwards to 9router
 * 9router validates the sk-* key natively (no conversion needed!)
 */
router.post('/chat/completions', async (req, res) => {
  try {
    const apiKey = (req.headers['authorization'] || '').replace('Bearer ', '');
    if (!apiKey) {
      return res.status(401).json({ error: { message: 'API key required', type: 'authentication_error' } });
    }

    // Look up the nineRouterKey from Markaz Arshy DB
    let routerKey = apiKey;
    if (apiKey.startsWith('ma-')) {
      const keyData = await prisma.aIApiKey.findUnique({ where: { apiKey } });
      if (!keyData || !keyData.isActive) {
        return res.status(401).json({ error: { message: 'Invalid or inactive API key', type: 'authentication_error' } });
      }
      if (!keyData.nineRouterKey) {
        return res.status(400).json({ error: { message: 'No 9router key found. Please recreate your API key.', type: 'setup_error' } });
      }
      routerKey = keyData.nineRouterKey;
    }

    // Forward to 9router with sk-* key
    const response = await fetch(`${NINE_ROUTER_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${routerKey}`,
      },
      body: JSON.stringify(req.body),
    });

    const contentType = response.headers.get('content-type') || '';

    // Stream SSE response
    if (contentType.includes('text/event-stream')) {
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
          buffer = lines.pop();
          for (const line of lines) res.write(line + '\n');
        }
        if (buffer) res.write(buffer);
      } catch (e) { console.error('[PROXY] Stream error:', e.message); }
      res.end();
    } else {
      const data = await response.json();
      res.status(response.status).json(data);
    }

    // Fire-and-forget: record usage
    const usageLog = `model=${req.body.model || 'code'} user=${apiKey.slice(0, 15)}`;
    console.log(`[PROXY] ${usageLog}`);
  } catch (error) {
    console.error('[PROXY] Chat error:', error.message);
    res.status(500).json({ error: { message: 'Proxy error: ' + error.message, type: 'server_error' } });
  }
});

/**
 * GET /v1/models — Forward to 9router
 */
router.get('/models', async (req, res) => {
  try {
    const apiKey = (req.headers['x-api-key'] || req.headers['authorization'] || '').replace('Bearer ', '');
    const response = await fetch(`${NINE_ROUTER_URL}/v1/models`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('[PROXY] Models error:', error.message);
    res.status(500).json({ error: { message: 'Proxy error' } });
  }
});

/**
 * POST /v1/messages — Anthropic Messages API (Claude Code)
 * Converts Anthropic → OpenAI format → 9router → converts back
 */
router.post('/messages', async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'] || (req.headers['authorization'] || '').replace('Bearer ', '');
    if (!apiKey) {
      return res.status(401).json({ type: 'error', error: { type: 'authentication_error', message: 'API key required' } });
    }

    // Look up nineRouterKey from DB
    let routerKey = apiKey;
    if (apiKey.startsWith('ma-')) {
      const keyData = await prisma.aIApiKey.findUnique({ where: { apiKey } });
      if (!keyData || !keyData.isActive) {
        return res.status(401).json({ type: 'error', error: { type: 'authentication_error', message: 'Invalid or inactive API key' } });
      }
      if (!keyData.nineRouterKey) {
        return res.status(400).json({ type: 'error', error: { type: 'setup_error', message: 'No 9router key found. Please recreate your API key.' } });
      }
      routerKey = keyData.nineRouterKey;
    }

    const { model, messages, max_tokens, system, stream, temperature } = req.body;

    // Convert Anthropic → OpenAI format
    const openaiMessages = [];
    if (system) {
      const sysText = typeof system === 'string' ? system
        : Array.isArray(system) ? system.map(s => s.text || '').join('\n') : String(system);
      openaiMessages.push({ role: 'system', content: sysText });
    }
    if (messages) {
      for (const msg of messages) {
        let content = msg.content;
        if (Array.isArray(content)) {
          content = content.filter(b => b.type === 'text').map(b => b.text).join('\n');
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

    // Forward to 9router with sk-* key
    const response = await fetch(`${NINE_ROUTER_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${routerKey}`,
      },
      body: JSON.stringify(openaiBody),
    });

    const contentType = response.headers.get('content-type') || '';

    // Streaming: OpenAI SSE → Anthropic SSE
    if (stream && contentType.includes('text/event-stream')) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.status(response.status);

      const msgId = `msg_${crypto.randomBytes(12).toString('hex')}`;
      res.write(`event: message_start\ndata: ${JSON.stringify({ type: 'message_start', message: { id: msgId, type: 'message', role: 'assistant', content: [], model: model || 'code', stop_reason: null, stop_sequence: null, usage: { input_tokens: 0, output_tokens: 0 } } })}\n\n`);
      res.write(`event: content_block_start\ndata: ${JSON.stringify({ type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } })}\n\n`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      try {
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
                res.write(`event: content_block_delta\ndata: ${JSON.stringify({ type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: delta.content } })}\n\n`);
              }
              if (chunk.choices?.[0]?.finish_reason) {
                const stopReason = chunk.choices[0].finish_reason === 'length' ? 'max_tokens' : 'end_turn';
                res.write(`event: content_block_stop\ndata: ${JSON.stringify({ type: 'content_block_stop', index: 0 })}\n\n`);
                res.write(`event: message_delta\ndata: ${JSON.stringify({ type: 'message_delta', delta: { stop_reason: stopReason, stop_sequence: null }, usage: { output_tokens: chunk.usage?.completion_tokens || 0 } })}\n\n`);
                res.write(`event: message_stop\ndata: ${JSON.stringify({ type: 'message_stop' })}\n\n`);
              }
            } catch {}
          }
        }
        if (buffer.startsWith('data: ')) {
          const data = buffer.slice(6).trim();
          if (data !== '[DONE]') {
            try {
              const chunk = JSON.parse(data);
              if (chunk.choices?.[0]?.delta?.content) {
                res.write(`event: content_block_delta\ndata: ${JSON.stringify({ type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: chunk.choices[0].delta.content } })}\n\n`);
              }
            } catch {}
          }
        }
      } catch (e) { console.error('[PROXY] Stream error:', e.message); }
      res.end();

    } else {
      // Non-streaming: convert OpenAI → Anthropic response
      const data = await response.json();
      if (data.error) {
        return res.status(response.status).json({ type: 'error', error: { type: 'api_error', message: data.error.message || 'Unknown error' } });
      }
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

// Need crypto for message IDs
import crypto from 'crypto';

export default router;
