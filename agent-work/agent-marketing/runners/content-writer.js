import prisma from '../../../backend/src/db.js';
import {
  AGENT_PROMPTS, createTask, startTask, completeTask, failTask,
  callAgentLLM, generateReport, saveReportFile, log,
} from '../../shared/agent-base.js';

// Content type rotation for cron runs — each day gets a different type
const CONTENT_ROTATION = ['product_desc', 'faq', 'tutorial'];

/**
 * Content Writer Agent (Agent 11)
 * Generates product descriptions, FAQ entries, and step-by-step tutorials.
 * Auto-rotates content types when called from cron (no explicit contentType).
 */
export async function runAgent(options = {}) {
  // Auto-rotate: pick content type based on day of year
  const explicitType = options.contentType || null;
  const contentType = explicitType || CONTENT_ROTATION[new Date().getDate() % CONTENT_ROTATION.length];
  const productId = options.productId || null;

  const task = await createTask('content_writer', `Content Writer: ${contentType}${productId ? ` (Product #${productId})` : ''}`, options, options.triggeredBy || 'cli');

  try {
    await startTask(task.id);
    log('content_writer', `Starting content generation: ${contentType}...`);

    const contentItems = [];

    switch (contentType) {
      case 'product_desc': {
        // 1. Try products without descriptions
        let products = await prisma.product.findMany({
          where: { isActive: true, OR: [{ description: null }, { description: '' }] },
          include: { category: true },
          take: productId ? 1 : 5,
        });

        // 2. Fallback: products with very short descriptions (< 50 chars)
        if (products.length === 0 && !productId) {
          const allActive = await prisma.product.findMany({
            where: { isActive: true },
            include: { category: true },
            take: 50,
          });
          products = allActive.filter(p => (p.description || '').length < 50).slice(0, 5);
          if (products.length > 0) {
            log('content_writer', `No empty descriptions, found ${products.length} products with short descriptions (< 50 chars)`);
          }
        }

        // 3. Fallback: pick products that haven't been updated recently
        if (products.length === 0 && !productId) {
          const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
          products = await prisma.product.findMany({
            where: { isActive: true, updatedAt: { lt: thirtyDaysAgo } },
            include: { category: true },
            orderBy: { updatedAt: 'asc' },
            take: 3,
          });
          if (products.length > 0) {
            log('content_writer', `Refreshing ${products.length} outdated product descriptions`);
          }
        }

        log('content_writer', `Found ${products.length} products to write descriptions for`);

        for (const product of products) {
          const userPrompt = `Buat deskripsi produk yang menarik dan SEO-friendly untuk:

Nama Produk: ${product.name}
Kategori: ${product.category?.name || '-'}
Tipe: ${product.type}
Harga User: Rp ${product.priceUser.toLocaleString('id-ID')}
Harga Reseller: Rp ${product.priceReseller.toLocaleString('id-ID')}

Deskripsi harus:
1. 100-200 kata, dalam Bahasa Indonesia
2. Menjelaskan manfaat utama produk
3. SEO-friendly dengan keyword yang relevan
4. Menyertakan Call-to-Action
5. Tone: profesional tapi friendly
6. Sertakan info harga dan cara pemesanan

Untuk produk SMM: highlight kecepatan, kualitas, dan garansi
Untuk produk Premium: highlight legalitas, multi-device, dan value for money

Kembalikan hasil dalam format:
---TITLE Judul Deskripsi---
---BODY Isi deskripsi---`;

          const result = await callAgentLLM(task.id, 'content_writer', AGENT_PROMPTS.content_writer, userPrompt);
          const { title, body } = parseContentParts(result, `${product.name} - Deskripsi Produk`);

          const item = await prisma.contentItem.create({
            data: {
              contentType: 'product_desc',
              title: title || `Deskripsi: ${product.name}`,
              slug: `desc-${product.slug}`,
              body: body || result,
              metaTitle: `${product.name} — Markaz-Arshy`,
              metaDescription: (body || result).slice(0, 150),
              keywords: `${product.name}, ${product.type}, ${product.category?.name || ''}, markaz arshy, smm panel`,
              status: 'DRAFT',
            },
          });

          contentItems.push(item);
          log('content_writer', `Saved description for "${product.name}" (ID: ${item.id})`);
        }
        break;
      }

      case 'faq': {
        const userPrompt = `Buat FAQ (Pertanyaan yang Sering Diajukan) untuk Markaz-Arshy, SMM Panel & Premium Accounts Store Indonesia.

Buat minimal 15 FAQ mencakup:

### Kategori: Pemesanan
- Cara pesan produk SMM
- Cara beli premium account
- Minimal/maximal order

### Kategori: Pembayaran
- Metode pembayaran yang tersedia
- Cara isi saldo/deposit
- Konfirmasi pembayaran

### Kategori: Akun & Keamanan
- Cara daftar akun
- Verifikasi email
- Reset password

### Kategori: Layanan
- Berapa lama proses pesanan
- Garansi dan refund
- Cara hubungi admin

### Kategori: Reseller
- Cara jadi reseller
- Harga reseller
- Komisi referral

Format untuk setiap FAQ:
---FAQ---
**Q: [Pertanyaan]**
**A: [Jawaban dalam 2-3 kalimat]**

---END---

Semua dalam Bahasa Indonesia.`;

        const result = await callAgentLLM(task.id, 'content_writer', AGENT_PROMPTS.content_writer, userPrompt);
        const faqItems = parseFAQItems(result);

        for (const faq of faqItems) {
          const item = await prisma.contentItem.create({
            data: {
              contentType: 'faq',
              title: faq.question,
              slug: `faq-${slugify(faq.question.slice(0, 50))}`,
              body: `**Q: ${faq.question}**\n\n**A: ${faq.answer}**`,
              status: 'DRAFT',
            },
          });
          contentItems.push(item);
        }

        log('content_writer', `Saved ${contentItems.length} FAQ items`);
        break;
      }

      case 'tutorial': {
        const userPrompt = `Buat tutorial langkah-demi-langkah untuk Markaz-Arshy. Buat 5 tutorial:

1. **Cara Pesan Followers Instagram**
   - Step-by-step dari daftar sampai order selesai
   - Tips dan common mistakes

2. **Cara Beli Akun Netflix Premium**
   - Penjelasan cara pilih paket
   - Proses pembayaran
   - Cara aktivasi akun

3. **Cara Isi Saldo (Deposit)**
   - Pilih metode pembayaran
   - Upload bukti transfer
   - Menunggu konfirmasi

4. **Cara Jadi Reseller**
   - Syarat dan ketentuan
   - Cara daftar
   - Keuntungan reseller

5. **Cara Order SMM Panel**
   - Pilih layanan
   - Masukkan link/username
   - Monitoring progress

Format untuk setiap tutorial:
---TUTORIAL Judul Tutorial---
## Judul
### Langkah 1: [Judul langkah]
[Instruksi detail]
### Langkah 2: [Judul langkah]
[Instruksi detail]
...dst

---END---

Gunakan Bahasa Indonesia yang jelas dan mudah dipahami.`;

        const result = await callAgentLLM(task.id, 'content_writer', AGENT_PROMPTS.content_writer, userPrompt);
        const tutorials = parseTutorials(result);

        for (const tut of tutorials) {
          const item = await prisma.contentItem.create({
            data: {
              contentType: 'tutorial',
              title: tut.title,
              slug: `tutorial-${slugify(tut.title.slice(0, 50))}`,
              body: tut.body,
              metaTitle: `Tutorial: ${tut.title} — Markaz-Arshy`,
              metaDescription: tut.body.slice(0, 150),
              keywords: `tutorial, cara, ${tut.title.toLowerCase()}, markaz arshy`,
              status: 'DRAFT',
            },
          });
          contentItems.push(item);
        }

        log('content_writer', `Saved ${contentItems.length} tutorials`);
        break;
      }
    }

    // Build report
    const reportContent = `# Laporan Content Writer Agent

## Ringkasan
- **Jenis Konten:** ${contentType}
- **Jumlah Dibuat:** ${contentItems.length}
- **Status:** Semua disimpan sebagai DRAFT
- **Rotasi Otomatis:** ${explicitType ? 'Tidak (manual)' : `Ya — hari ke-${new Date().getDate() % 3 + 1} dari 3 tipe`}

## Konten yang Dihasilkan

${contentItems.length > 0
      ? contentItems.map(item => `### ${item.title}
- **ID:** ${item.id}
- **Type:** ${item.contentType}
- **Slug:** ${item.slug || '-'}
- **Status:** ${item.status}

${item.body.slice(0, 300)}${item.body.length > 300 ? '...' : ''}
`).join('\n---\n')
      : '*Tidak ada konten yang dihasilkan pada run ini. Mungkin semua produk sudah memiliki deskripsi yang cukup.*'
    }

## Langkah Selanjutnya
1. Review setiap konten di admin dashboard
2. Edit dan sesuaikan jika perlu
3. Ubah status ke PUBLISHED saat siap live
4. Monitor SEO performance untuk konten yang sudah publish`;

    const reportPath = saveReportFile(`content_writer_${contentType}_${Date.now()}.md`, reportContent);

    const metrics = {
      contentType,
      autoRotated: !explicitType,
      rotationCycle: CONTENT_ROTATION.length,
      itemsCreated: contentItems.length,
      itemIds: contentItems.map(i => i.id),
    };

    await generateReport(task.id, 'campaign', `Content Writer: ${contentType}`, reportContent.slice(0, 500), metrics);
    await completeTask(task.id, metrics, reportPath);
    log('content_writer', `Done: ${contentItems.length} ${contentType} items created${!explicitType ? ' (auto-rotated)' : ''}`);

    return { contentItems, reportPath, taskId: task.id };
  } catch (error) {
    await failTask(task.id, error.message);
    log('content_writer', `Failed: ${error.message}`);
    throw error;
  }
}

// ─── Parse Helpers ────────────────────────────────────

function parseContentParts(result, defaultTitle) {
  const titleMatch = result.match(/---TITLE\s+(.+?)---/i);
  const bodyMatch = result.match(/---BODY\s+([\s\S]+?)---/i);
  return {
    title: titleMatch?.[1]?.trim() || defaultTitle,
    body: bodyMatch?.[1]?.trim() || result.trim(),
  };
}

function parseFAQItems(result) {
  const items = [];
  const parts = result.split(/---FAQ---/i);
  for (let i = 1; i < parts.length; i++) {
    const block = parts[i].split(/---END---/i)[0]?.trim();
    if (!block) continue;
    const qMatch = block.match(/\*\*Q:\s*(.+?)\*\*/i);
    const aMatch = block.match(/\*\*A:\s*([\s\S]+?)\*\*/i);
    if (qMatch) {
      items.push({
        question: qMatch[1].trim(),
        answer: aMatch?.[1]?.trim() || block.replace(/\*\*Q:.*?\*\*/, '').trim(),
      });
    }
  }
  // Fallback: parse numbered items
  if (items.length === 0) {
    const qParts = result.split(/\d+\.\s*\*\*/);
    for (let i = 1; i < qParts.length; i++) {
      const question = qParts[i].split(/\*\*/)[0]?.trim();
      const answer = qParts[i].split(/\*\*/).slice(1).join('').trim();
      if (question && answer) items.push({ question, answer: answer.slice(0, 500) });
    }
  }
  return items;
}

function parseTutorials(result) {
  const tutorials = [];
  const parts = result.split(/---TUTORIAL\s+(.+?)---/i);
  for (let i = 1; i < parts.length; i += 2) {
    const title = parts[i].trim();
    const body = (parts[i + 1] || '').split(/---END---/i)[0]?.trim();
    if (title && body && body.length > 20) tutorials.push({ title, body });
  }
  return tutorials;
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

export default runAgent;
