import type { OrderPayload, Shop } from '../types';

function formatRM(n: number): string {
  return `RM ${Number(n).toFixed(2)}`;
}

export function normalizeWhatsappNumber(raw: string): string {
  // wa.me expects digits only, no +, spaces, dashes. e.g. 60123456789
  return (raw || '').replace(/\D/g, '');
}

export function getAppOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return 'https://iium-hub.example.com';
}

export function generateWhatsAppLink(
  shop: Shop,
  order: OrderPayload,
  orderId: string
): string {
  const dashboardLink = `${getAppOrigin()}/seller/orders/${orderId}`;

  const lines: string[] = [];
  lines.push(`*New Order - ${shop.name}*`);
  lines.push(`--------------------------`);
  lines.push(`Buyer: ${order.buyer_name}`);
  lines.push(`Location: ${order.location}`);
  lines.push(``);
  lines.push(`*Items:*`);
  order.items.forEach((it, idx) => {
    lines.push(
      `${idx + 1}. ${it.title} x${it.qty} - ${formatRM(it.lineTotal)}`
    );
    if (it.selectedOptions) {
      lines.push(`   Spec: ${it.selectedOptions}`);
    }
  });
  // Custom form key-values (for custom category)
  const customEntries = Object.entries(order.custom_data || {});
  if (customEntries.length > 0) {
    lines.push(``);
    lines.push(`*Custom Spec:*`);
    customEntries.forEach(([k, v]) => {
      lines.push(`- ${k}: ${String(v)}`);
    });
  }
  lines.push(``);
  lines.push(`*Total: ${formatRM(order.total_amount)}*`);
  lines.push(`DuitNow Ref ID: ${order.payment_ref_id}`);
  lines.push(``);
  lines.push(`Manage order:`);
  lines.push(dashboardLink);

  const text = lines.join('\n');
  const number = normalizeWhatsappNumber(shop.whatsapp_number);
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
