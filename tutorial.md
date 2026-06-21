# 🚀 Tutorial Menjalankan Website Markaz-Arshy

Panduan lengkap untuk menjalankan website **Markaz-Arshy** (Follower Store) di lokal maupun VPS.

---

## 📋 Prasyarat

Pastikan sudah terinstall:
- **Node.js 22 LTS** (https://nodejs.org)
- **npm** (sudah termasuk di Node.js)
- **Git** (https://git-scm.com)

---

## 1. Clone Repository

```bash
git clone https://github.com/PunoKawan/follower-store.git
cd follower-store
```

---

## 2. Setup Backend

### 2.1 Install Dependencies

```bash
cd backend
npm install
```

### 2.2 Konfigurasi Environment Variables

Edit file `backend/.env` dan isi nilai yang benar:

```env
# Server
NODE_ENV=development
PORT=5000

# Database (SQLite untuk development)
DATABASE_URL="file:./dev.db"

# JWT Secret (ganti dengan string acak yang kuat)
JWT_SECRET=your-super-secret-jwt-key-here

# Lolipop SMM API (daftar di https://lollipop-smm.com)
LOLIPOP_API_URL=https://lollipop-smm.com/api/v2
LOLIPOP_API_KEY=your-lollipop-api-key

# SMTP (Gmail App Password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com

# Google OAuth (dari Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback

# Frontend URL
FRONTEND_URL=http://localhost:5173

# AI Router
AI_WEBHOOK_SECRET=min-32-characters-long-secret-key-here!!
AI_ROUTER_URL=http://localhost:20128
AI_ROUTER_9KEY=your-9router-api-key
```

**Cara generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2.3 Database Setup

```bash
# Run migrations
npx prisma migrate dev

# Seed data test (opsional)
npm run db:seed
```

**Data seed yang dibuat:**
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@followerstore.com | admin123 |
| Reseller | reseller@followerstore.com | reseller123 |
| User | user@followerstore.com | user123 |

### 2.4 Jalankan Backend

```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

Backend berjalan di **http://localhost:5000**

---

## 3. Setup Frontend

### 3.1 Install Dependencies

```bash
cd ../frontend
npm install
```

### 3.2 Konfigurasi Environment Variables

Edit file `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_FRONTEND_BASE_URL=http://localhost:5173
VITE_AI_ROUTER_PUBLIC_URL=http://localhost:20128/v1
```

### 3.3 Jalankan Frontend

```bash
npm run dev
```

Frontend berjalan di **http://localhost:5173**

---

## 4. Akses Website

Buka browser dan akses:

| Halaman | URL |
|---------|-----|
| Homepage | http://localhost:5173 |
| Login | http://localhost:5173/login |
| Register | http://localhost:5173/register |
| Admin Panel | http://localhost:5173/admin |
| AI Router Catalog | http://localhost:5173/catalog/ai-router |
| AI Docs | http://localhost:5173/docs/ai |

---

## 5. Setup 9Router (AI Gateway) - Opsional

9Router adalah AI gateway untuk mengarahkan request ke OpenAI, Anthropic, dan Google AI.

### 5.1 Install 9Router

```bash
npm install -g 9router
```

### 5.2 Konfigurasi

Buat file `backend/9router-config.yml` (sudah ada di repo). Jalankan:

```bash
9router -c backend/9router-config.yml
```

9Router berjalan di **http://localhost:20128**

---

## 6. Deploy ke VPS

### 6.1 Persiapan VPS

- OS: Ubuntu 22.04 LTS
- RAM: minimal 1GB
- Port yang dibutuhkan: 22 (SSH), 80 (HTTP), 443 (HTTPS)

### 6.2 Jalankan Deploy Script

```bash
# Upload repo ke VPS
scp -r follower-store user@your-vps:/var/

# SSH ke VPS
ssh user@your-vps

# Jalankan deploy script
cd /var/follower-store
chmod +x deploy-vps.sh
sudo ./deploy-vps.sh
```

**Deploy script akan:**
1. Install Node.js 22, Nginx, PM2, Certbot
2. Konfigurasi Nginx sebagai reverse proxy
3. Setup SSL dengan Let's Encrypt
4. Install 9router sebagai systemd service
5. Jalankan backend dengan PM2

### 6.3 Konfigurasi DNS

Arahkan domain ke IP VPS:
```
api.markaz-arshy.com  →  IP VPS
markaz-arshy.com      →  IP VPS
```

### 6.4 Update Environment Variables

Di VPS, edit `/var/markaz-arshy/backend/.env` dengan production values:
- Ganti `JWT_SECRET` dengan secret baru
- Ganti `AI_WEBHOOK_SECRET` dengan secret baru
- Update `FRONTEND_URL` ke `https://markaz-arshy.com`
- Isi semua API keys yang valid

---

## 7. Perintah Berguna

### Database
```bash
cd backend

# Lihat database di browser
npx prisma studio

# Reset database
npx prisma migrate reset

# Buat migration baru
npx prisma migrate dev --name nama-migrasi
```

### Production
```bash
# Cek status backend
pm2 status

# Lihat log
pm2 logs markaz-backend

# Restart backend
pm2 restart markaz-backend

# Cek status 9router
sudo systemctl status 9router

# Restart 9router
sudo systemctl restart 9router
```

### Build Frontend
```bash
cd frontend
npm run build    # Output ke frontend/dist/
npm run preview  # Preview build lokal
```

---

## 8. Troubleshooting

### Port sudah digunakan
```bash
# Cari proses yang menggunakan port
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Database error
```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

### Frontend tidak bisa koneksi ke backend
- Pastikan backend berjalan di port 5000
- Cek `VITE_API_BASE_URL` di `frontend/.env`
- Pastikan CORS tidak diblokir

### 9Router error
```bash
# Cek log
journalctl -u 9router -f

# Restart service
sudo systemctl restart 9router
```

---

## 9. Struktur Project

```
follower-store/
├── backend/
│   ├── src/
│   │   ├── index.js          # Entry point
│   │   ├── db.js             # Prisma client
│   │   ├── routes/           # API routes
│   │   ├── middleware/        # Auth middleware
│   │   └── seed.js           # Database seed
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   └── dev.db            # SQLite database
│   ├── .env                  # Environment variables
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/            # React pages
│   │   ├── components/       # React components
│   │   ├── App.jsx           # Router config
│   │   └── main.jsx          # Entry point
│   ├── .env                  # Environment variables
│   └── package.json
├── deploy-vps.sh             # VPS deployment script
├── walkthrough.md            # Analisis lengkap project
└── tutorial.md               # Dokumen ini
```

---

## 📝 Catatan

- **SQLite** digunakan untuk development, gunakan **PostgreSQL** untuk production
- **API keys** jangan pernah commit ke git
- **Default passwords** hanya untuk development, ganti di production
- **9Router** opsional tapi diperlukan untuk fitur AI Router
