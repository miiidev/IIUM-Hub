import type { CustomField } from '../types';

interface Props {
  fields: CustomField[];
  values: Record<string, string | number>;
  onChange: (fieldId: string, value: string | number) => void;
  errors?: Record<string, string>;
}

const inputCls =
  'h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-900 outline-none focus:border-emerald-600';

export default function DynamicFormEngine({ fields, values, onChange, errors = {} }: Props) {
  if (!fields || fields.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        No custom options for this item.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {fields.map((f) => {
        const val = values[f.id] ?? '';
        const err = errors[f.id];
        const span = f.type === 'textarea' ? 'sm:col-span-2' : '';
        return (
          <div key={f.id} className={span}>
            <label className="mb-1 block text-sm font-bold text-slate-900">
              {f.label} {f.required && <span className="text-red-600">*</span>}
            </label>

            {f.type === 'select' && (
              <select
                className={inputCls}
                value={String(val)}
                onChange={(e) => onChange(f.id, e.target.value)}
              >
                <option value="">-- Pilih --</option>
                {(f.options ?? []).map((o) => (
                  <option key={o.name} value={o.name}>
                    {o.name}
                    {Number(o.price_modifier) > 0
                      ? ` (+RM ${Number(o.price_modifier).toFixed(2)})`
                      : ''}
                  </option>
                ))}
              </select>
            )}

            {f.type === 'text' && (
              <input
                className={inputCls}
                type="text"
                value={String(val)}
                placeholder={f.label}
                onChange={(e) => onChange(f.id, e.target.value)}
              />
            )}

            {f.type === 'number' && (
              <input
                className={inputCls}
                type="number"
                value={val === '' ? '' : Number(val)}
                placeholder="0"
                onChange={(e) =>
                  onChange(f.id, e.target.value === '' ? '' : Number(e.target.value))
                }
              />
            )}

            {f.type === 'textarea' && (
              <textarea
                className="min-h-[96px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-emerald-600"
                value={String(val)}
                placeholder={f.label}
                onChange={(e) => onChange(f.id, e.target.value)}
              />
            )}

            {err && <p className="mt-1 text-sm font-medium text-red-600">{err}</p>}
          </div>
        );
      })}
    </div>
  );
}

export function computeModifierTotal(
  fields: CustomField[],
  values: Record<string, string | number>
): number {
  let total = 0;
  for (const f of fields) {
    if (f.type !== 'select') continue;
    const chosen = values[f.id];
    if (!chosen) continue;
    const opt = (f.options ?? []).find((o) => o.name === String(chosen));
    if (opt) total += Number(opt.price_modifier) || 0;
  }
  return total;
}

export function validateDynamicFields(
  fields: CustomField[],
  values: Record<string, string | number>
): Record<string, string> {
  const errs: Record<string, string> = {};
  for (const f of fields) {
    if (!f.required) continue;
    const v = values[f.id];
    if (v === undefined || v === null || String(v).trim() === '') {
      errs[f.id] = `${f.label} diperlukan`;
    }
  }
  return errs;
}
