import type {
  CustomField,
  CustomFieldType,
  CustomValue,
  PresetKey,
} from '../types';

export interface FormPreset {
  key: PresetKey;
  label: string;
  description: string;
  fields: CustomField[];
}

export const CATEGORY_PRESET_MAP: Record<string, PresetKey | null> = {
  food: 'food_addons',
  printing: 'printing',
  shoe_wash: 'shoe_wash',
  repairs: 'services',
  rentals: 'services',
  custom: 'services',
};

export function getPresetForCategory(category: string): PresetKey | null {
  return CATEGORY_PRESET_MAP[category] ?? null;
}

export function isFormApplicable(category: string): boolean {
  return getPresetForCategory(category) !== null;
}

function select(
  id: string,
  label: string,
  options: Array<[string, number]>,
  required = true
): CustomField {
  return {
    id,
    label,
    type: 'select',
    required,
    enabled: true,
    options: options.map(([name, price_modifier]) => ({ name, price_modifier })),
  };
}

function text(id: string, label: string, required: boolean, placeholder?: string): CustomField {
  return { id, label, type: 'text', required, enabled: true, placeholder };
}

function textarea(id: string, label: string, required: boolean, placeholder?: string): CustomField {
  return { id, label, type: 'textarea', required, enabled: true, placeholder };
}

export const PRESETS: FormPreset[] = [
  {
    key: 'printing',
    label: 'Printing',
    description: 'Paper size, color, duplex and file.',
    fields: [
      select('print_size', 'Paper Size', [
        ['A4', 0],
        ['A3', 0.5],
      ]),
      select('print_color', 'Color Mode', [
        ['Black & White', 0],
        ['Color', 0.4],
      ]),
      select('print_duplex', 'Duplex', [
        ['Single-sided', 0],
        ['Double-sided', 0],
      ]),
      {
        id: 'print_pages',
        label: 'Number of Pages',
        type: 'number',
        required: true,
        enabled: true,
        price_per_unit: 0.1,
        min: 1,
        max: 500,
        integer: true,
      },
      { id: 'print_file', label: 'Upload File', type: 'file', required: true, enabled: true },
    ],
  },
  {
    key: 'shoe_wash',
    label: 'Shoe Wash',
    description: 'Treatment level, shoe details and room pickup.',
    fields: [
      select('shoe_level', 'Treatment Level', [
        ['Basic', 0],
        ['Deep Clean', 5],
      ]),
      text('shoe_details', 'Shoe Details', true, 'e.g. white Nike, size 42'),
      select('shoe_pickup', 'Room Pickup', [
        ['Yes, pick up from my room', 1],
        ['No, I will send it myself', 0],
      ]),
    ],
  },
  {
    key: 'food_addons',
    label: 'Food + Add-ons',
    description: 'Size, add-ons and notes.',
    fields: [
      select('food_size', 'Size', [
        ['Regular', 0],
        ['Large', 2],
      ]),
      {
        id: 'food_addons',
        label: 'Add-ons',
        type: 'multiselect',
        required: false,
        enabled: true,
        options: [
          { name: 'Egg', price_modifier: 1 },
          { name: 'Cheese', price_modifier: 1.5 },
          { name: 'Extra Rice', price_modifier: 2 },
        ],
      },
      textarea('food_notes', 'Notes', false, 'e.g. less spicy'),
    ],
  },
  {
    key: 'services',
    label: 'Services & Booking',
    description: 'Item, date, phone and notes. Fits repairs, rentals and custom jobs.',
    fields: [
      select(
        'service_item',
        'Service / Item',
        [
          ['General Service', 0],
          ['Repair', 0],
          ['Rental', 0],
        ],
        true
      ),
      { id: 'service_date', label: 'Date', type: 'date', required: true, enabled: true },
      { id: 'service_phone', label: 'Phone Number', type: 'phone', required: true, enabled: true },
      textarea('service_notes', 'Notes', false, 'e.g. describe the issue or rental period'),
    ],
  },
  {
    key: 'custom',
    label: 'Custom',
    description: 'Stack your own question cards.',
    fields: [],
  },
];

export function getPreset(key: PresetKey): FormPreset {
  return PRESETS.find((p) => p.key === key) ?? PRESETS[PRESETS.length - 1];
}

export function clonePresetFields(key: PresetKey): CustomField[] {
  return getPreset(key).fields.map((f) => ({
    ...f,
    options: f.options?.map((o) => ({ ...o })),
  }));
}

function randomId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return `q_${globalThis.crypto.randomUUID().slice(0, 8)}`;
  }
  return `q_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export const QUESTION_CARD_TYPES: Array<{ type: CustomFieldType; label: string }> = [
  { type: 'select', label: 'Choice' },
  { type: 'multiselect', label: 'Multiple choice' },
  { type: 'text', label: 'Text' },
  { type: 'number', label: 'Number' },
  { type: 'textarea', label: 'Notes' },
  { type: 'file', label: 'File Upload' },
];

export function createQuestionCard(type: CustomFieldType): CustomField {
  const withOptions = type === 'select' || type === 'multiselect';
  return {
    id: randomId(),
    label: '',
    type,
    required: false,
    enabled: true,
    options: withOptions ? [{ name: '', price_modifier: 0 }] : undefined,
  };
}

export function activeFields(fields: CustomField[] | null | undefined): CustomField[] {
  return (fields ?? []).filter((f) => f.enabled !== false);
}

export const MAX_QTY_PER_ITEM = 20;

export function clampQty(q: unknown): number {
  const n = Math.floor(Number(q));
  if (!Number.isFinite(n)) return 0;
  return Math.min(MAX_QTY_PER_ITEM, Math.max(0, n));
}

export function calculateModifierTotal(
  fields: CustomField[],
  values: Record<string, CustomValue>
): number {
  let total = 0;
  for (const f of activeFields(fields)) {
    if (f.type === 'select' || f.type === 'multiselect') {
      const chosen = values[f.id];
      if (!chosen) continue;
      const names = Array.isArray(chosen) ? chosen : [String(chosen)];
      for (const name of names) {
        const opt = (f.options ?? []).find((o) => o.name === name);
        if (opt) total += Number(opt.price_modifier) || 0;
      }
    } else if (f.type === 'number') {
      const ppu = Number(f.price_per_unit) || 0;
      if (ppu > 0) total += clampNumberValue(f, values[f.id]) * ppu;
    }
  }
  return Math.round(total * 100) / 100;
}

export function clampNumberValue(f: CustomField, raw: CustomValue | undefined): number {
  if (raw === undefined || raw === null) return 0;
  if (typeof raw === 'string' && raw.trim() === '') return 0;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return 0;
  let v = n;
  if (Number.isFinite(Number(f.min))) v = Math.max(v, Number(f.min));
  if (Number.isFinite(Number(f.max))) v = Math.min(v, Number(f.max));
  return v;
}

export function maxExtraForField(f: CustomField): number | null {
  if (f.enabled === false) return 0;
  if (f.type === 'select' || f.type === 'multiselect') {
    const positives = (f.options ?? [])
      .map((o) => Number(o.price_modifier) || 0)
      .filter((n) => n > 0);
    if (f.type === 'multiselect') return positives.reduce((a, b) => a + b, 0);
    return positives.length > 0 ? Math.max(...positives) : 0;
  }
  if (f.type === 'number') {
    const ppu = Number(f.price_per_unit) || 0;
    if (ppu <= 0) return 0;
    return Number.isFinite(Number(f.max)) ? Number(f.max) * ppu : null;
  }
  return 0;
}

export function computeUnitTotal(
  base: number,
  fields: CustomField[],
  values: Record<string, CustomValue>
): number {
  return (Number(base) || 0) + calculateModifierTotal(fields, values);
}

export function validateRequired(
  fields: CustomField[],
  values: Record<string, CustomValue>,
  today?: string
): Record<string, string> {
  const errs: Record<string, string> = {};
  for (const f of activeFields(fields)) {
    const err = validateField(f, values[f.id], today);
    if (err) errs[f.id] = err;
  }
  return errs;
}

export function todayLocal(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function normalizeMyPhone(input: unknown): string {
  const digits = String(input ?? '').replace(/[\s\-()]/g, '');
  const m = digits.match(/^(?:\+?60|0)?(1\d{7,9})$/);
  if (!m) return '';
  return `+60${m[1]}`;
}

export function validateField(
  f: CustomField,
  v: CustomValue | undefined,
  today: string = todayLocal()
): string | null {
  const empty =
    v === undefined || v === null || (Array.isArray(v) ? v.length === 0 : String(v).trim() === '');
  if (empty) return f.required ? `${f.label || 'This field'} is required` : null;
  if (f.type === 'number') {
    const label = f.label || 'This field';
    const n = Number(v);
    const min = Number.isFinite(Number(f.min)) ? Number(f.min) : 0;
    const max = Number.isFinite(Number(f.max)) ? Number(f.max) : null;
    const range = max !== null ? `between ${min} and ${max}` : `at least ${min}`;
    if (!Number.isFinite(n)) return `${label} must be a number ${range}.`;
    if (n < min || (max !== null && n > max)) {
      return f.integer
        ? `${label} must be a whole number ${range}.`
        : `${label} must be a number ${range}.`;
    }
    if (f.integer && !Number.isInteger(n)) {
      return `${label} must be a whole number ${range}.`;
    }
    return null;
  }
  if (f.type === 'phone' && !normalizeMyPhone(v)) {
    return 'Enter a valid Malaysian mobile number (e.g. 012-3456789).';
  }
  if (f.type === 'date' && String(v) < today) {
    return 'Date must be today or later.';
  }
  return null;
}

export function describeValues(
  fields: CustomField[],
  values: Record<string, CustomValue>
): Array<{ label: string; value: string }> {
  const out: Array<{ label: string; value: string }> = [];
  for (const f of activeFields(fields)) {
    const v = values[f.id];
    if (v === undefined || v === null) continue;
    const text = Array.isArray(v) ? v.join(', ') : String(v).trim();
    if (!text) continue;
    out.push({ label: f.label.trim() || f.id, value: text });
  }
  return out;
}

export function sanitizeFields(fields: CustomField[]): CustomField[] {
  const seen = new Set<string>();
  const out: CustomField[] = [];
  for (const f of fields) {
    let id = f.id;
    if (!id || seen.has(id)) id = randomId();
    seen.add(id);
    const next: CustomField = {
      id,
      label: f.label.trim(),
      type: f.type,
      required: Boolean(f.required),
      enabled: f.enabled !== false,
      placeholder: f.placeholder,
    };
    if (f.type === 'select' || f.type === 'multiselect') {
      next.options = (f.options ?? [])
        .map((o) => ({
          name: o.name.trim(),
          price_modifier: Number.isFinite(Number(o.price_modifier)) ? Math.max(0, Number(o.price_modifier)) : 0,
        }))
        .filter((o) => o.name !== '');
    }
    if (f.type === 'number') {
      const ppu = Number(f.price_per_unit);
      if (Number.isFinite(ppu)) next.price_per_unit = Math.max(0, ppu);
      if (f.integer) next.integer = true;
      const min = Number(f.min);
      const max = Number(f.max);
      const validMin = Number.isFinite(min);
      const validMax = Number.isFinite(max);
      if (validMin && validMax && min <= max) {
        next.min = min;
        next.max = max;
      } else if (validMin && !validMax) {
        next.min = min;
      } else if (!validMin && validMax) {
        next.max = max;
      }
    }
    out.push(next);
  }
  return out;
}
