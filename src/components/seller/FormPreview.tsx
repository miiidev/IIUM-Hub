import { useState } from 'react';
import DynamicFormEngine from '../DynamicFormEngine';
import type { CustomField, CustomValue } from '../../types';
import { computeUnitTotal } from '../../utils/formPresets';

interface Props {
  fields: CustomField[];
  basePrice: number;
}

export default function FormPreview({ fields, basePrice }: Props) {
  const [values, setValues] = useState<Record<string, CustomValue>>({});
  const unit = computeUnitTotal(basePrice, fields, values);

  return (
    <div className="rounded-xl border border-slate-300 bg-white p-3">
      <p className="text-xs font-bold uppercase text-slate-700">Preview paparan buyer</p>
      <div className="mt-2">
        <DynamicFormEngine
          fields={fields}
          values={values}
          onChange={(id, v) => setValues((p) => ({ ...p, [id]: v }))}
        />
      </div>
      <div className="mt-3 border-t border-slate-200 pt-2 text-sm">
        <p className="flex justify-between text-slate-700">
          <span>Harga asas</span>
          <span>RM {basePrice.toFixed(2)}</span>
        </p>
        <p className="flex justify-between font-bold text-slate-900">
          <span>Jumlah seunit</span>
          <span>RM {unit.toFixed(2)}</span>
        </p>
      </div>
    </div>
  );
}
