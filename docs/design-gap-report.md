# IIUM Hub — Design gap report

Figma file `b6fwUPcdxlVuSStMBrVG5R`, page `0:1` (`Page 1`). Reviewed at 16 top-level
frames. Screenshots saved to `design/frames/`, asset crop to `design/assets/`, tokens to
`design/tokens.md`. All MCP-generated code is reference only and was **not** copied in.

## 1. Frame inventory

| # | Node | Frame name | Size | Saved | Readable |
|---|---|---|---|---|---|
| 00 | `1:2` | Style setup | 1440×1024 | `frames/00-style-setup.png` | yes (tokens) |
| 01 | `21:2591` | Shopping page - mobile | 390×2022 | `frames/01-shopping-mobile.png` | yes |
| 02 | `21:2342` | Shopping page - dekstop | 1440×1543 | `frames/02-shopping-desktop.png` | yes |
| 03 | `21:4389` | Bike Rental Maryam · Mobile order | 390×1098 | `frames/03-order-mobile.png` | yes |
| 04 | `21:4264` | Chicken Crispy Burger · Desktop order | 1440×1024 | `frames/04-order-desktop.png` | yes |
| 05 | `61:247` | Bike Rental Maryam · Desktop checkout | 1440×1117 | `frames/05-checkout-desktop.png` | yes |
| 06 | `48:31` | Welcome page - mobile | 390×844 | `frames/06-welcome-mobile.png` | yes |
| 07 | `45:45` | Welcome page - dekstop | 1440×1024 | `frames/07-welcome-desktop.png` | yes |
| 08 | `53:83` | Seller or Buyer page - dekstop | 1440×1024 | `frames/08-sellerbuyer-desktop.png` | yes |
| 09 | `60:536` | IIUM Hub · Log in · Mobile | 390×932 | `frames/09-login-mobile.png` | yes |
| 10 | `60:189` | Seller log in page - dekstop | 1440×1024 | `frames/10-login-desktop.png` | yes |
| 11 | `81:649` | Seller registration · Mobile | 390×1286 | `frames/11-signup-mobile.png` | yes |
| 12 | `81:559` | Seller registration · Desktop | 1440×1075 | `frames/12-signup-desktop.png` | yes |
| 13 | `60:582` | IIUM Hub · Logged out · Mobile | 390×932 | `frames/13-loggedout-mobile.png` | yes |
| 14 | `60:231` | IIUM Hub · Logged out | 1440×1024 | `frames/14-loggedout-desktop.png` | yes |
| 15 | `98:57` | image | 400×300 | `assets/frame-image-98-57.png` | **leftover / off-system** |

**Frames that disagree / unreadable:** `98:57` is a stray crop showing an **old navy-blue
button** (not part of the cream/emerald system) — excluded. No conflicting layouts between
frames; mobile and desktop variants are consistent. The mobile checkout is **absent** (only
a desktop checkout frame exists).

**Screens with NO Figma frame** (receive tokens/primitives but cannot be visually matched):
Order Tracker `/order/:id/track`, Seller Dashboard `/seller`, seller Products +
configurator `/seller/products`, Settings `/seller/settings`, seller order page
`/seller/orders/:id`, `SellerNav`, and the `ProductSheet` / `QuestionEditorSheet` bottom
sheets.

## 2. Screen map (frame → route → component → notes)

| Frame(s) | Route today | Component | Notes |
|---|---|---|---|
| 06, 07, 08 | *(none)* | *(none)* | Welcome + role choice: no route in the app (opens on Marketplace at `/`) |
| 09, 10 | `/login` | `pages/auth/Login.tsx` | restyle only |
| 11, 12 | `/signup` | `pages/auth/Signup.tsx` | restyle only |
| 13, 14 | *(none)* | *(none)* | logged-out confirmation page; app redirects on sign-out |
| 01, 02 | `/` | `pages/Marketplace.tsx` | restyle + static additions |
| 03, 04 | `/shop/:slug` | `pages/Storefront.tsx` (+ `components/buyer/ProductSheet.tsx`) | storefront + Order Summary |
| 05 | over `/shop/:slug` | `components/CheckoutModal.tsx` | design is a **full page**; ours is a 3-step modal |
| 00 | n/a | `src/index.css` | tokens |
| 15 | n/a | n/a | legacy, excluded |

## 3. Element table (non-restyle items)

Category key — **A** pure visual · **B** new static UI (no data/logic) · **C** UI for data
that already exists · **D** needs new data/backend/logic · **E** conflicts with the product
principles or the core loop.

### Marketplace (01, 02)

| ID | Element | Cat | Exists today | Handling decided | Effort | Risk |
|---|---|---|---|---|---|---|
| MKT-1 | Hero (pin overline, H1, sub-copy) | A/B | plain heading only | restyle + add static copy | S | low |
| MKT-2 | Search input + search button | D | none (category filter only) | **do not build**; omit the field (a dead search box is misleading) | M | med |
| MKT-3 | Mahallah dropdown filter | C | shops carry `mahalla`; filter may not exist | restyle iff a filter exists; otherwise show the control disabled (`// FALLBACK`) — decide below | M | med |
| MKT-4 | Category chips with icons | A | category filter exists (`utils/categories.ts`) | restyle | S | low |
| MKT-5 | "Open only" toggle + "Sort: Featured" | C/D | `is_active` exists; sorting does not | build "Open only" (C, client filter); **omit Sort** (D) | M | med |
| MKT-6 | Shop card (image, status pill, arrow) | C/D | card exists; `banner_url` exists | restyle; status from `is_active` (C); **image fallback** to lucide mark (`// FALLBACK`) | M | low |
| MKT-7 | "Sell here" CTA banner | B | none | static, implement | S | low |
| MKT-8 | Footer (logo, tagline, links) | B | none | static, implement | S | low |
| MKT-9 | Mobile bottom tab bar (Marketplace / How to order / Sell) | B/E | none | implement Marketplace + Sell; "How to order" → see MKT-10 | M | med |
| MKT-10 | "How to order" page (nav + footer link) | B (new route) | none | add a small static route, or omit the link — decide below | M | med |

### Storefront / Order (03, 04)

| ID | Element | Cat | Exists today | Handling decided | Effort | Risk |
|---|---|---|---|---|---|---|
| SF-1 | Breadcrumb | A | partial | restyle | S | low |
| SF-2 | Category overline + "Active" pill | C | `shop.category`, `shop.is_active` | show them | S | low |
| SF-3 | Product image block | D | `product.image_url` (0005/0014) | restyle existing image; fallback lucide icon (`// FALLBACK`) | S | low |
| SF-4 | Price range "RM x — RM y" + "varies by…" | C | `priceRange`/`formatRange` exist | restyle existing output only | S | low |
| SF-5 | **Inline qty stepper on an options product** | **E** | field-products open `ProductSheet` | **keep our structure** (design wins visuals, not layout) — logged | M | med |
| SF-6 | "How to order" strip (1·2·3) | B | none | static, implement | S | low |
| SF-7 | Order Summary (line, Edit items, Total, payment notice, WhatsApp btn) | A/E | cart bar + summary exist | restyle; payment notice from `duitnow_account` (C) | M | low |

### Checkout (05)

| ID | Element | Cat | Exists today | Handling decided | Effort | Risk |
|---|---|---|---|---|---|---|
| CO-1 | Full-page checkout vs modal | **E** | `CheckoutModal` (3-step) | keep the modal (Phase 3–5 structure wins); style it to read as a centred page/module | M | med |
| CO-2 | Step labels Pick items/Checkout/WhatsApp | **E** | ours: Review·Details·Pay | keep our step model; restyle the indicator visuals | S | low |
| CO-3 | Details fields (Full name, WhatsApp number) | E | ours: name + Mahalla/Room | keep ours (Mahalla/Room is the honour-system flow) | S | low |
| CO-4 | "Rental preferences" (date, pickup time, note) | D | none | **do not build** | L | high |
| CO-5 | "Payment details unavailable" notice | C | `duitnow_account` | show conditionally | S | low |
| CO-6 | Footer | B | none | static | S | low |

### Auth / on-boarding (06–14)

| ID | Element | Cat | Exists today | Handling decided | Effort | Risk |
|---|---|---|---|---|---|---|
| AU-1 | Login card visual | A | `Login.tsx` | restyle | M | low |
| AU-2 | "Forgot password?" link | D | none (no reset flow) | **do not build**; omit the link | S | med |
| AU-3 | "browse without logging in" copy | B | may exist | add copy | S | low |
| AU-4 | Signup form visual | A | `Signup.tsx` | restyle | M | low |
| AU-5 | Logged-out confirmation page (13, 14) | B/D | none (redirect) | **do not add a route**; keep the current redirect, optionally style the target | M | med |
| AU-6 | "Contact us" footer link | D/B | none | omit or point at nothing — decide below | S | low |
| WB-1 | Welcome landing (06, 07) | B/E | none | **do not add a blocking gateway** (changes entry flow) | L | med |
| WB-2 | Seller-or-Buyer role choice (08) | E | none (role chosen at login/signup) | skip | M | med |

### Global

| ID | Element | Cat | Exists today | Handling decided | Effort | Risk |
|---|---|---|---|---|---|---|
| GL-1 | Top nav (logo, Marketplace, How to order, Gombak, Sell here) | A/B | partial (`SellerNav`) | restyle + static links | M | low |
| GL-2 | Footer | B | none | static, implement | S | low |

## 4. UI states the design shows with no equivalent today

- **Shop "Open/Closed" status pill** — data exists (`is_active`) but is not shown as a pill.
- **Empty Order Summary** ("No items yet. Pick from the menu…", "Add items to enable
  checkout") — we have a disabled button but not this copy.
- **"Payment details unavailable" notice** — shop without DuitNow (data exists).
- **"All sample shops shown."** caption / catalog count ("6 sample shops", "1 item
  available").
- **How-to-order step strip** (1 Pick items › 2 Checkout › 3 WhatsApp).
- **Mobile bottom tab bar** with an active state.
- **"Not set up DuitNow yet"** message (vs our generic).

## 5. Copy differences (design vs app)

| Design | App today | Note |
|---|---|---|
| "IIUM Campus Marketplace" | Marketplace heading | align heading copy |
| "Sell here ↗" | "Sell" / signup link | align label |
| "Choose items and quantities before checkout." | storefront intro | align |
| "Review your order" | checkout step title | keep our steps; may adopt as the Review step title |
| "Send order via WhatsApp ↗" | submit button label | align |
| "How to order" | n/a | new |
| "IIUM Hub · Our campus marketplace" / "Made for the IIUM Gombak community" | none | new footer copy |
| "Welcome back" / "Register Seller Shop" | Login/Signup headings | align |

## 6. Contrast findings (proposed values only — NOT applied yet)

Computed against the final tokens; body text must reach 4.5:1, large text 3:1.

| Foreground | Background | Est. ratio | Verdict | Proposed |
|---|---|---|---|---|
| muted body `#7A8A82` *(est.)* | cream `#FFF8E7` | ~3.3:1 | **FAIL** | use `#56665D` (~5.0:1) for body; keep the lighter shade only for large text |
| input placeholder `#8A9A92` *(est.)* | white | ~3.0:1 | **FAIL (text)** | use `#6B7A72` |
| emerald `#065F46` | mint `#A7F3D0` | high | PASS | keep |
| white | emerald `#065F46` | ~7:1 | PASS | keep |
| emerald `#065F46` | cream `#FFF8E7` | high | PASS | keep |
| mint `#A7F3D0` text on emerald | — | check decorative only | keep for decorative |

The muted/placeholder colours are visual estimates from screenshots, so **verify with the
real values in Phase 8** before applying. Proposed shades are logged here, not silently
changed.

## 7. Font & asset licensing

- **Sofia Sans** — SIL Open Font License 1.1 (free, redistributable). Self-host woff2.
- No photographic assets supplied; all imagery is placeholder blocks → nothing to license.
- `98:57` legacy crop — not used.
- Icons — none shipped; reuse `lucide-react` (already a dependency).

## 8. Conflicts with the new form / checkout flow

1. **Options-on-card vs sheet (SF-5).** The design shows an inline quantity stepper on a
   product whose price "varies by size/add-ons". Our locked flow opens `ProductSheet` for
   any product with active fields. **Resolution: keep our structure; apply the design's
   visuals.** Requested-for-review.
2. **Full-page checkout (CO-1).** The design is a page; our checkout is a 3-step modal.
   **Resolution: keep the modal** (locked structure) and style it to read as a centred
   page on desktop.
3. **Step model (CO-2).** Design: Pick items / Checkout / WhatsApp. Ours: Review / Details
   / Pay. **Resolution: keep ours.**
4. **Checkout extra fields (CO-4).** Rental date/time/notes imply per-shop checkout fields
   the data model does not have — **not built**.
5. **Buyer details (CO-3).** Design asks WhatsApp number; ours asks Mahalla/Room (honour
   system). **Resolution: keep ours.**

## 9. Decisions for the owner (every D and E item)

| ID | Item | Recommendation | What a proper build needs |
|---|---|---|---|
| MKT-2 | Shop search | **Skip now.** Omit the field rather than ship a dead box. | Client-side name filter (no backend) — small, could add later. |
| MKT-3 | Mahallah filter | **Skip if no filter exists**; show a static "All Mahallahs" label or omit. | A client-side `shop.mahalla` filter + dropdown. |
| MKT-5 | "Open only" / Sort | **Build "Open only"** (pure client filter on `is_active`); **skip Sort**. | Sorting needs a ranking rule (featured/price) + data. |
| MKT-6 | Shop images | **Fallback only.** | Shop image upload + storage (product images exist; shop banner exists — extend). |
| MKT-9/10 | Bottom nav + "How to order" | **Add the tab bar (Marketplace, Sell);** make "How to order" a small static page OR drop the link. | A new `/how-to-order` route + static content. |
| SF-3 | Product images | Use existing `product.image_url`; fallback to a lucide mark. | Already have product images — just wire + style. |
| SF-5 | Options product stepper | **Keep the sheet.** | Would break the locked one-line-per-product model. |
| CO-1/2/3 | Checkout shape | **Keep our modal + steps + fields.** | Full-page/sectioned checkout + per-shop fields — a redesign of the core loop. |
| CO-4 | Rental date/time/note | **Skip.** | Per-shop checkout fields in the data model. |
| AU-2 | Forgot password | **Skip the link** (no reset flow). | Supabase password-reset flow + email templates. |
| AU-5 | Logged-out page | **Skip the route**; keep redirect. | A `/logged-out` route. |
| AU-6 | Contact us | **Skip or wire to an existing channel** (WhatsApp). | A contact route or `mailto`. |
| WB-1/2 | Welcome + role choice | **Skip the entry gateway** (changes the flow/pricacy). | A landing route + role routing. |
| — | Ratings, reviews, favourites, notifications, delivery fee, opening hours, chat, extra payment methods, dark mode | **Not shown in this design set** — nothing to build; listed for completeness. | Various backend features. |

## 10. Summary

- Pure visual (A): ~20 elements across 8 screens — restyle, no data.
- Static (B): hero/CTA copy, footers, How-to-order strip, tab bar labels.
- Existing-data display (C): shop status, mahallah/category, price range, DuitNow notice.
- New-data (D): shop search, sort, shop images, forgot-password, rental checkout fields,
  welcome/role routes — **not built**.
- Principle/loop conflicts (E): options-product stepper, full-page checkout, step model,
  checkout fields — **our structure kept, design applied visually only.**

## 11. Phase 7 outcome (what was actually built) + corrections

Corrections to the tables above (found while implementing):

- **MKT-2 (search) and MKT-3 (mahalla filter) already existed** in `Marketplace.tsx`
  (`q`/`mahalla` state + filtering). Reclassified **A (restyle)** — the design's search bar
  and Mahallah dropdown were built from the existing controls. The separate emerald search
  button is wired to focus the input (no dead control).
- **Routes:** Marketplace `/`, storefront `/s/:slug`, seller login `/seller/login`, signup
  `/seller/signup`, tracker `/order/:orderId/track` (the §2 map used placeholders).
- **MKT-5 Sort:** omitted (new logic). "Open only" also omitted — the query already returns
  active shops only.
- **MKT-9/MKT-10 (new):** a mobile tab bar (Marketplace / How to order / Sell) and a static
  `/how-to-order` page were added (category B).
- **AU-5 / WB-1 / WB-2 / AU-2:** logged-out page, welcome landing, role choice and
  forgot-password were **not** added (D/E). Login/Signup restyled only.
- Category chips follow `SHOP_CATEGORIES` (the design omits none now; Shoe Wash was removed from
  the product at the owner's request) — functionality over fidelity.

Built this phase:

- **A/B/C implemented:** nav + footer + tab bar; Marketplace hero/search/chips/shop cards/
  CTA; storefront breadcrumb/overline/Active pill/price-range/How-to-order strip/Order
  Summary; checkout modal restyle + step indicator; tracker; login/signup card restyle;
  seller shell, dashboard, products, configurator, question rows/editor, wizard, order page,
  settings; `ui/` primitives; `@theme` tokens; self-hosted **Sofia Sans**.
- **D skipped (with safe fallbacks):** shop search button (focus-only), no images → initial
  letter / lucide mark; no sort; no ratings/reviews/etc.
- **E: structure kept, visuals applied** (options-product sheet, modal checkout, Review/
  Details/Pay steps, name + Mahalla/Room fields).
- **Contrast:** body/muted text uses `#56665D` on cream (≥4.5:1); placeholders `#6B7A72`.
- **Verification:** built with a **fake** Supabase URL (live project never contacted) and
  screenshotted the public routes at 390px/1440px with headless Edge —
  `design/shots/01..06`. Confirmed the nav, hero, search, chips, cards, CTA, footer, tab bar,
  login card and How-to-order page match the frames.

### Follow-up (post-run) — Welcome + role pages built, routing changed

The owner asked for the two entry screens after the run, overriding the earlier E/D skip:

- **WB-1 Welcome** (`src/pages/Welcome.tsx`) and **WB-2 Seller-or-Buyer**
  (`src/pages/SellerOrBuyer.tsx`) are now built (frames `48:31`/`45:45` and `53:83`).
- **Routing changed to match the Figma entry flow:** `/` → Welcome, `/start` → role choice
  (Buyer → `/marketplace`, Seller → `/seller/login`), and **Marketplace moved to
  `/marketplace`**. All "Marketplace" links (header, tab bar, storefront/tracker back links,
  login/signup, 404) were repointed.
- Both screens use the cream→mint gradient and a staggered enter animation (see
  `docs/design-system.md` → Motion).
