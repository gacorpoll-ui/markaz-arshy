#!/bin/bash
# ═══════════════════════════════════════════════════════════
# Markaz Arshy — VPS Deployment Script
# Run this on your VPS server
# ═══════════════════════════════════════════════════════════

set -e

echo "🚀 Markaz Arshy Deployment Starting..."
echo "=========================================="

# 1. System Update
echo "📦 Updating system..."
apt update && apt upgrade -y

# 2. Install dependencies
echo "📦 Installing Node.js, Nginx, PM2..."
apt install -y curl nginx certbot python3-certbot-nginx

# Install Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

# Install PM2 globally
npm install -g pm2

echo "✅ Dependencies installed"
echo "   Node: $(node --version)"
echo "   npm: $(npm --version)"
echo "   Nginx: $(nginx -v 2>&1)"

# 3. Clone repository
echo ""
echo "📥 Cloning repository..."
cd /var
rm -rf markaz-arshy 2>/dev/null || true
git clone https://github.com/gacorpoll-ui/markaz-arshy.git
cd markaz-arshy/backend

# 4. Setup environment
echo "⚙️ Setting up environment..."
cp .env.example .env 2>/dev/null || true

# Generate secure secrets if not set
JWT_SECRET=$(openssl rand -hex 32)
AI_WEBHOOK_SECRET=$(openssl rand -hex 32)

# Update .env with production values
sed -i "s|DATABASE_URL=.*|DATABASE_URL=\"postgresql://markaz:$(openssl rand -hex 16)@localhost:5432/markaz_arshy?schema=public\"|" .env
sed -i "s|JWT_SECRET=.*|JWT_SECRET=\"$JWT_SECRET\"|" .env
sed -i "s|AI_WEBHOOK_SECRET=.*|AI_WEBHOOK_SECRET=\"$AI_WEBHOOK_SECRET\"|" .env
sed -i "s|AI_ROUTER_URL=.*|AI_ROUTER_URL=\"http://localhost:20128\"|" .env

# Add 9router key if not present
if ! grep -q "AI_ROUTER_9KEY" .env; then
    echo 'AI_ROUTER_9KEY=""  # Fill with your 9router API key' >> .env
fi

# Add 9router admin credentials if not present
if ! grep -q "NINE_ROUTER_ADMIN_EMAIL" .env; then
    echo 'NINE_ROUTER_ADMIN_EMAIL=""  # Fill with 9router admin email' >> .env
    echo 'NINE_ROUTER_ADMIN_PASSWORD=""  # Fill with 9router admin password' >> .env
fi

echo "✅ Environment configured"

# 5. Install backend dependencies
echo ""
echo "📦 Installing backend dependencies..."
npm install

# 6. Setup 9router
echo ""
echo "🤖 Setting up 9router..."
cd /var
npm install -g 9router

# Create 9router systemd service
cat > /etc/systemd/system/9router.service << 'EOF'
[Unit]
Description=9router AI Gateway
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/markaz-arshy
ExecStart=/usr/bin/node /usr/lib/node_modules/9router/app/custom-server.js
Restart=always
RestartSec=5
Environment=PORT=20128
Environment=NODE_ENV=production
Environment=REQUIRE_API_KEY=false
Environment=JWT_SECRET=change-me-in-production
Environment=INITIAL_PASSWORD=change-me-in-production

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable 9router
systemctl start 9router

echo "✅ 9router started on port 20128"

# 7. Setup Nginx
echo ""
echo "🌐 Configuring Nginx..."

# Remove default config
rm -f /etc/nginx/sites-enabled/default

# Create Markaz Arshy config
cat > /etc/nginx/sites-available/markaz-arshy << 'NGINX'
# Markaz Arshy — Nginx Configuration
# Handles: api.markaz-arshy.com (AI API) + markaz-arshy.com (frontend)

# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=chat:10m rate=5r/s;

# Backend upstream
upstream backend {
    server 127.0.0.1:5000;
    keepalive 32;
}

# 9router upstream
upstream nine_router {
    server 127.0.0.1:20128;
    keepalive 32;
}

# ─── HTTP → HTTPS redirect ──────────────────────────────
server {
    listen 80;
    listen [::]:80;
    server_name api.markaz-arshy.com markaz-arshy.com;

    # Certbot challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# ─── API Server (api.markaz-arshy.com) ─────────────────
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.markaz-arshy.com;

    # SSL (managed by certbot)
    ssl_certificate /etc/letsencrypt/live/api.markaz-arshy.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.markaz-arshy.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;

    # ─── /v1/* → Backend AI Proxy ───────────────────────
    location /v1/ {
        limit_req zone=api burst=20 nodelay;

        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # SSE streaming support
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 300s;

        # Large body for Claude Code system prompts
        client_max_body_size 10m;
    }

    # ─── /api/* → Backend ──────────────────────────────
    location /api/ {
        limit_req zone=api burst=20 nodelay;

        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        client_max_body_size 10m;
    }

    # ─── Direct 9router access (admin only) ─────────────
    location /9router/ {
        # Restrict to admin IPs
        allow 127.0.0.1;
        allow ::1;
        # Add your admin IP here:
        # allow YOUR_ADMIN_IP;
        deny all;

        proxy_pass http://nine_router/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # ─── Health check ──────────────────────────────────
    location /health {
        proxy_pass http://backend/api/health;
    }

    # ─── Default ───────────────────────────────────────
    location / {
        return 404 '{"error": "Not found"}';
        add_header Content-Type application/json;
    }
}

# ─── Frontend Server (markaz-arshy.com) ────────────────
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name markaz-arshy.com;

    ssl_certificate /etc/letsencrypt/live/markaz-arshy.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/markaz-arshy.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    root /var/markaz-arshy/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINX

# Enable site
ln -sf /etc/nginx/sites-available/markaz-arshy /etc/nginx/sites-enabled/

# Test nginx config
nginx -t

echo "✅ Nginx configured"

# 8. SSL Certificate
echo ""
echo "🔒 Setting up SSL certificates..."
certbot --nginx -d api.markaz-arshy.com -d markaz-arshy.com --non-interactive --agree-tos --email admin@markaz-arshy.com || true

# 9. Start backend with PM2
echo ""
echo "🚀 Starting backend..."
cd /var/markaz-arshy/backend

# Stop existing PM2 processes
pm2 delete all 2>/dev/null || true

# Start backend
pm2 start src/index.js --name "markaz-backend" -i max

# Save PM2 config
pm2 save
pm2 startup

echo "✅ Backend started"

# 10. Configure firewall
echo ""
echo "🔥 Configuring firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo ""
echo "✅ Deployment complete!"
echo ""
echo "════════════════════════════════════════════════════"
echo "  🎉 Markaz Arshy is live!"
echo ""
echo "  Frontend: https://markaz-arshy.com"
echo "  API:      https://api.markaz-arshy.com"
echo "  Health:   https://api.markaz-arshy.com/api/health"
echo ""
echo "  9router:  http://localhost:20128 (internal)"
echo "  Backend:  http://localhost:5000 (internal)"
echo ""
echo "  Nginx:    systemctl status nginx"
echo "  PM2:      pm2 status"
echo "  Logs:     pm2 logs markaz-backend"
echo "════════════════════════════════════════════════════"
