# Plan: Content Creator Agent Worker

> Dibuat: 2026-06-28
> Status: Draft — menunggu approval

---

## Status Quo

### Yang Sudah Ada
- **Prisma schema** lengkap: `AgentTask`, `AgentSchedule`, `AgentReport`, `SocialPost`, `ContentItem`, `AgentConfig`, `RevenueMetric`
- **Admin API routes** (`/api/admin/agents/*`) sudah fungsional: dashboard stats, task CRUD, manual trigger, schedule management, content queue, social posts, LLM config + test connection
- **Everything-claude-code** punya skills siap pakai: `content-engine`, `article-writing`, `brand-voice`, `brand-discovery`
- **AgentConfig** mendukung custom `baseUrl` — bisa arahkan ke Ollama (`http://localhost:11434/v1`)

### Yang Kosong / Belum Dibangun
- `agent-work/` — folder utama agent, **belum ada file sama sekali**
- `content-pipeline/` — folder pipeline konten, **kosong**
- Tidak ada actual agent logic yang menjalankan task
- Tidak ada koneksi ke Ollama / local LLM
- Tidak ada cron scheduler untuk agent tasks
- Frontend admin dashboard agent belum ada

### Import yang Sudah Diharapkan Backend
```
agent-work/agent-marketing/scheduler.js   → triggerAgent()
agent-work/shared/revenue-tracker.js      → getCumulativeRevenue(), getRevenueMetrics(), getAgentRevenueStats()
agent-work/shared/agent-base.js           → getAgentStats()
agent-work/shared/llm-client.js           → resetConfigCache()
```

---

## Arsitektur yang Dibangun

```
agent-work/
├── shared/
│   ├── llm-client.js          # Unified LLM client (Ollama, OpenAI, Claude)
│   ├── agent-base.js          # Base class untuk semua agent
│   ├── revenue-tracker.js     # Revenue tracking & metrics
│   └── prompts.js             # Prompt templates
├── agent-marketing/
│   ├── index.js               # Marketing agent entry point
│   ├── scheduler.js           # Cron scheduler (node-cron)
│   ├── content-writer.js      # Content Creator Agent (fokus utama)
│   ├── seo-agent.js           # SEO content agent
│   └── social-media-agent.js  # Social media post generator
├── agent-ops/
│   ├── index.js               # Operations agent entry point
│   ├── email-agent.js         # Email campaigns
│   └── whatsapp-agent.js      # WhatsApp automation
└── run.js                     # CLI entry point untuk manual run

content-pipeline/
├── index.js                   # Pipeline orchestrator
├── generators/
│   ├── product-desc.js        # Deskripsi produk otomatis
│   ├── blog-post.js           # Blog post generator
│   ├── faq.js                 # FAQ generator
│   └── landing-page.js        # Landing page copy
├── templates/
│   └── (prompt templates per jenis konten)
└── publishers/
    ├── draft.js               # Save to DB sebagai DRAFT
    └── social.js              # Post ke social media (via API)
```

---

## Phase 1: Shared Infrastructure (Hari 1)

### 1.1 LLM Client (`agent-work/shared/llm-client.js`)
- Baca config dari `AgentConfig` table via Prisma
- Support Ollama (base URL: `http://localhost:11434/v1`) dan OpenAI-compatible APIs
- Auto-detect provider dari base URL
- Config caching + `resetConfigCache()` yang sudah di-import backend
- Retry logic (3 attempts, exponential backoff)
- Token counting & cost tracking

### 1.2 Agent Base (`agent-work/shared/agent-base.js`)
- `BaseAgent` class dengan lifecycle:
  - `init()` → load config, validate
  - `execute(input)` → run agent logic
  - `complete(output)` → save to AgentTask, generate report
  - `fail(error)` → save error state
- Automatic `AgentTask` record creation & status tracking
- `getAgentStats()` → aggregate stats dari AgentTask table

### 1.3 Revenue Tracker (`agent-work/shared/revenue-tracker.js`)
- `getCumulativeRevenue()` → total revenue dari RevenueMetric
- `getRevenueMetrics(start, end)` → daily metrics
- `getAgentRevenueStats()` → revenue per agent type
- Hitung revenue impact dari agent-generated orders (via `promoCode` di SocialPost & ContentItem)

### 1.4 Prompt Templates (`agent-work/shared/prompts.js`)
- Centralized prompt management
- Templates untuk: product description, blog post, social media, SEO, FAQ
- Brand voice integration (bisa load dari config atau pakai defaults)

---

## Phase 2: Content Creator Agent (Hari 2-3)

### 2.1 Content Writer Agent (`agent-marketing/content-writer.js`)
**Fokus utama** — agent yang menghasilkan konten.

**Jenis konten yang dihasilkan:**
| Jenis | Trigger | Output |
|-------|---------|--------|
| Product Description | Product baru ditambahkan / manual | ContentItem (type: product_desc) |
| Blog Post | Cron harian / manual | ContentItem (type: blog_post) |
| FAQ | Product update / manual | ContentItem (type: faq) |
| Tutorial | Cron mingguan / manual | ContentItem (type: tutorial) |
| Landing Page | Manual | ContentItem (type: landing_page) |

**Flow:**
1. Terima input (jenis konten, parameter, product ID jika ada)
2. Load context dari database (products, categories, existing content)
3. Generate prompt dengan template + context
4. Call LLM via llm-client
5. Post-process (extract meta title, description, keywords)
6. Simpan ke `ContentItem` sebagai DRAFT
7. Update `AgentTask` dengan status COMPLETED
8. Track cost di `AIUsage` equivalent

### 2.2 Social Media Agent (`agent-marketing/social-media-agent.js`)
- Generate social media posts dari ContentItem yang sudah PUBLISHED
- Platform: Instagram, TikTok, Twitter, Facebook
- Auto-generate promo code untuk revenue tracking
- Schedule posts via `SocialPost` model
- Format per platform (character limits, hashtags, etc.)

### 2.3 SEO Agent (`agent-marketing/seo-agent.js`)
- Analyze products → generate SEO-optimized content
- Generate meta titles, descriptions, keywords
- Suggest internal linking opportunities
- Output ke ContentItem dengan SEO fields filled

### 2.4 Scheduler (`agent-marketing/scheduler.js`)
- `triggerAgent(agentType, triggeredBy)` — fungsi yang sudah di-import backend
- Load schedules dari `AgentSchedule` table
- Register node-cron jobs berdasarkan `cronExpression`
- Support manual trigger dari admin

---

## Phase 3: Content Pipeline (Hari 3-4)

### 3.1 Pipeline Orchestrator (`content-pipeline/index.js`)
- Queue system sederhana (in-memory, bisa upgrade ke Bull/BullMQ nanti)
- Process content generation requests secara berurutan
- Rate limiting untuk LLM calls
- Retry failed generations

### 3.2 Generators
- **product-desc.js** — ambil data product dari DB, generate deskripsi menarik
- **blog-post.js** — generate blog post berdasarkan topik/keyword
- **faq.js** — generate FAQ dari product info
- **landing-page.js** — generate landing page copy

### 3.3 Publishers
- **draft.js** — save ke ContentItem sebagai DRAFT
- **social.js** — convert content ke social media format, save ke SocialPost

---

## Phase 4: Event-Driven & Cron Integration (Hari 4)

### 4.1 Event Triggers
- **Product created** → auto-generate product description
- **Order completed** → trigger review request content
- **New user registered** → trigger welcome email content
- Hook ke existing backend events di `backend/src/index.js`

### 4.2 Cron Jobs
- Tambahkan ke `backend/src/utils/cron_jobs.js`:
  - Daily content generation (blog posts, social media)
  - Weekly SEO audit
  - Monthly performance report

### 4.3 API Endpoints Baru
- `POST /api/agents/generate` — on-demand content generation
- `GET /api/agents/queue` — check pending content queue
- `POST /api/agents/agents/:id/retry` — retry failed tasks

---

## Phase 5: Frontend Dashboard (Hari 5)

### 5.1 Admin Agent Dashboard
- Overview: total tasks, success rate, cost, revenue impact
- Task list: filter by type, status, date
- Content queue: review, edit, approve DRAFT content
- Social media calendar: schedule & preview posts
- LLM config: manage API keys, test connections
- Revenue metrics: charts, KPIs

### 5.2 Components
- `AgentOverview.jsx` — stats dashboard
- `AgentTaskList.jsx` — task history table
- `ContentQueue.jsx` — content review/approve
- `SocialCalendar.jsx` — social media scheduler
- `AgentConfigPanel.jsx` — LLM configuration

---

## Phase 6: Ollama Setup & Testing (Hari 5-6)

### 6.1 Ollama Configuration
- Default config: `http://localhost:11434/v1`
- Model recommendations:
  - Content writing: `llama3.1:8b` atau `mistral:7b`
  - SEO analysis: `llama3.1:8b`
  - Quick tasks: `phi3:3.8b` atau `gemma2:2b`
- Auto-detect available models
- Fallback chain: Ollama → OpenAI (jika ada API key)

### 6.2 Testing
- Unit tests untuk llm-client (mock responses)
- Integration tests untuk content generation
- Load testing untuk queue system
- Manual testing via admin dashboard

---

## Dependencies

### NPM Packages (baru)
```json
{
  "node-cron": "^3.0.3",     // Sudah ada (digunakan di cron_jobs.js)
  "ollama": "^0.5.0"         // Ollama client (opsional, bisa pakai fetch langsung)
}
```

### Infrastructure
- Ollama terinstall dan running di `localhost:11434`
- Model sudah di-pull: `ollama pull llama3.1:8b`

---

## Implementation Order

```
Phase 1 (Hari 1)    ████████████████ Shared Infrastructure
Phase 2 (Hari 2-3)  ████████████████ Content Creator Agent
Phase 3 (Hari 3-4)  ████████████████ Content Pipeline
Phase 4 (Hari 4)    ████████████████ Event-Driven & Cron
Phase 5 (Hari 5)    ████████████████ Frontend Dashboard
Phase 6 (Hari 5-6)  ████████████████ Ollama & Testing
```

---

## Expected Outcomes

1. **Agent worker yang berjalan** sebagai long-running process
2. **Content generation otomatis** — produk baru langsung dapat deskripsi
3. **Social media scheduling** — konten terjadwal secara otomatis
4. **On-demand generation** — trigger via API kapan saja
5. **Revenue tracking** — tahu konten mana yang generate revenue
6. **Local LLM support** — berjalan di Ollama, tanpa dependensi cloud API
7. **Admin dashboard** — monitor dan kontrol semua agent dari frontend

---

## Risks & Mitigations

| Risiko | Mitigasi |
|--------|----------|
| Ollama lambat/timeout | Retry logic + fallback ke cloud LLM |
| Content quality kurang | Fine-tune prompts + human review workflow |
| Memory usage tinggi | Queue limit + batch processing |
| SQLite concurrency | Use WAL mode + connection pooling |

---

**Next step:** Approve plan ini, lalu mulai Phase 1 — Shared Infrastructure.
