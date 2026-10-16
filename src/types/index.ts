export type ShopCategory = 'food' | 'printing' | 'shoe_wash' | 'repairs' | 'rentals' | 'custom';

export type PresetKey = 'printing' | 'shoe_wash' | 'food_addons' | 'custom';

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
  duitnow_qr_url?: string | null;
  duitnow_account?: string | null;
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

export type CustomValue = string | number | string[];

export interface CustomField {
  id: string;
  label: string;
  type: CustomFieldType;
  required: boolean;
  enabled?: boolean;
  options?: CustomOption[];
  placeholder?: string;
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
}

export interface OrderItemSummary {
  title: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  selectedOptions?: string;
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
