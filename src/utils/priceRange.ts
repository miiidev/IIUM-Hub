import type { CustomField } from '../types';
import { activeFields, maxExtraForField } from './formPresets';

export interface PriceRange {
  min: number;
  max: number | null;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function minExtraForField(f: CustomField): number {
  if (f.enabled === false || !f.required) return 0;
  if (f.type === 'select' || f.type === 'multiselect') {
    const mods = (f.options ?? []).map((o) => Number(o.price_modifier) || 0);
    return mods.length > 0 ? Math.min(...mods) : 0;
  }
  if (f.type === 'number') {
    const ppu = Number(f.price_per_unit) || 0;
    if (ppu <= 0) return 0;
    return Number.isFinite(Number(f.min)) ? Number(f.min) * ppu : 0;
  }
  return 0;
}

export function priceRange(base: number, fields: CustomField[] | null | undefined): PriceRange {
  const b = Number(base) || 0;
  const list = activeFields(fields);
  const min = round2(b + list.reduce((s, f) => s + minExtraForField(f), 0));
  const maxes = list.map(maxExtraForField);
  if (maxes.includes(null)) return { min, max: null };
  return { min, max: round2(b + (maxes as number[]).reduce((s, m) => s + m, 0)) };
}

function formatRM(n: number): string {
  return `RM ${n.toFixed(2)}`;
}

export function formatRange(range: PriceRange): string {
  if (range.max === null) return `From ${formatRM(range.min)}`;
  if (range.max === range.min) return formatRM(range.min);
  return `${formatRM(range.min)} to ${formatRM(range.max)}`;
}
