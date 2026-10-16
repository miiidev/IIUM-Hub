import { useRef, useState } from 'react';
import type { CustomField, CustomValue } from '../types';
import { activeFields, clampNumberValue, normalizeMyPhone, todayLocal } from '../utils/formPresets';
import { quickPicksFor, shouldRenderAsChips } from '../utils/formUi';
import {
  FILE_ACCEPT,
  displayFileName,
  isLegacyFileUrl,
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
  'h-12 w-full rounded-control border border-line bg-white px-4 text-ink outline-none transition-colors placeholder:text-placeholder focus:border-emerald focus:ring-2 focus:ring-emerald/25';

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
          className="block w-full rounded-control border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none file:mr-3 file:rounded-control file:border-0 file:bg-cream file:px-3 file:py-2 file:text-sm file:font-semibold file:text-muted disabled:opacity-60"
        />
        <p className="mt-1 text-xs text-muted">
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
      const path = await uploadBuyerFile(shopId, picked);
      onChange(path);
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
        className="block w-full rounded-control border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none file:mr-3 file:rounded-control file:border-0 file:bg-emerald file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white disabled:opacity-60"
      />
      {uploading && <p className="mt-1 text-sm text-muted">Uploading…</p>}
      {uploadError && <p className="mt-1 text-sm font-medium text-danger">{uploadError}</p>}
      {url && (
        <div className="mt-2 flex items-center gap-2 rounded-control border border-line bg-cream p-2">
          {isLegacyFileUrl(url) ? (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="min-w-0 flex-1 truncate text-sm font-semibold text-emerald underline"
            >
              {displayFileName(url)}
            </a>
          ) : (
            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
              {displayFileName(url)} ✓
            </span>
          )}
          <button
            type="button"
            onClick={() => onChange('')}
            className="h-10 shrink-0 rounded-control px-3 text-xs font-semibold text-danger"
          >
            Remove
          </button>
        </div>
      )}
      <p className="mt-1 text-xs text-muted">JPG, PNG, WEBP or PDF — max 5MB.</p>
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
          <div key={f.id} id={fieldId} tabIndex={-1} className={`${wide} rounded-control outline-none focus:ring-2 focus:ring-emerald`}>
            <label htmlFor={fieldId} className="mb-1 block text-sm font-semibold text-ink">
              {f.label} {f.required && <span className="text-danger">*</span>}
            </label>

            {f.type === 'select' && shouldRenderAsChips(f) && (
              <div role="radiogroup" aria-label={f.label}>
                <div className="space-y-2">
                  {(f.options ?? []).map((o) => {
                    const checked = String(val) === o.name;
                    return (
                      <label
                        key={o.name}
                        className={`flex min-h-[48px] cursor-pointer items-center gap-3 rounded-control border px-4 transition-colors duration-150 ease-out-soft ${
                          checked ? 'border-emerald bg-mint/40' : 'border-line bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`radio-${f.id}`}
                          checked={checked}
                          onChange={() =>
                            onChange(f.id, checked && !f.required ? '' : o.name)
                          }
                          className="h-5 w-5 shrink-0 accent-emerald"
                        />
                        <span className="flex-1 text-sm text-ink">{o.name}</span>
                        {Number(o.price_modifier) > 0 && (
                          <span className="text-xs font-semibold text-emerald">
                            +RM {Number(o.price_modifier).toFixed(2)}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {f.type === 'select' && !shouldRenderAsChips(f) && (
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
                      className={`flex min-h-[48px] cursor-pointer items-center gap-3 rounded-control border px-4 ${
                        checked ? 'border-emerald bg-mint/40' : 'border-line bg-white'
                      }`}
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
                        className="h-5 w-5 shrink-0 accent-emerald"
                      />
                      <span className="flex-1 text-sm text-ink">{o.name}</span>
                      {Number(o.price_modifier) > 0 && (
                        <span className="text-xs font-semibold text-emerald">
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
                {f.integer ? (
                  <div className="flex h-12 items-center gap-2">
                    <button
                      type="button"
                      aria-label="Decrease"
                      onClick={() => {
                        const cur = Number(val) || 0;
                        onChange(f.id, clampNumberValue(f, cur - 1));
                      }}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control border border-line bg-white text-xl font-bold text-ink transition-colors hover:bg-mint/30"
                    >
                      −
                    </button>
                    <input
                      id={fieldId}
                      className={`${inputCls} text-center`}
                      type="number"
                      inputMode="numeric"
                      min={f.min}
                      max={f.max}
                      step={1}
                      value={val === '' ? '' : Number(val)}
                      placeholder="0"
                      onChange={(e) =>
                        onChange(f.id, e.target.value === '' ? '' : Number(e.target.value))
                      }
                    />
                    <button
                      type="button"
                      aria-label="Increase"
                      onClick={() => {
                        const cur = val === '' ? (Number(f.min) || 0) - 1 : Number(val) || 0;
                        onChange(f.id, clampNumberValue(f, cur + 1));
                      }}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-emerald text-xl font-bold text-white transition-colors hover:bg-emerald/90"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <input
                    id={fieldId}
                    className={inputCls}
                    type="number"
                    inputMode="decimal"
                    min={f.min}
                    max={f.max}
                    step="any"
                    value={val === '' ? '' : Number(val)}
                    placeholder="0"
                    onChange={(e) =>
                      onChange(f.id, e.target.value === '' ? '' : Number(e.target.value))
                    }
                  />
                )}
                {quickPicksFor(f).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {quickPicksFor(f).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => onChange(f.id, p)}
                        className="h-11 min-w-[44px] rounded-full border border-line bg-white px-3 text-sm font-semibold text-ink transition-colors hover:bg-mint/30"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
                {Number(f.price_per_unit) > 0 && (
                  <p className="mt-1 text-xs text-muted">
                    RM {Number(f.price_per_unit).toFixed(2)}{' '}
                    {/page/i.test(f.label) ? 'per page' : 'per unit'}
                  </p>
                )}
              </div>
            )}

            {f.type === 'textarea' && (
              <textarea
                id={fieldId}
                className="min-h-[96px] w-full rounded-control border border-line bg-white px-4 py-3 text-ink outline-none transition-colors placeholder:text-placeholder focus:border-emerald focus:ring-2 focus:ring-emerald/25"
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
                min={todayLocal()}
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
                autoComplete="tel"
                value={String(val)}
                placeholder={f.placeholder || 'e.g. 012-3456789'}
                onChange={(e) => onChange(f.id, e.target.value)}
                onBlur={(e) => {
                  const normalized = normalizeMyPhone(e.target.value);
                  if (normalized && normalized !== e.target.value) onChange(f.id, normalized);
                }}
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

            {err && (
              <p role="alert" className="mt-1 text-sm font-medium text-danger">
                {err}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
