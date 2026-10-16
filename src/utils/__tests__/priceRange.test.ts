import { describe, expect, it } from 'vitest';
import type { CustomField } from '../../types';
import { formatRange, priceRange } from '../priceRange';

const sel = (id: string, required: boolean, options: Array<[string, number]>): CustomField => ({
  id,
  label: id,
  type: 'select',
  required,
  options: options.map(([name, price_modifier]) => ({ name, price_modifier })),
});

const num = (id: string, required: boolean, price_per_unit: number, min?: number, max?: number): CustomField => ({
  id,
  label: id,
  type: 'number',
  required,
  price_per_unit,
  min,
  max,
});

describe('priceRange', () => {
  it('base only with no fields', () => {
    expect(priceRange(5, [])).toEqual({ min: 5, max: 5 });
    expect(priceRange(5, null)).toEqual({ min: 5, max: 5 });
  });

  it('required select uses its smallest modifier for min, largest for max', () => {
    const fields = [sel('s', true, [['A', 0], ['B', 2]])];
    expect(priceRange(5, fields)).toEqual({ min: 5, max: 7 });
  });

  it('optional select contributes 0 to min', () => {
    const fields = [sel('s', false, [['A', 3]])];
    expect(priceRange(5, fields)).toEqual({ min: 5, max: 8 });
  });

  it('required number with min uses min x ppu', () => {
    const fields = [num('n', true, 0.1, 1, 500)];
    expect(priceRange(0, fields)).toEqual({ min: 0.1, max: 50 });
  });

  it('number without max gives null max', () => {
    const fields = [num('n', true, 2, 1)];
    expect(priceRange(5, fields)).toEqual({ min: 7, max: null });
  });

  it('multiselect sums positives for max, 0 for min', () => {
    const fields: CustomField[] = [
      { id: 'm', label: 'm', type: 'multiselect', required: false, options: [{ name: 'A', price_modifier: 1 }, { name: 'B', price_modifier: 2 }] },
    ];
    expect(priceRange(5, fields)).toEqual({ min: 5, max: 8 });
  });

  it('ignores disabled fields and rounds floats', () => {
    const fields = [
      { ...sel('s', true, [['A', 0.1]]), enabled: false },
      num('n', false, 0.1, 1, 3),
    ];
    expect(priceRange(0, fields)).toEqual({ min: 0, max: 0.3 });
  });
});

describe('formatRange', () => {
  it('formats single, ranged and open ranges', () => {
    expect(formatRange({ min: 5, max: 5 })).toBe('RM 5.00');
    expect(formatRange({ min: 5, max: 12 })).toBe('RM 5.00 to RM 12.00');
    expect(formatRange({ min: 5, max: null })).toBe('From RM 5.00');
  });
});
