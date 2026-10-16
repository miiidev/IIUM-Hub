export type ShopCategory = 'food' | 'printing' | 'repairs' | 'rentals' | 'custom';

export type OrderStatus = 'pending' | 'confirmed' | 'rejected' | 'completed';

export interface Shop {
  id: string;
  slug: string;
  name: string;
  whatsapp_number: string;
  category: ShopCategory | string;
  mahalla: string;
  is_active: boolean;
  owner_id?: string | null;
}

export interface Profile {
  id: string;
  whatsapp_number: string | null;
}

export interface CustomOption {
  name: string;
  price_modifier: number;
}

export type CustomFieldType = 'select' | 'text' | 'number' | 'textarea';

export interface CustomField {
  id: string;
  label: string;
  type: CustomFieldType;
  required: boolean;
  options?: CustomOption[];
}

export interface Product {
  id: string;
  shop_id: string;
  title: string;
  price: number;
  is_available: boolean;
  custom_fields: CustomField[] | null;
}

export interface Order {
  id: string;
  shop_id: string;
  buyer_name: string;
  location: string;
  total_amount: number;
  payment_ref_id: string;
  custom_data: Record<string, string | number>;
  status: OrderStatus;
}

export interface OrderItemSummary {
  title: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  selectedOptions?: string;
}

export interface OrderPayload {
  buyer_name: string;
  location: string;
  total_amount: number;
  payment_ref_id: string;
  custom_data: Record<string, string | number>;
  items: OrderItemSummary[];
  shop_id: string;
}
