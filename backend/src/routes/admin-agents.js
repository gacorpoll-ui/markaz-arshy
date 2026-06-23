import express from 'express';
import prisma from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { triggerAgent } from '../../../agent-work/agent-marketing/scheduler.js';
import { getCumulativeRevenue, getRevenueMetrics, getAgentRevenueStats } from '../../../agent-work/shared/revenue-tracker.js';
import { getAgentStats } from '../../../agent-work/shared/agent-base.js';
import { resetConfigCache } from '../../../agent-work/shared/llm-client.js';

const router = express.Router();
router.use(requireAuth);
router.use(requireAdmin);

// ─── Agent Dashboard Stats ────────────────────────────

router.get('/agents/stats', async (req, res) => {
  try {
    const [stats, revenue, agentStats] = await Promise.all([
      getAgentStats(),
      getCumulativeRevenue(),
      getAgentRevenueStats(),
    ]);

    return res.json({
      overview: stats,
      revenue,
      agents: agentStats,
    });
  } catch (error) {
    console.error('Agent stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch agent stats.' });
  }
});

// ─── KPI / Revenue Progress ───────────────────────────

router.get('/agents/kpi', async (req, res) => {
  try {
    const revenue = await getCumulativeRevenue();
    return res.json({ kpi: revenue });
  } catch (error) {
    console.error('KPI error:', error);
    return res.status(500).json({ error: 'Failed to fetch KPI.' });
  }
});

// ─── Agent Tasks ──────────────────────────────────────

router.get('/agents', async (req, res) => {
  try {
    const { agentType, status, limit = 50, offset = 0 } = req.query;
    const where = {};
    if (agentType) where.agentType = agentType;
    if (status) where.status = status;

    const [tasks, total] = await Promise.all([
      prisma.agentTask.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset),
      }),
      prisma.agentTask.count({ where }),
    ]);

    return res.json({ tasks, total, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (error) {
    console.error('Agent tasks list error:', error);
    return res.status(500).json({ error: 'Failed to fetch agent tasks.' });
  }
});

router.get('/agents/:id', async (req, res) => {
  try {
    const task = await prisma.agentTask.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { reports: true },
    });
    if (!task) return res.status(404).json({ error: 'Task not found.' });
    return res.json({ task });
  } catch (error) {
    console.error('Agent task detail error:', error);
    return res.status(500).json({ error: 'Failed to fetch task.' });
  }
});

// ─── Manual Agent Trigger ─────────────────────────────

router.post('/agents/run/:agentType', async (req, res) => {
  const { agentType } = req.params;
  const options = { ...req.body, triggeredBy: 'admin' };

  try {
    // Run agent asynchronously — return immediately
    const resultPromise = triggerAgent(agentType, 'admin');
    resultPromise.catch(err => console.error(`[ADMIN] Agent ${agentType} run failed:`, err.message));

    return res.json({
      message: `Agent "${agentType}" triggered successfully.`,
      status: 'triggered',
    });
  } catch (error) {
    console.error('Agent trigger error:', error);
    return res.status(500).json({ error: `Failed to trigger agent: ${error.message}` });
  }
});

// ─── Agent Schedules ──────────────────────────────────

router.get('/agents/schedules', async (req, res) => {
  try {
    const schedules = await prisma.agentSchedule.findMany({
      orderBy: { agentType: 'asc' },
    });
    return res.json({ schedules });
  } catch (error) {
    console.error('Schedules list error:', error);
    return res.status(500).json({ error: 'Failed to fetch schedules.' });
  }
});

router.put('/agents/schedules/:id', async (req, res) => {
  try {
    const { cronExpression, isActive, config } = req.body;
    const data = {};
    if (cronExpression !== undefined) data.cronExpression = cronExpression;
    if (isActive !== undefined) data.isActive = isActive;
    if (config !== undefined) data.config = typeof config === 'string' ? config : JSON.stringify(config);

    const schedule = await prisma.agentSchedule.update({
      where: { id: parseInt(req.params.id) },
      data,
    });

    return res.json({ schedule, message: 'Schedule updated. Changes take effect on next server restart.' });
  } catch (error) {
    console.error('Schedule update error:', error);
    return res.status(500).json({ error: 'Failed to update schedule.' });
  }
});

// ─── Agent Reports ────────────────────────────────────

router.get('/agents/reports', async (req, res) => {
  try {
    const { reportType, limit = 20, offset = 0 } = req.query;
    const where = {};
    if (reportType) where.reportType = reportType;

    const [reports, total] = await Promise.all([
      prisma.agentReport.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset),
        include: { agentTask: { select: { agentType: true, taskName: true } } },
      }),
      prisma.agentReport.count({ where }),
    ]);

    return res.json({ reports, total });
  } catch (error) {
    console.error('Reports list error:', error);
    return res.status(500).json({ error: 'Failed to fetch reports.' });
  }
});

router.get('/agents/reports/:id', async (req, res) => {
  try {
    const report = await prisma.agentReport.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { agentTask: true },
    });
    if (!report) return res.status(404).json({ error: 'Report not found.' });
    return res.json({ report });
  } catch (error) {
    console.error('Report detail error:', error);
    return res.status(500).json({ error: 'Failed to fetch report.' });
  }
});

// ─── Revenue Metrics ──────────────────────────────────

router.get('/agents/revenue', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 86400000);
    const end = endDate ? new Date(endDate) : new Date();

    const metrics = await getRevenueMetrics(start, end);
    const cumulative = await getCumulativeRevenue();

    return res.json({ metrics, cumulative });
  } catch (error) {
    console.error('Revenue metrics error:', error);
    return res.status(500).json({ error: 'Failed to fetch revenue metrics.' });
  }
});

// ─── Content Queue ────────────────────────────────────

router.get('/agents/content', async (req, res) => {
  try {
    const { contentType, status, limit = 20, offset = 0 } = req.query;
    const where = {};
    if (contentType) where.contentType = contentType;
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.contentItem.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset),
      }),
      prisma.contentItem.count({ where }),
    ]);

    return res.json({ items, total });
  } catch (error) {
    console.error('Content list error:', error);
    return res.status(500).json({ error: 'Failed to fetch content.' });
  }
});

router.put('/agents/content/:id', async (req, res) => {
  try {
    const { status, title, body, metaTitle, metaDescription } = req.body;
    const data = {};
    if (status) data.status = status;
    if (title) data.title = title;
    if (body) data.body = body;
    if (metaTitle) data.metaTitle = metaTitle;
    if (metaDescription) data.metaDescription = metaDescription;
    if (status === 'PUBLISHED') data.publishedAt = new Date();

    const item = await prisma.contentItem.update({
      where: { id: parseInt(req.params.id) },
      data,
    });

    return res.json({ item });
  } catch (error) {
    console.error('Content update error:', error);
    return res.status(500).json({ error: 'Failed to update content.' });
  }
});

// ─── Social Posts ─────────────────────────────────────

router.get('/agents/social', async (req, res) => {
  try {
    const { platform, status, limit = 20, offset = 0 } = req.query;
    const where = {};
    if (platform) where.platform = platform;
    if (status) where.status = status;

    const [posts, total] = await Promise.all([
      prisma.socialPost.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset),
      }),
      prisma.socialPost.count({ where }),
    ]);

    return res.json({ posts, total });
  } catch (error) {
    console.error('Social posts list error:', error);
    return res.status(500).json({ error: 'Failed to fetch social posts.' });
  }
});

router.post('/agents/social', async (req, res) => {
  try {
    const { platform, content, mediaUrl, scheduledAt } = req.body;
    if (!platform || !content) {
      return res.status(400).json({ error: 'Platform and content are required.' });
    }

    const post = await prisma.socialPost.create({
      data: {
        platform,
        content,
        mediaUrl,
        status: scheduledAt ? 'QUEUED' : 'DRAFT',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      },
    });

    return res.json({ post });
  } catch (error) {
    console.error('Social post create error:', error);
    return res.status(500).json({ error: 'Failed to create social post.' });
  }
});

// ─── Agent LLM API Config (Raw SQL — avoids Prisma Client regeneration) ──

// Get all agent configs
router.get('/agents/configs', async (req, res) => {
  try {
    const configs = await prisma.$queryRawUnsafe(
      `SELECT * FROM AgentConfig ORDER BY agentType ASC`
    );

    // Mask API keys in response — only show last 8 chars
    const masked = configs.map(c => ({
      ...c,
      apiKey: c.apiKey ? '••••••••' + String(c.apiKey).slice(-8) : null,
    }));

    return res.json({ configs: masked });
  } catch (error) {
    console.error('Agent configs list error:', error);
    return res.status(500).json({ error: 'Failed to fetch agent configs.' });
  }
});

// Get single agent config (with full API key for editing)
router.get('/agents/configs/:agentType', async (req, res) => {
  try {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT * FROM AgentConfig WHERE agentType = ?`, req.params.agentType
    );
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Config not found.' });
    return res.json({ config: rows[0] });
  } catch (error) {
    console.error('Agent config detail error:', error);
    return res.status(500).json({ error: 'Failed to fetch config.' });
  }
});

// Create or update agent config (upsert via raw SQL)
router.put('/agents/configs/:agentType', async (req, res) => {
  try {
    const { baseUrl, apiKey, model, maxTokens, temperature, isActive } = req.body;
    const agentType = req.params.agentType;

    // Check if exists
    const existing = await prisma.$queryRawUnsafe(
      `SELECT * FROM AgentConfig WHERE agentType = ?`, agentType
    );

    if (existing && existing.length > 0) {
      // Update — only set fields that are provided
      const sets = [];
      const values = [];
      if (baseUrl !== undefined) { sets.push('baseUrl = ?'); values.push(baseUrl); }
      if (apiKey !== undefined && apiKey !== '••••••••') { sets.push('apiKey = ?'); values.push(apiKey); }
      if (model !== undefined) { sets.push('model = ?'); values.push(model); }
      if (maxTokens !== undefined) { sets.push('maxTokens = ?'); values.push(parseInt(maxTokens)); }
      if (temperature !== undefined) { sets.push('temperature = ?'); values.push(parseFloat(temperature)); }
      if (isActive !== undefined) { sets.push('isActive = ?'); values.push(isActive ? 1 : 0); }
      sets.push('updatedAt = CURRENT_TIMESTAMP');

      if (sets.length > 1) {
        await prisma.$executeRawUnsafe(
          `UPDATE AgentConfig SET ${sets.join(', ')} WHERE agentType = ?`,
          ...values, agentType
        );
      }
    } else {
      // Insert new
      await prisma.$executeRawUnsafe(
        `INSERT INTO AgentConfig (agentType, baseUrl, apiKey, model, maxTokens, temperature, isActive)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        agentType,
        baseUrl || 'https://api.openai.com/v1',
        apiKey || null,
        model || 'gpt-4o-mini',
        parseInt(maxTokens) || 4096,
        parseFloat(temperature) || 0.7,
        isActive !== false ? 1 : 0
      );
    }

    // Reload cache
    resetConfigCache();

    // Fetch updated config
    const rows = await prisma.$queryRawUnsafe(
      `SELECT * FROM AgentConfig WHERE agentType = ?`, agentType
    );

    return res.json({ config: rows[0], message: 'Config saved. Changes take effect on next agent run.' });
  } catch (error) {
    console.error('Agent config save error:', error);
    return res.status(500).json({ error: 'Failed to save config.' });
  }
});

// Delete agent config
router.delete('/agents/configs/:agentType', async (req, res) => {
  try {
    if (req.params.agentType === 'global') {
      return res.status(400).json({ error: 'Cannot delete global config.' });
    }
    await prisma.$executeRawUnsafe(
      `DELETE FROM AgentConfig WHERE agentType = ?`, req.params.agentType
    );
    resetConfigCache();
    return res.json({ message: 'Config deleted.' });
  } catch (error) {
    console.error('Agent config delete error:', error);
    return res.status(500).json({ error: 'Failed to delete config.' });
  }
});

// Test LLM connection
router.post('/agents/configs/test', async (req, res) => {
  try {
    const { baseUrl, apiKey, model } = req.body;
    if (!baseUrl || !apiKey || !model) {
      return res.status(400).json({ error: 'baseUrl, apiKey, and model are required.' });
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Say OK' }],
        max_tokens: 10,
        stream: false,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.json({ success: false, error: `API ${response.status}: ${errText.slice(0, 200)}` });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    return res.json({ success: true, model: data.model, response: content.slice(0, 100) });
  } catch (error) {
    return res.json({ success: false, error: error.message });
  }
});

export default router;
