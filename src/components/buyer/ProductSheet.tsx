import { useEffect, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import type { CustomValue, Product } from '../../types';
import BottomSheet from '../BottomSheet';
import DynamicFormEngine from '../DynamicFormEngine';
import { buildItemSnapshot } from '../../utils/orderSnapshot';
import { clampQty, validateRequired } from '../../utils/formPresets';
import { errorCount, firstErrorFieldId } from '../../utils/formUi';
import Button from '../ui/Button';

interface Props {
  open: boolean;
  product: Product | null;
  initialValues: Record<string, CustomValue>;
  initialQty: number;
  initialErrors?: Record<string, string>;
  editing: boolean;
  shopId: string;
  onClose: () => void;
  onCommit: (values: Record<string, CustomValue>, qty: number) => void;
}

export default function ProductSheet({
  open,
  product,
  initialValues,
  initialQty,
  initialErrors = {},
  editing,
  shopId,
  onClose,
  onCommit,
}: Props) {
  const [values, setValues] = useState<Record<string, CustomValue>>(initialValues);
  const [qty, setQty] = useState(initialQty);
  const [errors, setErrors] = useState<Record<string, string>>(initialErrors);
  const [busyCount, setBusyCount] = useState(0);
  const busy = busyCount > 0;

  useEffect(() => {
    if (open) {
      setValues(initialValues);
      setQty(Math.max(1, initialQty));
      setErrors(initialErrors);
      setBusyCount(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!product) return null;
  const fields = product.custom_fields ?? [];
  const base = Number(product.price) || 0;
  const snap = buildItemSnapshot({ title: product.title, price: base }, fields, values, qty);
  const nErrors = errorCount(errors);

  function handlePrimary() {
    if (busy) return;
    const errs = validateRequired(fields, values);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      const first = firstErrorFieldId(fields, errs);
      if (first) {
        window.setTimeout(() => {
          const el = document.getElementById(`field-${first}`);
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const input = el?.querySelector<HTMLElement>('input, select, textarea');
          (input ?? el)?.focus({ preventScroll: true });
        }, 50);
      }
      return;
    }
    onCommit(values, qty);
  }

  function handleFocus(e: React.FocusEvent) {
    const t = e.target as HTMLElement;
    if (t && /^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName) && t.getAttribute('type') !== 'file') {
      window.setTimeout(() => {
        t.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 250);
    }
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={product.title}
      busy={busy}
      footer={
        <div className="flex items-center gap-3">
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => setQty((q) => Math.max(1, clampQty(q - 1)))}
              className="flex h-12 w-12 items-center justify-center rounded-control border border-line bg-white text-ink transition-colors hover:bg-mint/30"
            >
              <Minus size={18} aria-hidden="true" />
            </button>
            <span className="w-6 text-center font-semibold text-ink">{qty}</span>
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => setQty((q) => clampQty(q + 1))}
              className="flex h-12 w-12 items-center justify-center rounded-control bg-emerald text-white transition-colors hover:bg-emerald/90"
            >
              <Plus size={18} aria-hidden="true" />
            </button>
          </div>
          <Button
            type="button"
            onClick={handlePrimary}
            disabled={busy}
            className="flex-1"
          >
            {busy ? 'Uploading…' : `${editing ? 'Update order' : 'Add to order'} · RM ${snap.lineTotal.toFixed(2)}`}
          </Button>
        </div>
      }
    >
      <div onFocusCapture={handleFocus}>
        {nErrors > 0 && (
          <p role="alert" className="mb-3 rounded-control border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
            {nErrors} {nErrors === 1 ? 'thing' : 'things'} to fill in
          </p>
        )}
        <p className="text-sm text-muted">Base: RM {base.toFixed(2)}</p>
        <div className="mt-3">
          <DynamicFormEngine
            fields={fields}
            values={values}
            onChange={(id, v) => {
              setValues((p) => ({ ...p, [id]: v }));
              setErrors((p) => ({ ...p, [id]: '' }));
            }}
            errors={errors}
            shopId={shopId}
            onBusyChange={(b) => setBusyCount((c) => Math.max(0, c + (b ? 1 : -1)))}
          />
        </div>
        {snap.fields && snap.fields.length > 0 && (
          <details className="mt-3 rounded-control border border-line bg-white">
            <summary className="flex min-h-[44px] cursor-pointer items-center px-3 text-sm font-semibold text-ink">
              See price breakdown
            </summary>
            <div className="border-t border-line p-3 text-sm text-muted">
              <p className="flex justify-between">
                <span>Base</span>
                <span>RM {base.toFixed(2)}</span>
              </p>
              {snap.fields.map((f) => (
                <p key={f.field_id} className="flex justify-between gap-2">
                  <span className="min-w-0 flex-1">
                    {f.label}: {f.display}
                  </span>
                  {f.price_applied > 0 && (
                    <span className="font-semibold text-emerald">+RM {f.price_applied.toFixed(2)}</span>
                  )}
                </p>
              ))}
              <p className="mt-1 flex justify-between border-t border-line pt-1 font-semibold text-ink">
                <span>
                  {qty} × RM {snap.unitPrice.toFixed(2)}
                </span>
                <span>RM {snap.lineTotal.toFixed(2)}</span>
              </p>
            </div>
          </details>
        )}
      </div>
    </BottomSheet>
  );
}
