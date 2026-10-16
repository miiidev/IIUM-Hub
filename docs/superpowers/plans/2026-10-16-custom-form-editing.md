# Custom Form Editing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let sellers reorder questions, add date/phone questions, change a question's type, and give a product its questions through exactly one path.

**Architecture:** Three pure helpers (`reorderFields`, `moveField`, `convertFieldType`) plus an impact helper carry all logic and are unit-tested. The seller UI is a reorderable question list (native drag on desktop + always-available up/down buttons) and an editor sheet with a type selector that confirms before discarding config. The standalone "apply preset" panel is removed so the wizard is the only place questions are chosen.

**Tech Stack:** React 19 + Vite + TypeScript + Tailwind v4; Vitest (node env, no DOM) + oxlint; zero new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-16-custom-form-editing-design.md`

## Global Constraints

- Zero cost, no new npm dependencies (do not re-add `@dnd-kit`).
- Mobile-first at 390px; interactive targets ≥44px (≥48px for primary rows).
- English UI. No code comments in source files unless explaining a non-obvious workaround.
- Do NOT change `products.custom_fields` shape, `buildItemSnapshot`, `normalizeOrderFields`, `calculateModifierTotal`, `validateField`, or `supabase/`.
- Vitest runs in a node environment with no DOM — test pure functions only; UI changes get a manual verification step.
- After every task: `npm run build`, `npm run lint`, `npm test` must pass.
- Reordering is order-only: array order is question order for both the buyer form and the order snapshot.

---

### Task 1: Pure helpers + extended type list

**Files:**
- Modify: `src/utils/formPresets.ts`
- Test: `src/utils/__tests__/formPresets.test.ts`

**Interfaces:**
- Consumes: `CustomField`, `CustomFieldType` (existing types).
- Produces:
  - `reorderFields(fields: CustomField[], fromId: string, toId: string): CustomField[]`
  - `moveField(fields: CustomField[], id: string, direction: -1 | 1): CustomField[]`
  - `convertFieldType(field: CustomField, newType: CustomFieldType): CustomField`
  - `typeChangeImpact(field: CustomField, newType: CustomFieldType): string | null`
  - `QUESTION_CARD_TYPES` now includes `date` and `phone`.

- [ ] **Step 1: Write the failing tests**

Append to `src/utils/__tests__/formPresets.test.ts`:

```ts
import {
  QUESTION_CARD_TYPES,
  convertFieldType,
  moveField,
  reorderFields,
  typeChangeImpact,
} from '../formPresets';
import type { CustomField, CustomFieldType } from '../../types';

const choice: CustomField = {
  id: 'c',
  label: 'Size',
  type: 'select',
  required: true,
  options: [
    { name: 'A', price_modifier: 0 },
    { name: 'B', price_modifier: 1 },
  ],
};
const num: CustomField = {
  id: 'n',
  label: 'Pages',
  type: 'number',
  required: false,
  price_per_unit: 0.1,
  min: 1,
  max: 10,
  integer: true,
  quickPicks: [1, 5],
};

describe('reorderFields', () => {
  const list = ['a', 'b', 'c'].map((id) => ({ id, label: id, type: 'text' as CustomFieldType, required: false }));
  it('moves a field to the target position', () => {
    expect(reorderFields(list, 'a', 'c').map((f) => f.id)).toEqual(['b', 'c', 'a']);
  });
  it('is a no-op on unknown ids or same position', () => {
    expect(reorderFields(list, 'a', 'a')).toBe(list);
    expect(reorderFields(list, 'x', 'a')).toBe(list);
  });
});

describe('moveField', () => {
  const list = ['a', 'b', 'c'].map((id) => ({ id, label: id, type: 'text' as CustomFieldType, required: false }));
  it('swaps with the neighbour', () => {
    expect(moveField(list, 'b', -1).map((f) => f.id)).toEqual(['b', 'a', 'c']);
    expect(moveField(list, 'b', 1).map((f) => f.id)).toEqual(['a', 'c', 'b']);
  });
  it('is a no-op at the ends', () => {
    expect(moveField(list, 'a', -1)).toBe(list);
    expect(moveField(list, 'c', 1)).toBe(list);
  });
});

describe('convertFieldType', () => {
  it('choice -> number drops options', () => {
    const out = convertFieldType(choice, 'number');
    expect(out.type).toBe('number');
    expect(out.options).toBeUndefined();
    expect(out.label).toBe('Size');
    expect(out.required).toBe(true);
  });
  it('number -> choice seeds one empty option and drops pricing', () => {
    const out = convertFieldType(num, 'select');
    expect(out.options).toEqual([{ name: '', price_modifier: 0 }]);
    expect(out.price_per_unit).toBeUndefined();
    expect(out.min).toBeUndefined();
    expect(out.max).toBeUndefined();
    expect(out.integer).toBeUndefined();
    expect(out.quickPicks).toBeUndefined();
  });
  it('select -> multiselect keeps options', () => {
    expect(convertFieldType(choice, 'multiselect').options).toEqual(choice.options);
  });
  it('drops placeholder for non-text types', () => {
    const withText: CustomField = { ...choice, placeholder: 'x' };
    expect(convertFieldType(withText, 'date').placeholder).toBeUndefined();
  });
});

describe('typeChangeImpact', () => {
  it('reports option loss and pricing loss', () => {
    expect(typeChangeImpact(choice, 'number')).toBe('clear 2 options');
    expect(typeChangeImpact(num, 'textarea')).toBe('clear per-unit pricing');
    expect(typeChangeImpact(choice, 'multiselect')).toBeNull();
    expect(typeChangeImpact(num, 'number')).toBeNull();
  });
});

describe('addable question types', () => {
  it('includes date and phone', () => {
    const types = QUESTION_CARD_TYPES.map((t) => t.type);
    expect(types).toContain('date');
    expect(types).toContain('phone');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/utils/__tests__/formPresets.test.ts`
Expected: FAIL — `reorderFields`, `moveField`, `convertFieldType`, `typeChangeImpact` are not exported; `date`/`phone` not in the list.

- [ ] **Step 3: Implement the helpers**

In `src/utils/formPresets.ts`, extend `QUESTION_CARD_TYPES`:

```ts
export const QUESTION_CARD_TYPES: Array<{ type: CustomFieldType; label: string }> = [
  { type: 'select', label: 'Choice' },
  { type: 'multiselect', label: 'Multiple choice' },
  { type: 'text', label: 'Text' },
  { type: 'number', label: 'Number' },
  { type: 'textarea', label: 'Notes' },
  { type: 'date', label: 'Date' },
  { type: 'phone', label: 'Phone' },
  { type: 'file', label: 'File Upload' },
];
```

Add below `activeFields`:

```ts
function isChoiceType(t: CustomFieldType): boolean {
  return t === 'select' || t === 'multiselect';
}

export function reorderFields(fields: CustomField[], fromId: string, toId: string): CustomField[] {
  const from = fields.findIndex((f) => f.id === fromId);
  const to = fields.findIndex((f) => f.id === toId);
  if (from === -1 || to === -1 || from === to) return fields;
  const next = [...fields];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export function moveField(fields: CustomField[], id: string, direction: -1 | 1): CustomField[] {
  const i = fields.findIndex((f) => f.id === id);
  if (i === -1) return fields;
  const j = i + direction;
  if (j < 0 || j >= fields.length) return fields;
  const next = [...fields];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

export function convertFieldType(field: CustomField, newType: CustomFieldType): CustomField {
  const next: CustomField = { ...field, type: newType };
  if (isChoiceType(newType)) {
    if (!next.options || next.options.length === 0) {
      next.options = [{ name: '', price_modifier: 0 }];
    }
  } else {
    next.options = undefined;
  }
  if (newType !== 'number') {
    next.price_per_unit = undefined;
    next.min = undefined;
    next.max = undefined;
    next.integer = undefined;
    next.quickPicks = undefined;
  }
  if (newType !== 'text' && newType !== 'textarea') {
    next.placeholder = undefined;
  }
  return next;
}

export function typeChangeImpact(field: CustomField, newType: CustomFieldType): string | null {
  if (field.type === newType) return null;
  if (
    isChoiceType(field.type) &&
    !isChoiceType(newType) &&
    (field.options ?? []).length > 0
  ) {
    return `clear ${(field.options ?? []).length} options`;
  }
  if (
    field.type === 'number' &&
    newType !== 'number' &&
    (Number(field.price_per_unit) > 0 || field.min !== undefined || field.max !== undefined)
  ) {
    return 'clear per-unit pricing';
  }
  return null;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/utils/__tests__/formPresets.test.ts`
Expected: PASS (all new cases, existing suite still green).

- [ ] **Step 5: Full verification + commit**

```bash
npm run build && npm run lint && npm test
git add src/utils/formPresets.ts src/utils/__tests__/formPresets.test.ts
git commit -m "Forms: reorder/convert pure helpers + date & phone question types"
```

---

### Task 2: `QuestionRow` restructure (tap zone + grip + arrows)

**Files:**
- Modify: `src/components/seller/QuestionRow.tsx`

**Interfaces:**
- Consumes: `FIELD_TYPE_LABEL` (existing).
- Produces: `QuestionRow` props become
  `{ field: CustomField; onOpen: () => void; disabled?: boolean; onMove?: (dir: -1 | 1) => void; isFirst?: boolean; isLast?: boolean; dragging?: boolean; onDragStart?: () => void; onDragOverRow?: (e: React.DragEvent) => void; onDropRow?: () => void }`.
  When `onMove`/`onDragStart` are absent (wizard review), no grip/arrows render — behaviour identical to today.

- [ ] **Step 1: Replace the component body**

A `<button>` cannot contain the arrow `<button>`s, so the row becomes a container: a tap-to-edit zone, an optional grip, and optional arrows. Keep `compactView` exactly as-is.

```tsx
import type { CustomField } from '../../types';
import { FIELD_TYPE_LABEL } from '../../utils/fieldLabels';

interface Props {
  field: CustomField;
  onOpen: () => void;
  disabled?: boolean;
  onMove?: (dir: -1 | 1) => void;
  isFirst?: boolean;
  isLast?: boolean;
  dragging?: boolean;
  onDragStart?: () => void;
  onDragOverRow?: (e: React.DragEvent) => void;
  onDropRow?: () => void;
}

function compactView(f: CustomField): string {
  /* unchanged from current file */
}

export default function QuestionRow({
  field: f,
  onOpen,
  disabled = false,
  onMove,
  isFirst = false,
  isLast = false,
  dragging = false,
  onDragStart,
  onDragOverRow,
  onDropRow,
}: Props) {
  const off = f.enabled === false;
  return (
    <div
      onDragOver={onDragOverRow}
      onDrop={onDropRow}
      className={`flex items-stretch gap-1 rounded-xl border bg-white ${
        off ? 'border-slate-200 opacity-60' : 'border-slate-300'
      } ${dragging ? 'ring-2 ring-slate-900' : ''}`}
    >
      {onMove && (
        <span
          draggable={!disabled}
          onDragStart={onDragStart}
          aria-hidden
          className="flex w-9 shrink-0 cursor-grab items-center justify-center rounded-l-xl text-slate-400 active:cursor-grabbing"
        >
          ⋮⋮
        </span>
      )}
      <button
        type="button"
        onClick={onOpen}
        disabled={disabled}
        className="min-h-[48px] min-w-0 flex-1 p-3 text-left disabled:opacity-50"
      >
        <span className="flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-900">
            {f.label || '(No label yet)'}
          </span>
          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
            {FIELD_TYPE_LABEL[f.type]}
          </span>
          <span
            className={`shrink-0 rounded-full px-2 py-1 text-xs font-bold ${
              f.required ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {f.required ? 'Required' : 'Optional'}
          </span>
          {off && (
            <span className="shrink-0 rounded-full bg-slate-200 px-2 py-1 text-xs font-bold text-slate-600">
              OFF
            </span>
          )}
        </span>
        <span className="mt-1 block truncate text-xs text-slate-600">{compactView(f)}</span>
      </button>
      {onMove && (
        <span className="flex shrink-0 flex-col justify-center gap-1 pr-2">
          <button
            type="button"
            aria-label="Move up"
            disabled={disabled || isFirst}
            onClick={() => onMove(-1)}
            className="h-5 w-8 rounded text-sm font-bold text-slate-600 disabled:opacity-30"
          >
            ↑
          </button>
          <button
            type="button"
            aria-label="Move down"
            disabled={disabled || isLast}
            onClick={() => onMove(1)}
            className="h-5 w-8 rounded text-sm font-bold text-slate-600 disabled:opacity-30"
          >
            ↓
          </button>
        </span>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build/lint**

Run: `npm run build && npm run lint`
Expected: PASS. (`ProductWizard.tsx` calls `QuestionRow` with only `field`/`onOpen`/`disabled`; the new props are optional, so it still compiles and renders without grip/arrows.)

- [ ] **Step 3: Manual verification**

Open `/seller/products`, create a product, reach the wizard's Review step: question rows must still look and behave as before (tap does nothing there yet — it advances to Questions). Note: no arrows/grip on the review rows. Nothing to commit for progress yet.

- [ ] **Step 4: Commit**

```bash
npm test
git add src/components/seller/QuestionRow.tsx
git commit -m "Forms: QuestionRow with optional grip and move arrows"
```

---

### Task 3: Reorderable list in `SellerFormConfigurator`

**Files:**
- Modify: `src/components/SellerFormConfigurator.tsx`

**Interfaces:**
- Consumes: `reorderFields`, `moveField` (Task 1); `QuestionRow` (Task 2).
- Produces: no new exports; the questions list becomes reorderable.

- [ ] **Step 1: Add drag state + handlers**

Near the other state at the top of the component:

```tsx
import { moveField, reorderFields } from '../utils/formPresets'; // merge into the existing import line
const [dragId, setDragId] = useState<string | null>(null);
```

- [ ] **Step 2: Wire the list**

Replace the current `{fields.map((f) => (<QuestionRow ... />))}` block with:

```tsx
{fields.map((f, i) => (
  <QuestionRow
    key={f.id}
    field={f}
    onOpen={() => setEditingId(f.id)}
    disabled={disabled}
    isFirst={i === 0}
    isLast={i === fields.length - 1}
    dragging={dragId === f.id}
    onMove={(dir) => onChange(moveField(fields, f.id, dir))}
    onDragStart={() => setDragId(f.id)}
    onDragOverRow={(e) => e.preventDefault()}
    onDropRow={() => {
      if (dragId) onChange(reorderFields(fields, dragId, f.id));
      setDragId(null);
    }}
  />
))}
```

- [ ] **Step 3: Verify build/lint/tests**

Run: `npm run build && npm run lint && npm test`
Expected: PASS.

- [ ] **Step 4: Manual verification**

On desktop, drag a grip onto another row — the order changes. On a phone (or narrow window), use ↑/↓ — the order changes and the first row's ↑ / last row's ↓ are disabled. Reload after save and the order persists (it lives in `custom_fields`).

- [ ] **Step 5: Commit**

```bash
git add src/components/SellerFormConfigurator.tsx
git commit -m "Forms: reorderable question list (drag + move buttons)"
```

---

### Task 4: Type selector in `QuestionEditorSheet`

**Files:**
- Modify: `src/components/seller/QuestionEditorSheet.tsx`

**Interfaces:**
- Consumes: `convertFieldType`, `typeChangeImpact` (Task 1); `QUESTION_CARD_TYPES`, `FIELD_TYPE_LABEL`.
- Produces: no new exports; the sheet's type badge becomes a working selector.

- [ ] **Step 1: Add draft type + pending state**

```tsx
const [type, setType] = useState<CustomFieldType>(field?.type ?? 'text');
const [pendingType, setPendingType] = useState<CustomFieldType | null>(null);
```

Reset both in the `open` effect (`setType(field.type); setPendingType(null);`).

- [ ] **Step 2: Derive choice/number from the draft type**

Change the two derivations to use `type` instead of `field.type`:

```tsx
const isChoice = type === 'select' || type === 'multiselect';
const isNumber = type === 'number';
```

- [ ] **Step 3: Add the type selector + inline confirm**

Replace the current `<p>{FIELD_TYPE_LABEL[field.type]}</p>` header line with:

```tsx
<label className="block">
  <span className="text-xs font-bold text-slate-600">Question type</span>
  <select
    value={type}
    onChange={(e) => {
      if (!field) return;
      const next = e.target.value as CustomFieldType;
      const impact = typeChangeImpact(field, next);
      if (impact) setPendingType(next);
      else setType(next);
    }}
    className={`mt-1 ${smallInput}`}
  >
    {QUESTION_CARD_TYPES.map((t) => (
      <option key={t.type} value={t.type}>
        {t.label}
      </option>
    ))}
  </select>
</label>

{pendingType && field && (
  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
    <p className="font-bold">
      Changing to {FIELD_TYPE_LABEL[pendingType]} will {typeChangeImpact(field, pendingType)}.
    </p>
    <div className="mt-2 flex gap-2">
      <button
        type="button"
        onClick={() => {
          setType(pendingType);
          setPendingType(null);
        }}
        className="h-10 rounded-lg bg-amber-700 px-3 text-sm font-bold text-white"
      >
        Convert
      </button>
      <button
        type="button"
        onClick={() => setPendingType(null)}
        className="h-10 rounded-lg border border-amber-300 bg-white px-3 text-sm font-bold text-amber-900"
      >
        Keep {FIELD_TYPE_LABEL[field.type]}
      </button>
    </div>
  </div>
)}
```

- [ ] **Step 4: Normalise on save via the pure helper**

In `handleSave`, build from `convertFieldType` so stripping is not re-implemented:

```tsx
onSave({
  ...convertFieldType(field, type),
  label: label.trim(),
  required,
  enabled,
  ...(isChoice ? { options: nextOptions } : {}),
  ...(isNumber
    ? {
        price_per_unit: ppu === '' ? undefined : Math.max(0, Number(ppu) || 0),
        min: min === '' ? undefined : Number(min),
        max: max === '' ? undefined : Number(max),
        integer,
      }
    : {}),
});
```

Add `convertFieldType` to the existing `formPresets` import and `QUESTION_CARD_TYPES` too. Import `CustomFieldType` from `../../types`.

- [ ] **Step 5: Verify build/lint/tests**

Run: `npm run build && npm run lint && npm test`
Expected: PASS.

- [ ] **Step 6: Manual verification**

Edit a Choice question → switch to Number: the amber bar says "clear N options"; Convert clears the options panel; Keep leaves the type. Switch Number → Date: pricing fields disappear after Convert. Add a Date and a Phone question and confirm the buyer can fill them (date blocks past dates, phone normalises) since `DynamicFormEngine` already handles both.

- [ ] **Step 7: Commit**

```bash
git add src/components/seller/QuestionEditorSheet.tsx
git commit -m "Forms: change question type with convert-and-confirm"
```

---

### Task 5: Remove the standalone apply-preset panel

**Files:**
- Modify: `src/pages/seller/Products.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: the Products page no longer exposes `handleBulkApply`; the wizard remains the only path to set questions.

- [ ] **Step 1: Delete the panel + handler**

Remove the whole `handleBulkApply` function, the panel block that starts with `{shop && getPresetForCategory(shop.category) && (` (the "Preset … recommended … / Apply to empty products / Overwrite all" card), and the `saving` state if it is now unused.

- [ ] **Step 2: Trim imports**

Change the `formPresets` import in this file to only what remains used:

```tsx
import { activeFields } from '../../utils/formPresets';
```

(`clonePresetFields`, `getPreset`, `getPresetForCategory`, `sanitizeFields` were only used by the panel.)

- [ ] **Step 3: Verify build/lint (catches unused imports)**

Run: `npm run build && npm run lint`
Expected: PASS with no unused-symbol errors.

- [ ] **Step 4: Manual verification**

The Products page shows the header, `+ Add product`, and the cards only — no preset panel. Adding a product still shows preset choices inside the wizard's Questions step.

- [ ] **Step 5: Commit**

```bash
git add src/pages/seller/Products.tsx
git commit -m "Forms: drop standalone preset panel (wizard is the single path)"
```

---

### Task 6: Update forms doc + final verification

**Files:**
- Modify: `docs/forms.md`

**Interfaces:** none.

- [ ] **Step 1: Update the seller-flow section**

In `docs/forms.md`, replace the seller-flow paragraph so it states: questions can be reordered (drag on desktop, ↑/↓ always), question types include `date` and `phone`, a question's type can be changed with convert-and-strip confirmation, and the wizard is the only place questions are chosen (no standalone preset panel).

- [ ] **Step 2: Full verification**

Run: `npm run build && npm run lint && npm test`
Expected: all green.

- [ ] **Step 3: Commit**

```bash
git add docs/forms.md
git commit -m "Docs: forms doc matches reorder/type-change/flow changes"
```

---

## Self-Review

**Spec coverage:**
- Reorder (drag + buttons) → Tasks 1, 2, 3.
- Date/phone addable → Task 1 (type list) + Task 4 verification.
- Type change convert + strip → Tasks 1, 4.
- Unify add flow → Task 5.
- Tests for pure helpers → Task 1; UI via manual verification (node Vitest has no DOM) → Tasks 2–5.

**Placeholder scan:** none — every code step shows real code; UI steps show exact class/prop changes and a concrete manual check.

**Type consistency:** `reorderFields(fields, fromId, toId)`, `moveField(fields, id, dir)`, `convertFieldType(field, newType)`, `typeChangeImpact(field, newType)` are used with identical signatures in Tasks 3 and 4. `QuestionRow` props in Task 2 match the calls in Task 3.
