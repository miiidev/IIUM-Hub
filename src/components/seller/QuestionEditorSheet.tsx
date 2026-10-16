import { useEffect, useState } from 'react';
import type { CustomField } from '../../types';
import BottomSheet from '../BottomSheet';
import { FIELD_TYPE_LABEL } from '../../utils/fieldLabels';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';

interface Props {
  open: boolean;
  field: CustomField | null;
  onClose: () => void;
  onSave: (field: CustomField) => void;
  onRemove: () => void;
}

const smallInput =
  'h-11 w-full rounded-control border border-line bg-white px-3 text-sm text-ink outline-none transition-colors placeholder:text-placeholder focus:border-emerald focus:ring-2 focus:ring-emerald/25 disabled:opacity-50';

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
  const [confirmRemove, setConfirmRemove] = useState(false);

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
  }, [open]);

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
    <>
      <BottomSheet
      open={open}
      onClose={onClose}
      title={field.label || 'Edit question'}
      footer={
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setConfirmRemove(true)}
            className="border-red-200 text-danger hover:bg-red-50"
          >
            Remove
          </Button>
          <Button type="button" onClick={handleSave} className="flex-1">
            Save question
          </Button>
        </div>
      }
    >
      <p className="text-xs font-semibold text-muted">{FIELD_TYPE_LABEL[field.type]}</p>
      <div className="mt-2 space-y-3">
        <div>
          <label className="mb-1 block text-sm font-semibold text-ink">Question</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Paper size"
            className={smallInput}
          />
        </div>
        <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm font-semibold text-ink">
          <input
            type="checkbox"
            checked={required}
            onChange={(e) => setRequired(e.target.checked)}
            className="h-5 w-5 accent-emerald"
          />
          Required
        </label>
        <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm font-semibold text-ink">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-5 w-5 accent-emerald"
          />
          On (off hides it from buyers)
        </label>

        {isChoice && (
          <div className="rounded-control border border-line bg-cream p-3">
            <p className="text-xs font-semibold text-muted">Options and price add-ons (RM)</p>
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
                    className="h-11 w-20 shrink-0 rounded-control border border-line bg-white px-2 text-sm text-ink outline-none transition-colors focus:border-emerald focus:ring-2 focus:ring-emerald/25"
                  />
                  <button
                    type="button"
                    onClick={() => setOptions((prev) => prev.filter((_, j) => j !== i))}
                    aria-label="Remove option"
                    className="h-11 w-11 shrink-0 rounded-control border border-line text-lg font-bold text-danger transition-colors hover:bg-red-50"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setOptions((prev) => [...prev, { name: '', price: '' }])}
              className="mt-2 h-11 rounded-control border border-line bg-white px-3 text-sm font-semibold text-ink transition-colors hover:bg-mint/30"
            >
              + Add option
            </button>
          </div>
        )}

        {isNumber && (
          <div className="rounded-control border border-line bg-cream p-3">
            <p className="text-xs font-semibold text-muted">Price per unit (RM) + limits</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <label className="block">
                <span className="text-xs text-muted">RM / unit</span>
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
                <span className="text-xs text-muted">Min</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={min}
                  onChange={(e) => setMin(e.target.value)}
                  className={`mt-0.5 ${smallInput}`}
                />
              </label>
              <label className="block">
                <span className="text-xs text-muted">Max</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={max}
                  onChange={(e) => setMax(e.target.value)}
                  className={`mt-0.5 ${smallInput}`}
                />
              </label>
            </div>
            <label className="mt-2 flex min-h-[44px] cursor-pointer items-center gap-2 text-sm font-semibold text-ink">
              <input
                type="checkbox"
                checked={integer}
                onChange={(e) => setInteger(e.target.checked)}
                className="h-5 w-5 accent-emerald"
              />
              Whole numbers only
            </label>
          </div>
        )}

        {error && (
          <p role="alert" className="rounded-control border border-red-200 bg-red-50 p-3 text-sm font-medium text-danger">
            {error}
          </p>
        )}
      </div>
    </BottomSheet>
      <ConfirmDialog
        open={confirmRemove}
        title="Remove question?"
        message={<>“{label || 'This question'}” will be removed from the product. This can’t be undone.</>}
        confirmLabel="Remove"
        onConfirm={() => {
          setConfirmRemove(false);
          onRemove();
          onClose();
        }}
        onClose={() => setConfirmRemove(false)}
      />
    </>
  );
}
