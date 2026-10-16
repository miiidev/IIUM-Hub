import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { CustomField, PresetKey, Product } from '../../types';
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
  getPreset,
} from '../../utils/formPresets';
import { formatRange, priceRange } from '../../utils/priceRange';
import { randomUuid } from '../../utils/uuid';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import ConfirmDialog from '../ui/ConfirmDialog';

const inputCls =
  'h-12 w-full rounded-control border border-line bg-white px-4 text-ink outline-none transition-colors placeholder:text-placeholder focus:border-emerald focus:ring-2 focus:ring-emerald/25';

interface Props {
  editing: Product | null;
  products: Product[];
  onDone: () => void;
  onCancel: () => void;
}

type Step = 1 | 2 | 3;

const STEP_LABELS: Array<{ n: Step; label: string }> = [
  { n: 1, label: 'Details' },
  { n: 2, label: 'Questions' },
  { n: 3, label: 'Review' },
];

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
  const [imageUrl, setImageUrl] = useState(editing?.image_url ?? '');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [pendingPreset, setPendingPreset] = useState<PresetKey | null>(null);
  const [pendingCopy, setPendingCopy] = useState(false);

  useEffect(() => {
    setStep(editing ? 3 : 1);
    setTitle(editing?.title ?? '');
    setPrice(editing ? String(editing.price) : '');
    setAvailable(editing?.is_available ?? true);
    setFields(editing?.custom_fields ?? []);
    setCopyFrom('');
    setError(null);
    setImageUrl(editing?.image_url ?? '');
    setUploadingImage(false);
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

  function applyPreset(key: PresetKey) {
    if (fields.length > 0) {
      setPendingPreset(key);
      return;
    }
    setFields(clonePresetFields(key));
  }

  function applyCopy() {
    const src = products.find((p) => p.id === copyFrom);
    if (!src) return;
    if (fields.length > 0) {
      setPendingCopy(true);
      return;
    }
    setFields(copyFields(src.custom_fields ?? []));
  }

  function confirmApplyPreset() {
    if (pendingPreset) setFields(clonePresetFields(pendingPreset));
    setPendingPreset(null);
  }

  function confirmApplyCopy() {
    const src = products.find((p) => p.id === copyFrom);
    if (src) setFields(copyFields(src.custom_fields ?? []));
    setPendingCopy(false);
  }

  async function handleImageUpload(file: File) {
    if (!shop) return;
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('Product image must be an image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Product image must be 2MB or smaller.');
      return;
    }
    setUploadingImage(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
      const path = `${shop.id}/${randomUuid()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('product-images')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('product-images').getPublicUrl(path);
      setImageUrl(`${data.publicUrl}?t=${Date.now()}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to upload image.');
    } finally {
      setUploadingImage(false);
    }
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
          .update({ title: title.trim(), price: numPrice, is_available: available, custom_fields: cleaned, image_url: imageUrl.split('?')[0] || null })
          .eq('id', editing.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase.from('products').insert({
          shop_id: shop.id,
          title: title.trim(),
          price: numPrice,
          is_available: available,
          custom_fields: cleaned,
          image_url: imageUrl.split('?')[0] || null,
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
    <>
      <div>
        <h2 className="text-lg font-semibold text-ink">{editing ? 'Edit Product' : 'Add Product'}</h2>
      <p className="mt-1 text-sm font-semibold text-muted" aria-label={`Step ${step} of 3`}>
        {STEP_LABELS.map((s, i) => (
          <span key={s.n} className={step === s.n ? 'text-ink' : ''}>
            {s.n} {s.label}
            {i < STEP_LABELS.length - 1 ? ' · ' : ''}
          </span>
        ))}
      </p>

      {step === 1 && (
        <div className="mt-3 space-y-3">
          <div>
            <label className="mb-1 block text-sm font-semibold text-ink">Name *</label>
            <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Nasi Lemak Ayam" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-ink">Price (RM) *</label>
            <input className={inputCls} type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 8.50" min="0" step="0.10" />
          </div>
          <label className="flex h-12 items-center gap-2 text-sm font-semibold text-ink">
            <input type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)} className="h-5 w-5 accent-emerald" />
            Available for sale
          </label>
          <div className="rounded-control border border-line bg-cream p-3">
            <p className="text-sm font-semibold text-ink">Product image (optional)</p>
            <p className="text-xs text-muted">JPG/PNG, max 2MB.</p>
            <div className="mt-2">
              {imageUrl ? (
                <img src={imageUrl} alt="Product" className="aspect-video w-full rounded-control border border-line bg-white object-cover animate-fade-in" />
              ) : (
                <div className="flex aspect-video w-full items-center justify-center rounded-control border border-line bg-white text-sm font-semibold text-muted">
                  No image
                </div>
              )}
              <div className="mt-2 flex gap-2">
                <label className="inline-flex h-12 flex-1 cursor-pointer items-center justify-center rounded-control bg-emerald px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald/90">
                  {uploadingImage ? 'Uploading...' : 'Upload image'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingImage}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleImageUpload(f);
                      e.target.value = '';
                    }}
                  />
                </label>
                {imageUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setImageUrl('')}
                    disabled={uploadingImage}
                    className="border-red-200 text-danger hover:bg-red-50"
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>
          <Button onClick={nextFromInfo} className="w-full">
            Continue
          </Button>
          {editing && (
            <Button variant="ghost" size="sm" onClick={onCancel} className="w-full">
              Cancel
            </Button>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="mt-3 space-y-4">
          <div>
            <p className="mb-2 text-sm font-semibold text-ink">What do you need to ask customers?</p>
            <div className="grid grid-cols-1 gap-2">
              {PRESETS.map((p) => {
                const labels = p.fields.slice(0, 3).map((f) => f.label);
                const more = p.fields.length - labels.length;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => applyPreset(p.key)}
                    className={`min-h-[48px] rounded-control border bg-white px-3 py-2 text-left transition-colors hover:bg-mint/20 ${
                      recommended === p.key ? 'border-emerald' : 'border-line'
                    }`}
                  >
                    <span className="flex flex-wrap items-center gap-1 text-sm font-semibold text-ink">
                      {p.label}
                      {recommended === p.key && <Badge tone="emerald">Recommended</Badge>}
                    </span>
                    <span className="block text-xs text-muted">{p.description}</span>
                    {labels.length > 0 && (
                      <span className="block text-xs text-muted">
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
            <div className="rounded-control border border-line bg-white p-3">
              <p className="text-sm font-semibold text-ink">Copy questions from another product</p>
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
                <Button
                  type="button"
                  variant="ghost"
                  disabled={!copyFrom}
                  onClick={applyCopy}
                  className="shrink-0"
                >
                  Copy
                </Button>
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
            <Button variant="ghost" onClick={() => setStep(1)}>
              ← Back
            </Button>
            <Button onClick={() => setStep(3)} className="flex-1">
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="mt-3 space-y-3">
          <div className="space-y-3 rounded-control border border-line bg-white p-3">
            <div>
              <label className="mb-1 block text-sm font-semibold text-ink">Name *</label>
              <input
                className={inputCls}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Nasi Lemak Ayam"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-ink">Price (RM) *</label>
              <input
                className={inputCls}
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 8.50"
                min="0"
                step="0.10"
              />
            </div>
            <label className="flex h-12 items-center gap-2 text-sm font-semibold text-ink">
              <input
                type="checkbox"
                checked={available}
                onChange={(e) => setAvailable(e.target.checked)}
                className="h-5 w-5 accent-emerald"
              />
              Available for sale
            </label>
            <p className="text-sm text-muted">
              Customers pay{' '}
              <span className="font-bold text-ink">{formatRange(priceRange(numPrice, fields))}</span>
            </p>
          </div>
          {fields.length > 0 ? (
            <div className="space-y-2">
              {fields.map((f) => (
                <QuestionRow key={f.id} field={f} onOpen={() => setStep(2)} disabled={saving} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">No questions — plain product.</p>
          )}
          {fields.length > 0 && (
            <FormPreview fields={fields} basePrice={numPrice} shopId={shop.id} />
          )}
          {error && (
            <div role="alert" className="rounded-control border border-red-200 bg-red-50 p-3 text-sm font-medium text-danger">
              {error}
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setStep(2)}>
              ← Back
            </Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Product'}
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel} className="w-full">
            {editing ? 'Cancel Edit' : 'Cancel'}
          </Button>
        </div>
      )}

      {error && step !== 3 && (
        <div role="alert" className="mt-3 rounded-control border border-red-200 bg-red-50 p-3 text-sm font-medium text-danger">
          {error}
        </div>
      )}
      </div>

      <ConfirmDialog
        open={pendingPreset !== null}
        title="Replace questions?"
        message={
          <>
            Applying the{' '}
            <span className="font-semibold text-ink">
              {pendingPreset ? getPreset(pendingPreset).label : ''}
            </span>{' '}
            preset will replace the current questions on this product. This can’t be undone.
          </>
        }
        confirmLabel="Replace questions"
        onConfirm={confirmApplyPreset}
        onClose={() => setPendingPreset(null)}
      />

      <ConfirmDialog
        open={pendingCopy}
        title="Replace with copied questions?"
        message="The copied questions will replace the current questions on this product. This can’t be undone."
        confirmLabel="Replace questions"
        onConfirm={confirmApplyCopy}
        onClose={() => setPendingCopy(false)}
      />
    </>
  );
}
