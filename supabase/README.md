# Supabase setup for IIUM Hub

Source of truth for the database. The live project is configured via these files —
if the DB is ever wiped or a new environment is needed, re-apply in order:

1. `migrations/0001_init.sql` — tables, indexes, RLS policies, Realtime (paste into Dashboard → SQL Editor)
2. `migrations/0002_public_read_for_authenticated.sql` — extend public policies to `anon, authenticated`
3. `migrations/0003_buyer_uploads_bucket.sql` — `buyer-uploads` bucket + policies
4. `migrations/0004_custom_forms.sql` - LEGACY (history only): forms system, dropped by 0007
5. `migrations/0005_form_templates.sql` - LEGACY (history only): dropped by 0007
6. `migrations/0006_duitnow_and_order_columns.sql` - idempotent: `shops.duitnow_*`, `orders.items`, `orders.custom_data`
7. `migrations/0007_drop_legacy_forms.sql` - drops `forms`, `form_versions`, `form_submissions`
8. `seed.sql` — demo shops, products, test orders (one per status)

## Dashboard checklist (per environment)

- [ ] SQL: run `0001_init.sql`, the `0002`-`0007` migrations, then `seed.sql`
- [ ] Realtime: `orders` table must be in the `supabase_realtime` publication
  (the migration does `alter publication ... add table`; verify under Database → Replication)
- [ ] Auth → Providers → Email: turn OFF **Confirm email** for frictionless demo logins
- [ ] Auth → URL Configuration: whitelist the Vercel domain (email links redirect correctly)
- [ ] Storage: create public bucket `duitnow-qr` (checkout QR uploads) with policies:
  - `INSERT` for `authenticated` (sellers upload their own QR)
  - `SELECT` for `anon, authenticated` (buyers see QR at checkout)
- [ ] Storage: `buyer-uploads` is created by `migrations/0003_buyer_uploads_bucket.sql`
  (custom-field file uploads, 5MB + jpg/png/webp/pdf cap) with policies:
  - `INSERT` for `anon, authenticated` (buyers check out without login)
  - `SELECT` for `anon, authenticated` (anyone with the link; sellers via dashboard)

## RLS summary (honor-system for hackathon)

Public browse + buyer policies apply to `anon` **and** `authenticated` (scoping them to `anon`
alone breaks logged-in users — see `migrations/0002_public_read_for_authenticated.sql`).

| Table | anon + authenticated | authenticated (owner) |
|---|---|---|
| `shops` | read `is_active=true` | full access to own (`owner_id = auth.uid()`) |
| `products` | read `is_available=true` | full access to own shop's |
| `orders` | insert + read + update (open) | read + update own shop's |
| `profiles` | — | own row only |

Post-demo hardening: restrict anon `orders` select/update (currently open so buyer
tracker links and honor-flow checkout work without login).
