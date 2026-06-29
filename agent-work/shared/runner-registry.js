/**
 * Unified Runner Registry — single source of truth for all agent runner lazy-loaders.
 * Eliminates duplication between index.js and scheduler.js.
 */

const RUNNERS = {
  seo:             () => import('../agent-marketing/runners/seo-content.js'),
  email:           () => import('../agent-marketing/runners/email-campaign.js'),
  social_media:    () => import('../agent-marketing/runners/social-media.js'),
  whatsapp:        () => import('../agent-marketing/runners/whatsapp-broadcast.js'),
  competitor:      () => import('../agent-marketing/runners/competitor-intel.js'),
  dynamic_pricing: () => import('../agent-marketing/runners/dynamic-pricing.js'),
  analytics:       () => import('../agent-marketing/runners/analytics.js'),
  reseller:        () => import('../agent-marketing/runners/reseller-recruitment.js'),
  retention:       () => import('../agent-marketing/runners/customer-retention.js'),
  upsell:          () => import('../agent-marketing/runners/upsell.js'),
  content_writer:  () => import('../agent-marketing/runners/content-writer.js'),
  review_request:  () => import('../agent-marketing/runners/review-request.js'),
  video_ads:       () => import('../agent-marketing/runners/video-ads.js'),
};

export function getRunner(agentType) {
  return RUNNERS[agentType] || null;
}

export function getRunnerNames() {
  return Object.keys(RUNNERS);
}

export async function loadRunner(agentType) {
  const loader = RUNNERS[agentType];
  if (!loader) throw new Error(`Unknown agent type: "${agentType}"`);
  const mod = await loader();
  return mod.default || mod.runAgent || mod.run;
}

export default { getRunner, getRunnerNames, loadRunner };
