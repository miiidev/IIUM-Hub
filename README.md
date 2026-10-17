# IIUM Hub

Zero-cost, mobile-first campus marketplace connecting student vendors and buyers at IIUM.

- **Buyers:** browse shops → order → pay via DuitNow (honor-based Ref ID) → confirm over WhatsApp → live order tracking
- **Sellers:** `@live.iium.edu.my` signup → dashboard with order queue, stats, product + shop management, DuitNow Ref-ID cross-check

## Tech stack

**Core:** React 19 + Vite 8 + TypeScript 6 + Tailwind CSS v4, Supabase (Postgres, Auth, Storage, Realtime), `wa.me` deep links. No backend server, no paid services.

### Runtime dependencies (5 total)

| Dependency | Role |
|---|---|
| `react` / `react-dom` 19 | UI |
| `react-router-dom` 7 | Routing (`/`, `/s/:slug`, `/order/:id/track`, seller dashboard) |
| `@supabase/supabase-js` | Database, Auth, Storage, Realtime client |
| `lucide-react` | Icons |

### Tooling

| Tool | Role |
|---|---|
| Vite 8 | Dev server + production build |
| TypeScript 6 (`tsc -b`) | Typecheck gated into `npm run build` |
| Tailwind CSS v4 | Styling, via `@tailwindcss/vite` plugin |
| Vitest 5 | Unit tests (83 tests / 8 files) |
| oxlint | Linting |

### Backend (Supabase — no server code)

- **Postgres schema** — 4 tables (`shops`, `products`, `orders`, `profiles`), evolved through 15 versioned migrations in `supabase/migrations/`
- **Row Level Security** — sellers manage only their own shop; anonymous bulk order reads blocked via a `security definer` RPC (`get_order`)
- **Realtime** — `orders` table broadcasts status changes to the live tracker
- **Storage** — private `buyer-uploads` and DuitNow QR buckets; seller file access via short-lived signed URLs

### Integrations

- **DuitNow** — Malaysia's national payment QR; buyers pay directly, sellers cross-check the transaction Ref ID (honor-based, zero gateway fees)
- **WhatsApp (`wa.me` deep links)** — checkout generates a pre-filled structured order message (items, per-field prices, DuitNow Ref ID, manage-order link) sent to the seller

## Setup

```bash
npm install
cp .env.example .env   # fill in your Supabase URL + publishable key
npm run dev
```

Database schema + seed data live in Supabase — tables: `shops`, `products`, `orders`, `profiles`
(`shops.owner_id` links one shop per seller). Enable **Realtime on `orders`**, and for
frictionless demo logins turn OFF **Authentication → Providers → Email → Confirm email**.

```bash
npm run build   # typecheck + production build
```

## Deploy (Vercel)

Import this repo in Vercel (framework: Vite). `vercel.json` already handles SPA rewrites.
Set env vars `VITE_PUBLIC_SUPABASE_URL` and `VITE_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
and whitelist the Vercel domain under Supabase **Authentication → URL Configuration**.

## Routes

| Route | Who |
|---|---|
| `/` | Marketplace (search, Mahalla filter, categories) |
| `/s/:slug` | Storefront (steppers or JSONB custom form + sticky checkout) |
| `/order/:orderId/track` | Buyer live tracker (Realtime) |
| `/seller/signup`, `/seller/login` | Seller auth (`@live.iium.edu.my` only) |
| `/seller` | Dashboard (stats + order queue) |
| `/seller/products`, `/seller/settings` | Product + shop management |
| `/seller/orders/:orderId` | Per-order Confirm/Reject control (ownership-checked) |
