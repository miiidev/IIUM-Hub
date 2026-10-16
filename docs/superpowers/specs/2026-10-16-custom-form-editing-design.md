# Custom form editing — reorder, full type coverage, type changes

Date: 2026-10-16
Status: approved (design), pending spec review

## Context

The seller form builder currently uses presets + a plain question list
(`SellerFormConfigurator` → `QuestionRow` → `QuestionEditorSheet`). Drag-and-drop
was removed deliberately (twice) for mobile reasons and to avoid a blank builder.
`@dnd-kit` is gone from the project. Today the builder cannot:

- reorder questions at all,
- add `date` or `phone` questions (they exist only inside presets),
- change a question's type after creation.

Goal: close those three gaps while preserving the preset model, the buyer renderer,
and the existing data shape. No blank canvas, no new dependency.

## Scope

In:
1. Reorder questions — native HTML5 drag on desktop, plus always-available up/down
   buttons for touch/keyboard/screen readers.
2. Add `date` and `phone` as addable question types.
3. Change a question's type, converting and stripping incompatible config.
4. Unify the product/form flow: `Add product` is the single entry point and questions
   are always configured inside it. The parallel preset bulk-apply panel leaves the
   Products page and becomes a one-off action in Settings (next to Category).

Out (unchanged): preset picker, editor-sheet core fields, `DynamicFormEngine`
(already renders date/phone), snapshot/pricing paths, `products.custom_fields`
JSONB shape. No schema migration. No new npm dependency.

## Decisions (locked with the user)

- **Reordering mechanism:** native drag + buttons (Approach A). Phones reorder with
  arrows; desktops can drag. Zero dependency. Rationale: touch-drag is the least
  reliable interaction at 390px and was the original reason for removal.
- **Type change behaviour:** convert + strip incompatible config (not restrict, not
  reset). Keep `id`, `label`, `required`, `enabled`.
- **Confirmation style:** inline bar inside the editor sheet (no native
  `prompt`/`confirm`, consistent with the cancel-reason sheet).
- **Product vs form naming:** keep the noun "Product". Products and their forms are
  one entity (`products.custom_fields`); there are no standalone forms, and plain
  listings (no questions) are common, so "Add form" would mislead. The real fix for
  the "product then preset" feeling is removing the *parallel* preset panel from the
  Products page — not renaming. Preset choice then only ever happens inside the
  create/edit flow, where the wizard already marks the recommended preset.

## Design

### Pure helpers (`src/utils/formPresets.ts`)

- `reorderFields(fields, fromId, toId): CustomField[]` — move the field at `fromId`
  to `toId`'s position; no-op on unknown ids or same position.
- `moveField(fields, id, direction: -1 | 1): CustomField[]` — swap with the
  neighbour; no-op at the ends.
- `convertFieldType(field, newType): CustomField` — keeps `id/label/required/enabled`;
  - to choice (`select`/`multiselect`): seeds `options: [{ name: '', price_modifier: 0 }]`
    if none exist, keeps existing options;
  - to number: drops `options`, keeps `price_per_unit/min/max/integer/quickPicks`;
  - from number to non-number: drops `price_per_unit/min/max/integer/quickPicks`;
  - to non-text types: drops `placeholder`.
- `QUESTION_CARD_TYPES` extended with `{ type: 'date' }` and `{ type: 'phone' }`.

All three helpers are pure and unit-tested.

### Seller UI

- `QuestionRow`: restructure from a single `<button>` to a row containing a
  tap-to-edit zone, a decorative grip, and two 44px buttons
  (`aria-label="Move up"` / `"Move down"`). Nesting interactive elements inside a
  button is invalid HTML, hence the restructure.
- `SellerFormConfigurator`: the question list becomes reorderable — native
  `draggable` + `onDragStart/onDragOver/onDrop` for desktop drag, wired to
  `reorderFields`; up/down buttons wired to `moveField`. Add-question menu uses the
  extended type list.
- `QuestionEditorSheet`: the type badge becomes a type selector. When a switch would
  discard config, an inline confirm bar appears — e.g. *"This will clear 3 options.
  [Convert] [Keep type]"* — applying `convertFieldType` to the draft on confirm.
  Save persists through the existing `sanitizeFields`.

### Flow unification (product vs form)

- `Products.tsx`: remove the preset bulk-apply panel. The page keeps only
  "+ Add product" and the product grid, so adding a product is the single entry and
  no preset concept competes with it.
- `ProductWizard.tsx`: unchanged — step 2 already surfaces preset cards with the
  recommended badge, so preset choice happens inside creation/editing.
- `Settings.tsx`: gains a small one-off "Apply recommended preset to all products"
  action next to Category (which drives the recommendation), preserving the existing
  empty-only and overwrite-with-confirm behaviour.

### Data flow

Array order is the single source of truth for question order: it drives the buyer
render order and therefore the order snapshot. Reordering only mutates local
component state before the existing save path (`sanitizeFields` → `custom_fields`
JSONB). No persistence or schema change.

### Error handling

Reorder helpers are total (no-ops on invalid input). Save validation is unchanged
(labels present, choice questions have ≥1 option, no duplicate option names).
Type-change conversion happens on the draft, so an abandoned edit changes nothing.

### Testing

- Unit: `reorderFields` (move to position, unknown id, same position), `moveField`
  (swap, both ends), `convertFieldType` (each direction, config retained vs
  stripped, option seeding), and the extended `QUESTION_CARD_TYPES` list.
- UI: manual phone checklist (Vitest here has no DOM):
  - reorder by arrows on a phone; reorder by drag on desktop;
  - add Date and Phone questions and see them render for the buyer with validation;
  - change Choice → Number (options cleared, inline confirm shown) and back;
  - existing presets and legacy products still edit and save unchanged.

## Risks

- HTML5 drag does nothing on touch — accepted and covered by the arrow buttons.
- `QuestionRow` restructure — the tap zone must stay a 48px target and open the
  editor sheet exactly as before.
- Type conversion data loss — mitigated by the inline confirm naming what is lost.

## Follow-ups (not in scope)

Duplicate question; per-question help text; conditional logic — all explicitly
deferred.
