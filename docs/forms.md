# State of forms

Mental model (locked): Product (base price) + per-product form = buyer fills form →
live total → checkout → Order. No standalone forms, no drag-and-drop, no blank builder.

## Presets (`src/utils/formPresets.ts` — single source of truth)

`printing`, `shoe_wash`, `food_addons`, `services`, `custom` (empty starter).
Category map: food→food_addons, printing→printing, shoe_wash→shoe_wash,
repairs/rentals/custom→services. New products pre-fill; bulk apply covers
empty-only or overwrite-with-confirm. Backfilled live + in `seed.sql`.

Base-price convention: base = flat fee, modifiers add on top. Printing sellers should
set base to 0 and charge per page (RM0.10) + size/color modifiers. Old bases are never
migrated silently.

## Field types

`select` (single, modifiers) · `multiselect` (string[], modifiers summed) · `text` ·
`number` (optional `price_per_unit`, `min`, `max`) · `textarea` · `date` (`min` today) ·
`phone` (normalized to `+601…`) · `file` (upload, URL-or-path value).

`CustomField` = { id, label, type, required, enabled, options?, placeholder?,
price_per_unit?, min?, max? }. `enabled: false` hides a field everywhere but keeps it
for re-editing. Sellers tune labels/options/prices/required + add cards; types are locked.

## Pricing semantics

- `calculateModifierTotal`: select/multiselect matched-option sum; number =
  clamped value × price_per_unit; everything rounded to 2dp (`0.10 × 3 = 0.30`).
- Empty/NaN/negative numbers → 0 (empty short-circuits before min-clamp).
- `computeUnitTotal(base, fields, values)` = base + modifiers. Line = unit × qty
  (`MAX_QTY_PER_ITEM = 20`, `clampQty` floors + clamps).
- Per-field contribution: `priceForField` (same math, used for snapshots).

## Order snapshot (`src/utils/orderSnapshot.ts`)

`OrderItemSummary` carries `basePrice?` + `fields?: OrderFieldSnapshot[]`
({field_id, label, type, value, display, price_applied}), built by
`buildItemSnapshot` on the same pricing path as the total, so they can't disagree.

`custom_data` is written `{}` for new orders (column kept for the insert shape).
`normalizeOrderFields(order)` is the ONLY legacy reader: snapshot items → per-item
groups (+ tamper badge when |(base + Σmodifiers) × qty − lineTotal| > 0.01);
old label-keyed `custom_data` → one "Additional details" group. All consumers
(seller page, tracker, WhatsApp) go through it.

## WhatsApp (`src/utils/whatsapp.ts`)

Per-item lines `- Title x2 @ RM 2.95 = RM 5.90` + spec sub-lines
`- Label: display (+RM 1.00)`, then Total, Ref ID, `/seller/orders/:id` link.
**File values are names, never URLs** (rule; enforced by test).

## Uploads (`src/utils/uploadFile.ts`, bucket `buyer-uploads`)

Immediate upload on file select, 5MB + jpg/png/webp/pdf pre-check (bucket enforces
the same), path `shopId/uuid-name`, checkout blocked while uploading. Values stored
as paths (new) or legacy public URLs (old orders — still link until the bucket flips).

Privacy status: bucket is STILL PUBLIC until `0010_buyer_uploads_private.sql` is run
in Dashboard → SQL Editor (it makes SELECT owner-only via `shops.owner_id`; anon
INSERT kept). Code is already private-ready: seller page signs hour-long URLs on
demand with retry; tracker shows names only. Legacy public links keep rendering as
links pre-migration and should be revisited after it runs.

## Validation

`validateRequired` delegates to `validateField`: required-empty, MY mobile
(`normalizeMyPhone` → `+601…`, rejects landlines/short/long), date ≥ today
(device-local `todayLocal()`, ≈ Asia/Kuala_Lumpur assumption). Phone normalizes on
blur; checkout re-validates. Inline errors, checkout blocked until valid.

## RLS summary (forms-relevant)

Anon INSERT (status locked to `pending_verification` after 0011) + SELECT on `orders`
for the honor flow and tracker; anon UPDATE removed (0009) — status changes are
owner-authenticated only. Buyer tracker reads via `get_order()` RPC (no realtime sub;
5s visibility-aware polling) so anon bulk SELECT can go away with 0011.
`buyer-uploads`: anon INSERT open, SELECT public until 0010, then owner-only.
Never scope public reads to `anon` alone (breaks logged-in users).

## Pending manual steps (in order)

1. Deploy this frontend (client-generated order ids + RPC tracker must be live first).
2. Run `0010_buyer_uploads_private.sql`.
3. Run `0011_orders_privacy.sql`.
4. Verify: logged-out `/rest/v1/orders?select=*` empty · tracker link works + updates ·
   checkout works · seller sees own orders · old public file URLs 404.
