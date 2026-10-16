import type { CustomField, CustomFieldType, PresetKey } from '../types';
import { PRESETS, QUESTION_CARD_TYPES, clonePresetFields, createQuestionCard } from '../utils/formPresets';

interface Props {
  fields: CustomField[];
  onChange: (fields: CustomField[]) => void;
  basePrice: number;
  disabled?: boolean;
}

const smallInput =
  'h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-900 disabled:opacity-50';

const TYPE_LABEL: Record<CustomFieldType, string> = {
  select: 'Pilihan',
  text: 'Teks',
  number: 'Nombor',
  textarea: 'Catatan',
};

export default function SellerFormConfigurator({ fields, onChange, basePrice, disabled = false }: Props) {
  function applyPreset(key: PresetKey) {
    if (fields.length > 0 && !window.confirm('Ganti semua soalan semasa dengan preset ini?')) return;
    onChange(clonePresetFields(key));
  }

  function patch(index: number, next: Partial<CustomField>) {
    onChange(fields.map((f, i) => (i === index ? { ...f, ...next } : f)));
  }

  function remove(index: number) {
    onChange(fields.filter((_, i) => i !== index));
  }

  function patchOption(fieldIndex: number, optionIndex: number, next: { name?: string; price_modifier?: number }) {
    const field = fields[fieldIndex];
    const options = (field.options ?? []).map((o, i) => (i === optionIndex ? { ...o, ...next } : o));
    patch(fieldIndex, { options });
  }

  function addOption(fieldIndex: number) {
    const field = fields[fieldIndex];
    patch(fieldIndex, { options: [...(field.options ?? []), { name: '', price_modifier: 0 }] });
  }

  function removeOption(fieldIndex: number, optionIndex: number) {
    const field = fields[fieldIndex];
    patch(fieldIndex, { options: (field.options ?? []).filter((_, i) => i !== optionIndex) });
  }

  const maxExtra = fields
    .filter((f) => f.enabled !== false && f.type === 'select')
    .reduce((sum, f) => sum + Math.max(0, ...(f.options ?? []).map((o) => Number(o.price_modifier) || 0)), 0);

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-bold text-slate-900">1. Pilih preset</p>
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              disabled={disabled}
              onClick={() => applyPreset(p.key)}
              className="min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-left disabled:opacity-50"
            >
              <span className="block text-sm font-bold text-slate-900">{p.label}</span>
              <span className="block text-xs text-slate-600">{p.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-bold text-slate-900">2. Atur soalan ({fields.length})</p>
        {fields.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-center text-sm text-slate-600">
            Belum ada soalan. Pilih preset atau tambah kad soalan di bawah.
          </div>
        )}
        <div className="space-y-3">
          {fields.map((f, i) => (
            <div
              key={f.id}
              className={`rounded-xl border bg-white p-3 ${
                f.enabled === false ? 'border-slate-200 opacity-60' : 'border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm font-bold text-slate-900">
                  <input
                    type="checkbox"
                    checked={f.enabled !== false}
                    disabled={disabled}
                    onChange={(e) => patch(i, { enabled: e.target.checked })}
                    className="h-5 w-5 accent-emerald-600"
                  />
                  {f.enabled === false ? 'OFF' : 'ON'}
                </label>
                <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
                  {TYPE_LABEL[f.type]}
                </span>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => remove(i)}
                  className="h-11 rounded-lg border border-red-200 px-3 text-xs font-bold text-red-700 disabled:opacity-40"
                >
                  Buang
                </button>
              </div>

              <input
                type="text"
                value={f.label}
                disabled={disabled}
                onChange={(e) => patch(i, { label: e.target.value })}
                placeholder="Label soalan"
                className={`mt-2 ${smallInput}`}
              />
              <label className="mt-1 flex min-h-[44px] cursor-pointer items-center gap-2 text-sm font-bold text-slate-900">
                <input
                  type="checkbox"
                  checked={f.required}
                  disabled={disabled}
                  onChange={(e) => patch(i, { required: e.target.checked })}
                  className="h-5 w-5 accent-emerald-600"
                />
                Wajib diisi
              </label>

              {f.type === 'select' && (
                <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                  <p className="text-xs font-bold text-slate-700">Pilihan dan tambahan harga (RM)</p>
                  <div className="mt-2 space-y-2">
                    {(f.options ?? []).map((o, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={o.name}
                          disabled={disabled}
                          onChange={(e) => patchOption(i, oi, { name: e.target.value })}
                          placeholder="Nama pilihan"
                          className={`min-w-0 flex-1 ${smallInput}`}
                        />
                        <input
                          type="number"
                          inputMode="decimal"
                          min="0"
                          step="0.1"
                          value={o.price_modifier}
                          disabled={disabled}
                          onChange={(e) => patchOption(i, oi, { price_modifier: Number(e.target.value) || 0 })}
                          aria-label="Tambahan harga"
                          className="h-11 w-20 shrink-0 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-900 outline-none focus:border-slate-900 disabled:opacity-50"
                        />
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => removeOption(i, oi)}
                          aria-label="Buang pilihan"
                          className="h-11 w-11 shrink-0 rounded-lg border border-slate-300 text-lg font-bold text-red-700 disabled:opacity-40"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => addOption(i)}
                    className="mt-2 h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-slate-800 disabled:opacity-40"
                  >
                    + Tambah pilihan
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-bold text-slate-900">3. Tambah kad soalan</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {QUESTION_CARD_TYPES.map((t) => (
            <button
              key={t.type}
              type="button"
              disabled={disabled}
              onClick={() => onChange([...fields, createQuestionCard(t.type)])}
              className="min-h-[44px] rounded-xl border border-slate-300 bg-white px-2 text-sm font-bold text-slate-800 disabled:opacity-50"
            >
              + {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800">
        <p>
          Harga asas: <span className="font-bold">RM {basePrice.toFixed(2)}</span>
        </p>
        <p>
          Harga maksimum (semua tambahan dipilih):{' '}
          <span className="font-bold">RM {(basePrice + maxExtra).toFixed(2)}</span>
        </p>
      </div>

      <details className="rounded-xl border border-slate-200 bg-white">
        <summary className="flex min-h-[44px] cursor-pointer items-center px-3 text-sm font-bold text-slate-800">
          Lihat JSON
        </summary>
        <pre className="max-h-64 overflow-auto border-t border-slate-200 p-3 text-xs text-slate-800">
          {JSON.stringify(fields, null, 2)}
        </pre>
      </details>
    </div>
  );
}
