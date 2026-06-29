export default {
  name: 'reactivation',
  steps: [
    { agent: 'retention', options: { taskName: 'Retention Analysis' } },
    { agents: ['email', 'whatsapp'], parallel: true, continueOnError: true },
  ],
};
