# Physical Products Dropship — Design Spec

**Date:** 2026-06-27
**Status:** Approved

## Overview

Add physical product (barang fisik) capability to Markaz-Arshy, sourced via dropship from Jakmall (hidden/white-label). Products are synced automatically via Puppeteer-based CSV export from Jakmall Partner Portal. Orders are fulfilled manually or semi-automatically by admin.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Markaz-Arshy System                     │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐│
│  │ SMM       │  │ PREMIUM  │  │ PHYSICAL │  │ AI       ││
│  │ (existing)│  │(existing)│  │  (NEW)   │  │(existing)││
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘│
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Shared: Auth, Balance, Notification, Review     │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## 1. Database Changes

### New Model: `UserAddress`

```prisma
model UserAddress {
  id              Int       @id @default(autoincrement())
  userId          Int
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  label           String    // "Rumah", "Kantor", etc
  recipientName   String
  phoneNumber     String
  province        String
  city            String
  district        String
  village         String
  villageCode     String?
  fullAddress     String
  postalCode      String?
  isDefault       Boolean   @default(false)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  orders          Order[]   @relation("ShippingAddress")

  @@index([userId])
}
```

### New Model: `Cart` and `CartItem`

```prisma
model Cart {
  id              Int       @id @default(autoincrement())
  userId          Int       @unique
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  items           CartItem[]
}

model CartItem {
  id              Int       @id @default(autoincrement())
  cartId          Int
  cart            Cart      @relation(fields: [cartId], references: [id], onDelete: Cascade)
  productId       Int
  product         Product   @relation(fields: [productId], references: [id])
  quantity        Int       @default(1)
  selectedVariant Json?     // {"color": "Hitam", "size": "XL"}
  createdAt       DateTime  @default(now())

  @@unique([cartId, productId])
}
```

### Order Model — Additional Fields

```prisma
model Order {
  // ... existing fields ...

  // NEW FIELDS for PHYSICAL orders
  shippingAddressId   Int?
  shippingAddress     UserAddress? @relation("ShippingAddress", fields: [shippingAddressId], references: [id])
  shippingSnapshot    Json?       // Snapshot of address at order time
  courier             String?     // "jne", "jnt", "sicepat"
  courierService      String?     // "REG"
  courierServiceName  String?     // "Regular"
  shippingCost        Int?        // Ongkir amount
  resi                String?     // Resi number
  shippedAt           DateTime?
  deliveredAt         DateTime?
}
```

### Product — Additional Fields

```prisma
model Product {
  // ... existing fields (weight, length, width, height, variants, imageUrl already exist)

  // NEW
  stock               Int       @default(0)  // Stock count for PHYSICAL products
}
```

## 2. Routes (Backend API)

### Addresses (`/api/addresses`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/addresses` | List user's saved addresses |
| POST | `/api/addresses` | Create new address |
| PUT | `/api/addresses/:id` | Update address |
| DELETE | `/api/addresses/:id` | Delete address |
| PUT | `/api/addresses/:id/default` | Set as default |

### Cart (`/api/cart`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/cart` | Get user's cart |
| POST | `/api/cart/add` | Add item to cart (productId, quantity, selectedVariant) |
| PUT | `/api/cart/item/:id` | Update quantity |
| DELETE | `/api/cart/item/:id` | Remove item |
| DELETE | `/api/cart` | Clear cart |

### Orders — Physical Checkout (`/api/orders`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/orders/physical-checkout` | Create physical order (cartId, addressId, courier, service, shippingCost) |

### Shipping Cost (`/api/shipping`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/shipping/cost` | Calculate shipping via api.co.id (villageCode, weight, courier) |

### Admin Fulfillment (`/api/admin/physical-orders`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/physical-orders` | List all physical orders (with filters) |
| GET | `/api/admin/physical-orders/:id` | Get detail |
| PUT | `/api/admin/physical-orders/:id/process` | Set status to PROCESSING |
| PUT | `/api/admin/physical-orders/:id/ship` | Input resi → status SHIPPING |
| PUT | `/api/admin/physical-orders/:id/deliver` | Force DELIVERED |

### Cron Sync (`/api/admin/sync-jakmall`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/admin/sync-jakmall` | Manual trigger product sync |
| (cron) | `0 2 * * *` | Auto sync every 2 AM |

## 3. Frontend Pages & Components

### New Pages
| Page | Route | Description |
|------|-------|-------------|
| CatalogFisik | `/catalog/fisik` | Physical products listing with thumbnails |
| ProductDetailFisik | `/catalog/fisik/:slug` | Detail with variants, qty, add to cart |
| CheckoutPage | `/checkout` | Multi-step: address + courier + confirm |
| AddressPage | `/account/addresses` | Manage saved addresses |

### Modified Pages
| Page | Changes |
|------|---------|
| CatalogPage | Add "Barang Fisik" tab/route |
| Dashboard (user) | Add "Pesanan Fisik" section |
| AdminDashboard | Add "Pesanan Fisik" tab in admin panel |
| AdminAgents or standalone | Add fulfillment panel in admin |

### Components (New)
- `AddressForm` — Province→city→district→village cascading selectors
- `AddressCard` — Saved address display
- `CourierPicker` — Shipping cost options from api.co.id
- `CartDrawer` or `CartPage` — Cart view
- `PhysicalOrderCard` — Order card for physical orders in user dashboard
- `FulfillmentTable` — Admin table with process/ship actions

### Key Navigation Changes
- Header Nav: Add "Barang Fisik" link
- Admin Sidebar: Add "Pesanan Fisik" menu item

## 4. Sync System (Jakmall Puppeteer)

### Architecture
- Script: `backend/scripts/sync_jakmall_products.js` (existing, reused)
- Cron: Daily at 2 AM via `node-cron`
- Manual: Button in admin panel + API endpoint

### Data Mapping
| CSV Column | DB Field | Notes |
|-----------|----------|-------|
| Product ID | jakmallProductId | Unique key |
| Product Name | name | As-is (white-label) |
| Description | description | As-is |
| Price | priceUser | priceReseller = priceUser * 0.85 (auto) |
| Stock | stock | Direct |
| Category | → Category model | Auto-create if not exists, map name |
| Weight | weight | Grams |
| Length/Width/Height | length/width/height | CM |
| Image URLs | → Download to /public/images/jakmall/ | Local path in imageUrl |
| Variants | variants (JSON) | For color/size options |
| Shipping Info | shippingInfo (JSON) | Reference only |

### Sync Flow
1. Login to Jakmall Partner Portal (Puppeteer: headless Chromium)
2. Navigate to Export Master Produk page
3. Set filters: all products, Generic channel, CSV format
4. Download CSV file
5. Parse CSV row by row
6. For each row: download images, upsert product
7. Mark products not in CSV as `isActive = false`
8. Log results (created, updated, deactivated counts)

## 5. Checkout Flow

```
1. Product Detail Page
   ├── Select variant (if any)
   ├── Set quantity
   └── Click "Masukkan Keranjang"

2. Cart Page
   ├── View items, adjust qty
   └── Click "Checkout"

3. Checkout Page (3 Steps)
   Step 1: Shipping Address
   ├── Select saved address or add new
   ├── Province → City → District → Village selector
   └── Fill detail address + phone + recipient name

   Step 2: Shipping Method
   ├── System calls GET /api/shipping/cost
   ├── Display courier options + prices + ETD
   ├── User selects one
   └── Show total with shipping

   Step 3: Payment Confirmation
   ├── Order summary
   ├── Total = product price + shipping
   ├── "Bayar" button → deduct balance
   └── Success page with order info

4. Success / Order Detail
   └── Show order ID, status, shipping info
```

## 6. Order Status Lifecycle

```
PENDING ──→ PROCESSING ──→ SHIPPING ──→ DELIVERED
               │               │
               ▼               ▼
         (Admin clicks     (Admin inputs
          "Proses")         resi number)
                              │
                              ▼
                         DELIVERED (auto 7 days
                         after SHIPPING if user
                         doesn't confirm)
```

## 7. Error States & Edge Cases

| Scenario | Handling |
|----------|----------|
| API ongkir down | Show error toast: "Gagal memuat ongkir, coba lagi" — keep user on checkout |
| Stok = 0 | Disable add-to-cart, show "Stok Habis" badge |
| Saldo insufficient on checkout | Show balance vs total comparison, no deduction |
| Weight missing | Default 0 — show warning "Berat tidak diketahui" in admin |
| Sync fails | Log error, system uses last sync data, admin notified |
| Address missing villageCode | Show "Alamat belum lengkap" — recalculate |
| Image download fails | Skip image, use placeholder, log error |
| Jakmall portal changes | Catchable via Puppeteer selectors failing — log + alert admin |
| User doesn't confirm delivery | Auto-DELIVERED after 7 days grace period |
| Product discontinued in Jakmall | Set isActive = false, existing orders unaffected |

## 8. Implementation Order

Phased to keep each merge safe and focused:

### Phase 1 — Foundation (Database + Sync)
1. Prisma schema migration (UserAddress, Cart, CartItem, Order fields, Product.stock)
2. Fix & re-enable Jakmall sync script (Puppeteer CSV)
3. Admin manual sync button in admin panel
4. Cron schedule daily sync

### Phase 2 — Address & Shipping
5. Address CRUD API + frontend page
6. api.co.id shipping cost endpoint
7. Province → City → District → Village cascading selector component

### Phase 3 — Cart & Checkout
8. Cart API + frontend (add/remove/qty)
9. Checkout page (3-step flow)
10. Physical order creation endpoint
11. Balance deduction + balance transaction

### Phase 4 — Fulfillment
12. Admin physical orders panel (list, filter, process)
13. Input resi → SHIPPING
14. Order confirmation by user → DELIVERED
15. Admin override deliver
16. Auto-DELIVERED cron (7 days)

### Phase 5 — Polish
17. Notifications (user: status changes, admin: new orders)
18. Catalog page polish (sort, filter by category, search)
19. Dashboard user: physical order history
