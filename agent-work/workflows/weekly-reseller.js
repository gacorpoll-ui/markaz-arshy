export default {
  name: 'weekly-reseller',
  steps: [
    { agent: 'analytics', options: { period: 'weekly', taskName: 'Weekly Analytics' } },
    { agent: 'reseller', dependsOn: 'analytics', options: { taskName: 'Reseller Recruitment' }, continueOnError: true },
    { agent: 'review_request', dependsOn: 'reseller', options: { taskName: 'Review Requests' }, continueOnError: true },
  ],
};
