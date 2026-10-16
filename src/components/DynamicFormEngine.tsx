import { useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { CustomField, CustomValue } from '../types';
import {
  BUYER_UPLOADS_BUCKET,
  FILE_ACCEPT,
  FILE_MAX_BYTES,
  fileNameFromUrl,
  isAllowedUploadType,
  uploadPathFor,
} from '../utils/files';

interface Props {
  fields: CustomField[];
  values: Record<string, CustomValue>;
  onChange: (fieldId: string, value: CustomValue) => void;
  errors?: Record<string, string>;
  shopId: string;
}

type Values = Record<string, CustomValue>;

const inputCls =
  'h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-900 outline-none focus:border-emerald-600';

function FileField({
  field,
  value,
  shopId,
  onChange,
}: {
  field: CustomField;
  value: CustomValue | undefined;
  shopId: string;
  onChange: (value: CustomValue) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const url = typeof value === 'string' ? value : '';

  async function handlePicked(picked: File | undefined) {
    if (!picked || uploading) return;
    setUploadError(null);
    if (!isAllowedUploadType(picked)) {
      setUploadError('Jenis fail tidak dibenarkan. Guna JPG, PNG, WEBP atau PDF.');
      return;
    }
    if (picked.size > FILE_MAX_BYTES) {
      setUploadError('Fail melebihi 5MB.');
      return;
    }
    setUploading(true);
    try {
      const path = uploadPathFor(shopId, picked.name);
      const { error: upErr } = await supabase.storage
        .from(BUYER_UPLOADS_BUCKET)
        .upload(path, picked, { contentType: picked.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from(BUYER_UPLOADS_BUCKET).getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (e: unknown) {
      setUploadError(e instanceof Error ? e.message : 'Muat naik gagal. Cuba lagi.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={FILE_ACCEPT}
        disabled={uploading}
        onChange={(e) => handlePicked(e.target.files?.[0])}
        className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-3 file:py-2 file:text-sm file:font-bold file:text-white disabled:opacity-60"
      />
      {uploading && <p className="mt-1 text-sm text-slate-500">Memuat naik…</p>}
      {uploadError && <p className="mt-1 text-sm font-medium text-red-600">{uploadError}</p>}
      {url && (
        <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="min-w-0 flex-1 truncate text-sm font-bold text-emerald-700 underline"
          >
            {fileNameFromUrl(url) || 'Lihat fail'}
          </a>
          <button
            type="button"
            onClick={() => onChange('')}
            className="h-10 shrink-0 rounded-lg px-3 text-xs font-bold text-red-600"
          >
            Padam
          </button>
        </div>
      )}
      <p className="mt-1 text-xs text-slate-500">
        JPG, PNG, WEBP atau PDF — maks 5MB.
        {field.required ? '' : ' Pilihan.'}
      </p>
    </div>
  );
}

export default function DynamicFormEngine({ fields, values, onChange, errors = {}, shopId }: Props) {
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
        const span = f.type === 'textarea' || f.type === 'checkbox' || f.type === 'file' ? 'sm:col-span-2' : '';
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

            {f.type === 'radio' && (
              <div className="space-y-2">
                {(f.options ?? []).map((o) => (
                  <label
                    key={o.name}
                    className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4"
                  >
                    <input
                      type="radio"
                      name={`radio-${f.id}`}
                      checked={String(val) === o.name}
                      onChange={() => onChange(f.id, o.name)}
                      className="h-5 w-5 shrink-0 accent-emerald-600"
                    />
                    <span className="flex-1 text-sm text-slate-900">{o.name}</span>
                    {Number(o.price_modifier) > 0 && (
                      <span className="text-xs font-bold text-emerald-600">
                        +RM {Number(o.price_modifier).toFixed(2)}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            )}

            {f.type === 'checkbox' && (
              <div className="space-y-2">
                {(f.options ?? []).map((o) => {
                  const picked = Array.isArray(val) ? val : [];
                  const checked = picked.includes(o.name);
                  return (
                    <label
                      key={o.name}
                      className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4"
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
                        className="h-5 w-5 shrink-0 rounded border-slate-300 accent-emerald-600"
                      />
                      <span className="flex-1 text-sm text-slate-900">{o.name}</span>
                      {Number(o.price_modifier) > 0 && (
                        <span className="text-xs font-bold text-emerald-600">
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

            {f.type === 'file' && (
              <FileField
                field={f}
                value={val}
                shopId={shopId}
                onChange={(v) => onChange(f.id, v)}
              />
            )}

            {err && <p className="mt-1 text-sm font-medium text-red-600">{err}</p>}
          </div>
        );
      })}
    </div>
  );
}

export function computeModifierTotal(fields: CustomField[], values: Values): number {
  let total = 0;
  for (const f of fields) {
    if (f.type !== 'select' && f.type !== 'radio' && f.type !== 'checkbox') continue;
    const chosen = values[f.id];
    if (!chosen) continue;
    const names = Array.isArray(chosen) ? chosen : [String(chosen)];
    for (const name of names) {
      const opt = (f.options ?? []).find((o) => o.name === name);
      if (opt) total += Number(opt.price_modifier) || 0;
    }
  }
  return total;
}

export function validateDynamicFields(fields: CustomField[], values: Values): Record<string, string> {
  const errs: Record<string, string> = {};
  for (const f of fields) {
    if (!f.required) continue;
    const v = values[f.id];
    const empty =
      v === undefined || v === null || (Array.isArray(v) ? v.length === 0 : String(v).trim() === '');
    if (empty) {
      errs[f.id] = `${f.label} diperlukan`;
    }
  }
  return errs;
}
