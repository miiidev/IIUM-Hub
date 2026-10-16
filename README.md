# IIUM Hub

Zero-cost, mobile-first campus marketplace connecting student vendors and buyers at IIUM.

- **Buyers:** browse shops → order → pay via DuitNow (honor-based Ref ID) → confirm over WhatsApp → live order tracking
- **Sellers:** `@live.iium.edu.my` signup → dashboard with order queue, stats, product + shop management, DuitNow Ref-ID cross-check

## Tech stack

React 19 + Vite + TypeScript + Tailwind CSS v4, Supabase (Postgres, Auth, Realtime), `wa.me` deep links. No backend server, no paid services.

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
