import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../../backend/src/db.js';
import { callLLM } from './llm-client.js';
import eventBus from './event-bus.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPORTS_DIR = path.join(__dirname, '../../backend/src/marketing/reports');

// Ensure reports directory exists
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

/**
 * Agent system prompts — centralized here for easy editing.
 */
export const AGENT_PROMPTS = {
  seo: `You are the SEO Specialist Agent for Markaz-Arshy (Indonesian SMM & premium accounts store). You write top-ranking Google SEO blog posts, landing pages, and metadata. Tone: informative, professional, optimized with keywords. Always write in Indonesian.`,

  social_media: `You are the Social Media Content Agent for Markaz-Arshy. You create engaging posts for Instagram, TikTok, Twitter, and Facebook. Use emojis, trending hashtags, and compelling CTAs. All content in Indonesian.`,

  email: `You are the Email Campaign Agent for Markaz-Arshy. You craft high-converting email campaigns with personalized subject lines and beautifully styled HTML content. Dark glassmorphism theme (#070913 background, cyan/indigo accents). All content in Indonesian.`,

  whatsapp: `You are the WhatsApp Broadcast Agent for Markaz-Arshy. You create catchy, high-conversion WhatsApp messages with emojis, bullet points, urgency hooks, and clear CTAs. All content in Indonesian.`,

  competitor: `You are the Competitor Intelligence Agent for Markaz-Arshy. You audit pricing, margins, and catalog competitiveness. Goal: maximize profitability and attract resellers. Output formatted Markdown reports.`,

  dynamic_pricing: `You are the Dynamic Pricing Agent for Markaz-Arshy. You analyze order patterns, demand curves, and time-based trends to suggest optimal pricing. Never auto-apply — always suggest. Output structured recommendations.`,

  analytics: `You are the Analytics Agent for Markaz-Arshy. You generate daily/weekly KPI reports with revenue tracking, user metrics, and progress toward Rp 1 Miliar target. Use clear tables and bullet points. All content in Indonesian.`,

  reseller: `You are the Reseller Recruitment Agent for Markaz-Arshy. You identify potential resellers from active users and create compelling outreach content. Highlight reseller benefits, commission structure, and growth potential. All in Indonesian.`,

  retention: `You are the Customer Retention Agent for Markaz-Arshy. You re-engage inactive users with personalized campaigns. Create time-limited offers and comeback incentives. All content in Indonesian.`,

  upsell: `You are the Upsell Agent for Markaz-Arshy. You cross-sell products based on purchase history — SMM buyers get premium account offers, premium buyers get SMM offers. Create bundle deals. All in Indonesian.`,

  content_writer: `You are the Content Writer Agent for Markaz-Arshy. You write product descriptions, FAQ entries, and step-by-step tutorials. Clear, helpful, SEO-friendly. All in Indonesian.`,

  review_request: `You are the Review Request Agent for Markaz-Arshy. You create polite, engaging review request messages for customers with completed orders. All in Indonesian.`,

  video_ads: `You are the Video Ads Agent for Markaz-Arshy. You create compelling short-form video ad scripts for TikTok, Instagram Reels, and YouTube Shorts. You specialize in hook-driven storytelling, scene-by-scene breakdowns with visual descriptions, text overlays, voiceover scripts, and trending hashtags. All content in Indonesian. Focus on SMM services, premium accounts, and digital products.`,
};

// ─── Core Task Management ─────────────────────────────

/**
 * Create a new agent task record.
 */
export async function createTask(agentType, taskName, input = null, triggeredBy = 'cron') {
  const task = await prisma.agentTask.create({
    data: {
      agentType,
      taskName,
      status: 'PENDING',
      input: input ? JSON.stringify(input) : null,
      triggeredBy,
    },
  });
  log(agentType, `Task #${task.id} created: ${taskName}`);
  return task;
}

/**
 * Mark task as RUNNING.
 */
export async function startTask(taskId) {
  return prisma.agentTask.update({
    where: { id: taskId },
    data: { status: 'RUNNING', startedAt: new Date() },
  });
}

/**
 * Mark task as COMPLETED.
 */
export async function completeTask(taskId, output, reportPath = null) {
  const task = await prisma.agentTask.findUnique({ where: { id: taskId } });
  const durationMs = task?.startedAt ? Date.now() - task.startedAt.getTime() : 0;

  return prisma.agentTask.update({
    where: { id: taskId },
    data: {
      status: 'COMPLETED',
      output: typeof output === 'string' ? output : JSON.stringify(output),
      reportPath,
      completedAt: new Date(),
      durationMs,
    },
  });
}

/**
 * Mark task as FAILED.
 */
export async function failTask(taskId, errorMessage) {
  return prisma.agentTask.update({
    where: { id: taskId },
    data: {
      status: 'FAILED',
      errorMessage: String(errorMessage),
      completedAt: new Date(),
    },
  });
}

// ─── LLM Integration ──────────────────────────────────

/**
 * Call LLM and track token usage in the agent task.
 */
export async function callAgentLLM(taskId, agentKey, systemPrompt, userPrompt, options = {}) {
  const start = Date.now();
  const result = await callLLM(agentKey, systemPrompt, userPrompt, options);
  const durationMs = Date.now() - start;

  // Estimate token count (rough: 1 token ≈ 4 chars for Indonesian)
  const estimatedTokens = Math.ceil((systemPrompt.length + userPrompt.length + result.length) / 4);
  const estimatedCost = Math.ceil(estimatedTokens * 0.02); // ~Rp 0.02 per token estimate

  await prisma.agentTask.update({
    where: { id: taskId },
    data: {
      llmTokensUsed: { increment: estimatedTokens },
      llmCost: { increment: estimatedCost },
    },
  });

  return result;
}

// ─── Report Generation ────────────────────────────────

/**
 * Create an AgentReport record linked to a task.
 */
export async function generateReport(taskId, reportType, title, summary, metrics = null, periodStart = null, periodEnd = null) {
  return prisma.agentReport.create({
    data: {
      agentTaskId: taskId,
      reportType,
      title,
      summary,
      metrics: metrics ? JSON.stringify(metrics) : null,
      periodStart,
      periodEnd,
    },
  });
}

/**
 * Save report content as a markdown file.
 */
export function saveReportFile(filename, content) {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = path.join(REPORTS_DIR, safeName);
  fs.writeFileSync(filePath, content, 'utf-8');
  log('SYSTEM', `Report saved: ${filePath}`);
  return filePath;
}

// ─── Utility ──────────────────────────────────────────

/**
 * Console log with agent prefix.
 */
export function log(agentType, message) {
  const prefix = `[AGENT-${agentType.toUpperCase().replace(/-/g, '_')}]`;
  console.log(`${prefix} ${message}`);
}

/**
 * Get a summary of recent agent activity.
 */
export async function getAgentStats(agentType = null) {
  const where = agentType ? { agentType } : {};
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [total, today, failed, totalTokens] = await Promise.all([
    prisma.agentTask.count({ where }),
    prisma.agentTask.count({ where: { ...where, createdAt: { gte: todayStart } } }),
    prisma.agentTask.count({ where: { ...where, status: 'FAILED' } }),
    prisma.agentTask.aggregate({ where, _sum: { llmTokensUsed: true, llmCost: true } }),
  ]);

  return {
    totalRuns: total,
    runsToday: today,
    failedRuns: failed,
    successRate: total > 0 ? ((total - failed) / total * 100).toFixed(1) + '%' : '0%',
    totalTokensUsed: totalTokens._sum.llmTokensUsed || 0,
    totalLLMCost: totalTokens._sum.llmCost || 0,
  };
}

// ─── Runner Wrapper ─────────────────────────────────

/**
 * createRunner — wraps business logic in standard task lifecycle + event emission.
 * Reduces each runner from ~90 lines of boilerplate to ~30 lines of pure logic.
 *
 * Usage:
 *   export default createRunner('seo', async (ctx) => {
 *     const articles = await ctx.llm(prompt);
 *     // ... save results ...
 *     return { contentItemId: article.id };
 *   });
 */
export function createRunner(agentType, businessLogic) {
  return async function runAgent(options = {}) {
    const taskName = options.taskName || `${agentType} run`;
    const task = await createTask(agentType, taskName, options, options.triggeredBy || 'cron');

    try {
      await startTask(task.id);
      log(agentType, `Starting: ${taskName}`);

      // Context object passed to business logic
      const ctx = {
        taskId: task.id,
        agentType,
        options,
        log: (msg) => log(agentType, msg),
        llm: (systemPrompt, userPrompt, opts = {}) => callAgentLLM(task.id, agentType, systemPrompt, userPrompt, opts),
        report: (type, title, summary, metrics) => generateReport(task.id, type, title, summary, metrics),
        saveFile: (filename, content) => saveReportFile(filename, content),
      };

      const result = await businessLogic(ctx);

      await completeTask(task.id, result);
      log(agentType, `✅ Completed: ${taskName}`);

      // Emit event for other agents
      eventBus.emit(eventBus.EVENTS.AGENT_COMPLETED, {
        agentType, taskId: task.id, output: result,
      });

      return result;
    } catch (error) {
      await failTask(task.id, error.message);
      log(agentType, `❌ Failed: ${error.message}`);

      eventBus.emit(eventBus.EVENTS.AGENT_FAILED, {
        agentType, taskId: task.id, error: error.message,
      });

      throw error;
    }
  };
}

// ─── Health Monitoring ──────────────────────────────

export async function getAgentHealth() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);

  const agentTypes = [
    'seo', 'social_media', 'email', 'whatsapp', 'competitor',
    'dynamic_pricing', 'analytics', 'reseller', 'retention',
    'upsell', 'content_writer', 'review_request',
  ];

  const health = [];
  for (const type of agentTypes) {
    const [total, completed, failed, recentTasks, costAgg] = await Promise.all([
      prisma.agentTask.count({ where: { agentType: type, createdAt: { gte: sevenDaysAgo } } }),
      prisma.agentTask.count({ where: { agentType: type, status: 'COMPLETED', createdAt: { gte: sevenDaysAgo } } }),
      prisma.agentTask.count({ where: { agentType: type, status: 'FAILED', createdAt: { gte: sevenDaysAgo } } }),
      prisma.agentTask.findMany({
        where: { agentType: type, createdAt: { gte: sevenDaysAgo } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { status: true, durationMs: true, errorMessage: true, completedAt: true },
      }),
      prisma.agentTask.aggregate({
        where: { agentType: type, createdAt: { gte: sevenDaysAgo } },
        _sum: { llmCost: true, llmTokensUsed: true },
        _avg: { durationMs: true },
      }),
    ]);

    const lastRun = recentTasks[0];
    health.push({
      agentType: type,
      runsWeek: total,
      successRate: total > 0 ? ((completed / total) * 100).toFixed(1) : '0',
      avgDurationMs: Math.round(costAgg._avg.durationMs || 0),
      totalCost: costAgg._sum.llmCost || 0,
      totalTokens: costAgg._sum.llmTokensUsed || 0,
      lastStatus: lastRun?.status || 'NEVER',
      lastError: lastRun?.errorMessage || null,
      lastRunAt: lastRun?.completedAt || null,
      isHealthy: total === 0 || (completed / total) >= 0.7,
    });
  }
  return health;
}

export default {
  AGENT_PROMPTS,
  createTask,
  startTask,
  completeTask,
  failTask,
  callAgentLLM,
  generateReport,
  saveReportFile,
  log,
  getAgentStats,
  createRunner,
  getAgentHealth,
};
