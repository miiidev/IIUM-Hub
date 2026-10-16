import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { CustomField, Product } from '../../types';
import SellerFormConfigurator from '../../components/SellerFormConfigurator';
import FormPreview from '../../components/seller/FormPreview';
import QuestionRow from '../../components/seller/QuestionRow';
import {
  PRESETS,
  activeFields,
  clonePresetFields,
  copyFields,
  getPresetForCategory,
  sanitizeFields,
} from '../../utils/formPresets';
import { formatRange, priceRange } from '../../utils/priceRange';

const inputCls =
  'h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-900 outline-none focus:border-emerald-600';

interface Props {
  editing: Product | null;
  products: Product[];
  onDone: () => void;
  onCancel: () => void;
}

type Step = 1 | 2 | 3;

export default function ProductWizard({ editing, products, onDone, onCancel }: Props) {
  const { shop } = useAuth();
  const [step, setStep] = useState<Step>(editing ? 3 : 1);
  const [title, setTitle] = useState(editing?.title ?? '');
  const [price, setPrice] = useState(editing ? String(editing.price) : '');
  const [available, setAvailable] = useState(editing?.is_available ?? true);
  const [fields, setFields] = useState<CustomField[]>(editing?.custom_fields ?? []);
  const [copyFrom, setCopyFrom] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setStep(editing ? 3 : 1);
    setTitle(editing?.title ?? '');
    setPrice(editing ? String(editing.price) : '');
    setAvailable(editing?.is_available ?? true);
    setFields(editing?.custom_fields ?? []);
    setCopyFrom('');
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing?.id]);

  if (!shop) return null;
  const recommended = getPresetForCategory(shop.category);
  const copySources = products.filter(
    (p) => p.id !== editing?.id && activeFields(p.custom_fields).length > 0
  );
  const numPrice = Number(price) || 0;

  function nextFromInfo() {
    setError(null);
    if (!title.trim()) return setError('Product name is required.');
    if (!price || isNaN(numPrice) || numPrice <= 0)
      return setError('Price must be a number above 0.');
    setStep(2);
  }

  function applyPreset(key: Parameters<typeof clonePresetFields>[0]) {
    if (fields.length > 0 && !window.confirm('Replace current questions?')) return;
    setFields(clonePresetFields(key));
  }

  function applyCopy() {
    const src = products.find((p) => p.id === copyFrom);
    if (!src) return;
    if (fields.length > 0 && !window.confirm('Replace current questions with the copy?')) return;
    setFields(copyFields(src.custom_fields ?? []));
  }

  async function handleSave() {
    setError(null);
    if (!shop) return;
    if (!title.trim()) return setError('Product name is required.');
    if (!price || isNaN(numPrice) || numPrice <= 0)
      return setError('Price must be a number above 0.');
    const cleaned = sanitizeFields(fields);
    const missingLabel = cleaned.some((f) => f.enabled !== false && !f.label);
    if (missingLabel) return setError('Every active question needs a label.');
    const badSelect = cleaned.some(
      (f) =>
        f.enabled !== false &&
        (f.type === 'select' || f.type === 'multiselect') &&
        (f.options ?? []).length === 0
    );
    if (badSelect) return setError('Choice questions need at least one option.');
    for (const f of cleaned) {
      if (f.enabled === false || (f.type !== 'select' && f.type !== 'multiselect')) continue;
      const seen = new Set<string>();
      for (const o of f.options ?? []) {
        const key = o.name.trim().toLowerCase();
        if (seen.has(key)) return setError(`Duplicate option "${o.name.trim()}" in "${f.label}".`);
        seen.add(key);
      }
    }
    setSaving(true);
    try {
      if (editing) {
        const { error: err } = await supabase
          .from('products')
          .update({ title: title.trim(), price: numPrice, is_available: available, custom_fields: cleaned })
          .eq('id', editing.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase.from('products').insert({
          shop_id: shop.id,
          title: title.trim(),
          price: numPrice,
          is_available: available,
          custom_fields: cleaned,
        });
        if (err) throw err;
      }
      onDone();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save product.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2 className="font-bold text-slate-900">{editing ? 'Edit Product' : 'Add Product'}</h2>
      <p className="mt-1 text-sm font-bold text-slate-600" aria-label={`Step ${step} of 3`}>
        <span className={step === 1 ? 'text-slate-900' : ''}>1 Details</span>
        {' · '}
        <span className={step === 2 ? 'text-slate-900' : ''}>2 Questions</span>
        {' · '}
        <span className={step === 3 ? 'text-slate-900' : ''}>3 Review</span>
      </p>

      {step === 1 && (
        <div className="mt-3 space-y-3">
          <div>
            <label className="mb-1 block text-sm font-bold text-slate-900">Name *</label>
            <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Nasi Lemak Ayam" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-bold text-slate-900">Price (RM) *</label>
            <input className={inputCls} type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 8.50" min="0" step="0.10" />
          </div>
          <label className="flex h-12 items-center gap-2 text-sm font-bold text-slate-900">
            <input type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)} className="h-5 w-5" />
            Available for sale
          </label>
          <button
            onClick={nextFromInfo}
            className="h-12 w-full rounded-xl bg-slate-900 font-bold text-white"
          >
            Continue
          </button>
          {editing && (
            <button onClick={onCancel} className="h-11 w-full rounded-xl border border-slate-200 text-sm font-bold text-slate-700">
              Cancel
            </button>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="mt-3 space-y-4">
          <div>
            <p className="mb-2 text-sm font-bold text-slate-900">What do you need to ask customers?</p>
            <div className="grid grid-cols-1 gap-2">
              {PRESETS.map((p) => {
                const labels = p.fields.slice(0, 3).map((f) => f.label);
                const more = p.fields.length - labels.length;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => applyPreset(p.key)}
                    className={`min-h-[48px] rounded-xl border bg-white px-3 py-2 text-left ${
                      recommended === p.key ? 'border-slate-900' : 'border-slate-300'
                    }`}
                  >
                    <span className="flex items-center gap-1 text-sm font-bold text-slate-900">
                      {p.label}
                      {recommended === p.key && (
                        <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs font-bold text-white">
                          Recommended
                        </span>
                      )}
                    </span>
                    <span className="block text-xs text-slate-600">{p.description}</span>
                    {labels.length > 0 && (
                      <span className="block text-xs text-slate-500">
                        {labels.join(' · ')}
                        {more > 0 ? ` · +${more} more` : ''}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {copySources.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-sm font-bold text-slate-900">Copy questions from another product</p>
              <div className="mt-2 flex gap-2">
                <select
                  value={copyFrom}
                  onChange={(e) => setCopyFrom(e.target.value)}
                  className={`${inputCls} min-w-0 flex-1`}
                >
                  <option value="">Choose a product…</option>
                  {copySources.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({activeFields(p.custom_fields).length})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!copyFrom}
                  onClick={applyCopy}
                  className="h-12 shrink-0 rounded-xl border border-slate-300 px-4 text-sm font-bold text-slate-800 disabled:opacity-40"
                >
                  Copy
                </button>
              </div>
            </div>
          )}

          <SellerFormConfigurator
            fields={fields}
            onChange={setFields}
            basePrice={numPrice}
            shopId={shop.id}
            disabled={saving}
            recommendedKey={recommended}
            hidePresets
          />

          <div className="flex gap-2">
            <button
              onClick={() => setStep(1)}
              className="h-12 rounded-xl border border-slate-300 px-6 font-bold text-slate-700"
            >
              ← Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="h-12 flex-1 rounded-xl bg-slate-900 font-bold text-white"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="mt-3 space-y-3">
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="font-bold text-slate-900">{title || '(No name yet)'}</p>
            <p className="text-sm text-slate-700">
              Customers pay{' '}
              <span className="font-bold">{formatRange(priceRange(numPrice, fields))}</span>
            </p>
          </div>
          {fields.length > 0 ? (
            <div className="space-y-2">
              {fields.map((f) => (
                <QuestionRow key={f.id} field={f} onOpen={() => setStep(2)} disabled={saving} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-600">No questions — plain product.</p>
          )}
          {fields.length > 0 && (
            <FormPreview fields={fields} basePrice={numPrice} shopId={shop.id} />
          )}
          {error && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => setStep(2)}
              className="h-12 rounded-xl border border-slate-300 px-6 font-bold text-slate-700"
            >
              ← Back
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="h-12 flex-1 rounded-xl bg-emerald-600 font-bold text-white disabled:opacity-60"
            >
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
          <button
            onClick={onCancel}
            className="h-11 w-full rounded-xl border border-slate-200 text-sm font-bold text-slate-700"
          >
            {editing ? 'Cancel Edit' : 'Cancel'}
          </button>
        </div>
      )}

      {error && step !== 3 && (
        <div role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
