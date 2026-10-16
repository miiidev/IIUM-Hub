import type { CustomValue, OrderPayload, Shop } from '../types';

function formatRM(n: number): string {
  return `RM ${Number(n).toFixed(2)}`;
}

function formatValue(v: CustomValue): string {
  return Array.isArray(v) ? v.join(', ') : String(v);
}

export function normalizeWhatsappNumber(raw: string): string {
  return (raw || '').replace(/\D/g, '');
}

export function getAppOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return 'https://iium-hub.example.com';
}

export function buildOrderMessage(shop: Shop, order: OrderPayload, orderId: string): string {
  const lines: string[] = [];
  lines.push(`*New Order - ${shop.name}*`);
  lines.push('');
  lines.push(`- *Buyer:* ${order.buyer_name}`);
  lines.push(`- *Location:* ${order.location}`);
  lines.push('');
  lines.push('*Items:*');
  order.items.forEach((it) => {
    lines.push(`- ${it.title} x${it.qty} @ ${formatRM(it.unitPrice)} = ${formatRM(it.lineTotal)}`);
    (it.fields ?? []).forEach((f) => {
      const extra = Number(f.price_applied) > 0 ? ` (+RM ${Number(f.price_applied).toFixed(2)})` : '';
      lines.push(`  - ${f.label}: ${f.display}${extra}`);
    });
    if (it.selectedOptions) {
      lines.push(`  - ${it.selectedOptions}`);
    }
  });
  const custom = Object.entries(order.custom_data || {});
  if (custom.length > 0) {
    lines.push('');
    lines.push('*Spec:*');
    custom.forEach(([k, v]) => {
      lines.push(`- ${k}: ${formatValue(v)}`);
    });
  }
  lines.push('');
  lines.push(`*Total: ${formatRM(order.total_amount)}*`);
  lines.push(`DuitNow Ref ID: ${order.payment_ref_id}`);
  lines.push('');
  lines.push('Manage order:');
  lines.push(`${getAppOrigin()}/seller/orders/${orderId}`);
  return lines.join('\n');
}

export function generateWhatsAppLink(shop: Shop, order: OrderPayload, orderId: string): string {
  const number = normalizeWhatsappNumber(shop.whatsapp_number);
  return `https://wa.me/${number}?text=${encodeURIComponent(buildOrderMessage(shop, order, orderId))}`;
}
