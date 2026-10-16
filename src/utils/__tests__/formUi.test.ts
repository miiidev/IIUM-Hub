import { describe, expect, it } from 'vitest';
import type { CustomField } from '../../types';
import { CHIP_MAX_OPTIONS, errorCount, firstErrorFieldId, quickPicksFor, shouldRenderAsChips } from '../formUi';

function sel(n: number): CustomField {
  return {
    id: 's',
    label: 's',
    type: 'select',
    required: true,
    options: Array.from({ length: n }, (_, i) => ({ name: `O${i}`, price_modifier: 0 })),
  };
}

describe('formUi', () => {
  it('renders chips for 1..CHIP_MAX_OPTIONS selects only', () => {
    expect(CHIP_MAX_OPTIONS).toBe(4);
    expect(shouldRenderAsChips(sel(1))).toBe(true);
    expect(shouldRenderAsChips(sel(4))).toBe(true);
    expect(shouldRenderAsChips(sel(5))).toBe(false);
    expect(shouldRenderAsChips({ ...sel(2), type: 'multiselect' })).toBe(false);
  });

  it('filters quick picks to min/max integers', () => {
    const f: CustomField = {
      id: 'n',
      label: 'n',
      type: 'number',
      required: true,
      integer: true,
      min: 1,
      max: 20,
      quickPicks: [1, 5, 2.5, 50, 10],
    };
    expect(quickPicksFor(f)).toEqual([1, 5, 10]);
    expect(quickPicksFor({ ...f, integer: false })).toEqual([]);
    expect(quickPicksFor({ ...f, quickPicks: undefined })).toEqual([]);
  });

  it('finds the first error in field order and counts', () => {
    const fields: CustomField[] = [
      { id: 'a', label: 'a', type: 'text', required: false },
      { id: 'b', label: 'b', type: 'text', required: true },
      { id: 'c', label: 'c', type: 'text', required: true },
    ];
    expect(firstErrorFieldId(fields, { c: 'x', b: 'y' })).toBe('b');
    expect(firstErrorFieldId(fields, {})).toBeNull();
    expect(errorCount({ b: 'y', c: 'x' })).toBe(2);
  });
});
