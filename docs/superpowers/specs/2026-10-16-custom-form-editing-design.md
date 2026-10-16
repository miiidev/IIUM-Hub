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
4. Unify the add flow: remove the standalone "apply preset" bulk panel so the wizard
   is the single path for giving a product its questions.

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

### Unifying the add flow (`src/pages/seller/Products.tsx`)

The wizard already combines product details and its questions in one flow, so the
only thing making products and forms feel separate is the standalone panel on the
Products page: *"Preset X recommended for your shop category → Apply to empty
products / Overwrite all."* Remove it (and `handleBulkApply` plus the imports it
alone used). The wizard’s step 2 remains the single place a preset is chosen or
tuned.

Vocabulary stays "product" everywhere — the buyer surface (marketplace, storefront,
tracker) talks about products/services, and "form" describes only the questions on a
product. Trade-off, accepted: existing empty products must each be edited to gain
questions; there is no bulk backfill anymore.

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
  - existing presets and legacy products still edit and save unchanged;
  - the Products page shows no standalone "apply preset" panel, and adding a
    product reveals the preset choice only inside the wizard.

## Risks

- HTML5 drag does nothing on touch — accepted and covered by the arrow buttons.
- `QuestionRow` restructure — the tap zone must stay a 48px target and open the
  editor sheet exactly as before.
- Type conversion data loss — mitigated by the inline confirm naming what is lost.

## Follow-ups (not in scope)

Duplicate question; per-question help text; conditional logic — all explicitly
deferred.
