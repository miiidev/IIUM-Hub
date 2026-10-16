import type { CustomField, CustomValue } from '../types';
import { activeFields } from '../utils/formPresets';

interface Props {
  fields: CustomField[];
  values: Record<string, CustomValue>;
  onChange: (fieldId: string, value: CustomValue) => void;
  errors?: Record<string, string>;
}

const inputCls =
  'h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-900 outline-none focus:border-slate-900';

export default function DynamicFormEngine({ fields, values, onChange, errors = {} }: Props) {
  const list = activeFields(fields);
  if (list.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {list.map((f) => {
        const val = values[f.id] ?? '';
        const err = errors[f.id];
        const wide = f.type === 'textarea' ? 'sm:col-span-2' : '';
        const fieldId = `field-${f.id}`;
        return (
          <div key={f.id} className={wide}>
            <label htmlFor={fieldId} className="mb-1 block text-sm font-bold text-slate-900">
              {f.label} {f.required && <span className="text-red-600">*</span>}
            </label>

            {f.type === 'select' && (
              <select
                id={fieldId}
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
                id={fieldId}
                className={inputCls}
                type="text"
                value={String(val)}
                placeholder={f.placeholder || f.label}
                onChange={(e) => onChange(f.id, e.target.value)}
              />
            )}

            {f.type === 'number' && (
              <input
                id={fieldId}
                className={inputCls}
                type="number"
                inputMode="decimal"
                value={val === '' ? '' : Number(val)}
                placeholder="0"
                onChange={(e) =>
                  onChange(f.id, e.target.value === '' ? '' : Number(e.target.value))
                }
              />
            )}

            {f.type === 'textarea' && (
              <textarea
                id={fieldId}
                className="min-h-[96px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
                value={String(val)}
                placeholder={f.placeholder || f.label}
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
