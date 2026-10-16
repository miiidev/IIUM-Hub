import { describe, expect, it } from 'vitest';
import type { CustomField, Order } from '../../types';
import { buildItemSnapshot, normalizeOrderFields } from '../orderSnapshot';
import { clonePresetFields } from '../formPresets';

const printing = clonePresetFields('printing');

describe('buildItemSnapshot', () => {
  it('builds totals from the same path as the order total', () => {
    const snap = buildItemSnapshot({ title: 'Print', price: 1 }, printing, {
      print_size: 'A3',
      print_color: 'Color',
      print_pages: 20,
      print_file: 'https://x/f.pdf',
    }, 2);
    expect(snap.unitPrice).toBeCloseTo(3.9);
    expect(snap.lineTotal).toBeCloseTo(7.8);
    expect(snap.basePrice).toBe(1);
    expect(snap.fields?.map((f) => f.field_id).sort()).toEqual(
      ['print_color', 'print_file', 'print_pages', 'print_size']
    );
  });

  it('records per-field price contributions', () => {
    const snap = buildItemSnapshot({ title: 'Print', price: 0 }, printing, {
      print_size: 'A3',
      print_pages: 10,
    }, 1);
    const byId = Object.fromEntries((snap.fields ?? []).map((f) => [f.field_id, f]));
    expect(byId.print_size.price_applied).toBe(0.5);
    expect(byId.print_pages.price_applied).toBe(1);
    expect(byId.print_pages.display).toBe('10');
  });

  it('stores the clamped numeric value so display equals priced', () => {
    const snap = buildItemSnapshot({ title: 'Print', price: 0 }, printing, {
      print_size: 'A4',
      print_pages: 9999,
    }, 1);
    const pages = (snap.fields ?? []).find((f) => f.field_id === 'print_pages')!;
    expect(pages.value).toBe(500);
    expect(pages.display).toBe('500');
    expect(pages.price_applied).toBe(50);
  });

  it('skips empty values', () => {
    const snap = buildItemSnapshot({ title: 'T', price: 5 }, printing, {}, 1);
    expect(snap.fields).toEqual([]);
    expect(snap.lineTotal).toBe(5);
  });
});

describe('normalizeOrderFields', () => {
  function newOrder(): Order {
    return {
      id: 'o1',
      shop_id: 's1',
      buyer_name: 'Ali',
      location: 'Faruq',
      total_amount: 7.8,
      payment_ref_id: '1234',
      custom_data: {},
      items: [
        buildItemSnapshot({ title: 'Print', price: 1 }, printing, {
          print_size: 'A3',
          print_pages: 10,
        }, 2),
      ],
      status: 'pending_verification',
    };
  }

  it('maps snapshot items to groups with no mismatch', () => {
    const groups = normalizeOrderFields(newOrder());
    expect(groups).toHaveLength(1);
    expect(groups[0].mismatch).toBe(false);
    expect(groups[0].entries.length).toBeGreaterThan(0);
  });

  it('flags tampered totals', () => {
    const order = newOrder();
    order.items[0] = { ...order.items[0], lineTotal: 999 };
    expect(normalizeOrderFields(order)[0].mismatch).toBe(true);
  });

  it('keeps duplicate labels on two products separate', () => {
    const noteField: CustomField = { id: 'n', label: 'Notes', type: 'textarea', required: false };
    const order = newOrder();
    order.items = [
      buildItemSnapshot({ title: 'Burger', price: 5 }, [noteField], { n: 'no egg' }, 1),
      buildItemSnapshot({ title: 'Fries', price: 3 }, [noteField], { n: 'extra salt' }, 1),
    ];
    const groups = normalizeOrderFields(order);
    expect(groups).toHaveLength(2);
    expect(groups[0].entries[0].display).toBe('no egg');
    expect(groups[1].entries[0].display).toBe('extra salt');
  });

  it('reads legacy label-keyed orders as an Additional details group', () => {
    const legacy: Order = {
      id: 'o2',
      shop_id: 's1',
      buyer_name: 'Siti',
      location: 'Ali',
      total_amount: 50,
      payment_ref_id: '5566',
      custom_data: {
        'Model Telefon': 'iPhone 11',
        'Rekaan': 'https://cdn/x/12345678-1234-1234-1234-123456789012-plan.pdf',
      },
      items: [{ title: 'Repair Phone Custom', qty: 1, unitPrice: 50, lineTotal: 50 }],
      status: 'confirmed',
    };
    const groups = normalizeOrderFields(legacy);
    expect(groups).toHaveLength(1);
    expect(groups[0].title).toBe('Additional details');
    expect(groups[0].mismatch).toBe(false);
    const file = groups[0].entries.find((e) => e.label === 'Rekaan')!;
    expect(file.isFile).toBe(true);
    expect(file.display).toBe('plan.pdf');
  });
});
