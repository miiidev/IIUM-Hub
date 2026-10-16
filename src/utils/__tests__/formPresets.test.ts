import { describe, expect, it } from 'vitest';
import type { CustomField } from '../../types';
import {
  CATEGORY_PRESET_MAP,
  PRESETS,
  activeFields,
  calculateModifierTotal,
  clonePresetFields,
  computeUnitTotal,
  createQuestionCard,
  describeValues,
  getPresetForCategory,
  isFormApplicable,
  sanitizeFields,
  validateRequired,
} from '../formPresets';

describe('presets', () => {
  it('defines the five presets with only standard field types', () => {
    expect(PRESETS.map((p) => p.key)).toEqual([
      'printing',
      'shoe_wash',
      'food_addons',
      'services',
      'custom',
    ]);
    const allowed = new Set(['select', 'text', 'number', 'textarea', 'date', 'phone', 'file']);
    for (const p of PRESETS) {
      for (const f of p.fields) expect(allowed.has(f.type)).toBe(true);
    }
  });

  it('maps every shop category to a preset', () => {
    expect(getPresetForCategory('food')).toBe('food_addons');
    expect(getPresetForCategory('printing')).toBe('printing');
    expect(getPresetForCategory('shoe_wash')).toBe('shoe_wash');
    expect(getPresetForCategory('repairs')).toBe('services');
    expect(getPresetForCategory('rentals')).toBe('services');
    expect(getPresetForCategory('custom')).toBe('services');
    expect(getPresetForCategory('unknown')).toBeNull();
    expect(isFormApplicable('rentals')).toBe(true);
    expect(isFormApplicable('unknown')).toBe(false);
    expect(Object.keys(CATEGORY_PRESET_MAP).sort()).toEqual([
      'custom',
      'food',
      'printing',
      'rentals',
      'repairs',
      'shoe_wash',
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
        print_file: 'https://x/y.pdf',
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
    const fields = clonePresetFields('shoe_wash');
    const errs = validateRequired(fields, { shoe_level: 'Basic' });
    expect(Object.keys(errs).sort()).toEqual(['shoe_details', 'shoe_pickup']);
    const off = fields.map((f) => (f.id === 'shoe_details' ? { ...f, enabled: false } : f));
    expect(validateRequired(off, { shoe_level: 'Basic', shoe_pickup: 'No, I will send it myself' })).toEqual({});
  });

  it('describes only filled values with labels', () => {
    const fields = clonePresetFields('food_addons');
    expect(describeValues(fields, { food_size: 'Large', food_notes: '  ' })).toEqual([
      { label: 'Size', value: 'Large' },
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
