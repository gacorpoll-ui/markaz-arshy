#!/bin/bash
# ═══════════════════════════════════════════════════════════
# Markaz Arshy — Quick Update Script
# Run this on your VPS to deploy latest changes
# ═══════════════════════════════════════════════════════════

set -e

echo "🚀 Deploying Markaz Arshy updates..."
echo "=========================================="

# Navigate to project directory
cd /var/markaz-arshy

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install --production

# Build frontend
echo "🔨 Building frontend..."
cd ../frontend
npm install
npm run build

# Restart backend with PM2
echo "🔄 Restarting backend..."
cd ../backend
pm2 restart markaz-backend

# Verify backend is running
sleep 2
if pm2 status | grep -q "markaz-backend.*online"; then
    echo "✅ Backend is running"
else
    echo "❌ Backend failed to start! Check logs: pm2 logs markaz-backend"
    exit 1
fi

# Test health endpoint
echo "🏥 Testing health endpoint..."
HEALTH=$(curl -s http://localhost:5000/api/health)
if echo "$HEALTH" | grep -q '"status":"ok"'; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed: $HEALTH"
fi

echo ""
echo "════════════════════════════════════════════════════"
echo "  ✅ Deployment complete!"
echo ""
echo "  Frontend: https://markaz-arshy.com"
echo "  API:      https://api.markaz-arshy.com"
echo "  Logs:     pm2 logs markaz-backend"
echo "════════════════════════════════════════════════════"
