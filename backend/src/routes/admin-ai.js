import express from 'express';
import prisma from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

/* ═══════════════════════════════════════
   GET ALL AI PROVIDERS (Admin)
   ═══════════════════════════════════════ */
router.get('/ai-providers', requireAuth, requireAdmin, async (req, res) => {
  try {
    const providers = await prisma.aIProvider.findMany({
      include: {
        models: true,
      },
      orderBy: { id: 'asc' },
    });
    res.json(providers);
  } catch (error) {
    console.error('Error fetching AI providers:', error);
    res.status(500).json({ error: 'Failed to fetch AI providers' });
  }
});

/* ═══════════════════════════════════════
   CREATE AI PROVIDER (Admin)
   ═══════════════════════════════════════ */
router.post('/ai-providers', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, slug, description, logoUrl, isActive } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ error: 'Name and slug are required' });
    }

    const provider = await prisma.aIProvider.create({
      data: {
        name,
        slug,
        description: description || null,
        logoUrl: logoUrl || null,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    res.status(201).json(provider);
  } catch (error) {
    console.error('Error creating AI provider:', error);
    res.status(500).json({ error: 'Failed to create AI provider' });
  }
});

/* ═══════════════════════════════════════
   UPDATE AI PROVIDER (Admin)
   ═══════════════════════════════════════ */
router.put('/ai-providers/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, logoUrl, isActive } = req.body;

    const provider = await prisma.aIProvider.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(description !== undefined && { description }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json(provider);
  } catch (error) {
    console.error('Error updating AI provider:', error);
    res.status(500).json({ error: 'Failed to update AI provider' });
  }
});

/* ═══════════════════════════════════════
   DELETE AI PROVIDER (Admin)
   ═══════════════════════════════════════ */
router.delete('/ai-providers/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.aIProvider.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: 'Provider deleted successfully' });
  } catch (error) {
    console.error('Error deleting AI provider:', error);
    res.status(500).json({ error: 'Failed to delete AI provider' });
  }
});

/* ═══════════════════════════════════════
   CREATE AI MODEL (Admin)
   ═══════════════════════════════════════ */
router.post('/ai-models', requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      providerId,
      name,
      modelId,
      inputPricePerToken,
      outputPricePerToken,
      contextWindow,
      isActive,
    } = req.body;

    if (!providerId || !name || !modelId || !inputPricePerToken || !outputPricePerToken || !contextWindow) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if modelId already exists
    const existingModel = await prisma.aIModel.findUnique({ where: { modelId } });
    if (existingModel) {
      return res.status(400).json({ error: `Model dengan ID "${modelId}" sudah ada. Gunakan Edit untuk mengubahnya.` });
    }

    const model = await prisma.aIModel.create({
      data: {
        providerId: parseInt(providerId),
        name,
        modelId,
        inputPricePerToken: parseFloat(inputPricePerToken),
        outputPricePerToken: parseFloat(outputPricePerToken),
        contextWindow: parseInt(contextWindow),
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    res.status(201).json(model);
  } catch (error) {
    console.error('Error creating AI model:', error);
    res.status(500).json({ error: 'Failed to create AI model' });
  }
});

/* ═══════════════════════════════════════
   UPDATE AI MODEL (Admin)
   ═══════════════════════════════════════ */
router.put('/ai-models/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      modelId,
      inputPricePerToken,
      outputPricePerToken,
      contextWindow,
      isActive,
    } = req.body;

    const model = await prisma.aIModel.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(modelId && { modelId }),
        ...(inputPricePerToken && { inputPricePerToken: parseFloat(inputPricePerToken) }),
        ...(outputPricePerToken && { outputPricePerToken: parseFloat(outputPricePerToken) }),
        ...(contextWindow && { contextWindow: parseInt(contextWindow) }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json(model);
  } catch (error) {
    console.error('Error updating AI model:', error);
    res.status(500).json({ error: 'Failed to update AI model' });
  }
});

/* ═══════════════════════════════════════
   DELETE AI MODEL (Admin)
   ═══════════════════════════════════════ */
router.delete('/ai-models/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.aIModel.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: 'Model deleted successfully' });
  } catch (error) {
    console.error('Error deleting AI model:', error);
    res.status(500).json({ error: 'Failed to delete AI model' });
  }
});

/* ═══════════════════════════════════════
   AI ROUTER STATISTICS (Admin)
   ═══════════════════════════════════════ */
router.get('/ai-stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    // Total API keys created
    const totalKeys = await prisma.aIApiKey.count();

    // Active API keys
    const activeKeys = await prisma.aIApiKey.count({
      where: { isActive: true },
    });

    // Total usage requests
    const totalRequests = await prisma.aIUsage.count();

    // Total revenue from AI Router
    const totalRevenue = await prisma.aIUsage.aggregate({
      _sum: { totalCost: true },
    });

    // Top users by usage
    const topUsers = await prisma.aIUsage.groupBy({
      by: ['userId'],
      _count: { id: true },
      _sum: { totalCost: true },
      orderBy: { _sum: { totalCost: 'desc' } },
      take: 10,
    });

    res.json({
      totalKeys,
      activeKeys,
      totalRequests,
      totalRevenue: totalRevenue._sum.totalCost || 0,
      topUsers,
    });
  } catch (error) {
    console.error('Error fetching AI stats:', error);
    res.status(500).json({ error: 'Failed to fetch AI stats' });
  }
});

/* ═══════════════════════════════════════
   SYNC PROVIDERS & MODELS FROM 9ROUTER (Admin)
   ═══════════════════════════════════════ */
router.post('/ai-sync-9router', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { routerUrl, apiKey } = req.body;
    
    // Resolve URL and API Key (defaulting to env values if not passed in body)
    const targetUrl = routerUrl || process.env.AI_ROUTER_URL || 'http://localhost:20128';
    const targetKey = apiKey || process.env.AI_ROUTER_KEY;

    if (!targetKey) {
      return res.status(400).json({ error: '9router API Key is required for sync' });
    }

    // Clean URL (remove trailing slash, ensure correct models endpoint)
    const baseUrl = targetUrl.replace(/\/$/, '');
    const modelsUrl = baseUrl.endsWith('/v1') ? `${baseUrl}/models` : `${baseUrl}/v1/models`;

    console.log(`Syncing models from 9router at: ${modelsUrl}`);

    // Call 9router models endpoint
    const response = await fetch(modelsUrl, {
      headers: {
        'Authorization': `Bearer ${targetKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('9router sync failed:', errText);
      return res.status(response.status).json({ error: `Failed to fetch models from 9router: ${errText}` });
    }

    const result = await response.json();
    if (!result.data || !Array.isArray(result.data)) {
      return res.status(422).json({ error: 'Invalid response format from 9router models endpoint' });
    }

    const syncedModels = [];
    
    // Loop through each model returned by 9router
    for (const item of result.data) {
      const modelId = item.id;
      if (!modelId) continue;

      // Infer provider slug and name
      let providerSlug = item.owned_by || '';
      let providerName = '';

      if (providerSlug.includes('openai') || modelId.startsWith('gpt') || modelId.startsWith('text-embedding') || modelId.startsWith('o1') || modelId.startsWith('o3')) {
        providerSlug = 'openai';
        providerName = 'OpenAI';
      } else if (providerSlug.includes('anthropic') || modelId.includes('claude')) {
        providerSlug = 'anthropic';
        providerName = 'Anthropic';
      } else if (providerSlug.includes('google') || modelId.includes('gemini')) {
        providerSlug = 'google-ai';
        providerName = 'Google AI';
      } else {
        providerSlug = providerSlug.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'other';
        providerName = item.owned_by || 'Other Providers';
      }

      // Upsert the provider in our DB
      const dbProvider = await prisma.aIProvider.upsert({
        where: { slug: providerSlug },
        update: {},
        create: {
          name: providerName,
          slug: providerSlug,
          description: `Automatically synced provider from 9router`,
          isActive: true
        }
      });

      // Upsert the model in our DB
      const dbModel = await prisma.aIModel.upsert({
        where: { modelId: modelId },
        update: {},
        create: {
          providerId: dbProvider.id,
          name: modelId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          modelId: modelId,
          // Reasonable default cost per 1M tokens in USD ($0.01 inputs / $0.03 outputs)
          inputPricePerToken: 0.00001,
          outputPricePerToken: 0.00003,
          contextWindow: 128000,
          isActive: true
        }
      });

      syncedModels.push({
        provider: providerName,
        model: dbModel.name,
        modelId: dbModel.modelId
      });
    }

    res.json({
      message: `Successfully synced ${syncedModels.length} models from 9router`,
      syncedCount: syncedModels.length,
      models: syncedModels
    });

  } catch (error) {
    console.error('Error syncing 9router models:', error);
    res.status(500).json({ error: `Sync failed: ${error.message}` });
  }
});

export default router;
