import prisma from '../../backend/src/db.js';
import { getRunner } from '../shared/runner-registry.js';

// Active interval handles
const activeIntervals = {};

/**
 * Calculate milliseconds until the next cron match.
 * Simplified cron parser - handles: minute hour dayOfMonth month dayOfWeek
 * Supports: *, star/N, number
 */
function msUntilNextRun(cronExpression) {
  const parts = cronExpression.trim().split(/\s+/);
  if (parts.length !== 5) return null;

  const [minExpr, hourExpr, domExpr, monExpr, dowExpr] = parts;
  const now = new Date();

  // Search forward up to 32 days (covers all month/day combos)
  for (let offset = 0; offset < 32 * 24 * 60; offset++) {
    const candidate = new Date(now.getTime() + offset * 60000);
    candidate.setSeconds(0, 0);

    if (matchCronField(minExpr, candidate.getMinutes()) &&
        matchCronField(hourExpr, candidate.getHours()) &&
        matchCronField(domExpr, candidate.getDate()) &&
        matchCronField(monExpr, candidate.getMonth() + 1) &&
        matchCronField(dowExpr, candidate.getDay())) {
      return candidate.getTime() - now.getTime();
    }
  }
  return null;
}

function matchCronField(expr, value) {
  if (expr === '*') return true;
  if (expr.includes(',')) return expr.split(',').some(v => matchCronField(v.trim(), value));
  if (expr.includes('/')) {
    const [_, step] = expr.split('/');
    return value % parseInt(step) === 0;
  }
  return parseInt(expr) === value;
}

/**
 * Run an agent by type.
 */
async function runAgent(agentType) {
  const loader = getRunner(agentType);
  if (!loader) {
    console.log(`[SCHEDULER] Unknown agent type: ${agentType}`);
    return;
  }

  try {
    console.log(`[SCHEDULER] Triggering agent: ${agentType}`);
    const mod = await loader();
    const runFn = mod.default || mod.runAgent || mod.run;
    if (typeof runFn === 'function') {
      await runFn({ triggeredBy: 'cron' });
    }

    // Update lastRunAt
    await prisma.agentSchedule.update({
      where: { agentType },
      data: { lastRunAt: new Date() },
    });
  } catch (error) {
    console.error(`[SCHEDULER] Agent "${agentType}" failed:`, error.message);
  }
}

/**
 * Schedule a single agent based on its AgentSchedule record.
 */
function scheduleAgent(schedule) {
  const delayMs = msUntilNextRun(schedule.cronExpression);
  if (delayMs === null) {
    console.log(`[SCHEDULER] Invalid cron for ${schedule.agentType}: ${schedule.cronExpression}`);
    return;
  }

  // Clear existing timer
  if (activeIntervals[schedule.agentType]) {
    clearTimeout(activeIntervals[schedule.agentType]);
  }

  // Use recursive setTimeout to avoid drift
  function scheduleNext() {
    const nextDelay = msUntilNextRun(schedule.cronExpression) || 86400000;
    activeIntervals[schedule.agentType] = setTimeout(async () => {
      try {
        await runAgent(schedule.agentType);
      } catch (err) {
        console.error(`[SCHEDULER] Agent "${schedule.agentType}" crashed:`, err.message);
      } finally {
        scheduleNext(); // Always reschedule — prevents permanent agent death
      }
    }, nextDelay);
  }

  // Set initial timeout
  activeIntervals[schedule.agentType] = setTimeout(async () => {
    try {
      await runAgent(schedule.agentType);
    } catch (err) {
      console.error(`[SCHEDULER] Agent "${schedule.agentType}" crashed:`, err.message);
    } finally {
      scheduleNext();
    }
  }, delayMs);

  const nextRun = new Date(Date.now() + delayMs);
  console.log(`[SCHEDULER] ${schedule.agentType} scheduled - next run: ${nextRun.toLocaleString('id-ID')}`);
}

/**
 * Initialize the agent scheduler - called from initCrons().
 */
export async function initAgentScheduler() {
  console.log('[SCHEDULER] Initializing agent scheduler...');

  try {
    const schedules = await prisma.agentSchedule.findMany({
      where: { isActive: true },
    });

    if (schedules.length === 0) {
      console.log('[SCHEDULER] No active schedules found. Seeding defaults...');
      await seedDefaultSchedules();
      const updated = await prisma.agentSchedule.findMany({ where: { isActive: true } });
      updated.forEach(s => { try { scheduleAgent(s); } catch (e) { console.error(`[SCHEDULER] Failed to schedule ${s.agentType}:`, e.message); } });
    } else {
      schedules.forEach(s => { try { scheduleAgent(s); } catch (e) { console.error(`[SCHEDULER] Failed to schedule ${s.agentType}:`, e.message); } });
    }

    console.log(`[SCHEDULER] ${Object.keys(activeIntervals).length} agent(s) scheduled.`);
  } catch (error) {
    console.error('[SCHEDULER] Failed to initialize scheduler:', error.message);
  }
}

/**
 * Manually trigger an agent run (from admin API).
 */
export async function triggerAgent(agentType, triggeredBy = 'admin') {
  const loader = getRunner(agentType);
  if (!loader) throw new Error(`Unknown agent type: ${agentType}`);

  const mod = await loader();
  const runFn = mod.default || mod.runAgent || mod.run;
  if (typeof runFn !== 'function') throw new Error(`Agent "${agentType}" has no runnable function`);

  return runFn({ triggeredBy });
}

/**
 * Seed default agent schedules if none exist.
 */
async function seedDefaultSchedules() {
  const defaults = [
    { agentType: 'seo', agentName: 'SEO Content Agent', cronExpression: '0 20 * * *', description: 'SEO articles daily at 03:00 WIB' },
    { agentType: 'email', agentName: 'Email Campaign Agent', cronExpression: '0 2 * * *', description: 'Email campaigns daily at 09:00 WIB' },
    { agentType: 'social_media', agentName: 'Social Media Agent', cronExpression: '0 0,5,11 * * *', description: 'Social posts 3x daily at 07:00, 12:00, 18:00 WIB' },
    { agentType: 'whatsapp', agentName: 'WhatsApp Broadcast Agent', cronExpression: '0 3 * * 1,4', description: 'WhatsApp promos Mon & Thu at 10:00 WIB' },
    { agentType: 'competitor', agentName: 'Competitor Intel Agent', cronExpression: '0 19 * * 0', description: 'Competitor audit Sunday 02:00 WIB' },
    { agentType: 'dynamic_pricing', agentName: 'Dynamic Pricing Agent', cronExpression: '0 17 * * *', description: 'Price optimization daily at 00:00 WIB' },
    { agentType: 'analytics', agentName: 'Analytics Agent', cronExpression: '0 23 * * *', description: 'Daily KPI report at 06:00 WIB' },
    { agentType: 'reseller', agentName: 'Reseller Recruitment Agent', cronExpression: '0 3 1,15 * *', description: 'Reseller outreach 1st & 15th at 10:00 WIB' },
    { agentType: 'retention', agentName: 'Customer Retention Agent', cronExpression: '0 2 * * 3', description: 'Retention campaign Wed at 09:00 WIB' },
    { agentType: 'upsell', agentName: 'Upsell Agent', cronExpression: '0 4 * * *', description: 'Upsell campaigns daily at 11:00 WIB' },
    { agentType: 'content_writer', agentName: 'Content Writer Agent', cronExpression: '0 7 * * *', description: 'Content generation daily at 14:00 WIB (auto-rotate: product_desc/faq/tutorial)' },
    { agentType: 'review_request', agentName: 'Review Request Agent', cronExpression: '0 8 * * *', description: 'Review requests daily at 15:00 WIB' },
    { agentType: 'video_ads', agentName: 'Video Ads Agent', cronExpression: '0 6 * * 1,3,5', description: 'Video ad scripts Mon/Wed/Fri at 13:00 WIB' },
  ];

  for (const s of defaults) {
    await prisma.agentSchedule.upsert({
      where: { agentType: s.agentType },
      update: {},
      create: s,
    });
  }
  console.log('[SCHEDULER] Default schedules seeded.');
}

/**
 * Trigger a workflow by name.
 */
export async function triggerWorkflow(workflowName, options = {}) {
  const { executeWorkflow } = await import('../shared/workflow-engine.js');

  const workflowMap = {
    'daily-marketing': () => import('../workflows/daily-marketing.js'),
    'weekly-reseller': () => import('../workflows/weekly-reseller.js'),
    'reactivation': () => import('../workflows/reactivation.js'),
    'content-pipeline': () => import('../workflows/content-pipeline.js'),
  };

  const loader = workflowMap[workflowName];
  if (!loader) throw new Error(`Unknown workflow: "${workflowName}". Available: ${Object.keys(workflowMap).join(', ')}`);

  const mod = await loader();
  const workflow = mod.default || mod;
  return executeWorkflow(workflow, options);
}

export default { initAgentScheduler, triggerAgent, triggerWorkflow, seedDefaultSchedules };
