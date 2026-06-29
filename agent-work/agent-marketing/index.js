#!/usr/bin/env node

/**
 * AI Agent Workers — CLI Router
 * Usage: node agent-work/agent-marketing/index.js --task=<agent-type> [options]
 *
 * Agents: seo, email, social_media, whatsapp, competitor, dynamic_pricing,
 *         analytics, reseller, retention, upsell, content_writer, review_request
 */

import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

// Load .env from backend/ without requiring dotenv package
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../../backend/.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    // Remove surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

import prisma from '../../backend/src/db.js';

// Available agent runners (lazy-loaded)
const RUNNERS = {
  'seo':            () => import('./runners/seo-content.js'),
  'email':          () => import('./runners/email-campaign.js'),
  'social_media':   () => import('./runners/social-media.js'),
  'whatsapp':       () => import('./runners/whatsapp-broadcast.js'),
  'competitor':     () => import('./runners/competitor-intel.js'),
  'dynamic_pricing':() => import('./runners/dynamic-pricing.js'),
  'analytics':      () => import('./runners/analytics.js'),
  'reseller':       () => import('./runners/reseller-recruitment.js'),
  'retention':      () => import('./runners/customer-retention.js'),
  'upsell':         () => import('./runners/upsell.js'),
  'content_writer': () => import('./runners/content-writer.js'),
  'review_request': () => import('./runners/review-request.js'),
  'video_ads':      () => import('./runners/video-ads.js'),
};

// Parse CLI args
function parseArgs() {
  const args = {};
  process.argv.slice(2).forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.split('=');
      args[key.replace('--', '')] = value || true;
    }
  });
  return args;
}

async function main() {
  const args = parseArgs();
  const task = args.task;

  console.log('═══════════════════════════════════════════════════');
  console.log('  🤖 Markaz-Arshy AI Agent Workers');
  console.log('═══════════════════════════════════════════════════');

  if (!task || task === 'help') {
    console.log('\nAvailable agents:');
    Object.keys(RUNNERS).forEach(key => {
      console.log(`  --task=${key}`);
    });
    console.log('\nOptions:');
    console.log('  --topic="smm-panel-murah"     (for seo)');
    console.log('  --segment=inactive            (for email, whatsapp, retention)');
    console.log('  --template=promo              (for email)');
    console.log('  --limit=20                    (for email)');
    console.log('  --contentType=promo           (for social_media)');
    console.log('  --period=daily                (for analytics)');
    console.log('  --platforms=instagram          (for social_media)');
    console.log('\nExamples:');
    console.log('  node src/agents/index.js --task=seo --topic="cara-menambah-followers"');
    console.log('  node src/agents/index.js --task=email --segment=inactive --limit=10');
    console.log('  node src/agents/index.js --task=analytics --period=daily');
    console.log('  node src/agents/index.js --task=social_media --contentType=promo');
    await prisma.$disconnect();
    return;
  }

  if (!RUNNERS[task]) {
    console.error(`\n❌ Unknown agent: "${task}"`);
    console.error(`Available: ${Object.keys(RUNNERS).join(', ')}`);
    await prisma.$disconnect();
    process.exit(1);
  }

  // Build options from CLI args (exclude --task)
  const options = { triggeredBy: 'cli' };
  Object.entries(args).forEach(([key, value]) => {
    if (key !== 'task' && value !== true) {
      try { options[key] = JSON.parse(value); } catch { options[key] = value; }
    }
  });

  console.log(`\n▶ Running agent: ${task}`);
  console.log(`  Options: ${JSON.stringify(options)}\n`);

  const startTime = Date.now();

  try {
    const mod = await RUNNERS[task]();
    const runFn = mod.default || mod.runAgent || mod.run;
    const result = await runFn(options);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`\n✅ Agent "${task}" completed in ${elapsed}s`);
    if (result) console.log(`  Result: ${JSON.stringify(result, null, 2)}`);
  } catch (error) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error(`\n❌ Agent "${task}" failed after ${elapsed}s: ${error.message}`);
  }

  await prisma.$disconnect();
  console.log('\n═══════════════════════════════════════════════════');
}

main().catch(async (e) => {
  console.error('Fatal error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
