#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════════════════════
 *  🏢 Markaz-Arshy Agent Workers — Main Router
 * ═══════════════════════════════════════════════════════════
 *
 *  Agent Teams:
 *    agent-marketing    — 12 marketing agents (SEO, email, social, etc.)
 *    agent-developer    — (coming soon) website maintenance, code review, etc.
 *    agent-cs           — (coming soon) customer service automation
 *    agent-finance      — (coming soon) financial reporting, invoicing
 *    agent-operations   — (coming soon) logistics, inventory, fulfillment
 *
 *  Usage:
 *    node agent-work/index.js --team=marketing --task=seo --topic="smm-panel"
 *    node agent-work/index.js --team=marketing          (interactive menu)
 *    node agent-work/index.js                           (list all teams)
 */

const TEAMS = {
  marketing: {
    name: 'Marketing Division',
    description: 'SEO, social media, email campaigns, content, pricing, analytics',
    entry: () => import('./agent-marketing/index.js'),
    agents: ['seo', 'email', 'social_media', 'whatsapp', 'competitor', 'dynamic_pricing', 'analytics', 'reseller', 'retention', 'upsell', 'content_writer', 'review_request'],
  },
  developer: {
    name: 'Developer Division',
    description: 'Website maintenance, code review, bug fixes, deployments',
    entry: null, // Coming soon
    agents: [],
  },
  cs: {
    name: 'Customer Service Division',
    description: 'Chat support, ticket management, FAQ automation',
    entry: null,
    agents: [],
  },
  finance: {
    name: 'Finance Division',
    description: 'Revenue reports, invoicing, reconciliation, fraud detection',
    entry: null,
    agents: [],
  },
  operations: {
    name: 'Operations Division',
    description: 'Logistics, inventory, supplier management, fulfillment',
    entry: null,
    agents: [],
  },
};

// Parse CLI args
const args = {};
process.argv.slice(2).forEach(arg => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.split('=');
    args[key.replace('--', '')] = value || true;
  }
});

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  🏢 Markaz-Arshy — AI Agent Workers                     ║');
  console.log('║  Building toward Rp 1 Miliar Revenue                    ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');

  // No team specified — show overview
  if (!args.team) {
    console.log('Agent Divisions:');
    console.log('');
    for (const [key, team] of Object.entries(TEAMS)) {
      const status = team.entry ? '🟢 Active' : '⬜ Coming Soon';
      console.log(`  ${key.padEnd(15)} ${team.name} — ${status}`);
      console.log(`  ${''.padEnd(15)} ${team.description}`);
      if (team.agents.length > 0) {
        console.log(`  ${''.padEnd(15)} Agents: ${team.agents.join(', ')}`);
      }
      console.log('');
    }
    console.log('Usage:');
    console.log('  node agent-work/index.js --team=marketing --task=seo --topic="smm-panel"');
    console.log('  node agent-work/index.js --team=marketing --task=help');
    console.log('');
    return;
  }

  const team = TEAMS[args.team];
  if (!team) {
    console.error(`❌ Unknown team: "${args.team}"`);
    console.error(`Available: ${Object.keys(TEAMS).join(', ')}`);
    process.exit(1);
  }

  if (!team.entry) {
    console.error(`⬜ "${team.name}" is not yet implemented.`);
    console.error('   Coming soon! Focus on marketing agents first.');
    return;
  }

  // Delegate to team-specific runner
  console.log(`🚀 Initializing ${team.name}...`);
  console.log('');

  try {
    const mod = await team.entry();
    // The team entry point should handle its own CLI args
    // Pass through remaining args
    const runFn = mod.default || mod.main || mod;
    if (typeof runFn === 'function') {
      await runFn(args);
    }
  } catch (error) {
    console.error(`❌ Team "${args.team}" failed:`, error.message);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
