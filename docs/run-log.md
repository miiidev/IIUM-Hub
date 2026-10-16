# IIUM Hub Overhaul — Run Log

Branch: `overhaul` · Tag of starting commit: `pre-overhaul` (26fadab) · Never commit to `main`.

This file is the progress log and resume point. If the run is interrupted or context is reset,
read this first and resume from the first unchecked phase.

---

## Baseline (Phase 0 / A) — recorded before any change

Command results on `pre-overhaul` (26fadab), clean tree:

| Check | Result |
|---|---|
| `npm run lint` (oxlint) | 8 warnings (0 errors) |
| `npm run test` (vitest) | 8 files, 78 tests passed |
| `npm run build` | success (pre-existing >500 kB chunk warning) |
| `dist/index.html` | 0.50 kB / gzip 0.33 kB |
| `dist/assets/*.css` | 23.35 kB / gzip 5.45 kB |
| `dist/assets/*.js` | 597.77 kB / gzip 165.48 kB |

oxlint warnings at baseline (all warnings, none errors):
- `src/context/AuthContext.tsx:247` react(only-export-components)
- `src/components/BottomSheet.tsx:33` react(purity) — `Math.random`
- `src/components/BottomSheet.tsx:80` react(refs)
- `src/components/BottomSheet.tsx:64` react(refs)
- `src/pages/seller/Dashboard.tsx:64` react(purity) — `Date`
- `src/pages/OrderTracker.tsx:35` react(set-state-in-effect)
- `src/pages/Storefront.tsx:77` react(set-state-in-effect)
- `src/pages/seller/Settings.tsx:33` react(set-state-in-effect)

## Reconciliation note (IMPORTANT)

Reconnaissance showed the repository has advanced past the snapshot the overhaul brief was
written against. Prompt Phases 1–5 are **already implemented and green** on `main`. This run
therefore treats Phases 1–5 as an **audit + gap-fill** (no destructive re-implementation) and
keeps Phases 6–8 (Figma report, design application, polish) as the real build.

Evidence (file:line) is recorded in the Phase B checklist below.

---

## Phase checklist

- [x] **Phase A** — Safety + baseline (branch `overhaul`, tag `pre-overhaul`, this log)
- [x] **Phase B** — Audit Phases 1–5 vs code; fix only residual gaps (lint, docs drift)
- [ ] **Phase C** — Figma access + `docs/design-gap-report.md`
- [ ] **Phase D** — Apply design (tokens, fonts, `src/components/ui/`, buyer then seller)
- [ ] **Phase E** — Polish, `docs/design-system.md`, `docs/forms.md`, final report

---

## Phase B — audit result (Phases 1–5 verified against code)

Every prompt requirement in Phases 1–5 was checked against the working tree. Result: **all
present**, no re-implementation needed. Evidence:

| Requirement | Status | Evidence |
|---|---|---|
| Number validation (finite, min/max, `integer`, exact message) | DONE | `src/utils/formPresets.ts:328-360`; tests `formPresets.test.ts:311-353` (cases 0, -5, 1.5, 500, 501, 9999, "abc", "", with/without integer+min+max) |
| `integer?` on `CustomField`, kept in sanitize | DONE | `src/types/index.ts:52`; `formPresets.ts:408` |
| Printing preset `print_pages` integer + min/max | DONE | `formPresets.ts:74-85` |
| `orderTotalCheck` (tolerance 0.01, legacy→unknown) + badge | DONE | `src/utils/orderSnapshot.ts:22`; `SellerDashboard.tsx:7,218`; tests `orderSnapshot.test.ts:123-165` |
| Duplicate option block (case-insensitive, keep-first) | DONE | `ProductWizard.tsx:133` (`Duplicate option "…" in "…".`), `QuestionEditorSheet.tsx:63`; sanitize keep-first `formPresets.ts:392-403`; test `formPresets.test.ts:355` |
| `0008_duitnow_qr_bucket.sql` + README migration list | DONE | file present; `supabase/README.md` lists through `0014` |
| Client UUID order id + insert without `.select()` | DONE | `src/utils/uuid.ts` (getRandomValues fallback); `CheckoutModal.tsx:102,115` |
| `0011_orders_privacy.sql` (get_order RPC, drop anon SELECT, pending check) | WRITTEN, NOT APPLIED | `supabase/migrations/0011_orders_privacy.sql` (has the apply-order header) |
| OrderTracker via `rpc('get_order')` + 5s visible-aware polling | DONE | `OrderTracker.tsx:40,51,72,96` |
| Phase 3 utils (`BottomSheet`, `fieldLabels`, `priceRange`, `cart`, `formUi`) | DONE | files present + tests |
| Chips / radio cards / stepper / quick picks | DONE | `DynamicFormEngine.tsx`; `formUi.ts:11`; test `formUi.test.ts:24-37` |
| `ProductSheet` + cart + 3-step checkout | DONE | `components/buyer/ProductSheet.tsx`, `Storefront.tsx`, `CheckoutModal.tsx` |
| Seller `QuestionRow`/`QuestionEditorSheet`/`ProductWizard`/`copyFields` | DONE | files present; `formPresets.ts:197`; test `formPresets.test.ts:80` |

### Phase B fixes applied (residual gaps only)

1. **`BottomSheet.tsx`** — replaced `useRef(\`sheet-${Math.random()…}\`)` + `.current` reads
   during render with `useId()`. Resolves 3 oxlint warnings (react/purity + 2× react/refs),
   behavior unchanged. No test covers BottomSheet (no DOM lib), so verified by type-check +
   build + existing suite.
2. **`docs/forms.md`** — corrected preset drift (`services` → `repairs` + `rentals`) and the
   `CustomField` shape (added `integer?`, `quickPicks?` and the stepper/chips note).

Baseline 8 oxlint warnings → **5 now**.

### Deferred oxlint warnings (logged, not fixed — non-trivial or behavior-risky)

| Warning | Site | Why deferred |
|---|---|---|
| react(only-export-components) | `src/context/AuthContext.tsx:247` | Real fix = move `useAuth` + the context object into a new module and update 11 import sites. Not "trivial"; conservative rule applied. (Locked dir from Phase C, left as-is deliberately.) |
| react(purity) `Date` | `src/pages/seller/Dashboard.tsx:64` | `new Date().toDateString()` for "today" stats; no behavior-preserving trivial fix without a stored clock. |
| react(set-state-in-effect) | `src/pages/OrderTracker.tsx:35` | Guards missing `:orderId` route param; hoisting would change render/loading semantics. |
| react(set-state-in-effect) | `src/pages/Storefront.tsx:77` | Syncs highlight from `?product=`; effect also drives scroll + timeout. |
| react(set-state-in-effect) | `src/pages/seller/Settings.tsx:33` | Form hydration when `shop` loads; moving it risks saving stale values. |

Rules stay error-free (0 errors). Lint "green" = 0 errors; warnings are DX-only.

---

## Locked areas (from Phase 6 onward)

After Phase C begins, the following directories must have an EMPTY diff for the rest of the run:

```
git diff --stat -- supabase src/utils src/lib src/context src/types
```

Any incidental lint fixes in `src/context/` (or other locked dirs) must be done in Phase B,
before the lock. Log and revert if a design phase touches them.

## Locked logic (all phases)

`computeUnitTotal`, `calculateModifierTotal`, `buildItemSnapshot` (except storing the clamped
value), `normalizeOrderFields` core, `buildOrderMessage` + WhatsApp link, `uploadFile`, the
order insert payload shape, status `'pending_verification'`, post-submit navigation to
`/order/:id/track`, `custom_fields` shape (`CustomField[]`), one cart line per product.

---

## Decisions log (append-only)

_(Populated as the run proceeds.)_

- D-A1: Treated prompt Phases 1–5 as audit-only (they are already implemented and green).
- D-A2: Branch `overhaul` created from `main`; tag `pre-overhaul` on 26fadab.

## Deviations log

_(Populated as the run proceeds.)_

## Skipped / deferred

_(Populated as the run proceeds.)_

## Manual steps for the owner

Recorded during Phase B/C. Order is critical: **deploy the new frontend before running 0011.**

_(See Phase B privacy section; finalized in Phase E report.)_
