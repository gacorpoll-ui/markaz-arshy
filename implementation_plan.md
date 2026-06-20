# Plan: Integrasi 9router ke Markaz Arshy (Source Modification)

## Konsep
Modifikasi source 9router supaya `validateApiKey()` bisa call Markaz Arshy API
untuk validasi key `ma-*`.

## Flow
```
User: ai.markaz-arshy.com/v1 + ma-* key
  ↓
9router: extractApiKey() → validateApiKey()
  ↓
  1. Cek SQLite lokal (sk-* keys) → found? return
  2. Key mulai "ma-"? → call Markaz Arshy API
  3. Markaz Arshy API validasi di DB
  4. Return valid/invalid
  ↓
9router → AI Provider
```

## Perubahan

### 1. `9router/src/lib/db/repos/apiKeysRepo.js`
```javascript
export async function validateApiKey(key) {
  if (!key) return false;
  const db = await getAdapter();
  
  // Check local DB first
  const row = db.get(`SELECT isActive FROM apiKeys WHERE key = ?`, [key]);
  if (row) return row.isActive === 1 || row.isActive === true;
  
  // External validation for ma-* keys
  const externalUrl = process.env.EXTERNAL_VALIDATION_URL;
  if (externalUrl && key.startsWith('ma-')) {
    const response = await fetch(externalUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: key }),
    });
    const result = await response.json();
    return result.valid === true;
  }
  return false;
}
```

### 2. `9router/.env`
```
EXTERNAL_VALIDATION_URL=http://localhost:5000/api/ai-router/validate-key
EXTERNAL_VALIDATION_TIMEOUT=5000
```

## Status
- [x] Modifikasi source apiKeysRepo.js
- [x] Tambah .env config
- [ ] Install dependencies (npm install)
- [ ] Build and run from source
- [ ] Test with ma-* key
- [ ] Deploy to production

## User Experience
1. User daftar di markaz-arshy.com
2. Buat API key → dapat `ma-*` key
3. Pakai di Claude Code/Cline/Cursor
4. 9router validasi via Markaz Arshy API
5. User tidak tau tentang 9router (hidden backend)
