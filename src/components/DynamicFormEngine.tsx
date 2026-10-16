import { useRef, useState } from 'react';
import type { CustomField, CustomValue } from '../types';
import { activeFields } from '../utils/formPresets';
import {
  FILE_ACCEPT,
  displayFileName,
  uploadBuyerFile,
  validateUploadFile,
} from '../utils/uploadFile';

interface Props {
  fields: CustomField[];
  values: Record<string, CustomValue>;
  onChange: (fieldId: string, value: CustomValue) => void;
  errors?: Record<string, string>;
  shopId: string;
  preview?: boolean;
  onBusyChange?: (busy: boolean) => void;
}

const inputCls =
  'h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-900 outline-none focus:border-slate-900';

function FileField({
  inputId,
  value,
  shopId,
  preview,
  onChange,
  onBusyChange,
}: {
  inputId: string;
  value: CustomValue;
  shopId: string;
  preview: boolean;
  onChange: (value: CustomValue) => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const url = typeof value === 'string' ? value : '';

  if (preview) {
    return (
      <div>
        <input
          id={inputId}
          type="file"
          disabled
          className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-slate-200 file:px-3 file:py-2 file:text-sm file:font-bold file:text-slate-500 disabled:opacity-60"
        />
        <p className="mt-1 text-xs text-slate-500">
          Preview only — real upload happens in the storefront.
        </p>
      </div>
    );
  }

  async function handlePicked(picked: File | undefined) {
    if (!picked || uploading) return;
    const invalid = validateUploadFile(picked);
    if (invalid) {
      setUploadError(invalid);
      return;
    }
    setUploadError(null);
    setUploading(true);
    onBusyChange?.(true);
    try {
      const publicUrl = await uploadBuyerFile(shopId, picked);
      onChange(publicUrl);
    } catch {
      setUploadError('Upload failed. Try again.');
    } finally {
      setUploading(false);
      onBusyChange?.(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={FILE_ACCEPT}
        disabled={uploading}
        onChange={(e) => handlePicked(e.target.files?.[0])}
        className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-bold file:text-white disabled:opacity-60"
      />
      {uploading && <p className="mt-1 text-sm text-slate-500">Uploading…</p>}
      {uploadError && <p className="mt-1 text-sm font-medium text-red-600">{uploadError}</p>}
      {url && (
        <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="min-w-0 flex-1 truncate text-sm font-bold text-emerald-700 underline"
          >
            {displayFileName(url)}
          </a>
          <button
            type="button"
            onClick={() => onChange('')}
            className="h-10 shrink-0 rounded-lg px-3 text-xs font-bold text-red-600"
          >
            Remove
          </button>
        </div>
      )}
      <p className="mt-1 text-xs text-slate-500">JPG, PNG, WEBP or PDF — max 5MB.</p>
    </div>
  );
}

export default function DynamicFormEngine({
  fields,
  values,
  onChange,
  errors = {},
  shopId,
  preview = false,
  onBusyChange,
}: Props) {
  const list = activeFields(fields);
  if (list.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {list.map((f) => {
        const val = values[f.id] ?? '';
        const err = errors[f.id];
        const wide = f.type === 'textarea' || f.type === 'file' ? 'sm:col-span-2' : '';
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
                <option value="">-- Select --</option>
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

            {f.type === 'multiselect' && (
              <div className="space-y-2">
                {(f.options ?? []).map((o) => {
                  const picked = Array.isArray(val) ? val.map(String) : [];
                  const checked = picked.includes(o.name);
                  return (
                    <label
                      key={o.name}
                      className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-4"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...picked, o.name]
                            : picked.filter((n) => n !== o.name);
                          onChange(f.id, next);
                        }}
                        className="h-5 w-5 shrink-0 accent-slate-900"
                      />
                      <span className="flex-1 text-sm text-slate-900">{o.name}</span>
                      {Number(o.price_modifier) > 0 && (
                        <span className="text-xs font-bold text-slate-700">
                          +RM {Number(o.price_modifier).toFixed(2)}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
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
              <div>
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
                {Number(f.price_per_unit) > 0 && (
                  <p className="mt-1 text-xs text-slate-500">
                    RM {Number(f.price_per_unit).toFixed(2)} per unit
                  </p>
                )}
              </div>
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

            {f.type === 'date' && (
              <input
                id={fieldId}
                className={inputCls}
                type="date"
                value={String(val)}
                onChange={(e) => onChange(f.id, e.target.value)}
              />
            )}

            {f.type === 'phone' && (
              <input
                id={fieldId}
                className={inputCls}
                type="tel"
                inputMode="tel"
                value={String(val)}
                placeholder={f.placeholder || 'e.g. 012-3456789'}
                onChange={(e) => onChange(f.id, e.target.value)}
              />
            )}

            {f.type === 'file' && (
              <FileField
                inputId={fieldId}
                value={val}
                shopId={shopId}
                preview={preview}
                onChange={(v) => onChange(f.id, v)}
                onBusyChange={onBusyChange}
              />
            )}

            {err && <p className="mt-1 text-sm font-medium text-red-600">{err}</p>}
          </div>
        );
      })}
    </div>
  );
}
