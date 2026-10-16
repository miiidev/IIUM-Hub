import { describe, expect, it } from 'vitest';
import type { Product } from '../../types';
import { buildCartSummary, removeLine, setLineQty, upsertLine } from '../cart';

function product(over: Partial<Product> = {}): Product {
  return {
    id: 'p1',
    shop_id: 's1',
    title: 'Nasi',
    price: 5,
    is_available: true,
    custom_fields: [],
    ...over,
  };
}

describe('cart helpers', () => {
  it('upserts, clamps and removes lines immutably', () => {
    let cart = upsertLine({}, 'p1', 2, {});
    expect(cart.p1.qty).toBe(2);
    cart = setLineQty(cart, 'p1', 99);
    expect(cart.p1.qty).toBe(20);
    cart = setLineQty(cart, 'p1', 0);
    expect(cart).toEqual({});
    expect(removeLine({}, 'missing')).toEqual({});
    expect(setLineQty({}, 'missing', 3)).toEqual({});
  });

  it('builds summary from snapshots with 2dp total', () => {
    const products = [product(), product({ id: 'p2', title: 'Air', price: 0.1 })];
    const cart = upsertLine(upsertLine({}, 'p1', 2, {}), 'p2', 3, {});
    const summary = buildCartSummary(products, cart);
    expect(summary.count).toBe(5);
    expect(summary.total).toBe(10.3);
    expect(summary.items).toHaveLength(2);
    expect(summary.lines.map((l) => l.productId)).toEqual(['p1', 'p2']);
  });

  it('skips products not in the cart', () => {
    const summary = buildCartSummary([product()], {});
    expect(summary).toEqual({ count: 0, total: 0, items: [], lines: [] });
  });
});
