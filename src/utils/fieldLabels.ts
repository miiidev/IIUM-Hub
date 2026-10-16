import type { CustomFieldType } from '../types';

export const FIELD_TYPE_LABEL: Record<CustomFieldType, string> = {
  select: 'Customer picks one',
  multiselect: 'Customer ticks several',
  number: 'Customer types a number',
  text: 'Short answer',
  textarea: 'Notes',
  date: 'Customer picks a date',
  phone: 'Phone number',
  file: 'Customer uploads a file',
};
