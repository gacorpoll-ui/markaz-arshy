# Design Doc: Follower Store & Akun Premium
**Tanggal:** 2026-06-17  
**Status:** Draft  
**Tech Stack:** Laravel 11 + Blade + SQLite + Filament v3  

---

## 1. Ringkasan Proyek

Website e-commerce yang menjual dua kategori produk:
1. **SMM Services** — Followers, likes, views untuk berbagai platform sosial media (Instagram, TikTok, YouTube, dll), diproses via API provider eksternal.
2. **Akun Premium** — Netflix, ChatGPT, Spotify, Disney+, dll., dengan sistem *Automatic Delivery* (user langsung mendapat detail akun di dashboard setelah pembayaran terverifikasi).

---

## 2. Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (Blade)                      │
│  Landing → Katalog → Keranjang → Checkout → Dashboard User  │
└──────────────────┬──────────────────────────────────────────┘
                   │ HTTP Request
┌──────────────────▼──────────────────────────────────────────┐
│                    LARAVEL 11 (Backend)                      │
│                                                              │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────────────┐  │
│  │   Auth     │  │  Order Engine│  │  Auto Delivery      │  │
│  │(Breeze/JWT)│  │  (SMM + Akun)│  │  (Akun Premium)     │  │
│  └────────────┘  └──────┬───────┘  └──────────┬──────────┘  │
│                         │                     │              │
│  ┌──────────────────────▼─────────────────────▼──────────┐  │
│  │               SQLITE DATABASE                          │  │
│  └────────────────────────────────────────────────────────┘  │
│                         │                                    │
│  ┌──────────────────────▼──────────────────────────────────┐ │
│  │              CRON / QUEUE JOBS                          │ │
│  │  - Cek status order SMM ke provider API                │ │
│  │  - Auto-kirim akun setelah payment confirmed           │ │
│  │  - Update saldo deposit user                           │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────┬──────────────────────────────────────────┘
                   │
       ┌───────────┴────────────┐
       │                        │
┌──────▼──────┐         ┌───────▼──────────┐
│ SMM Provider│         │  Payment Gateway  │
│  API (ext.) │         │  (Midtrans/Manual)│
└─────────────┘         └──────────────────┘
```

---

## 3. Modul & Fitur

### 3.1 Autentikasi (Laravel Breeze)
- Register / Login / Forgot Password
- Email verification
- Role: `user`, `reseller`, `admin`

### 3.2 Katalog Produk
- **Kategori:** SMM Services | Akun Premium
- **Subkategori SMM:** Instagram, TikTok, YouTube, Twitter, dll.
- **Subkategori Akun:** Netflix, ChatGPT, Spotify, dll.
- Setiap produk memiliki harga `user`, harga `reseller`, dan deskripsi.
- Untuk akun premium: tampilkan "Stok tersedia: X" (dihitung dari jumlah akun belum terjual).

### 3.3 Sistem Saldo (Deposit)
- User harus top-up saldo terlebih dahulu.
- Pembayaran deposit via **transfer manual** (konfirmasi oleh admin) atau **Midtrans** (otomatis).
- Riwayat mutasi saldo tersimpan di tabel `balance_transactions`.

### 3.4 Order Engine
**Order SMM:**
1. User pilih layanan → isi link target → konfirmasi.
2. Sistem kirim request ke SMM Provider API.
3. Simpan `provider_order_id` di database.
4. Cron Job tiap 5 menit cek status via API → update status order.
5. Status: `pending` → `processing` → `completed` / `failed`.

**Order Akun Premium:**
1. User pilih akun → checkout → potong saldo.
2. Sistem otomatis ambil 1 akun dari stok (`accounts` tabel, `is_sold = false`).
3. Tandai akun sebagai `is_sold = true`, simpan `user_id`.
4. Detail akun (email/pass) langsung muncul di halaman "Order Saya".

### 3.5 Dashboard User
- Ringkasan saldo
- Daftar order (SMM & Akun) + status real-time
- Detail akun yang sudah dibeli (hanya bisa dilihat oleh pemilik)
- Tombol "Cek Status" untuk refresh status order SMM

### 3.6 Admin Panel (Filament v3)
- Manajemen produk (CRUD)
- Manajemen stok akun premium (upload bulk via CSV)
- Manajemen order (lihat semua, tandai selesai/gagal manual)
- Konfirmasi deposit manual
- Manajemen user & saldo
- Pengaturan provider API (key, URL)
- Laporan penjualan (grafik harian/bulanan)

### 3.7 Sistem Reseller
- User bisa upgrade ke role `reseller` (manual oleh admin atau otomatis setelah deposit minimum).
- Reseller mendapat harga khusus yang lebih murah untuk semua produk.
- Panel reseller: bisa generate order untuk klien mereka sendiri.

---

## 4. Skema Database (SQLite)

### `users`
```
id, name, email, password, role (user/reseller/admin),
balance (decimal), email_verified_at, created_at, updated_at
```

### `categories`
```
id, name, slug, type (smm/premium), parent_id (nullable), icon, order, created_at
```

### `products`
```
id, category_id, name, slug, description,
price_user (decimal), price_reseller (decimal),
type (smm/premium), provider_service_id (nullable),
min_order (int), max_order (int), is_active (bool),
created_at, updated_at
```

### `accounts` (stok akun premium)
```
id, product_id, email, password, extra_info (text/JSON),
is_sold (bool), sold_to_user_id (nullable),
sold_at (nullable), created_at
```

### `orders`
```
id, user_id, product_id, type (smm/premium),
target_url (nullable), quantity (nullable),
account_id (nullable, FK ke accounts),
amount (decimal), status (pending/processing/completed/failed/refunded),
provider_order_id (nullable), provider_status (nullable),
notes (text), created_at, updated_at
```

### `balance_transactions`
```
id, user_id, type (deposit/deduction/refund),
amount (decimal), balance_before, balance_after,
description, reference_id (nullable), created_at
```

### `deposits`
```
id, user_id, amount, payment_method (manual/midtrans),
payment_proof (nullable, path gambar),
midtrans_token (nullable), status (pending/confirmed/rejected),
confirmed_by (nullable, admin user_id), confirmed_at (nullable),
created_at, updated_at
```

### `provider_settings`
```
id, name, api_url, api_key, is_active, created_at
```

### `site_settings`
```
id, key, value, created_at, updated_at
```

---

## 5. Alur Bisnis Utama

### Alur Order Akun Premium (Automatic Delivery)
```
User → Pilih Produk → Cek Stok → Cek Saldo
  → Kurangi Saldo → Ambil Akun Tersedia → Tandai Terjual
  → Buat Order (status: completed) → Tampilkan Detail Akun
```

### Alur Order SMM (via Provider API)
```
User → Isi Form (link + jumlah) → Cek Saldo
  → Kurangi Saldo → Kirim ke Provider API
  → Simpan provider_order_id → Status: processing
  → [CRON tiap 5 menit] → Cek status ke API
  → Update status order → Notifikasi user jika selesai
```

### Alur Deposit Manual
```
User → Pilih nominal → Lihat nomor rekening admin
  → Upload bukti transfer → Status: pending
  → [Admin konfirmasi di Filament] → Tambah saldo user
  → Status: confirmed → Notifikasi user
```

---

## 6. Tech Stack & Dependensi

| Komponen | Teknologi |
|---|---|
| Framework | Laravel 11 |
| Database | SQLite |
| Admin Panel | Filament v3 |
| Auth | Laravel Breeze |
| Frontend | Blade + TailwindCSS |
| Queue/Jobs | Laravel Queue (database driver) |
| Scheduler | Laravel Task Scheduling (Cron) |
| Payment | Midtrans (opsional, bisa mulai manual) |
| HTTP Client | Laravel Http (untuk SMM API) |
| File Storage | Laravel Storage (local) |

---

## 7. Struktur Direktori Laravel

```
app/
├── Http/Controllers/
│   ├── Auth/                  # Breeze controllers
│   ├── HomeController.php
│   ├── CatalogController.php
│   ├── OrderController.php
│   ├── DepositController.php
│   └── DashboardController.php
├── Models/
│   ├── User.php
│   ├── Category.php
│   ├── Product.php
│   ├── Account.php
│   ├── Order.php
│   ├── BalanceTransaction.php
│   ├── Deposit.php
│   └── ProviderSetting.php
├── Services/
│   ├── OrderService.php       # Logika utama pembuatan order
│   ├── BalanceService.php     # Mutasi saldo
│   ├── SmmProviderService.php # HTTP ke provider API
│   └── AccountDeliveryService.php # Auto delivery akun
├── Jobs/
│   └── CheckSmmOrderStatus.php    # Cron job cek status
└── Filament/Resources/        # Admin panel resources
    ├── UserResource.php
    ├── ProductResource.php
    ├── AccountResource.php
    ├── OrderResource.php
    ├── DepositResource.php
    └── SiteSettingResource.php

resources/views/
├── layouts/app.blade.php
├── home.blade.php
├── catalog/
│   ├── index.blade.php
│   └── show.blade.php
├── orders/
│   ├── create.blade.php
│   └── show.blade.php
├── dashboard/
│   ├── index.blade.php
│   └── orders.blade.php
└── deposits/
    └── create.blade.php
```

---

## 8. Keamanan

- Order detail akun (`accounts.password`) hanya tampil ke `user_id` yang sama dengan pembeli.
- Saldo tidak bisa negatif — ada pengecekan sebelum order dibuat (menggunakan database transaction).
- Admin panel (`/admin`) diproteksi middleware `auth + role:admin`.
- SMM API key disimpan di `provider_settings` tabel (bukan `.env`) agar bisa diubah via admin panel.
- Upload bukti transfer divalidasi: hanya `jpg/png`, max 2MB.

---

## 9. Fase Pembangunan (MVP → Lengkap)

### Fase 1 — MVP (2–3 minggu)
- [ ] Setup Laravel + SQLite + Filament + Breeze
- [ ] Migrations & Models
- [ ] Katalog produk (tampilan saja)
- [ ] Sistem saldo + deposit manual
- [ ] Order akun premium (automatic delivery)
- [ ] Dashboard user (lihat order & detail akun)
- [ ] Admin: konfirmasi deposit, manage stok akun

### Fase 2 — SMM Integration (1–2 minggu)
- [ ] Integrasi SMM Provider API
- [ ] Order SMM + Cron Job status checker
- [ ] Admin: manage order SMM

### Fase 3 — Polish & Monetisasi (1 minggu)
- [ ] Sistem reseller (role + harga khusus)
- [ ] Midtrans payment gateway
- [ ] Laporan penjualan di admin
- [ ] Halaman landing page yang menarik
- [ ] Email notifikasi (order selesai, deposit confirmed)

---

## 10. Definisi "Done" (MVP)

- ✅ User bisa register, login, top-up saldo manual
- ✅ Admin bisa konfirmasi deposit dan menambah stok akun
- ✅ User bisa order akun premium dan langsung melihat detail akun
- ✅ Semua data aman dan ter-isolasi per user
- ✅ Admin panel bisa CRUD semua data
