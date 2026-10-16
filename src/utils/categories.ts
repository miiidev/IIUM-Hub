export interface ShopCategoryOption {
  value: string;
  label: string;
}

export const SHOP_CATEGORIES: ShopCategoryOption[] = [
  { value: 'food', label: 'Food' },
  { value: 'printing', label: 'Printing' },
  { value: 'repairs', label: 'Repairs' },
  { value: 'rentals', label: 'Rentals' },
  { value: 'custom', label: 'Others' },
];

export function categoryLabel(value: string): string {
  return SHOP_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}
