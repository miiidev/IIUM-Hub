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
    description: 'Saiz kertas, warna, duplex dan fail.',
    fields: [
      select('print_size', 'Saiz Kertas', [
        ['A4', 0],
        ['A3', 0.5],
      ]),
      select('print_color', 'Mod Warna', [
        ['Hitam Putih', 0],
        ['Berwarna', 0.4],
      ]),
      select('print_duplex', 'Duplex', [
        ['Satu muka', 0],
        ['Dua muka', 0],
      ]),
      text(
        'print_file',
        'Fail / Pautan Fail',
        false,
        'cth: nama fail atau pautan Google Drive'
      ),
    ],
  },
  {
    key: 'shoe_wash',
    label: 'Shoe Wash',
    description: 'Tahap cucian, butiran kasut dan pickup bilik.',
    fields: [
      select('shoe_level', 'Tahap Cucian', [
        ['Basic', 0],
        ['Deep Clean', 5],
      ]),
      text('shoe_details', 'Butiran Kasut', true, 'cth: Nike putih, saiz 42'),
      select('shoe_pickup', 'Pickup di Bilik', [
        ['Ya, ambil di bilik', 1],
        ['Tidak, saya hantar sendiri', 0],
      ]),
    ],
  },
  {
    key: 'food_addons',
    label: 'Food + Add-ons',
    description: 'Saiz, add-ons dan nota.',
    fields: [
      select('food_size', 'Saiz', [
        ['Biasa', 0],
        ['Besar', 2],
      ]),
      select(
        'food_addons',
        'Add-ons',
        [
          ['Tiada', 0],
          ['Telur', 1],
          ['Cheese', 1.5],
          ['Telur + Cheese', 2.5],
        ],
        false
      ),
      textarea('food_notes', 'Nota', false, 'cth: kurang pedas'),
    ],
  },
  {
    key: 'custom',
    label: 'Custom',
    description: 'Susun sendiri kad soalan.',
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
  { type: 'select', label: 'Pilihan' },
  { type: 'text', label: 'Teks' },
  { type: 'number', label: 'Nombor' },
  { type: 'textarea', label: 'Catatan' },
];

export function createQuestionCard(type: CustomFieldType): CustomField {
  return {
    id: randomId(),
    label: '',
    type,
    required: false,
    enabled: true,
    options: type === 'select' ? [{ name: '', price_modifier: 0 }] : undefined,
  };
}

export function activeFields(fields: CustomField[] | null | undefined): CustomField[] {
  return (fields ?? []).filter((f) => f.enabled !== false);
}

export function calculateModifierTotal(
  fields: CustomField[],
  values: Record<string, CustomValue>
): number {
  let total = 0;
  for (const f of activeFields(fields)) {
    if (f.type !== 'select') continue;
    const chosen = values[f.id];
    if (!chosen) continue;
    const names = Array.isArray(chosen) ? chosen : [String(chosen)];
    for (const name of names) {
      const opt = (f.options ?? []).find((o) => o.name === name);
      if (opt) total += Number(opt.price_modifier) || 0;
    }
  }
  return total;
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
  values: Record<string, CustomValue>
): Record<string, string> {
  const errs: Record<string, string> = {};
  for (const f of activeFields(fields)) {
    if (!f.required) continue;
    const v = values[f.id];
    const empty =
      v === undefined || v === null || (Array.isArray(v) ? v.length === 0 : String(v).trim() === '');
    if (empty) errs[f.id] = `${f.label || 'Ruang ini'} diperlukan`;
  }
  return errs;
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
    if (f.type === 'select') {
      next.options = (f.options ?? [])
        .map((o) => ({
          name: o.name.trim(),
          price_modifier: Number.isFinite(Number(o.price_modifier)) ? Math.max(0, Number(o.price_modifier)) : 0,
        }))
        .filter((o) => o.name !== '');
    }
    out.push(next);
  }
  return out;
}
