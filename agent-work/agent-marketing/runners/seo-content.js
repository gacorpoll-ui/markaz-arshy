import prisma from '../../../backend/src/db.js';
import {
  AGENT_PROMPTS, createTask, startTask, completeTask, failTask,
  callAgentLLM, generateReport, saveReportFile, log,
} from '../../shared/agent-base.js';

/**
 * SEO Content Agent
 * Generates SEO-optimized blog articles targeting Indonesian search queries.
 */
export async function runAgent(options = {}) {
  const topic = options.topic || 'smm-panel-indonesia';
  const task = await createTask('seo', `SEO Article: ${topic}`, options, options.triggeredBy || 'cli');

  try {
    await startTask(task.id);
    log('seo', `Generating SEO article for topic: "${topic}"...`);

    // Get product catalog for context
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: { category: true },
      take: 10,
    });

    const productList = products
      .slice(0, 5)
      .map(p => `- ${p.name} (Rp ${p.priceUser.toLocaleString('id-ID')})`)
      .join('\n');

    const userPrompt = `Generate a high-quality, comprehensive, SEO-optimized blog article about: "${topic}".

Requirements:
1. Meta Title (Max 60 chars) and Meta Description (Max 150 chars)
2. Keywords checklist (10-15 keywords)
3. H1, H2, H3 structured content in Indonesian
4. 1500-2000 words, informative and engaging
5. Integrate references to Markaz-Arshy (https://markaz-arshy.com) naturally
6. Mention our popular products:
${productList}
7. Include a clear Call-to-Action at the end
8. Return in clean markdown format

Target audience: Indonesian users searching for SMM panels, premium accounts, and digital services.`;

    const articleContent = await callAgentLLM(task.id, 'seo', AGENT_PROMPTS.seo, userPrompt);

    // Parse meta title and description from output
    const metaTitleMatch = articleContent.match(/Meta Title[:\s]*([^\n]+)/i);
    const metaDescMatch = articleContent.match(/Meta Description[:\s]*([^\n]+)/i);
    const titleMatch = articleContent.match(/^#\s+(.+)/m);

    const metaTitle = metaTitleMatch?.[1]?.trim()?.slice(0, 60) || titleMatch?.[1]?.slice(0, 60) || `Artikel ${topic}`;
    const metaDescription = metaDescMatch?.[1]?.trim()?.slice(0, 150) || `Panduan lengkap ${topic} di Markaz-Arshy.`;
    const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-');
    const keywords = topic.split(/[-_]+/).join(', ') + ', smm panel, markaz arshy, followers instagram';

    // Save to ContentItem
    const contentItem = await prisma.contentItem.create({
      data: {
        contentType: 'blog_post',
        title: titleMatch?.[1] || `Panduan ${topic}`,
        slug,
        body: articleContent,
        metaTitle,
        metaDescription,
        keywords,
        status: 'DRAFT',
      },
    });

    // Save markdown file
    const reportPath = saveReportFile(`seo_article_${slug}.md`, articleContent);

    // Create report
    const report = await generateReport(task.id, 'campaign', `SEO Article: ${topic}`, articleContent.slice(0, 500), {
      contentItemId: contentItem.id,
      wordCount: articleContent.split(/\s+/).length,
      topic,
    });

    await completeTask(task.id, { contentItemId: contentItem.id, reportPath }, reportPath);
    log('seo', `✅ Article generated: "${titleMatch?.[1] || topic}" (${contentItem.id})`);

    return { contentItem, reportPath, taskId: task.id };
  } catch (error) {
    await failTask(task.id, error.message);
    log('seo', `❌ Failed: ${error.message}`);
    throw error;
  }
}

export default runAgent;
