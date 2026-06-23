import prisma from '../../../backend/src/db.js';
import { sendPromoEmail } from '../../../backend/src/emailService.js';
import {
  AGENT_PROMPTS, createTask, startTask, completeTask, failTask,
  callAgentLLM, generateReport, saveReportFile, log,
} from '../../shared/agent-base.js';

const MAX_EMAILS_PER_RUN = parseInt(process.env.AGENT_MAX_EMAILS_PER_RUN || '50');

/**
 * Email Campaign Agent
 * Generates and sends personalized email campaigns to user segments.
 */
export async function runAgent(options = {}) {
  const segment = options.segment || 'inactive';
  const limit = options.limit || 20;
  const template = options.template || 'promo';
  const task = await createTask('email', `Email Campaign: ${template} (${segment})`, options, options.triggeredBy || 'cli');

  try {
    await startTask(task.id);
    log('email', `Starting ${template} campaign for "${segment}" users (limit: ${limit})...`);

    // Find target users based on segment
    const targetUsers = await findTargetUsers(segment, limit);
    log('email', `Found ${targetUsers.length} target users.`);

    if (targetUsers.length === 0) {
      const reportContent = `# Email Campaign: ${template} (${segment})\n\n## Hasil\n- **Template:** ${template}\n- **Segment:** ${segment}\n- **Target Users:** 0\n- **Status:** Tidak ada user ditemukan untuk segment ini\n\n## Rekomendasi\n1. Pastikan user sudah terdaftar dan verified\n2. Coba segment lain (all, inactive, new, vip)\n3. Atau tambahkan user baru ke database`;
      const reportPath = saveReportFile(`email_campaign_${template}_${segment}_empty.md`, reportContent);
      await generateReport(task.id, 'campaign', `Email Campaign: ${template} — 0 users`, reportContent.slice(0, 500), { template, segment, totalUsers: 0, sent: 0 }, null, null);
      await completeTask(task.id, { sent: 0, reason: 'No target users found' }, reportPath);
      log('email', 'No target users. Campaign completed.');
      return { sent: 0, taskId: task.id };
    }

    let sentCount = 0;
    let failedCount = 0;
    const results = [];

    for (const user of targetUsers) {
      try {
        const userPrompt = buildEmailPrompt(user, template, segment);
        const rawResult = await callAgentLLM(task.id, 'email', AGENT_PROMPTS.email, userPrompt);

        let subject, html;
        try {
          const jsonMatch = rawResult.match(/\{[\s\S]*"subject"[\s\S]*"html"[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            subject = parsed.subject;
            html = parsed.html;
          }
        } catch { /* LLM didn't return valid JSON */ }

        // Fallback to mock template
        if (!subject || !html) {
          const mock = buildFallbackEmail(user, template);
          subject = mock.subject;
          html = mock.html;
        }

        await sendPromoEmail(user.email, user.name, subject, html);
        sentCount++;
        results.push({ email: user.email, status: 'sent' });
        log('email', `Sent to ${user.email}`);
      } catch (error) {
        failedCount++;
        results.push({ email: user.email, status: 'failed', error: error.message });
        log('email', `Failed for ${user.email}: ${error.message}`);
      }
    }

    // Save report
    const reportContent = `# Email Campaign Report\n\n- Template: ${template}\n- Segment: ${segment}\n- Target: ${targetUsers.length}\n- Sent: ${sentCount}\n- Failed: ${failedCount}\n\n## Results\n${results.map(r => `- ${r.email}: ${r.status}`).join('\n')}`;
    const reportPath = saveReportFile(`email_campaign_${Date.now()}.md`, reportContent);

    await generateReport(task.id, 'campaign', `Email Campaign: ${template}`, reportContent, {
      segment, template, targetCount: targetUsers.length, sentCount, failedCount,
    });

    await completeTask(task.id, { sent: sentCount, failed: failedCount }, reportPath);
    log('email', `✅ Campaign done: ${sentCount} sent, ${failedCount} failed`);

    return { sent: sentCount, failed: failedCount, taskId: task.id };
  } catch (error) {
    await failTask(task.id, error.message);
    log('email', `❌ Campaign failed: ${error.message}`);
    throw error;
  }
}

async function findTargetUsers(segment, limit) {
  const cappedLimit = Math.min(limit, parseInt(process.env.AGENT_MAX_EMAILS_PER_RUN || '50'));

  switch (segment) {
    case 'inactive':
      return prisma.user.findMany({
        where: {
          isVerified: true,
          balance: 0,
          orders: { none: {} },
        },
        take: cappedLimit,
      });

    case 'new':
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
      return prisma.user.findMany({
        where: {
          isVerified: true,
          createdAt: { gte: thirtyDaysAgo },
          orders: { none: {} },
        },
        take: cappedLimit,
      });

    case 'vip':
      return prisma.user.findMany({
        where: {
          isVerified: true,
          role: { in: ['RESELLER', 'ADMIN'] },
        },
        take: cappedLimit,
      });

    case 'reseller':
      return prisma.user.findMany({
        where: { role: 'RESELLER', isVerified: true },
        take: cappedLimit,
      });

    case 'all':
    default:
      return prisma.user.findMany({
        where: { isVerified: true },
        take: cappedLimit,
      });
  }
}

function buildEmailPrompt(user, template, segment) {
  const templates = {
    promo: `Generate a promotional email for user "${user.name}" (segment: ${segment}). Highlight our top products: Netflix Premium (Rp 29K), Spotify (Rp 12K), Instagram followers SMM, and AI Router API. Include a 10% discount code PROMO10. Return JSON with "subject" and "html" keys. Dark glassmorphism style.`,
    welcome: `Generate a welcome drip email for new user "${user.name}" who just registered. Introduce Markaz-Arshy's main services and guide them to make their first deposit. Return JSON with "subject" and "html" keys.`,
    reengagement: `Generate a re-engagement email for user "${user.name}" who hasn't visited in 30+ days. Offer a comeback bonus (Rp 5,000 free credit with code COMEBACK5). Create urgency. Return JSON with "subject" and "html" keys.`,
    upsell: `Generate an upsell email for user "${user.name}". They've used SMM services — recommend premium accounts (Netflix, Spotify, ChatGPT Plus) with a bundle discount. Return JSON with "subject" and "html" keys.`,
  };
  return templates[template] || templates.promo;
}

function buildFallbackEmail(user, template) {
  return {
    subject: `Spesial Buat ${user.name}: Penawaran Terbaik dari Markaz-Arshy!`,
    html: `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;padding:25px;background:#070913;border:1px solid #1e293b;border-radius:12px;color:#f8fafc;">
      <h1 style="background:linear-gradient(135deg,#4facfe,#00f2fe);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-size:28px;font-weight:800;">Markaz-Arshy</h1>
      <p style="color:#cbd5e1;font-size:15px;">Halo <strong>${user.name}</strong>,</p>
      <p style="color:#94a3b8;font-size:14px;line-height:1.6;">Kami punya penawaran spesial khusus Anda!</p>
      <div style="background:rgba(79,172,254,0.05);border:1px solid rgba(79,172,254,0.2);border-radius:8px;padding:15px;margin:20px 0;">
        <h3 style="color:#4facfe;margin-top:0;">Produk Terpopuler:</h3>
        <ul style="color:#cbd5e1;font-size:13px;padding-left:20px;line-height:1.8;">
          <li><strong>Netflix Premium</strong> — Rp 29.000/bulan</li>
          <li><strong>Spotify Premium</strong> — Rp 12.000/bulan</li>
          <li><strong>Instagram Followers</strong> — Rp 8.000/1K</li>
          <li><strong>AI Router API</strong> — GPT-4o, Claude, Gemini</li>
        </ul>
      </div>
      <div style="text-align:center;margin:30px 0;">
        <a href="https://markaz-arshy.com/deposit" style="background:linear-gradient(135deg,#4facfe,#00f2fe);color:#070913;padding:12px 30px;font-weight:bold;border-radius:8px;text-decoration:none;display:inline-block;">Isi Saldo & Dapatkan Bonus</a>
      </div>
      <p style="color:#64748b;font-size:12px;text-align:center;">Gunakan kode <strong>PROMO10</strong> untuk diskon 10%!<br>© 2026 Markaz-Arshy</p>
    </div>`,
  };
}

export default runAgent;
