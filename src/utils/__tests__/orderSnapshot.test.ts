import { describe, expect, it } from 'vitest';
import type { CustomField, Order } from '../../types';
import { buildItemSnapshot, normalizeOrderFields, orderTotalCheck } from '../orderSnapshot';
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

  it('prices a week-long rental as base × days', () => {
    const rentals = clonePresetFields('rentals');
    const values = {
      rental_start: '2026-03-01',
      rental_end: '2026-03-08',
      rental_item: 'Item A',
      rental_qty: 1,
      rental_phone: '+60123456789',
    };
    const snap = buildItemSnapshot({ title: 'Camera Rental', price: 25 }, rentals, values, 1);
    expect(snap.unitPrice).toBe(175);
    expect(snap.lineTotal).toBe(175);
    const days = (snap.fields ?? []).find((f) => f.field_id === 'rental_days');
    expect(days?.display).toBe('7 days');
    expect(days?.price_applied).toBe(150);
    const order: Order = {
      id: 'o3',
      shop_id: 's1',
      buyer_name: 'Ali',
      location: 'Faruq',
      total_amount: 175,
      payment_ref_id: '99',
      custom_data: {},
      items: [snap],
      status: 'pending_verification',
    };
    expect(normalizeOrderFields(order)[0].mismatch).toBe(false);
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

  it('reads legacy label-keyed orders as an Additional details group', () => {    const legacy: Order = {
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

describe('orderTotalCheck', () => {
  const good: Order = {
    id: 'o',
    shop_id: 's',
    buyer_name: 'A',
    location: 'F',
    total_amount: 11.8,
    payment_ref_id: '1',
    custom_data: {},
    items: [
      { title: 'Print', qty: 2, unitPrice: 3.4, lineTotal: 6.8 },
      { title: 'Biasa', qty: 1, unitPrice: 5, lineTotal: 5 },
    ],
    status: 'pending_verification',
  };

  it('passes matching orders including plain items', () => {
    expect(orderTotalCheck(good)).toEqual({ ok: true, expected: 11.8, actual: 11.8, unknown: false });
  });

  it('flags a tampered total', () => {
    expect(orderTotalCheck({ ...good, total_amount: 1 }).ok).toBe(false);
  });

  it('flags a tampered plain item line', () => {
    const bad = { ...good, items: [{ title: 'Biasa', qty: 1, unitPrice: 5, lineTotal: 50 }] };
    const res = orderTotalCheck(bad);
    expect(res.ok).toBe(false);
    expect(res.expected).toBe(5);
  });

  it('returns unknown for legacy items without lineTotal', () => {
    const legacy = { ...good, items: [{ title: 'Old', qty: 1, unitPrice: 5 } as never] };
    expect(orderTotalCheck(legacy)).toEqual({ ok: true, expected: 11.8, actual: 11.8, unknown: true });
  });

  it('tolerates float dust like 0.1 x 3', () => {
    const order = {
      ...good,
      total_amount: 0.3,
      items: [{ title: 'Page', qty: 3, unitPrice: 0.1, lineTotal: 0.3 }],
    };
    expect(orderTotalCheck(order).ok).toBe(true);
  });
});
