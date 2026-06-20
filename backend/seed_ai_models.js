import prisma from './src/db.js';

/**
 * Seed initial AI providers and models for AI Router feature
 */
async function seedAIProviders() {
  console.log('🤖 Seeding AI Providers...');

  // OpenAI Provider
  const openai = await prisma.aIProvider.upsert({
    where: { slug: 'openai' },
    update: {},
    create: {
      name: 'OpenAI',
      slug: 'openai',
      description: 'Leading AI provider with GPT models',
      logoUrl: '/logos/openai.png',
      isActive: true,
    },
  });

  // Anthropic Provider
  const anthropic = await prisma.aIProvider.upsert({
    where: { slug: 'anthropic' },
    update: {},
    create: {
      name: 'Anthropic',
      slug: 'anthropic',
      description: 'Claude AI models by Anthropic',
      logoUrl: '/logos/anthropic.png',
      isActive: true,
    },
  });

  // Google AI Provider
  const googleAI = await prisma.aIProvider.upsert({
    where: { slug: 'google-ai' },
    update: {},
    create: {
      name: 'Google AI',
      slug: 'google-ai',
      description: 'Gemini models by Google',
      logoUrl: '/logos/google-ai.png',
      isActive: true,
    },
  });

  console.log('✅ AI Providers seeded');

  // Seed OpenAI Models
  await prisma.aIModel.upsert({
    where: { modelId: 'gpt-4o' },
    update: {},
    create: {
      providerId: openai.id,
      name: 'GPT-4o',
      modelId: 'gpt-4o',
      inputPricePerToken: 0.000001,
      outputPricePerToken: 0.000003,
      contextWindow: 128000,
      isActive: true,
    },
  });

  await prisma.aIModel.upsert({
    where: { modelId: 'gpt-4o-mini' },
    update: {},
    create: {
      providerId: openai.id,
      name: 'GPT-4o mini',
      modelId: 'gpt-4o-mini',
      inputPricePerToken: 0.0000005,
      outputPricePerToken: 0.000002,
      contextWindow: 128000,
      isActive: true,
    },
  });



  await prisma.aIModel.upsert({
    where: { modelId: 'gpt-3.5-turbo' },
    update: {},
    create: {
      providerId: openai.id,
      name: 'GPT-3.5 Turbo',
      modelId: 'gpt-3.5-turbo',
      inputPricePerToken: 0.00000025,
      outputPricePerToken: 0.00000075,
      contextWindow: 16385,
      isActive: true,
    },
  });

  // Seed Anthropic Models
  await prisma.aIModel.upsert({
    where: { modelId: 'claude-3-5-sonnet-20241022' },
    update: {},
    create: {
      providerId: anthropic.id,
      name: 'Claude 3.5 Sonnet',
      modelId: 'claude-3-5-sonnet-20241022',
      inputPricePerToken: 0.000001,
      outputPricePerToken: 0.000005,
      contextWindow: 200000,
      isActive: true,
    },
  });



  await prisma.aIModel.upsert({
    where: { modelId: 'claude-3-opus-20240229' },
    update: {},
    create: {
      providerId: anthropic.id,
      name: 'Claude 3 Opus',
      modelId: 'claude-3-opus-20240229',
      inputPricePerToken: 0.0000075,
      outputPricePerToken: 0.000025,
      contextWindow: 200000,
      isActive: true,
    },
  });

  // Seed Google AI Models
  await prisma.aIModel.upsert({
    where: { modelId: 'gemini-1.5-pro' },
    update: {},
    create: {
      providerId: googleAI.id,
      name: 'Gemini 1.5 Pro',
      modelId: 'gemini-1.5-pro',
      inputPricePerToken: 0.000001,
      outputPricePerToken: 0.000003,
      contextWindow: 2000000,
      isActive: true,
    },
  });

  await prisma.aIModel.upsert({
    where: { modelId: 'gemini-1.5-flash' },
    update: {},
    create: {
      providerId: googleAI.id,
      name: 'Gemini 1.5 Flash',
      modelId: 'gemini-1.5-flash',
      inputPricePerToken: 0.0000005,
      outputPricePerToken: 0.0000015,
      contextWindow: 1000000,
      isActive: true,
    },
  });

  console.log('✅ AI Models seeded');
}

async function main() {
  try {
    await seedAIProviders();
    console.log('✅ AI seed completed successfully');
  } catch (error) {
    console.error('❌ AI seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
