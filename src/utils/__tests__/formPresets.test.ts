import { describe, expect, it } from 'vitest';
import type { CustomField } from '../../types';
import {
  CATEGORY_PRESET_MAP,
  MAX_QTY_PER_ITEM,
  PRESETS,
  activeFields,
  calculateModifierTotal,
  clampQty,
  clampNumberValue,
  clonePresetFields,
  computeUnitTotal,
  copyFields,
  createQuestionCard,
  describeValues,
  getPresetForCategory,
  isFormApplicable,
  maxExtraForField,
  normalizeMyPhone,
  rentalDurationDays,
  sanitizeFields,
  todayLocal,
  validateField,
  validateRequired,
} from '../formPresets';

describe('presets', () => {
  it('defines the five presets with only standard field types', () => {
    expect(PRESETS.map((p) => p.key)).toEqual([
      'printing',
      'food_addons',
      'repairs',
      'rentals',
      'custom',
    ]);
    const allowed = new Set(['select', 'text', 'number', 'textarea', 'date', 'phone', 'file', 'multiselect']);
    for (const p of PRESETS) {
      for (const f of p.fields) expect(allowed.has(f.type)).toBe(true);
    }
  });

  it('maps every shop category to a preset', () => {
    expect(getPresetForCategory('food')).toBe('food_addons');
    expect(getPresetForCategory('printing')).toBe('printing');
    expect(getPresetForCategory('shoe_wash')).toBeNull();
    expect(getPresetForCategory('repairs')).toBe('repairs');
    expect(getPresetForCategory('rentals')).toBe('rentals');
    expect(getPresetForCategory('custom')).toBe('custom');
    expect(getPresetForCategory('unknown')).toBeNull();
    expect(isFormApplicable('rentals')).toBe(true);
    expect(isFormApplicable('unknown')).toBe(false);
    expect(Object.keys(CATEGORY_PRESET_MAP).sort()).toEqual([
      'custom',
      'food',
      'printing',
      'rentals',
      'repairs',
    ]);
  });

  it('uses stable unique ids per preset', () => {
    for (const p of PRESETS) {
      const ids = p.fields.map((f) => f.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('clones without sharing option references', () => {
    const a = clonePresetFields('printing');
    a[0].options![0].price_modifier = 99;
    expect(clonePresetFields('printing')[0].options![0].price_modifier).toBe(0);
  });

  it('custom preset starts empty and cards get unique ids', () => {
    expect(clonePresetFields('custom')).toEqual([]);
    expect(createQuestionCard('text').id).not.toBe(createQuestionCard('text').id);
  });

  it('copyFields deep-clones with ids preserved', () => {
    const src = clonePresetFields('printing');
    const copy = copyFields(src);
    expect(copy).toEqual(src);
    copy[0].options![0].price_modifier = 99;
    expect(src[0].options![0].price_modifier).toBe(0);
    const srcPicks: CustomField[] = [
      { id: 'n', label: 'N', type: 'number', required: false, quickPicks: [1, 5] },
    ];
    const cloned = copyFields(srcPicks);
    cloned[0].quickPicks!.push(9);
    expect(srcPicks[0].quickPicks).toEqual([1, 5]);
  });

  it('printing preset uses a required file field', () => {
    const file = clonePresetFields('printing').find((f) => f.id === 'print_file');
    expect(file?.type).toBe('file');
    expect(file?.required).toBe(true);
    expect(validateRequired(clonePresetFields('printing'), {})).toHaveProperty('print_file');
    expect(
      validateRequired(clonePresetFields('printing'), {
        print_size: 'A4',
        print_color: 'Black & White',
        print_duplex: 'Single-sided',
        print_pages: 20,
        print_file: 'https://x/f.pdf',
      })
    ).toEqual({});
  });
});

describe('pricing', () => {
  const fields = clonePresetFields('printing');

  it('adds selected modifiers to the base price', () => {
    const values = { print_size: 'A3', print_color: 'Color' };
    expect(calculateModifierTotal(fields, values)).toBeCloseTo(0.9);
    expect(computeUnitTotal(1, fields, values)).toBeCloseTo(1.9);
  });

  it('ignores disabled fields and unknown options', () => {
    const off: CustomField[] = fields.map((f) =>
      f.id === 'print_color' ? { ...f, enabled: false } : f
    );
    const values = { print_size: 'A3', print_color: 'Color', print_duplex: 'bogus' };
    expect(calculateModifierTotal(off, values)).toBeCloseTo(0.5);
    expect(activeFields(off).some((f) => f.id === 'print_color')).toBe(false);
  });
});

describe('validation and description', () => {
  it('flags only required, enabled, empty fields', () => {
    const fields = clonePresetFields('repairs');
    const errs = validateRequired(fields, { repair_urgency: 'Normal' });
    expect(Object.keys(errs).sort()).toEqual(['repair_issue', 'repair_item', 'repair_phone']);
    const off = fields.map((f) => (f.id === 'repair_issue' ? { ...f, enabled: false } : f));
    expect(
      validateRequired(off, {
        repair_urgency: 'Normal',
        repair_item: 'iPhone 11',
        repair_phone: '+60123456789',
      })
    ).toEqual({});
  });

  it('describes only filled values with labels', () => {
    const fields = clonePresetFields('food_addons');
    expect(describeValues(fields, { food_size: 'Large', food_notes: '  ' })).toEqual([
      { label: 'Size', value: 'Large' },
    ]);
  });
});

describe('clampQty', () => {
  it('floors and clamps to 0..MAX_QTY_PER_ITEM', () => {
    expect(MAX_QTY_PER_ITEM).toBe(20);
    expect(clampQty(3)).toBe(3);
    expect(clampQty(2.9)).toBe(2);
    expect(clampQty(-5)).toBe(0);
    expect(clampQty(999)).toBe(20);
    expect(clampQty(NaN)).toBe(0);
    expect(clampQty(undefined)).toBe(0);
  });

  it('qty x unit math holds for multi-unit lines', () => {
    const fields = clonePresetFields('printing');
    const unit = computeUnitTotal(1, fields, { print_size: 'A3', print_color: 'Color' });
    expect(unit).toBeCloseTo(1.9);
    expect(unit * clampQty(2)).toBeCloseTo(3.8);
  });
});

describe('rental duration pricing', () => {
  const fields = clonePresetFields('rentals');

  it('returns null when either date is missing or end precedes start', () => {
    expect(rentalDurationDays({})).toBeNull();
    expect(rentalDurationDays({ rental_start: '2026-03-01' })).toBeNull();
    expect(rentalDurationDays({ rental_start: '2026-03-08', rental_end: '2026-03-01' })).toBeNull();
  });

  it('counts days end-exclusive, minimum 1 for same-day', () => {
    expect(rentalDurationDays({ rental_start: '2026-03-01', rental_end: '2026-03-08' })).toBe(7);
    expect(rentalDurationDays({ rental_start: '2026-03-01', rental_end: '2026-03-01' })).toBe(1);
  });

  it('multiplies the base price by rental days', () => {
    const values = {
      rental_start: '2026-03-01',
      rental_end: '2026-03-08',
      rental_item: 'Item A',
      rental_qty: 1,
      rental_phone: '+60123456789',
    };
    expect(computeUnitTotal(25, fields, values)).toBe(175);
    expect(computeUnitTotal(25, fields, { ...values, rental_start: '2026-03-01', rental_end: '2026-03-01' })).toBe(25);
    expect(computeUnitTotal(25, fields, {})).toBe(25);
  });

  it('flags a return date before the start date', () => {
    const errs = validateRequired(fields, {
      rental_start: '2030-03-08',
      rental_end: '2030-03-01',
      rental_item: 'Item A',
      rental_qty: 1,
      rental_phone: '+60123456789',
    });
    expect(Object.keys(errs)).toContain('rental_end');
  });
});

describe('number per-unit pricing', () => {
  const pages: CustomField = {
    id: 'pages',
    label: 'Pages',
    type: 'number',
    required: true,
    price_per_unit: 0.1,
    min: 1,
    max: 500,
  };

  it('multiplies value by price_per_unit without float dust', () => {
    expect(calculateModifierTotal([pages], { pages: 3 })).toBe(0.3);
    expect(computeUnitTotal(0, [pages], { pages: 10 })).toBe(1);
  });

  it('treats empty, NaN and negatives as 0 and clamps to min/max', () => {
    expect(calculateModifierTotal([pages], {})).toBe(0);
    expect(calculateModifierTotal([pages], { pages: '' })).toBe(0);
    expect(calculateModifierTotal([pages], { pages: -4 })).toBe(0);
    expect(calculateModifierTotal([pages], { pages: 9999 })).toBe(50);
    expect(clampNumberValue(pages, 'abc')).toBe(0);
  });

  it('ignores numbers without a positive price_per_unit', () => {
    const plain: CustomField = { id: 'n', label: 'N', type: 'number', required: false };
    expect(calculateModifierTotal([plain], { n: 5 })).toBe(0);
  });

  it('sanitize clamps negative ppu and drops bad min/max', () => {
    const [clean] = sanitizeFields([
      { id: 'n', label: 'N', type: 'number', required: false, price_per_unit: -2, min: 10, max: 5 },
    ]);
    expect(clean.price_per_unit).toBe(0);
    expect(clean.min).toBeUndefined();
    expect(clean.max).toBeUndefined();
  });

  it('maxExtraForField uses max x ppu or null when unbounded', () => {
    expect(maxExtraForField(pages)).toBe(50);
    const unbounded: CustomField = { id: 'u', label: 'U', type: 'number', required: false, price_per_unit: 2 };
    expect(maxExtraForField(unbounded)).toBeNull();
    expect(maxExtraForField({ ...unbounded, enabled: false })).toBe(0);
  });

  it('printing preset charges per page', () => {
    const fields = clonePresetFields('printing');
    const pagesField = fields.find((f) => f.id === 'print_pages');
    expect(pagesField?.price_per_unit).toBe(0.1);
    expect(
      computeUnitTotal(0, fields, {
        print_size: 'A4',
        print_color: 'Black & White',
        print_duplex: 'Single-sided',
        print_pages: 20,
        print_file: 'https://x/f.pdf',
      })
    ).toBe(2);
  });
});

describe('multiselect', () => {
  const fields = clonePresetFields('food_addons');
  const addons = () => fields.find((f) => f.id === 'food_addons')!;

  it('sums every selected option and ignores unknown names', () => {
    expect(calculateModifierTotal(fields, { food_addons: ['Egg', 'Cheese'] })).toBe(2.5);
    expect(calculateModifierTotal(fields, { food_addons: ['Egg', 'Ghost'] })).toBe(1);
    expect(calculateModifierTotal(fields, { food_addons: [] })).toBe(0);
    expect(calculateModifierTotal(fields, {})).toBe(0);
  });

  it('deselecting back to empty totals zero', () => {
    expect(calculateModifierTotal(fields, { food_addons: ['Extra Rice'] })).toBe(2);
  });

  it('required means at least one selected', () => {
    const req = [{ ...addons(), required: true, id: 'req' }];
    expect(validateRequired(req, { req: [] })).toHaveProperty('req');
    expect(validateRequired(req, { req: ['Egg'] })).toEqual({});
  });

  it('describeValues joins with comma', () => {
    expect(describeValues(fields, { food_addons: ['Egg', 'Cheese'] })).toEqual([
      { label: 'Add-ons', value: 'Egg, Cheese' },
    ]);
  });

  it('maxExtra sums all positive modifiers', () => {
    expect(maxExtraForField(addons())).toBe(4.5);
  });

  it('sanitize treats multiselect like select', () => {
    const [clean] = sanitizeFields([
      { id: 'm', label: 'M', type: 'multiselect', required: false, options: [{ name: ' A ', price_modifier: -1 }, { name: '', price_modifier: 2 }] },
    ]);
    expect(clean.options).toEqual([{ name: 'A', price_modifier: 0 }]);
  });
});

describe('phone and date validation', () => {
  const phone = (id = 'p'): CustomField => ({ id, label: 'Phone', type: 'phone', required: true });
  const date = (id = 'd'): CustomField => ({ id, label: 'Date', type: 'date', required: true });

  it('normalizes Malaysian mobile variants to +60 form', () => {
    expect(normalizeMyPhone('012-345 6789')).toBe('+60123456789');
    expect(normalizeMyPhone('0123456789')).toBe('+60123456789');
    expect(normalizeMyPhone('60123456789')).toBe('+60123456789');
    expect(normalizeMyPhone('+60123456789')).toBe('+60123456789');
    expect(normalizeMyPhone('(012) 345-6789')).toBe('+60123456789');
    expect(normalizeMyPhone('011-12345678')).toBe('+601112345678');
    expect(normalizeMyPhone('01112345678')).toBe('+601112345678');
  });

  it('rejects landlines, short, long and non-numeric input', () => {
    expect(normalizeMyPhone('031234567')).toBe('');
    expect(normalizeMyPhone('0123456')).toBe('');
    expect(normalizeMyPhone('012345678901')).toBe('');
    expect(normalizeMyPhone('abc')).toBe('');
    expect(normalizeMyPhone('')).toBe('');
    expect(normalizeMyPhone(undefined)).toBe('');
  });

  it('validateField gives a clear message for bad phones', () => {
    expect(validateField(phone(), '012-345 6789')).toBeNull();
    expect(validateField(phone(), '031234567')).toBe(
      'Enter a valid Malaysian mobile number (e.g. 012-3456789).'
    );
    expect(validateField(phone(), '')).toBe('Phone is required');
    expect(validateField({ ...phone(), required: false }, '')).toBeNull();
  });

  it('todayLocal returns device-local YYYY-MM-DD', () => {
    expect(todayLocal(new Date(2026, 9, 16))).toBe('2026-10-16');
    expect(todayLocal()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('rejects past dates and accepts today or later', () => {
    expect(validateField(date(), '2026-10-15', '2026-10-16')).toBe('Date must be today or later.');
    expect(validateField(date(), '2026-10-16', '2026-10-16')).toBeNull();
    expect(validateField(date(), '2026-10-17', '2026-10-16')).toBeNull();
    expect(validateField(date(), '', '2026-10-16')).toBe('Date is required');
  });
});

describe('number validation', () => {
  const pages: CustomField = {
    id: 'pages',
    label: 'Number of Pages',
    type: 'number',
    required: true,
    price_per_unit: 0.1,
    min: 1,
    max: 500,
    integer: true,
  };

  it('accepts in-range whole numbers', () => {
    expect(validateField(pages, 1)).toBeNull();
    expect(validateField(pages, 500)).toBeNull();
    expect(validateField(pages, 20)).toBeNull();
  });

  it('rejects 0, negatives, fractions, over-max and non-numbers', () => {
    expect(validateField(pages, 0)).toBe('Number of Pages must be a whole number between 1 and 500.');
    expect(validateField(pages, -5)).toBe('Number of Pages must be a whole number between 1 and 500.');
    expect(validateField(pages, 1.5)).toBe('Number of Pages must be a whole number between 1 and 500.');
    expect(validateField(pages, 501)).toBe('Number of Pages must be a whole number between 1 and 500.');
    expect(validateField(pages, 9999)).toBe('Number of Pages must be a whole number between 1 and 500.');
    expect(validateField(pages, 'abc')).toBe('Number of Pages must be a number between 1 and 500.');
    expect(validateField(pages, '')).toBe('Number of Pages is required');
  });

  it('enforces min/max without integer flag and treats missing min as 0', () => {
    const loose: CustomField = { id: 'n', label: 'N', type: 'number', required: true, max: 10 };
    expect(validateField(loose, 5)).toBeNull();
    expect(validateField(loose, -1)).toBe('N must be a number between 0 and 10.');
    expect(validateField(loose, 11)).toBe('N must be a number between 0 and 10.');
    expect(validateField(loose, 2.5)).toBeNull();
    const noMax: CustomField = { id: 'm', label: 'M', type: 'number', required: false, min: 2 };
    expect(validateField(noMax, 1)).toBe('M must be a number at least 2.');
    expect(validateField(noMax, '')).toBeNull();
  });

  it('sanitize keeps the integer flag', () => {
    const [clean] = sanitizeFields([{ ...pages, integer: true }]);
    expect(clean.integer).toBe(true);
  });

  it('sanitize keeps the first duplicate option (case-insensitive)', () => {
    const [clean] = sanitizeFields([
      {
        id: 's',
        label: 'Size',
        type: 'select',
        required: true,
        options: [
          { name: 'Large', price_modifier: 1 },
          { name: ' large ', price_modifier: 2 },
          { name: '', price_modifier: 3 },
          { name: 'Small', price_modifier: 0 },
        ],
      },
    ]);
    expect(clean.options).toEqual([
      { name: 'Large', price_modifier: 1 },
      { name: 'Small', price_modifier: 0 },
    ]);
  });
});

describe('sanitizeFields', () => {
  it('trims, drops empty options, clamps negative prices and dedupes ids', () => {
    const dirty: CustomField[] = [
      {
        id: 'a',
        label: '  Size ',
        type: 'select',
        required: true,
        options: [
          { name: ' Small ', price_modifier: -3 },
          { name: '', price_modifier: 5 },
        ],
      },
      { id: 'a', label: 'Notes', type: 'textarea', required: false },
    ];
    const clean = sanitizeFields(dirty);
    expect(clean[0].label).toBe('Size');
    expect(clean[0].options).toEqual([{ name: 'Small', price_modifier: 0 }]);
    expect(clean[1].id).not.toBe('a');
  });
});
