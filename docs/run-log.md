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
- [ ] **Phase B** — Audit Phases 1–5 vs code; fix only residual gaps (lint, docs drift)
- [ ] **Phase C** — Figma access + `docs/design-gap-report.md`
- [ ] **Phase D** — Apply design (tokens, fonts, `src/components/ui/`, buyer then seller)
- [ ] **Phase E** — Polish, `docs/design-system.md`, `docs/forms.md`, final report

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
