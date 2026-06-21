#!/usr/bin/env node
/**
 * 9router Full Proxy — Markaz Arshy
 * 
 * Proxies ALL 9router endpoints through Markaz Arshy backend.
 * User only sees api.markaz-arshy.com — never knows about 9router.
 * 
 * Flow:
 *   User (ma-* key) → api.markaz-arshy.com/* 
 *     → Validate ma-* key in DB
 *     → Forward to 9router (localhost:20128) with sk-* key
 *     → Response back to user
 */

import http from 'http';

const PORT = process.env.PROXY_PORT || 3099;
const NINE_ROUTER_URL = process.env.NINE_ROUTER_URL || 'http://localhost:20128';
const NINE_ROUTER_KEY = process.env.AI_ROUTER_9KEY;

// ═══════════════════════════════════════
// MODEL MAPPING: Claude Code valid IDs → 9router model names
// ═══════════════════════════════════════
const MODEL_MAP = {
  'claude-sonnet-4-6-20260514': 'Claude-sonnet-4.6',
  'claude-sonnet-4-20250514': 'Claude-sonnet-4.6',
  'claude-3-5-sonnet-20241022': 'Claude-sonnet-4.6',
  'claude-3-5-sonnet-latest': 'Claude-sonnet-4.6',
  'claude-3-5-haiku-20241022': 'Gemini-3.5-Flash-High',
  'claude-3-haiku-20240307': 'Gemini-3.5-Flash-High',
  'claude-opus-4-20250514': 'code',
  'claude-3-opus-20240229': 'code',
  'code': 'code',
  'claude-code': 'code',
  'Claude-sonnet-4.6': 'Claude-sonnet-4.6',
  'Gemini-3.5-Flash-High': 'Gemini-3.5-Flash-High',
};

function mapModel(model) {
  if (!model) return 'code';
  return MODEL_MAP[model] || model;
}

// ═══════════════════════════════════════
// KEY VALIDATION: Validate ma-* key against Markaz Arshy DB
// ═══════════════════════════════════════
async function validateMarkazKey(apiKey) {
  if (!apiKey || !apiKey.startsWith('ma-')) return false;
  
  try {
    const response = await fetch('http://localhost:5000/api/ai-router/validate-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey }),
      signal: AbortSignal.timeout(5000),
    });
    
    if (response.ok) {
      const result = await response.json();
      return result.valid === true;
    }
  } catch (err) {
    console.error('[PROXY] Key validation error:', err.message);
  }
  return false;
}

// ═══════════════════════════════════════
// EXTRACT API KEY from various header formats
// ═══════════════════════════════════════
function extractApiKey(headers) {
  // Bearer token
  const auth = headers['authorization'] || headers['Authorization'];
  if (auth && auth.startsWith('Bearer ')) return auth.slice(7);
  
  // x-api-key header (Anthropic format)
  const xApiKey = headers['x-api-key'] || headers['X-Api-Key'];
  if (xApiKey) return xApiKey;
  
  return null;
}

// ═══════════════════════════════════════
// FAKE MODELS LIST for Claude Code validation
// ═══════════════════════════════════════
function getFakeModels() {
  return {
    object: 'list',
    data: Object.keys(MODEL_MAP)
      .filter(m => m.startsWith('claude-') || m === 'code')
      .map(id => ({
        id,
        object: 'model',
        created: Date.now(),
        owned_by: 'anthropic',
      })),
  };
}

// ═══════════════════════════════════════
// ANTHROPIC ↔ OPENAI FORMAT CONVERSION
// ═══════════════════════════════════════
function extractSystemText(system) {
  if (!system) return null;
  if (typeof system === 'string') return system;
  if (Array.isArray(system)) {
    return system.map(b => b.text || (typeof b === 'string' ? b : '')).filter(Boolean).join('\n');
  }
  return String(system);
}

function extractMessageContent(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content.filter(b => b.type === 'text').map(b => b.text).join('\n');
  }
  return String(content || '');
}

function genId(prefix = 'msg') {
  const chars = 'abcdef0123456789';
  let id = '';
  for (let i = 0; i < 24; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}_${id}`;
}

// ═══════════════════════════════════════
// REQUEST HANDLER
// ═══════════════════════════════════════
async function handleRequest(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  
  // Health check
  if (req.method === 'GET' && url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', proxy: 'markaz-9router-proxy', router: NINE_ROUTER_URL }));
    return;
  }

  // ═══════════════════════════════════════
  // FAKE /v1/models for Claude Code validation
  // ═══════════════════════════════════════
  if (req.method === 'GET' && url.pathname === '/v1/models') {
    const apiKey = extractApiKey(req.headers);
    if (!apiKey || !apiKey.startsWith('ma-')) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: { message: 'Invalid API key', type: 'auth_error' } }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(getFakeModels()));
    return;
  }

  // ═══════════════════════════════════════
  // ANTHROPIC /v1/messages → Convert → 9router
  // ═══════════════════════════════════════
  if (req.method === 'POST' && url.pathname === '/v1/messages') {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const bodyStr = Buffer.concat(chunks).toString();
    
    let body;
    try { body = JSON.parse(bodyStr); } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ type: 'error', error: { type: 'invalid_request_error', message: 'Invalid JSON' } }));
      return;
    }

    const apiKey = extractApiKey(req.headers);
    const valid = await validateMarkazKey(apiKey);
    if (!valid) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ type: 'error', error: { type: 'auth_error', message: 'Invalid API key' } }));
      return;
    }

    // Convert Anthropic → OpenAI format
    const openaiMessages = [];
    const sysText = extractSystemText(body.system);
    if (sysText) openaiMessages.push({ role: 'system', content: sysText });
    if (body.messages) {
      for (const msg of body.messages) {
        openaiMessages.push({ role: msg.role, content: extractMessageContent(msg.content) });
      }
    }

    const openaiBody = {
      model: mapModel(body.model),
      messages: openaiMessages,
      max_tokens: body.max_tokens || 4096,
      stream: !!body.stream,
    };
    if (body.temperature !== undefined) openaiBody.temperature = body.temperature;

    // Forward to 9router
    const targetUrl = `${NINE_ROUTER_URL}/v1/chat/completions`;
    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${NINE_ROUTER_KEY}` },
        body: JSON.stringify(openaiBody),
      });

      const contentType = response.headers.get('content-type') || '';

      // Streaming conversion: OpenAI SSE → Anthropic SSE
      if (body.stream && contentType.includes('text/event-stream')) {
        res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' });

        const msgId = genId('msg');
        let blockIndex = 0;

        res.write(`event: message_start\ndata: ${JSON.stringify({ type: 'message_start', message: { id: msgId, type: 'message', role: 'assistant', content: [], model: body.model || 'code', stop_reason: null, stop_sequence: null, usage: { input_tokens: 0, output_tokens: 0 } } })}\n\n`);
        res.write(`event: content_block_start\ndata: ${JSON.stringify({ type: 'content_block_start', index: blockIndex, content_block: { type: 'text', text: '' } })}\n\n`);

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
                  res.write(`event: content_block_delta\ndata: ${JSON.stringify({ type: 'content_block_delta', index: blockIndex, delta: { type: 'text_delta', text: delta.content } })}\n\n`);
                }
                if (chunk.choices?.[0]?.finish_reason) {
                  res.write(`event: content_block_stop\ndata: ${JSON.stringify({ type: 'content_block_stop', index: blockIndex })}\n\n`);
                  const stopReason = chunk.choices[0].finish_reason === 'length' ? 'max_tokens' : 'end_turn';
                  res.write(`event: message_delta\ndata: ${JSON.stringify({ type: 'message_delta', delta: { stop_reason: stopReason, stop_sequence: null }, usage: { output_tokens: chunk.usage?.completion_tokens || 0 } })}\n\n`);
                  res.write(`event: message_stop\ndata: ${JSON.stringify({ type: 'message_stop' })}\n\n`);
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
          res.writeHead(response.status, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ type: 'error', error: { type: 'api_error', message: data.error.message || 'Unknown error' } }));
          return;
        }
        const content = data.choices?.[0]?.message?.content || '';
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          id: genId('msg'), type: 'message', role: 'assistant',
          content: [{ type: 'text', text: content }],
          model: body.model || 'code',
          stop_reason: data.choices?.[0]?.finish_reason === 'length' ? 'max_tokens' : 'end_turn',
          stop_sequence: null,
          usage: { input_tokens: data.usage?.prompt_tokens || 0, output_tokens: data.usage?.completion_tokens || 0 },
        }));
      }
    } catch (error) {
      console.error('[PROXY] Error:', error.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ type: 'error', error: { type: 'api_error', message: 'Proxy error: ' + error.message } }));
    }
    return;
  }

  // ═══════════════════════════════════════
  // ALL OTHER /v1/* endpoints → Proxy to 9router (OpenAI format)
  // ═══════════════════════════════════════
  if (url.pathname.startsWith('/v1/')) {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const bodyStr = chunks.length > 0 ? Buffer.concat(chunks).toString() : null;

    const apiKey = extractApiKey(req.headers);
    
    // Validate ma-* keys, allow sk-* pass-through
    if (apiKey && apiKey.startsWith('ma-')) {
      const valid = await validateMarkazKey(apiKey);
      if (!valid) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: { message: 'Invalid API key', type: 'auth_error' } }));
        return;
      }
    }

    // Forward to 9router
    const targetUrl = `${NINE_ROUTER_URL}${url.pathname}${url.search}`;
    const fwdHeaders = { 'Content-Type': req.headers['content-type'] || 'application/json', 'Authorization': `Bearer ${NINE_ROUTER_KEY}` };

    try {
      const fetchOptions = { method: req.method, headers: fwdHeaders };
      if (bodyStr) fetchOptions.body = bodyStr;
      
      const response = await fetch(targetUrl, fetchOptions);
      const resContentType = response.headers.get('content-type') || 'application/json';

      // Stream response if it's SSE
      if (resContentType.includes('text/event-stream')) {
        res.writeHead(response.status, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' });
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(decoder.decode(value, { stream: true }));
        }
        res.end();
      } else {
        const resBody = await response.text();
        res.writeHead(response.status, { 'Content-Type': resContentType });
        res.end(resBody);
      }
    } catch (error) {
      console.error('[PROXY] Forward error:', error.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: { message: 'Proxy error: ' + error.message } }));
    }
    return;
  }

  // 404 for unknown paths
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: { message: `Not found: ${req.method} ${url.pathname}` } }));
}

// ═══════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════
const server = http.createServer(handleRequest);
server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║   Markaz Arshy → 9router Full Proxy          ║
║   Port: ${PORT}                                 ║
║   Router: ${NINE_ROUTER_URL}                   ║
║   Key: ${NINE_ROUTER_KEY.slice(0, 10)}...        ║
║                                              ║
║   Endpoints proxied:                         ║
║   POST /v1/messages    (Anthropic format)    ║
║   POST /v1/chat/*      (OpenAI format)       ║
║   GET  /v1/models      (fake Anthropic list) ║
║   ALL  /v1/*           (pass-through)        ║
╚══════════════════════════════════════════════╝
  `);
});
