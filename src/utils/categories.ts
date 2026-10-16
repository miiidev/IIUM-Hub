export interface ShopCategoryOption {
  value: string;
  label: string;
}

export const SHOP_CATEGORIES: ShopCategoryOption[] = [
  { value: 'food', label: 'Food' },
  { value: 'printing', label: 'Printing' },
  { value: 'shoe_wash', label: 'Shoe Wash' },
  { value: 'repairs', label: 'Repairs' },
  { value: 'rentals', label: 'Rentals' },
  { value: 'custom', label: 'Others / Custom' },
];

export function categoryLabel(value: string): string {
  return SHOP_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}
