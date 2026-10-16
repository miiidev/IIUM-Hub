import { useEffect, useState } from 'react';
import type { CustomField } from '../../types';
import BottomSheet from '../BottomSheet';
import { FIELD_TYPE_LABEL } from '../../utils/fieldLabels';

interface Props {
  open: boolean;
  field: CustomField | null;
  onClose: () => void;
  onSave: (field: CustomField) => void;
  onRemove: () => void;
}

const smallInput =
  'h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-900 disabled:opacity-50';

export default function QuestionEditorSheet({ open, field, onClose, onSave, onRemove }: Props) {
  const [label, setLabel] = useState('');
  const [required, setRequired] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [options, setOptions] = useState<Array<{ name: string; price: string }>>([]);
  const [ppu, setPpu] = useState('');
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');
  const [integer, setInteger] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && field) {
      setLabel(field.label);
      setRequired(field.required);
      setEnabled(field.enabled !== false);
      setOptions((field.options ?? []).map((o) => ({ name: o.name, price: String(o.price_modifier) })));
      setPpu(field.price_per_unit !== undefined ? String(field.price_per_unit) : '');
      setMin(field.min !== undefined ? String(field.min) : '');
      setMax(field.max !== undefined ? String(field.max) : '');
      setInteger(!!field.integer);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open ]);

  if (!field) return null;
  const isChoice = field.type === 'select' || field.type === 'multiselect';
  const isNumber = field.type === 'number';

  function handleSave() {
    if (!field) return;
    setError(null);
    if (!label.trim()) {
      setError('Give this question a label.');
      return;
    }
    let nextOptions: CustomField['options'];
    if (isChoice) {
      const cleaned = options
        .map((o) => ({ name: o.name.trim(), price_modifier: Number(o.price) || 0 }))
        .filter((o) => o.name !== '');
      const seen = new Set<string>();
      for (const o of cleaned) {
        const key = o.name.toLowerCase();
        if (seen.has(key)) {
          setError(`Duplicate option "${o.name}".`);
          return;
        }
        seen.add(key);
      }
      if (cleaned.length === 0) {
        setError('Choice questions need at least one option.');
        return;
      }
      nextOptions = cleaned;
    }
    onSave({
      ...field,
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
    onClose();
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={field.label || 'Edit question'}
      footer={
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Remove this question?')) {
                onRemove();
                onClose();
              }
            }}
            className="h-12 rounded-xl border border-red-200 px-4 font-bold text-red-700"
          >
            Remove
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="h-12 flex-1 rounded-xl bg-emerald-600 font-bold text-white"
          >
            Save question
          </button>
        </div>
      }
    >
      <p className="text-xs font-bold text-slate-500">{FIELD_TYPE_LABEL[field.type]}</p>
      <div className="mt-2 space-y-3">
        <div>
          <label className="mb-1 block text-sm font-bold text-slate-900">Question</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Paper size"
            className={smallInput}
          />
        </div>
        <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm font-bold text-slate-900">
          <input
            type="checkbox"
            checked={required}
            onChange={(e) => setRequired(e.target.checked)}
            className="h-5 w-5 accent-emerald-600"
          />
          Required
        </label>
        <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm font-bold text-slate-900">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-5 w-5 accent-emerald-600"
          />
          On (off hides it from buyers)
        </label>

        {isChoice && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
            <p className="text-xs font-bold text-slate-700">Options and price add-ons (RM)</p>
            <div className="mt-2 space-y-2">
              {options.map((o, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={o.name}
                    onChange={(e) =>
                      setOptions((prev) => prev.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))
                    }
                    placeholder="Option name"
                    className={`min-w-0 flex-1 ${smallInput}`}
                  />
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.1"
                    value={o.price}
                    onChange={(e) =>
                      setOptions((prev) => prev.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)))
                    }
                    aria-label="Price add-on"
                    className="h-11 w-20 shrink-0 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-900 outline-none focus:border-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setOptions((prev) => prev.filter((_, j) => j !== i))}
                    aria-label="Remove option"
                    className="h-11 w-11 shrink-0 rounded-lg border border-slate-300 text-lg font-bold text-red-700"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setOptions((prev) => [...prev, { name: '', price: '' }])}
              className="mt-2 h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-slate-800"
            >
              + Add option
            </button>
          </div>
        )}

        {isNumber && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
            <p className="text-xs font-bold text-slate-700">Price per unit (RM) + limits</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <label className="block">
                <span className="text-xs text-slate-600">RM / unit</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={ppu}
                  onChange={(e) => setPpu(e.target.value)}
                  className={`mt-0.5 ${smallInput}`}
                />
              </label>
              <label className="block">
                <span className="text-xs text-slate-600">Min</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={min}
                  onChange={(e) => setMin(e.target.value)}
                  className={`mt-0.5 ${smallInput}`}
                />
              </label>
              <label className="block">
                <span className="text-xs text-slate-600">Max</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={max}
                  onChange={(e) => setMax(e.target.value)}
                  className={`mt-0.5 ${smallInput}`}
                />
              </label>
            </div>
            <label className="mt-2 flex min-h-[44px] cursor-pointer items-center gap-2 text-sm font-bold text-slate-900">
              <input
                type="checkbox"
                checked={integer}
                onChange={(e) => setInteger(e.target.checked)}
                className="h-5 w-5 accent-emerald-600"
              />
              Whole numbers only
            </label>
          </div>
        )}

        {error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
            {error}
          </p>
        )}
      </div>
    </BottomSheet>
  );
}
