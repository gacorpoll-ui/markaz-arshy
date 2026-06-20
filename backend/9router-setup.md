# 9router Setup Guide for Markaz-Arshy AI Router

## 📦 Installation

### Step 1: Install 9router
```bash
# Download 9router (adjust URL based on actual 9router distribution)
# Example for Linux/Mac:
curl -L https://github.com/9router/9router/releases/latest/download/9router-linux -o 9router
chmod +x 9router

# Example for Windows:
# Download 9router.exe from releases page
```

### Step 2: Copy Configuration File
```bash
# Copy the config file from backend directory to 9router directory
cp backend/9router-config.yml ./9router-config.yml
```

### Step 3: Set Environment Variables
Create a `.env` file in the 9router directory:

```env
# AI Provider API Keys
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
GOOGLE_AI_API_KEY=AIzaSyxxxxxxxxxxxxx

# Webhook Secret (must match backend .env)
WEBHOOK_SECRET=your-webhook-secret-here-min-32-chars
```

### Step 4: Update Backend .env
Add these to `backend/.env`:

```env
# AI Router Configuration
AI_WEBHOOK_SECRET=your-webhook-secret-here-min-32-chars
AI_ROUTER_URL=http://localhost:8080
```

---

## 🚀 Running 9router

### Start 9router Server
```bash
./9router --config 9router-config.yml
```

Expected output:
```
[INFO] 9router starting...
[INFO] Loaded configuration from 9router-config.yml
[INFO] OpenAI provider: enabled
[INFO] Anthropic provider: enabled
[INFO] Google AI provider: enabled
[INFO] Webhook endpoint: http://localhost:5000/api/ai-router-webhook/webhook/usage
[INFO] Server listening on http://0.0.0.0:8080
[INFO] Health check available at http://localhost:8080/health
```

---

## 🧪 Testing the Integration

### Test 1: Health Check
```bash
curl http://localhost:8080/health
```

Expected response:
```json
{"status": "ok", "providers": ["openai", "anthropic", "google_ai"]}
```

### Test 2: Create API Key via Markaz-Arshy Backend
```bash
# Login first and get JWT token
TOKEN="your-jwt-token-here"

# Create an API key
curl -X POST http://localhost:5000/api/ai-router/keys/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "keyName": "Test Key",
    "tier": "PRO",
    "initialCredits": 10.0
  }'
```

Expected response:
```json
{
  "id": 1,
  "apiKey": "sk-mrkarsh-abc123...",
  "keyName": "Test Key",
  "tier": "PRO",
  "rateLimit": 60,
  "creditsBalance": 10.0
}
```

### Test 3: Make AI Request via 9router
```bash
API_KEY="sk-mrkarsh-abc123..."

curl -X POST http://localhost:8080/v1/chat/completions \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [
      {"role": "user", "content": "Say hello in 5 words"}
    ]
  }'
```

Expected response:
```json
{
  "id": "chatcmpl-...",
  "object": "chat.completion",
  "created": 1718757600,
  "model": "gpt-4o-mini",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! How are you today?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 8,
    "total_tokens": 18
  }
}
```

### Test 4: Verify Webhook Received
Check backend logs for:
```
[INFO] AI Webhook: Usage recorded for request req_abc123
[INFO] Deducted $0.00003 from API key sk-mrkarsh-abc123...
```

Check database:
```bash
cd backend
npx prisma studio
```

Navigate to:
- `AIUsage` table → Should see the request logged
- `AITransaction` table → Should see usage deduction
- `AIApiKey` table → `creditsBalance` should be reduced

---

## 🔧 Troubleshooting

### Problem: 9router fails to start
**Solution:** Check environment variables are set correctly in `.env`

### Problem: Webhook not received
**Solution:** 
1. Check `WEBHOOK_SECRET` matches between 9router and backend
2. Verify backend is running on port 5000
3. Check firewall/network settings

### Problem: API key validation fails
**Solution:**
1. Ensure API key exists in database (`AIApiKey` table)
2. Check `isActive = true`
3. Verify `creditsBalance > 0`

### Problem: Rate limit exceeded
**Solution:**
1. Check tier in `AIApiKey` table
2. Adjust rate limits in `9router-config.yml` if needed
3. Upgrade tier: BASIC (10 rpm) → PRO (60 rpm) → ENTERPRISE (300 rpm)

---

## 📊 Monitoring

### View Real-time Logs
```bash
# 9router logs
tail -f 9router.log

# Backend logs
cd backend && npm run dev
```

### Check Usage Statistics
```bash
# Get usage summary
curl http://localhost:5000/api/ai-router/usage/summary?apiKeyId=1 \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🎯 Next Steps

1. ✅ 9router installed and running
2. ✅ Webhook integration working
3. ✅ API key validation working
4. ⏭️ **Phase 3: Build Frontend UI**
   - AI Catalog page (`/catalog/ai-router`)
   - AI Dashboard (`/dashboard/ai-keys`)
   - Usage Analytics page

---

**Setup Complete!** Backend + 9router integration is now functional.
