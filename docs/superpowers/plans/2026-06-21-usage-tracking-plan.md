# Usage Tracking Plan — Markaz-Arshy

## Temuan dari Analisis 9router

### Cara 9router Track Usage:
1. Request masuk → forward ke provider (OpenAI/Anthropic/Google)
2. Response diterima → extract token dari response body:
   - OpenAI format: `usage.prompt_tokens` + `usage.completion_tokens`
   - Anthropic format: `usage.input_tokens` + `usage.output_tokens`
   - Gemini format: `usageMetadata.promptTokenCount` + `candidatesTokenCount`
3. Streaming: count characters, estimate tokens = `chars / 4`, atau pakai token dari chunk terakhir
4. Record ke SQLite `usageHistory` table
5. **9router v0.5.4 TIDAK mengirim webhook** — config ada tapi belum diimplementasi

### Masalah di Markaz-Arshy Saat Ini:
- `proxy-ai.js` sudah record usage, TAPI:
  - Streaming fallback pakai `text.length / 4` (tidak akurat untuk Bahasa Indonesia)
  - Webhook endpoint ada tapi tidak ada yang kirim ke sana
  - Double-counting antara proxy dan webhook (sudah di-fix sebelumnya)

## Solusi: Single-Path Recording via Proxy

### Konsep:
- **Proxy adalah satu-satunya path** untuk record usage (bukan webhook)
- Proxy forward request ke 9router
- Proxy extract token dari response (sudah dilakukan)
- **Yang perlu diperbaiki**: Token extraction untuk streaming lebih akurat

### Yang Perlu Diubah:

#### 1. Streaming Token Extraction (proxy-ai.js)
**Masalah**: Saat streaming, jika 9router tidak kirim `usage` di chunk terakhir, proxy fallback ke `text.length / 4`. Untuk Bahasa Indonesia, ini sangat tidak akurat (bisa 2x lebih rendah dari aktual).

**Solusi**: 
- Parse SSE chunks untuk extract token dari `chunk.usage` jika ada
- Jika tidak ada, hitung dari content length dengan multiplier yang lebih baik
- Log peringatan jika pakai estimation

#### 2. Response Token Extraction Lebih Robust
**Masalah**: Proxy hanya check `data.usage.prompt_tokens` / `data.usage.completion_tokens`
**Solusi**: Tambah support untuk:
- `usage.input_tokens` (Anthropic)
- `usageMetadata.promptTokenCount` (Gemini)
- Fallback ke estimation jika tidak ada

#### 3. Webhook Dihapus
Karena 9router v0.5.4 tidak mengirim webhook, dan proxy sudah cukup, webhook endpoint bisa di-disable atau dihapus untuk mengurangi kompleksitas.

### Yang TIDAK Perlu Diubah:
- Database schema (AIUsage sudah benar)
- Frontend analytics (query sudah benar)
- Key management (sudah benar)
- Balance deduction (sudah atomic via $transaction)

## Backup & Execution

### Backup:
```bash
# Backup database
cp backend/prisma/dev.db backend/prisma/dev.db.backup-$(date +%Y%m%d)

# Backup code
cp -r backend/src/routes/proxy-ai.js backend/src/routes/proxy-ai.js.backup
```

### Execution Order:
1. Backup semua file yang akan diubah
2. Update `proxy-ai.js` — perbaiki streaming token extraction
3. Update `proxy-ai.js` — tambah robust response token extraction
4. Test dengan curl manual
5. Deploy

## Estimasi Perubahan:
- File yang diubah: `proxy-ai.js` saja
- Baris yang diubah: ~50-80 baris (streaming logic + token extraction)
- Risiko: Rendah (hanya mengubah cara extract token, tidak mengubah flow utama)
