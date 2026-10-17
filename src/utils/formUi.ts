import type { CustomField } from '../types';

export const CHIP_MAX_OPTIONS = 4;

export function shouldRenderAsChips(field: CustomField): boolean {
  if (field.type !== 'select') return false;
  const n = (field.options ?? []).length;
  return n >= 1 && n <= CHIP_MAX_OPTIONS;
}

export function quickPicksFor(field: CustomField): number[] {
  if (field.type !== 'number' || !field.integer) return [];
  const picks = Array.isArray(field.quickPicks) ? field.quickPicks : [];
  const min = Number.isFinite(Number(field.min)) ? Number(field.min) : Number.NEGATIVE_INFINITY;
  const max = Number.isFinite(Number(field.max)) ? Number(field.max) : Number.POSITIVE_INFINITY;
  return picks.filter(
    (p) => Number.isFinite(p) && Number.isInteger(p) && p >= min && p <= max
  );
}

export function firstErrorFieldId(
  fields: CustomField[],
  errors: Record<string, string>
): string | null {
  for (const f of fields) {
    if (errors[f.id]) return f.id;
  }
  return null;
}

export function errorCount(errors: Record<string, string>): number {
  return Object.values(errors).filter(Boolean).length;
}
