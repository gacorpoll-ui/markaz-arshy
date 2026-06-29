import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../../../backend/src/db.js';
import {
  AGENT_PROMPTS, createTask, startTask, completeTask, failTask,
  callAgentLLM, generateReport, saveReportFile, log,
} from '../../shared/agent-base.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VIDEOS_DIR = path.join(__dirname, '../../../backend/src/marketing/videos');

// Google Gemini Veo configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
const VEO_MODEL = process.env.VEO_MODEL || 'veo-3.1-generate-preview';
const VEO_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

// Ensure videos directory exists
if (!fs.existsSync(VIDEOS_DIR)) {
  fs.mkdirSync(VIDEOS_DIR, { recursive: true });
}

/**
 * Video Ads Agent — Google Gemini Veo
 * Generates short-form video ad scripts and renders videos via Google Veo API.
 * Targets: TikTok, Instagram Reels, YouTube Shorts.
 * 100% gratis dengan GEMINI_API_KEY dari Google AI Studio.
 */
export async function runAgent(options = {}) {
  const platform = options.platform || 'tiktok';
  const contentType = options.contentType || 'promo';
  const task = await createTask('video_ads', `Video Ad: ${contentType} (${platform})`, options, options.triggeredBy || 'cli');

  try {
    await startTask(task.id);
    log('video_ads', `Starting video ad generation for ${platform} (${contentType})...`);

    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const productList = products
      .map(p => `- ${p.name} (Rp ${p.priceUser.toLocaleString('id-ID')}, ${p.category?.name || '-'})`)
      .join('\n');

    // Step 1: Generate video script via LLM
    log('video_ads', 'Generating video script...');
    const scriptPrompt = buildScriptPrompt(platform, contentType, productList);
    const scriptResult = await callAgentLLM(task.id, 'video_ads', AGENT_PROMPTS.video_ads, scriptPrompt);
    const script = parseScript(scriptResult, platform);
    log('video_ads', `Script generated: ${script.scenes.length} scenes, ~${script.duration}s`);

    // Step 2: Generate video via Google Gemini Veo
    let videoUrl = null;
    let localVideoPath = null;
    let videoStatus = 'script_only';

    if (GEMINI_API_KEY) {
      try {
        log('video_ads', `Generating video via Google Veo (${VEO_MODEL})...`);
        const videoPrompt = buildVeoPrompt(script, platform, contentType);
        const result = await generateVideoWithVeo(videoPrompt, platform, task.id);
        videoUrl = result.videoUrl;
        localVideoPath = result.localPath;
        videoStatus = videoUrl ? 'rendered' : 'render_failed';
        log('video_ads', videoUrl ? `Video generated: ${videoUrl}` : 'Video generation failed');
      } catch (err) {
        log('video_ads', `Veo error: ${err.message}. Saving script only.`);
        videoStatus = 'render_failed';
      }
    } else {
      log('video_ads', 'No GEMINI_API_KEY — saving script only. Get free key at https://aistudio.google.com/apikey');
    }

    // Step 3: Save to ContentItem
    const slug = `video-ad-${platform}-${contentType}-${Date.now()}`;
    const contentItem = await prisma.contentItem.create({
      data: {
        contentType: 'video_ad',
        title: script.title,
        slug,
        body: JSON.stringify({ script, platform, contentType, videoUrl, localVideoPath, videoStatus }),
        metaTitle: script.title?.slice(0, 60),
        metaDescription: script.hook?.slice(0, 150),
        keywords: `${platform}, video ads, ${contentType}, markaz arshy, smm, followers`,
        status: 'DRAFT',
      },
    });

    // Step 4: Generate report
    const reportContent = buildReport(script, platform, contentType, videoUrl, localVideoPath, videoStatus, contentItem.id);
    const reportPath = saveReportFile(`video_ad_${platform}_${Date.now()}.md`, reportContent);

    const metrics = {
      platform, contentType, scenes: script.scenes.length, duration: script.duration,
      videoStatus, videoUrl, localVideoPath, contentItemId: contentItem.id,
      model: VEO_MODEL,
    };
    await generateReport(task.id, 'campaign', `Video Ad: ${contentType} (${platform})`, reportContent.slice(0, 500), metrics);
    await completeTask(task.id, metrics, reportPath);
    log('video_ads', `✅ Video ad created: ${contentItem.id} (${videoStatus})`);

    return { contentItem, script, videoUrl, localVideoPath, videoStatus, taskId: task.id };
  } catch (error) {
    await failTask(task.id, error.message);
    log('video_ads', `❌ Failed: ${error.message}`);
    throw error;
  }
}

// ─── Script Generation ───────────────────────────────

function buildScriptPrompt(platform, contentType, productList) {
  const specs = {
    tiktok:    { ratio: '9:16', duration: '5-8 detik', style: 'energetic, bold text, trending visual, Gen-Z vibe' },
    instagram: { ratio: '9:16', duration: '5-8 detik', style: 'aesthetic, clean, aspirational, smooth transitions' },
    youtube:   { ratio: '16:9', duration: '5-8 detik', style: 'cinematic, informative, hook-driven, professional' },
  };
  const s = specs[platform] || specs.tiktok;

  return `Buat script video iklan pendek untuk ${platform} tentang produk Markaz-Arshy.
Video akan dirender oleh Google Veo (AI video generation), jadi buat prompt visual yang sangat deskriptif dan cinematic.

Format: ${s.ratio}
Durasi target: ${s.duration}
Gaya visual: ${s.style}
Jenis konten: ${contentType}

Produk unggulan:
${productList}

Struktur script dalam format JSON:
{
  "title": "Judul video",
  "hook": "Hook pembuka yang compelling",
  "veo_prompt": "Prompt visual lengkap untuk Google Veo (bahasa Inggris, sangat deskriptif, cinematic, sebutkan kamera angle, lighting, gerakan, warna)",
  "scenes": [
    {
      "scene": 1,
      "duration": "3s",
      "visual": "Deskripsi visual",
      "text_overlay": "Text overlay di video",
      "voiceover": "Narasi (Indonesian)"
    }
  ],
  "cta": "Call to action",
  "hashtags": ["hashtag1", "hashtag2"],
  "caption": "Caption posting"
}

PENTING untuk veo_prompt:
- Tulis dalam bahasa Inggris
- Sangat deskriptif: gerakan kamera, lighting, warna, tekstur
- Sebutkan aspek Markaz-Arshy secara natural
- Buat cinematic dan eye-catching untuk social media
- Contoh: "Dynamic close-up of a smartphone screen showing Instagram follower count rapidly increasing, neon blue and purple lighting, smooth camera zoom out revealing multiple social media icons floating around, modern tech aesthetic, vertical 9:16 format"

Buat 1 script compelling. Semua output dalam Bahasa Indonesia kecuali veo_prompt.`;
}

function parseScript(rawResult, platform) {
  try {
    const jsonMatch = rawResult.match(/\{[\s\S]*"scenes"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const totalDuration = parsed.scenes?.reduce((sum, s) => {
        const match = String(s.duration || '0').match(/(\d+)/);
        return sum + (match ? parseInt(match[1]) : 3);
      }, 0) || 8;

      return {
        title: parsed.title || `Video Ad ${platform}`,
        hook: parsed.hook || '',
        veoPrompt: parsed.veo_prompt || parsed.veoPrompt || '',
        scenes: parsed.scenes || [],
        cta: parsed.cta || '',
        hashtags: parsed.hashtags || [],
        caption: parsed.caption || '',
        duration: totalDuration,
      };
    }
  } catch { /* JSON parse failed */ }

  // Fallback
  const fallbackVeoPrompt = `Modern social media promotional video for digital services, vibrant neon blue and purple colors, smartphone showing follower count increasing, smooth camera movement, tech aesthetic, professional quality, vertical format 9:16`;

  return {
    title: `Video Ad ${platform} — Markaz Arshy`,
    hook: rawResult.match(/hook[:\s]*([^\n]+)/i)?.[1]?.trim() || 'Mau followers murah?',
    veoPrompt: rawResult.match(/veo[_\s]prompt[:\s]*([^\n]+)/i)?.[1]?.trim() || fallbackVeoPrompt,
    scenes: [{ scene: 1, duration: '8s', visual: rawResult.slice(0, 200), text_overlay: 'Markaz-Arshy', voiceover: '' }],
    cta: 'Kunjungi markaz-arshy.com sekarang!',
    hashtags: ['smm', 'followers', 'markazarshy'],
    caption: rawResult.slice(0, 300),
    duration: 8,
  };
}

// ─── Google Gemini Veo Integration ───────────────────

function buildVeoPrompt(script, platform, contentType) {
  // Use the LLM-generated veo_prompt if available, otherwise build one
  if (script.veoPrompt && script.veoPrompt.length > 20) {
    return script.veoPrompt;
  }

  const sceneDesc = script.scenes.map(s => s.visual || s.text_overlay || '').join('. ');
  return `Professional short-form video ad for social media: ${script.title}. ${script.hook}. ${sceneDesc}. Modern, vibrant colors, dynamic camera movements, tech aesthetic, motion graphics style. Call to action: ${script.cta}. 9:16 vertical format.`;
}

async function generateVideoWithVeo(prompt, platform, taskId) {
  const aspectRatio = platform === 'youtube' ? '16:9' : '9:16';

  // Step 1: Submit video generation request
  log('video_ads', `Submitting to Veo (${VEO_MODEL}) with ${aspectRatio} aspect ratio...`);

  const requestUrl = `${VEO_BASE_URL}/models/${VEO_MODEL}:predictLongRunning?key=${GEMINI_API_KEY}`;

  const response = await fetch(requestUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: {
        aspectRatio,
        durationSeconds: 8,
        sampleCount: 1,
        enhancePrompt: true,
      },
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Veo request failed ${response.status}: ${errText.slice(0, 300)}`);
  }

  const requestData = await response.json();
  const operationName = requestData.name;

  if (!operationName) {
    throw new Error('No operation name returned from Veo API');
  }

  log('video_ads', `Veo operation started: ${operationName}`);

  // Step 2: Poll for completion (max 5 minutes)
  const maxPolls = 60; // 60 × 5s = 300s = 5 min
  let videoUri = null;

  for (let i = 0; i < maxPolls; i++) {
    await new Promise(r => setTimeout(r, 5000));

    const statusUrl = `${VEO_BASE_URL}/${operationName}?key=${GEMINI_API_KEY}`;
    const statusResponse = await fetch(statusUrl, {
      signal: AbortSignal.timeout(15000),
    });

    if (!statusResponse.ok) {
      log('video_ads', `Poll ${i + 1}: status check failed (${statusResponse.status})`);
      continue;
    }

    const statusData = await statusResponse.json();

    if (statusData.done) {
      // Extract video URI
      const generatedSamples = statusData.response?.generateVideoResponse?.generatedSamples;
      if (generatedSamples?.length > 0) {
        videoUri = generatedSamples[0].video?.uri;
      }
      break;
    }

    if (i % 6 === 0) { // Log every 30 seconds
      log('video_ads', `Still generating... (${(i + 1) * 5}s elapsed)`);
    }
  }

  if (!videoUri) {
    throw new Error('Video generation timed out after 5 minutes');
  }

  log('video_ads', `Video ready: ${videoUri}`);

  // Step 3: Download video locally
  const localPath = await downloadVideo(videoUri, platform);

  return { videoUrl: videoUri, localPath };
}

async function downloadVideo(videoUri, platform) {
  try {
    const response = await fetch(videoUri, {
      headers: { 'Authorization': `Bearer ${GEMINI_API_KEY}` },
      redirect: 'follow',
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      log('video_ads', `Download failed: ${response.status}`);
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const filename = `video_ad_${platform}_${Date.now()}.mp4`;
    const filePath = path.join(VIDEOS_DIR, filename);
    fs.writeFileSync(filePath, buffer);
    log('video_ads', `Video saved locally: ${filePath}`);
    return filePath;
  } catch (err) {
    log('video_ads', `Download error: ${err.message}`);
    return null;
  }
}

// ─── Report ──────────────────────────────────────────

function buildReport(script, platform, contentType, videoUrl, localPath, videoStatus, contentItemId) {
  return `# Laporan Video Ad Agent (Google Veo)

## Ringkasan
- **Platform:** ${platform}
- **Jenis:** ${contentType}
- **Durasi:** ~${script.duration} detik
- **Scenes:** ${script.scenes.length}
- **Video Model:** ${VEO_MODEL}
- **Status Video:** ${videoStatus}
- **Content ID:** ${contentItemId}

## Script
### Hook
${script.hook}

### Veo Prompt
\`\`\`
${script.veoPrompt}
\`\`\`

### Scenes
${script.scenes.map(s => `**Scene ${s.scene}** (${s.duration})
- Visual: ${s.visual || '-'}
- Text: ${s.text_overlay || '-'}
- Voiceover: ${s.voiceover || '-'}`).join('\n\n')}

### CTA
${script.cta}

### Caption
${script.caption}

### Hashtags
${script.hashtags?.map(h => `#${h}`).join(' ') || '-'}

${videoUrl ? `## Video\n- Remote: [View Video](${videoUrl})\n- Local: ${localPath || 'not downloaded'}` : `## Video\nVideo rendering ${videoStatus === 'render_failed' ? 'gagal — script disimpan untuk review' : 'belum (tidak ada GEMINI_API_KEY)'}`}

## Setup
Untuk mengaktifkan video generation:
1. Kunjungi https://aistudio.google.com/apikey
2. Buat API key (gratis)
3. Tambahkan ke \`.env\`: \`GEMINI_API_KEY=your-key-here\`

## Langkah Selanjutnya
1. Review script dan video di admin dashboard
2. ${videoUrl ? 'Download dan edit video jika diperlukan' : 'Set GEMINI_API_KEY untuk auto-render'}
3. Upload ke ${platform} setelah approval
4. Track engagement`;
}

export default runAgent;
