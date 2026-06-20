#!/usr/bin/env node
/**
 * Markaz Arshy — Production Reverse Proxy
 * Routes: /v1/* → Backend:5000, /api/* → Backend:5000, /* → 9router:20128
 */

import http from 'http';
import { URL } from 'url';

const PORT = 80;
const BACKEND = { host: '127.0.0.1', port: 5000 };
const NINE_ROUTER = { host: '127.0.0.1', port: 20128 };

function proxyTo(target, clientReq, clientRes) {
  const parsedUrl = new URL(clientReq.url, `http://${target.host}:${target.port}`);

  const options = {
    hostname: target.host,
    port: target.port,
    path: parsedUrl.pathname + parsedUrl.search,
    method: clientReq.method,
    headers: {
      ...clientReq.headers,
      host: parsedUrl.host,
      'x-forwarded-for': clientReq.socket.remoteAddress,
      'x-forwarded-proto': 'https',
    },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(clientRes, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.error(`[PROXY] Error → ${target.host}:${target.port}: ${err.message}`);
    if (!clientRes.headersSent) {
      clientRes.writeHead(502, { 'Content-Type': 'application/json' });
    }
    clientRes.end(JSON.stringify({ error: 'Bad Gateway' }));
  });

  proxyReq.setTimeout(300000, () => {
    proxyReq.destroy();
    if (!clientRes.headersSent) {
      clientRes.writeHead(504, { 'Content-Type': 'application/json' });
    }
    clientRes.end(JSON.stringify({ error: 'Gateway Timeout' }));
  });

  // Pipe request body (works for both with and without body)
  if (clientReq.method === 'GET' || clientReq.method === 'HEAD' || clientReq.method === 'OPTIONS') {
    proxyReq.end();
  } else {
    clientReq.pipe(proxyReq, { end: true });
  }

  clientReq.on('close', () => {
    if (!proxyReq.destroyed) proxyReq.destroy();
  });
}

const server = http.createServer((req, res) => {
  const path = req.url.split('?')[0];

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (path.startsWith('/v1/') || path.startsWith('/api/')) {
    console.log(`→ BACKEND: ${req.method} ${path}`);
    proxyTo(BACKEND, req, res);
  } else if (path.startsWith('/9router/')) {
    const newPath = path.replace('/9router', '') || '/';
    req.url = newPath + (req.url.includes('?') ? '?' + req.url.split('?')[1] : '');
    console.log(`→ 9ROUTER: ${req.method} ${req.url}`);
    proxyTo(NINE_ROUTER, req, res);
  } else {
    console.log(`→ 9ROUTER: ${req.method} ${path}`);
    proxyTo(NINE_ROUTER, req, res);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Markaz Arshy Proxy → Port ${PORT}`);
  console.log(`   /v1/* & /api/* → Backend:5000`);
  console.log(`   /*             → 9router:20128\n`);
});

process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT', () => server.close(() => process.exit(0)));
