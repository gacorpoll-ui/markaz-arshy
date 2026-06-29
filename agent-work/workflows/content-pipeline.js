export default {
  name: 'content-pipeline',
  steps: [
    { agent: 'seo', options: { taskName: 'SEO Content Generation' } },
    { agent: 'content_writer', dependsOn: 'seo', options: { taskName: 'Content Writing' }, continueOnError: true },
    { agent: 'social_media', dependsOn: 'content_writer', options: { taskName: 'Social Media Posts' }, continueOnError: true },
  ],
};
