import prisma from '../../../backend/src/db.js';
import {
  AGENT_PROMPTS, createTask, startTask, completeTask, failTask,
  callAgentLLM, generateReport, saveReportFile, log,
} from '../../shared/agent-base.js';

/**
 * Social Media Content Agent (Agent 2)
 * Generates social media posts for Instagram/TikTok/Twitter.
 * Creates platform-specific content with hashtags, emojis, CTAs, and promo codes.
 * Saves posts as DRAFT to SocialPost table — admin approves before publishing.
 */
export async function runAgent(options = {}) {
  const platforms = options.platforms || ['instagram'];
  const contentType = options.contentType || 'promo';
  const task = await createTask('social_media', `Social Media: ${contentType} [${platforms.join(', ')}]`, options, options.triggeredBy || 'cli');

  try {
    await startTask(task.id);
    log('social_media', `Starting ${contentType} post generation for: ${platforms.join(', ')}...`);

    // Query top products for context
    const topProducts = await prisma.product.findMany({
      where: { isActive: true },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });

    const productList = topProducts
      .map(p => `- ${p.name} (Rp ${p.priceUser.toLocaleString('id-ID')}, kategori: ${p.category?.name || '-'}, tipe: ${p.type})`)
      .join('\n');

    // Generate unique promo code for attribution
    const promoCode = `MARKAZ-${generateRandomCode()}`;
    log('social_media', `Promo code for this batch: ${promoCode}`);

    const posts = [];

    for (const platform of platforms) {
      const platformPrompt = buildPlatformPrompt(platform, contentType, productList, promoCode);
      const rawResult = await callAgentLLM(task.id, 'social_media', AGENT_PROMPTS.social_media, platformPrompt);

      // Parse the result — try to extract structured posts
      let generatedPosts = parsePostResult(rawResult, platform);

      if (generatedPosts.length === 0) {
        // Fallback: use the raw output as a single post
        generatedPosts = [{ content: rawResult.trim().slice(0, 2000) }];
      }

      // Save each post to SocialPost as DRAFT
      for (const post of generatedPosts) {
        const savedPost = await prisma.socialPost.create({
          data: {
            platform,
            content: post.content,
            mediaUrl: post.mediaUrl || null,
            status: 'DRAFT',
            promoCode,
          },
        });
        posts.push(savedPost);
        log('social_media', `Saved DRAFT post for ${platform} (ID: ${savedPost.id})`);
      }
    }

    // Build report
    const reportContent = buildReport(platforms, contentType, promoCode, posts);
    const reportPath = saveReportFile(`social_media_${contentType}_${Date.now()}.md`, reportContent);

    const metrics = {
      platforms,
      contentType,
      promoCode,
      postsCreated: posts.length,
      postIds: posts.map(p => p.id),
    };

    await generateReport(task.id, 'campaign', `Social Media: ${contentType}`, reportContent.slice(0, 500), metrics);
    await completeTask(task.id, metrics, reportPath);
    log('social_media', `Done: ${posts.length} posts created as DRAFT across ${platforms.length} platform(s)`);

    return { posts, promoCode, taskId: task.id };
  } catch (error) {
    await failTask(task.id, error.message);
    log('social_media', `Failed: ${error.message}`);
    throw error;
  }
}

function buildPlatformPrompt(platform, contentType, productList, promoCode) {
  const guidelines = {
    instagram: {
      format: 'Instagram carousel/feed post',
      maxLen: '2200 karakter',
      tips: 'Gunakan 20-30 hashtags populer di baris terakhir. Buat caption yang engaging dengan hook kuat di baris pertama. Sertakan CTA jelas.',
      emojiGuide: 'Gunakan emoji di setiap paragraf untuk visual appeal.',
    },
    tiktok: {
      format: 'TikTok caption / script ringkas',
      maxLen: '300 karakter untuk caption',
      tips: 'Buat hook 3 detik pertama yang menarik. Gunakan trending hashtags. Bahasa santai, gaul, anak muda.',
      emojiGuide: 'Emoji minimal, lebih ke trend.',
    },
    twitter: {
      format: 'Twitter/X tweet thread (3-5 tweets)',
      maxLen: '280 karakter per tweet',
      tips: 'Buat thread yang informatif. Tweet pertama harus viral-worthy. Gunakan angka dan fakta.',
      emojiGuide: 'Emoji hemat, gunakan di bullet points.',
    },
    facebook: {
      format: 'Facebook post',
      maxLen: '1000 karakter',
      tips: 'Bahasa persuasif, ceritakan manfaat. Gunakan pertanyaan untuk engagement.',
      emojiGuide: 'Emoji di heading dan CTA.',
    },
  };

  const g = guidelines[platform] || guidelines.instagram;

  return `Buat konten ${g.format} untuk platform ${platform} tentang Markaz-Arshy.

Jenis konten: ${contentType}

Produk unggulan kami:
${productList}

Aturan format:
- Maksimal ${g.maxLen}
- ${g.tips}
- ${g.emojiGuide}
- Semua konten dalam Bahasa Indonesia
- Sertakan promo code ${promoCode} di dalam konten
- Buat beberapa variasi konten (2-3 opsi) dengan format:

---POST 1---
[isi konten]
---POST 2---
[isi konten]
---POST 3---
[isi konten]

Pastikan setiap POST terasa unik dan berbeda angle-nya.`;
}

function parsePostResult(rawResult, platform) {
  const posts = [];
  // Try splitting by ---POST N--- markers
  const parts = rawResult.split(/---\s*POST\s+\d+\s*---/i);

  for (let i = 1; i < parts.length; i++) {
    const content = parts[i].trim();
    if (content.length > 10) {
      posts.push({ content: content.slice(0, 2000) });
    }
  }

  // If no markers found, try splitting by numbered sections
  if (posts.length === 0) {
    const numberedParts = rawResult.split(/\n\s*(?:Opsi|Pilihan|Versi|Variasi)\s*\d+\s*[:.]/i);
    for (let i = 1; i < numberedParts.length; i++) {
      const content = numberedParts[i].trim();
      if (content.length > 10) {
        posts.push({ content: content.slice(0, 2000) });
      }
    }
  }

  return posts;
}

function generateRandomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function buildReport(platforms, contentType, promoCode, posts) {
  return `# Laporan Social Media Content Agent

## Ringkasan
- **Jenis Konten:** ${contentType}
- **Platform:** ${platforms.join(', ')}
- **Promo Code:** ${promoCode}
- **Total Post Dibuat:** ${posts.length}
- **Status:** Semua post disimpan sebagai DRAFT (belum dipublish)

## Post yang Dibuat
${posts.map(p => `### Post #${p.id} (${p.platform})
Status: ${p.status}
Promo Code: ${p.promoCode || '-'}

${p.content.slice(0, 500)}${p.content.length > 500 ? '...' : ''}
`).join('\n---\n')}

## Langkah Selanjutnya
1. Review setiap post di admin dashboard
2. Ubah status dari DRAFT ke QUEUED untuk penjadwalan
3. Monitor engagement setelah publish
4. Track penggunaan promo code ${promoCode}`;
}

export default runAgent;
