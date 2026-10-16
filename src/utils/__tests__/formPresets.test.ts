import { describe, expect, it } from 'vitest';
import type { CustomField } from '../../types';
import {
  PRESETS,
  activeFields,
  calculateModifierTotal,
  clonePresetFields,
  computeUnitTotal,
  createQuestionCard,
  describeValues,
  sanitizeFields,
  validateRequired,
} from '../formPresets';

describe('presets', () => {
  it('defines the four presets with only standard field types', () => {
    expect(PRESETS.map((p) => p.key)).toEqual(['printing', 'shoe_wash', 'food_addons', 'custom']);
    const allowed = new Set(['select', 'text', 'number', 'textarea']);
    for (const p of PRESETS) {
      for (const f of p.fields) expect(allowed.has(f.type)).toBe(true);
    }
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
});

describe('pricing', () => {
  const fields = clonePresetFields('printing');

  it('adds selected modifiers to the base price', () => {
    const values = { print_size: 'A3', print_color: 'Berwarna' };
    expect(calculateModifierTotal(fields, values)).toBeCloseTo(0.9);
    expect(computeUnitTotal(1, fields, values)).toBeCloseTo(1.9);
  });

  it('ignores disabled fields and unknown options', () => {
    const off: CustomField[] = fields.map((f) =>
      f.id === 'print_color' ? { ...f, enabled: false } : f
    );
    const values = { print_size: 'A3', print_color: 'Berwarna', print_duplex: 'bogus' };
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
    expect(validateRequired(off, { shoe_level: 'Basic', shoe_pickup: 'Tidak, saya hantar sendiri' })).toEqual({});
  });

  it('describes only filled values with labels', () => {
    const fields = clonePresetFields('food_addons');
    expect(describeValues(fields, { food_size: 'Besar', food_notes: '  ' })).toEqual([
      { label: 'Saiz', value: 'Besar' },
    ]);
  });
});

describe('sanitizeFields', () => {
  it('trims, drops empty options, clamps negative prices and dedupes ids', () => {
    const dirty: CustomField[] = [
      {
        id: 'a',
        label: '  Saiz ',
        type: 'select',
        required: true,
        options: [
          { name: ' Kecil ', price_modifier: -3 },
          { name: '', price_modifier: 5 },
        ],
      },
      { id: 'a', label: 'Nota', type: 'textarea', required: false },
    ];
    const clean = sanitizeFields(dirty);
    expect(clean[0].label).toBe('Saiz');
    expect(clean[0].options).toEqual([{ name: 'Kecil', price_modifier: 0 }]);
    expect(clean[1].id).not.toBe('a');
  });
});
