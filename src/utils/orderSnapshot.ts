import type {
  CustomField,
  CustomValue,
  Order,
  OrderFieldSnapshot,
  OrderItemSummary,
} from '../types';
import {
  RENTAL_DAYS_ID,
  activeFields,
  clampNumberValue,
  computeUnitTotal,
  rentalDurationDays,
} from './formPresets';
import { displayFileName, fileNameFromValue } from './uploadFile';

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export interface OrderTotalCheck {
  ok: boolean;
  expected: number;
  actual: number;
  unknown: boolean;
}

export function orderTotalCheck(order: Order): OrderTotalCheck {
  const actual = Number(order.total_amount) || 0;
  const items = order.items ?? [];
  if (items.length === 0) return { ok: true, expected: actual, actual, unknown: false };
  let expected = 0;
  let ok = true;
  for (const it of items) {
    const line = Number(it.lineTotal);
    const unit = Number(it.unitPrice);
    const qty = Number(it.qty);
    if (!Number.isFinite(line) || !Number.isFinite(unit) || !Number.isFinite(qty)) {
      return { ok: true, expected: actual, actual, unknown: true };
    }
    const recomputed = round2(unit * qty);
    if (Math.abs(recomputed - line) > 0.01) ok = false;
    expected += recomputed;
  }
  expected = round2(expected);
  if (Math.abs(expected - actual) > 0.01) ok = false;
  return { ok, expected, actual, unknown: false };
}

export function displayForField(f: CustomField, v: CustomValue): string {
  if (Array.isArray(v)) return v.join(', ');
  if (f.type === 'file') return fileNameFromValue(v);
  return String(v).trim();
}

export function priceForField(f: CustomField, v: CustomValue): number {
  if (f.type === 'select' || f.type === 'multiselect') {
    const names = Array.isArray(v) ? v.map(String) : [String(v)];
    let sum = 0;
    for (const name of names) {
      const opt = (f.options ?? []).find((o) => o.name === name);
      if (opt) sum += Number(opt.price_modifier) || 0;
    }
    return round2(sum);
  }
  if (f.type === 'number') {
    const ppu = Number(f.price_per_unit) || 0;
    if (ppu <= 0) return 0;
    return round2(clampNumberValue(f, v) * ppu);
  }
  return 0;
}

export interface SnapshotProduct {
  title: string;
  price: number;
}

export function buildItemSnapshot(
  product: SnapshotProduct,
  fields: CustomField[],
  values: Record<string, CustomValue>,
  qty: number
): OrderItemSummary {
  const base = Number(product.price) || 0;
  const unit = computeUnitTotal(base, fields, values);
  const entries: OrderFieldSnapshot[] = [];
  for (const f of activeFields(fields)) {
    const raw = values[f.id];
    if (raw === undefined || raw === null) continue;
    const v: CustomValue =
      f.type === 'number' ? clampNumberValue(f, raw) : raw;
    const text = Array.isArray(v) ? v.join(', ') : String(v).trim();
    if (!text) continue;
    entries.push({
      field_id: f.id,
      label: f.label.trim() || f.id,
      type: f.type,
      value: v,
      display: displayForField(f, v),
      price_applied: priceForField(f, v),
    });
  }
  // Record the rental duration as a priced line so the buyer breakdown,
  // WhatsApp message and seller views all show base × days. The extra is
  // base × (days − 1) so `basePrice + Σ price_applied` still reconciles.
  const days = rentalDurationDays(values);
  if (days !== null && days > 1) {
    entries.push({
      field_id: RENTAL_DAYS_ID,
      label: 'Rental duration',
      type: 'number',
      value: days,
      display: `${days} day${days === 1 ? '' : 's'}`,
      price_applied: round2(base * (days - 1)),
    });
  }
  return {
    title: product.title,
    qty,
    basePrice: base,
    unitPrice: unit,
    lineTotal: round2(unit * qty),
    fields: entries,
  };
}

export interface NormalizedEntry {
  label: string;
  display: string;
  value: CustomValue;
  price_applied: number;
  isFile: boolean;
}

export interface NormalizedGroup {
  title: string;
  qty: number;
  lineTotal: number;
  entries: NormalizedEntry[];
  mismatch: boolean;
}

function isFileValue(type: string, v: CustomValue): boolean {
  if (type === 'file') return true;
  const s = Array.isArray(v) ? '' : String(v);
  return /^https?:\/\//.test(s);
}

export function normalizeOrderFields(order: Order): NormalizedGroup[] {
  const items = order.items ?? [];
  const groups: NormalizedGroup[] = items
    .filter((it) => Array.isArray(it.fields) && it.fields.length > 0)
    .map((it) => {
      const entries: NormalizedEntry[] = (it.fields ?? []).map((f) => ({
        label: f.label,
        display: f.display,
        value: f.value,
        price_applied: Number(f.price_applied) || 0,
        isFile: isFileValue(f.type, f.value),
      }));
      const base = Number(it.basePrice ?? NaN);
      let mismatch = false;
      if (Number.isFinite(base)) {
        const expected = round2((base + entries.reduce((s, e) => s + e.price_applied, 0)) * it.qty);
        mismatch = Math.abs(expected - Number(it.lineTotal)) > 0.01;
      }
      return {
        title: it.title,
        qty: it.qty,
        lineTotal: Number(it.lineTotal),
        entries,
        mismatch,
      };
    });
  const legacy = Object.entries(order.custom_data || {});
  if (legacy.length > 0) {
    groups.push({
      title: 'Additional details',
      qty: 1,
      lineTotal: 0,
      entries: legacy.map(([k, v]) => {
        const text = Array.isArray(v) ? v.join(', ') : String(v);
        const file = isFileValue('', v);
        return {
          label: k,
          display: file ? displayFileName(text) : text,
          value: v,
          price_applied: 0,
          isFile: file,
        };
      }),
      mismatch: false,
    });
  }
  return groups;
}
