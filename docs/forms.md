# State of forms

Mental model (locked): Product (base price) + per-product form = buyer taps Add and
the form is shown immediately → live total → Review → Details → Pay → Order.
Nothing is hidden; Add is explicit. No standalone forms, no drag-and-drop, no blank
builder.

## Buyer flow (`Storefront` → `ProductSheet` → `CheckoutModal`)

Menu cards show title + price range (`formatRange(priceRange(...))`: "RM 5.00",
"RM 5.00 to RM 12.00", "From RM 5.00") + 48px Add. Plain products keep inline
steppers. Tapping Add (or Edit) opens `ProductSheet` (BottomSheet): live line total,
`<details>` price breakdown from the snapshot, qty stepper (min 1), primary
"Add to order · RM X" (Uploading… while busy, close blocked). Validation banner +
scroll-to-first-error on submit; closing discards the draft.
Checkout is Review (editable lines, re-validated on entry, Fix buttons) → Details →
Pay. Cart state: `Record<productId, {qty, values}>` (`src/utils/cart.ts`); one line
per product, no duplicate-option lines.

## Seller flow (`Products` → `ProductWizard` → `SellerFormConfigurator`)

New product = 3 steps (Details → Questions → Review) with progress indicator; editing
opens at Review. Questions step: preset cards (name, description, first 3 labels +
"+N more", Recommended badge) + copy-from-another-product (deep clone, confirm on
overwrite). Configurator shows the price-range header, `QuestionRow`s (label, plain
type name, Required/Optional, OFF, compact options/prices) opening
`QuestionEditorSheet` (label, toggles, options, number pricing, remove; type locked),
"Preview as buyer" in a sheet, and an Advanced details (JSON + add-question menu).
Shared bits: `BottomSheet.tsx`, `fieldLabels.ts` (plain type names), `formUi.ts`
(chips/quick-picks/error helpers).

## Presets (`src/utils/formPresets.ts` — single source of truth)

`printing`, `shoe_wash`, `food_addons`, `repairs`, `rentals`, `custom` (empty starter).
Category map: food→food_addons, printing→printing, shoe_wash→shoe_wash,
repairs→repairs, rentals→rentals, custom→custom. New products pre-fill; bulk apply
covers empty-only or overwrite-with-confirm. Backfilled live + in `seed.sql`.

Base-price convention: base = flat fee, modifiers add on top. Printing sellers should
set base to 0 and charge per page (RM0.10) + size/color modifiers. Old bases are never
migrated silently.

## Field types

`select` (single, modifiers) · `multiselect` (string[], modifiers summed) · `text` ·
`number` (optional `price_per_unit`, `min`, `max`, `integer`, `quickPicks`) · `textarea` ·
`date` (`min` today) · `phone` (normalized to `+601…`) · `file` (upload, URL-or-path value).

`CustomField` = { id, label, type, required, enabled, options?, placeholder?,
price_per_unit?, min?, max?, integer?, quickPicks? }. `integer: true` requires a whole
number and renders the stepper + quick-pick chips; `quickPicks` are the suggested values.
`enabled: false` hides a field everywhere but keeps it for re-editing. Sellers tune
labels/options/prices/required + add cards; types are locked.

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
