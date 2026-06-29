export default {
  name: 'daily-marketing',
  steps: [
    { agent: 'analytics', options: { period: 'daily', taskName: 'Daily Analytics' } },
    { agent: 'competitor', dependsOn: 'analytics', options: { taskName: 'Competitor Analysis' }, continueOnError: true },
    { agent: 'dynamic_pricing', dependsOn: 'competitor', options: { taskName: 'Price Optimization' }, continueOnError: true },
    { agents: ['seo', 'social_media', 'email'], parallel: true, continueOnError: true },
  ],
};
