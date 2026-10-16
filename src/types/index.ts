export type ShopCategory = 'food' | 'printing' | 'repairs' | 'rentals' | 'custom';

export type PresetKey = 'printing' | 'food_addons' | 'repairs' | 'rentals' | 'custom';

export type OrderStatus =
  | 'pending_verification'
  | 'confirmed'
  | 'ready'
  | 'completed'
  | 'cancelled';

export interface Shop {
  id: string;
  slug: string;
  name: string;
  whatsapp_number: string;
  category: ShopCategory | string;
  mahalla: string;
  is_active: boolean;
  owner_id?: string | null;
  duitnow_qr_url?: string | null;
  duitnow_account?: string | null;
  banner_url?: string | null;
  description?: string | null;
}

export interface Profile {
  id: string;
  whatsapp_number: string | null;
}

export interface CustomOption {
  name: string;
  price_modifier: number;
}

export type CustomFieldType = 'select' | 'text' | 'number' | 'textarea' | 'date' | 'phone' | 'file' | 'multiselect';

export type CustomValue = string | number | string[];

export interface CustomField {
  id: string;
  label: string;
  type: CustomFieldType;
  required: boolean;
  enabled?: boolean;
  options?: CustomOption[];
  placeholder?: string;
  price_per_unit?: number;
  min?: number;
  max?: number;
  integer?: boolean;
  quickPicks?: number[];
}

export interface CustomFormState {
  values: Record<string, CustomValue>;
  errors: Record<string, string>;
  total: number;
}

export interface Product {
  id: string;
  shop_id: string;
  title: string;
  price: number;
  is_available: boolean;
  custom_fields: CustomField[] | null;
  image_url?: string | null;
}

export interface ProductWithShop extends Product {
  shops: Shop;
}

export interface OrderItemSummary {
  title: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  selectedOptions?: string;
  basePrice?: number;
  fields?: OrderFieldSnapshot[];
}

export interface OrderFieldSnapshot {
  field_id: string;
  label: string;
  type: string;
  value: CustomValue;
  display: string;
  price_applied: number;
}

export interface Order {
  id: string;
  shop_id: string;
  buyer_name: string;
  location: string;
  total_amount: number;
  payment_ref_id: string;
  custom_data: Record<string, CustomValue>;
  items: OrderItemSummary[];
  status: OrderStatus;
  cancel_reason?: string | null;
  created_at?: string;
}

export interface OrderPayload {
  buyer_name: string;
  location: string;
  total_amount: number;
  payment_ref_id: string;
  custom_data: Record<string, CustomValue>;
  items: OrderItemSummary[];
  shop_id: string;
}
