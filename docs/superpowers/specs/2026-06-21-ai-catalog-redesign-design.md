# AI Router Catalog Redesign — Design Spec

## Overview

Redesign the `/catalog/ai-router` page with a modern, OpenRouter-inspired hybrid table-cards layout. All sections refreshed: hero, features strip, model catalog, pricing tiers, 3-step guide, and footer CTA.

## Style Direction

OpenRouter-style: clean, data-rich, developer-focused. Dark theme with neon accents (existing design system). Hybrid table-cards for model display.

## File to Modify

- `frontend/src/pages/AIRouterCatalog.jsx` — single file, full page rewrite

## Section Designs

### 1. Hero Section

- Full-width gradient background (`rgba(79,172,254,0.08)` → transparent)
- Badge pill: "AI Gateway — OpenAI Compatible" with Zap icon, cyan glow
- Title: "Semua Model AI" (gradient text `#4facfe → #00f2fe`) + line break + "Satu API Key" (white)
- Subtitle: description text in `--text-secondary`
- Quick Start code block: dark bg, monospace, copy button with success state
- CTA buttons: "Buat API Key" (primary, with Key icon) + "Lihat Dokumentasi" (secondary, with BookOpen icon) — conditionally rendered based on `user` state
- Padding: `80px 24px 60px`, max-width `800px` centered

### 2. Features Strip

- 4-column grid (`repeat(4, 1fr)`) inside `max-width: 1000px`
- Each feature: icon in colored circle (44px), title (14px bold), description (12px muted)
- Features: 1 API Key (#4facfe), OpenAI Compatible (#f59e0b), Real-time Usage (#8b5cf6), Rate Limiting (#22c55e)
- Padding: `40px 24px`, bottom border

### 3. Model Catalog (Main Redesign)

- **Header:** Title "Model Catalog" + model count + provider filter pills
- **Provider filter:** Horizontal pill buttons — "Semua" + each provider. Active state uses provider color
- **Table wrapper:** Glass card with `border-radius: 16px`, `overflow: hidden`
- **Table header row:** Grid layout `2fr 1.2fr 0.8fr 1fr 1fr 0.6fr`, uppercase 11px labels
- **Model rows:** Grid layout matching header
  - **Model column:** Provider colored dot (10px circle) + model name (15px semibold) + chevron
  - **Provider column:** Colored pill badge (provider name)
  - **Context column:** Right-aligned, e.g. "128K"
  - **Input Price column:** Right-aligned, primary price `formatPrice()` (Rp/1K), secondary `formatPricePerM()` (Rp/1M)
  - **Output Price column:** Same format as Input
  - **Speed column:** Colored pill (Fast=#22c55e, Balanced=#6366f1, Premium=#f59e0b)
  - **Action column:** Small "Use" button (primary color, copies model ID)
- **Row interaction:** Click to expand. Hover shows subtle background. Expanded row shows detail panel
- **Expanded detail:** Two-column layout
  - Left: Model ID (monospace code), Provider, Context Window, Input/Output prices with per-1M
  - Right: Code example (curl with model ID pre-filled) + Copy button

### 4. Pricing Tiers

- 3-column grid (`repeat(3, 1fr)`)
- Cards: glass background, `border-radius: 16px`, `padding: 28px`
- PRO card: `border: 2px solid #4facfe`, "Most Popular" badge on top
- Each card: tier name (colored), price (32px bold), description, rate limit badge, features list with green checkmarks
- Tiers: BASIC (Rp 0, 10 req/min), PRO (Rp 50.000/bulan, 60 req/min), ENTERPRISE (Custom, 300 req/min)

### 5. 3-Step Guide

- Vertical layout with step numbers in colored circles (48px)
- Steps: 1) Buat API Key, 2) Pilih Tool, 3) Mulai Coding!
- Each step: number circle + title (16px bold) + description (14px) + optional action link with ArrowRight
- Max-width `800px` centered

### 6. Footer CTA

- Gradient background (`transparent → rgba(79,172,254,0.05)`)
- Headline "Siap Memulai?" (32px bold)
- Subtitle + single CTA button (primary)
- Padding: `60px 24px`

## Pricing Format

- Database stores Rp per 1K tokens
- `formatPrice(pricePer1K)` → `Rp X` (per 1K)
- `formatPricePerM(pricePer1K)` → `Rp X` (per 1M, secondary text)

## Loading State

- Centered spinner with "Memuat AI models..." text

## Responsive

- Grid columns collapse on mobile (features: 2-col, pricing: 1-col)
- Table scrolls horizontally on mobile
- Hero CTA buttons stack vertically
