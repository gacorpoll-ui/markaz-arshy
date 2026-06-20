#!/usr/bin/env node
/**
 * Markaz Arshy — Production Reverse Proxy
 * 
 * Listens on port 80, routes to:
 *   /v1/*    → Backend:5000 (AI Proxy for Claude Code, Cline)
 *   /api/*   → Backend:5000
 *   /9router → 9router:20128 (admin dashboard)
 *   /*       → 9router:20128 (default — 9router serves frontend)
 * 
 * Cloudflare handles SSL (Flexible mode) → connects to this on port 80.
 */

import http from 'http';
import { URL } from 'url';

const PORT = 80;
const BACKEND = 'http://127.0.0.1:5000';
const NINE_ROUTER = 'http://127.0.0.1:20128';

// ═══════════════════════════════════════
// PROXY REQUEST
// ═══════════════════════════════════════
function proxyRequest(target, clientReq, clientRes) {
  const url = new URL(clientReq.url, target);
  
  const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname + url.search,
    method: clientReq.method,
    headers: {
      ...clientReq.headers,
      host: url.host,
      'x-forwarded-for': clientReq.socket.remoteAddress,
      'x-forwarded-proto': 'https',
    },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    // Forward status and headers
    clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(clientRes);
  });

  proxyReq.on('error', (err) => {
    console.error(`[PROXY] Error proxying to ${target}: ${err.message}`);
    if (!clientRes.headersSent) {
      clientRes.writeHead(502, { 'Content-Type': 'application/json' });
      clientRes.end(JSON.stringify({ error: 'Bad Gateway', message: err.message }));
    }
  });

  // Handle timeouts
  proxyReq.setTimeout(300000, () => {
    console.error(`[PROXY] Timeout proxying to ${target}`);
    proxyReq.destroy();
    if (!clientRes.headersSent) {
      clientRes.writeHead(504, { 'Content-Type': 'application/json' });
      clientRes.end(JSON.stringify({ error: 'Gateway Timeout' }));
    }
  });

  // Pipe request body
  clientReq.pipe(proxyReq);
  
  // Handle client disconnect
  clientReq.on('close', () => {
    proxyReq.destroy();
  });
}

// ═══════════════════════════════════════
// ROUTING
// ═══════════════════════════════════════
const server = http.createServer((req, res) => {
  const path = req.url.split('?')[0];
  const ts = new Date().toISOString().slice(11, 23);
  
  // CORS for all
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Route based on path prefix
  if (path.startsWith('/v1/') || path.startsWith('/api/')) {
    // → Backend (AI Proxy)
    console.log(`[${ts}] → BACKEND: ${req.method} ${path}`);
    proxyRequest(BACKEND, req, res);
  } else if (path.startsWith('/9router/')) {
    // → 9router (admin dashboard, strip prefix)
    const newPath = path.replace('/9router', '') || '/';
    req.url = newPath + (req.url.includes('?') ? '?' + req.url.split('?')[1] : '');
    console.log(`[${ts}] → 9ROUTER: ${req.method} ${req.url}`);
    proxyRequest(NINE_ROUTER, req, res);
  } else {
    // → 9router (default — serves its own frontend)
    console.log(`[${ts}] → 9ROUTER: ${req.method} ${path}`);
    proxyRequest(NINE_ROUTER, req, res);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║   Markaz Arshy — Production Reverse Proxy        ║
║   Port: ${PORT}                                     ║
║                                                  ║
║   Routes:                                        ║
║   /v1/*      → Backend (AI Proxy)    :5000       ║
║   /api/*     → Backend               :5000       ║
║   /9router/* → 9router Admin         :20128      ║
║   /*         → 9router Frontend      :20128      ║
╚══════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[PROXY] Shutting down...');
  server.close(() => process.exit(0));
});
process.on('SIGINT', () => {
  console.log('[PROXY] Interrupted');
  server.close(() => process.exit(0));
});
