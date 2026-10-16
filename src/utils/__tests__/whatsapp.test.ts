import { describe, expect, it } from 'vitest';
import type { OrderPayload, Shop } from '../../types';
import { buildOrderMessage, generateWhatsAppLink, normalizeWhatsappNumber } from '../whatsapp';

const shop: Shop = {
  id: 's1',
  slug: 'kedai',
  name: 'Kedai Test',
  whatsapp_number: '+60 12-345 6789',
  category: 'printing',
  mahalla: 'Faruq',
  is_active: true,
};

const order: OrderPayload = {
  shop_id: 's1',
  buyer_name: 'Ali',
  location: 'Faruq C2-3-12',
  total_amount: 5.9,
  payment_ref_id: '9412',
  items: [{ title: 'Print A4', qty: 2, unitPrice: 2.95, lineTotal: 5.9 }],
  custom_data: { 'Saiz Kertas': 'A4', 'Mod Warna': 'Berwarna' },
};

describe('whatsapp', () => {
  it('normalizes the number to digits only', () => {
    expect(normalizeWhatsappNumber('+60 12-345 6789')).toBe('60123456789');
  });

  it('builds a markdown message with specs, total, ref id and manage link', () => {
    const msg = buildOrderMessage(shop, order, 'order-123');
    expect(msg).toContain('*New Order - Kedai Test*');
    expect(msg).toContain('- Print A4 x2 @ RM 2.95 = RM 5.90');
    expect(msg).toContain('- Saiz Kertas: A4');
    expect(msg).toContain('*Total: RM 5.90*');
    expect(msg).toContain('DuitNow Ref ID: 9412');
    expect(msg).toContain('/seller/orders/order-123');
  });

  it('encodes the whole body into a wa.me link', () => {
    const link = generateWhatsAppLink(shop, order, 'order-123');
    expect(link.startsWith('https://wa.me/60123456789?text=')).toBe(true);
    expect(decodeURIComponent(link.split('?text=')[1])).toBe(buildOrderMessage(shop, order, 'order-123'));
  });

  it('shows file names, never urls, for file values', () => {
    const withFile: OrderPayload = {
      ...order,
      items: [
        {
          title: 'Print',
          qty: 1,
          unitPrice: 2,
          lineTotal: 2,
          fields: [
            {
              field_id: 'f',
              label: 'Upload File',
              type: 'file',
              value: 'shop1/12345678-1234-1234-1234-123456789012-doc.pdf',
              display: 'doc.pdf',
              price_applied: 0,
            },
          ],
        },
      ],
      custom_data: {
        Old: 'https://cdn.example.com/storage/v1/object/public/buyer-uploads/shop1/12345678-1234-1234-1234-123456789012-old.pdf',
      },
    };
    const msg = buildOrderMessage(shop, withFile, 'order-9');
    expect(msg).toContain('- Upload File: doc.pdf');
    expect(msg).toContain('- Old: old.pdf');
    expect(msg).not.toContain('cdn.example.com');
    expect(msg).not.toContain('/storage/v1/object/');
    expect(msg).not.toContain('12345678-1234');
  });
});
