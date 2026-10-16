import type { CustomValue, OrderItemSummary, Product } from '../types';
import { clampQty } from './formPresets';
import { buildItemSnapshot } from './orderSnapshot';

export interface CartLine {
  qty: number;
  values: Record<string, CustomValue>;
}

export type Cart = Record<string, CartLine>;

export interface CartLineView {
  productId: string;
  item: OrderItemSummary;
}

export function upsertLine(cart: Cart, productId: string, qty: number, values: Record<string, CustomValue>): Cart {
  return { ...cart, [productId]: { qty: clampQty(qty), values: { ...values } } };
}

export function removeLine(cart: Cart, productId: string): Cart {
  if (!(productId in cart)) return cart;
  const next = { ...cart };
  delete next[productId];
  return next;
}

export function setLineQty(cart: Cart, productId: string, qty: number): Cart {
  const line = cart[productId];
  if (!line) return cart;
  const clamped = clampQty(qty);
  if (clamped <= 0) return removeLine(cart, productId);
  return { ...cart, [productId]: { ...line, qty: clamped } };
}

export function buildCartSummary(products: Product[], cart: Cart): {
  count: number;
  total: number;
  items: OrderItemSummary[];
  lines: CartLineView[];
} {
  let count = 0;
  let total = 0;
  const items: OrderItemSummary[] = [];
  const lines: CartLineView[] = [];
  for (const p of products) {
    const line = cart[p.id];
    if (!line || line.qty <= 0) continue;
    const item = buildItemSnapshot(
      { title: p.title, price: Number(p.price) },
      p.custom_fields ?? [],
      line.values,
      line.qty
    );
    count += line.qty;
    total += item.lineTotal;
    items.push(item);
    lines.push({ productId: p.id, item });
  }
  return { count, total: Math.round(total * 100) / 100, items, lines };
}

export function snapshotValues(item: OrderItemSummary): Record<string, CustomValue> {
  const values: Record<string, CustomValue> = {};
  for (const f of item.fields ?? []) values[f.field_id] = f.value;
  return values;
}
