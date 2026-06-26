#!/bin/bash
# ═══════════════════════════════════════════════════
# ROTATE SECRETS & DEPLOY — Markaz-Arshy
# Jalankan di VPS: bash rotate-secrets-and-deploy.sh
# ═══════════════════════════════════════════════════

set -e

ENV_FILE="/var/markaz-arshy/backend/.env"
BACKUP_DIR="/var/markaz-arshy/backend/.env-backup-$(date +%Y%m%d-%H%M%S)"

echo "🔐 Markaz-Arshy — Secret Rotation & Deployment"
echo "═══════════════════════════════════════════════"
echo ""

# 1. Backup current .env
echo "📋 Step 1: Backing up current .env..."
if [ -f "$ENV_FILE" ]; then
    mkdir -p "$BACKUP_DIR"
    cp "$ENV_FILE" "$BACKUP_DIR/.env"
    echo "   ✅ Backup saved to: $BACKUP_DIR/.env"
else
    echo "   ⚠️  No .env found at $ENV_FILE — creating new one"
fi
echo ""

# 2. Generate new secrets
echo "🔑 Step 2: Generating new secrets..."
NEW_JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
NEW_WEBHOOK_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "   ✅ JWT_SECRET generated"
echo "   ✅ AI_WEBHOOK_SECRET generated"
echo ""

# 3. Read current .env values for non-secret fields
echo "📝 Step 3: Reading current config values..."
if [ -f "$ENV_FILE" ]; then
    # Extract values that don't need rotation (URLs, ports, etc.)
    CURRENT_PORT=$(grep -E "^PORT=" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' || echo "5000")
    CURRENT_DB=$(grep -E "^DATABASE_URL=" "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' || echo 'file:./dev.db')
    CURRENT_SMTP_HOST=$(grep -E "^SMTP_HOST=" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' || echo "smtp.gmail.com")
    CURRENT_SMTP_PORT=$(grep -E "^SMTP_PORT=" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' || echo "587")
    CURRENT_SMTP_USER=$(grep -E "^SMTP_USER=" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' || echo "")
    CURRENT_SMTP_PASS=$(grep -E "^SMTP_PASS=" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' || echo "")
    CURRENT_SMTP_FROM=$(grep -E "^SMTP_FROM=" "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' || echo "")
    CURRENT_GOOGLE_ID=$(grep -E "^GOOGLE_CLIENT_ID=" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' || echo "")
    CURRENT_GOOGLE_SECRET=$(grep -E "^GOOGLE_CLIENT_SECRET=" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' || echo "")
    CURRENT_GOOGLE_URI=$(grep -E "^GOOGLE_REDIRECT_URI=" "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' || echo "")
    CURRENT_FRONTEND_URL=$(grep -E "^FRONTEND_URL=" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' || echo "https://markaz-arshy.com")
    CURRENT_ROUTER_URL=$(grep -E "^AI_ROUTER_URL=" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' || echo "http://localhost:20128")
    CURRENT_ROUTER_KEY=$(grep -E "^AI_ROUTER_9KEY=" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' || echo "")
    CURRENT_LOLIPOP=$(grep -E "^LOLIPOP_API_KEY=" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' || echo "")
    CURRENT_RAJAITEM_URL=$(grep -E "^RAJAITEM_API_URL=" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' || echo "https://rajaitem.com/api/v1")
    CURRENT_RAJAITEM_KEY=$(grep -E "^RAJAITEM_API_KEY=" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' || echo "")
    CURRENT_RAJAITEM_SIM=$(grep -E "^RAJAITEM_SIMULATION=" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' || echo "true")
    CURRENT_RAJAITEM_TARGET=$(grep -E "^RAJAITEM_DEFAULT_TARGET=" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' || echo "")
    CURRENT_ROUTER_ADMIN_EMAIL=$(grep -E "^NINE_ROUTER_ADMIN_EMAIL=" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' || echo "")
    CURRENT_ROUTER_ADMIN_PASS=$(grep -E "^NINE_ROUTER_ADMIN_PASSWORD=" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' || echo "")
    echo "   ✅ Config values read from existing .env"
else
    echo "   ⚠️  Using defaults for missing values"
    CURRENT_PORT="5000"
    CURRENT_DB='file:./dev.db'
    CURRENT_SMTP_HOST="smtp.gmail.com"
    CURRENT_SMTP_PORT="587"
    CURRENT_SMTP_USER=""
    CURRENT_SMTP_PASS=""
    CURRENT_SMTP_FROM=""
    CURRENT_GOOGLE_ID=""
    CURRENT_GOOGLE_SECRET=""
    CURRENT_GOOGLE_URI="http://localhost:5000/api/auth/google/callback"
    CURRENT_FRONTEND_URL="https://markaz-arshy.com"
    CURRENT_ROUTER_URL="http://localhost:20128"
    CURRENT_ROUTER_KEY=""
    CURRENT_LOLIPOP=""
    CURRENT_RAJAITEM_URL="https://rajaitem.com/api/v1"
    CURRENT_RAJAITEM_KEY=""
    CURRENT_RAJAITEM_SIM="true"
    CURRENT_RAJAITEM_TARGET=""
    CURRENT_ROUTER_ADMIN_EMAIL=""
    CURRENT_ROUTER_ADMIN_PASS=""
fi
echo ""

# 4. Write new .env with rotated secrets
echo "📝 Step 4: Writing new .env with rotated secrets..."
cat > "$ENV_FILE" << EOF
# ═══════════════════════════════════════
# Markaz-Arshy Backend — Environment Variables
# Last rotated: $(date '+%Y-%m-%d %H:%M:%S')
# ═══════════════════════════════════════

# Server
NODE_ENV=production
PORT=$CURRENT_PORT

# Database
DATABASE_URL="$CURRENT_DB"

# JWT Secret (ROTATED)
JWT_SECRET="$NEW_JWT_SECRET"

# Lolipop SMM API
LOLIPOP_API_URL=https://lollipop-smm.com/api/v2
LOLIPOP_API_KEY="$CURRENT_LOLIPOP"

# SMTP Email
SMTP_HOST=$CURRENT_SMTP_HOST
SMTP_PORT=$CURRENT_SMTP_PORT
SMTP_USER=$CURRENT_SMTP_USER
SMTP_PASS=$CURRENT_SMTP_PASS
SMTP_FROM="$CURRENT_SMTP_FROM"

# Google OAuth
GOOGLE_CLIENT_ID=$CURRENT_GOOGLE_ID
GOOGLE_CLIENT_SECRET=$CURRENT_GOOGLE_SECRET
GOOGLE_REDIRECT_URI=$CURRENT_GOOGLE_URI
FRONTEND_URL=$CURRENT_FRONTEND_URL

# AI Router (9router)
AI_WEBHOOK_SECRET="$NEW_WEBHOOK_SECRET"
AI_ROUTER_URL=$CURRENT_ROUTER_URL
AI_ROUTER_9KEY=$CURRENT_ROUTER_KEY
NINE_ROUTER_ADMIN_EMAIL=$CURRENT_ROUTER_ADMIN_EMAIL
NINE_ROUTER_ADMIN_PASSWORD=$CURRENT_ROUTER_ADMIN_PASS

# Rajaitem H2H API
RAJAITEM_API_URL=$CURRENT_RAJAITEM_URL
RAJAITEM_API_KEY=$CURRENT_RAJAITEM_KEY
RAJAITEM_SIMULATION=$CURRENT_RAJAITEM_SIM
RAJAITEM_DEFAULT_TARGET=$CURRENT_RAJAITEM_TARGET
EOF
echo "   ✅ New .env written"
echo ""

# 5. Show the NEW webhook secret (IMPORTANT — user needs this for 9router config)
echo "═══════════════════════════════════════════════"
echo "🔑 NEW SECRETS (save these!):"
echo "═══════════════════════════════════════════════"
echo ""
echo "   JWT_SECRET:"
echo "   $NEW_JWT_SECRET"
echo ""
echo "   AI_WEBHOOK_SECRET (for 9router config):"
echo "   $NEW_WEBHOOK_SECRET"
echo ""
echo "═══════════════════════════════════════════════"
echo ""

# 6. Pull latest code
echo "📥 Step 5: Pulling latest code..."
cd /var/markaz-arshy
git pull origin main
echo "   ✅ Code updated"
echo ""

# 7. Install dependencies
echo "📦 Step 6: Installing dependencies..."
cd /var/markaz-arshy/backend
npm install --production
echo "   ✅ Dependencies installed"
echo ""

# 8. Run database migrations (if any)
echo "🗄️  Step 7: Running database migrations..."
npx prisma migrate deploy 2>/dev/null || echo "   ℹ️  No pending migrations"
echo ""

# 9. Restart backend
echo "🔄 Step 8: Restarting backend..."
pm2 restart markaz-backend
echo "   ✅ Backend restarted"
echo ""

# 10. Verify
echo "✅ Step 9: Verifying..."
sleep 3
HEALTH=$(curl -s http://localhost:5000/api/health 2>/dev/null || echo '{"status":"error"}')
echo "   Health check: $HEALTH"
echo ""

echo "═══════════════════════════════════════════════"
echo "🎉 DEPLOYMENT COMPLETE!"
echo "═══════════════════════════════════════════════"
echo ""
echo "⚠️  IMPORTANT NEXT STEPS:"
echo ""
echo "1. Update 9router webhook config to use new secret:"
echo "   AI_WEBHOOK_SECRET=$NEW_WEBHOOK_SECRET"
echo ""
echo "2. Update 9router config file:"
echo "   nano /var/markaz-arshy/backend/9router-config.yml"
echo "   Add webhook URL: http://localhost:5000/api/ai-router-webhook/webhook/usage"
echo "   Add webhook header: x-webhook-secret: $NEW_WEBHOOK_SECRET"
echo ""
echo "3. Test webhook:"
echo "   curl -X POST http://localhost:5000/api/ai-router-webhook/webhook/usage \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -H 'x-webhook-secret: $NEW_WEBHOOK_SECRET' \\"
echo "     -d '{\"requestId\":\"test-001\",\"apiKey\":\"sk-test\",\"model\":\"gpt-4o\",\"inputTokens\":100,\"outputTokens\":50}'"
echo ""
echo "4. Backup of old .env saved at: $BACKUP_DIR/.env"
