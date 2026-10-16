import { useState } from 'react';
import DynamicFormEngine, { computeModifierTotal } from '../DynamicFormEngine';
import type { CustomField, CustomValue } from '../../types';

interface Props {
  fields: CustomField[];
  basePrice: number;
  shopId: string;
}

export default function FormPreview({ fields, basePrice, shopId }: Props) {
  const [values, setValues] = useState<Record<string, CustomValue>>({});
  const mod = computeModifierTotal(fields, values);

  return (
    <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
        Preview — paparan buyer
      </p>
      <div className="mt-2">
        <DynamicFormEngine
          fields={fields}
          values={values}
          onChange={(id, v) => setValues((p) => ({ ...p, [id]: v }))}
          shopId={shopId}
          preview
        />
      </div>
      <div className="mt-3 space-y-1 border-t border-emerald-200 pt-2 text-sm">
        <p className="flex justify-between text-slate-600">
          <span>Base</span>
          <span>RM {basePrice.toFixed(2)}</span>
        </p>
        <p className="flex justify-between text-slate-600">
          <span>Tambahan</span>
          <span>RM {mod.toFixed(2)}</span>
        </p>
        <p className="flex justify-between font-bold text-slate-900">
          <span>Total buyer bayar</span>
          <span>RM {(basePrice + mod).toFixed(2)}</span>
        </p>
      </div>
    </div>
  );
}
