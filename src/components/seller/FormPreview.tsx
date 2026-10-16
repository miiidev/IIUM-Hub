import { useState } from 'react';
import DynamicFormEngine from '../DynamicFormEngine';
import type { CustomField, CustomValue } from '../../types';
import { computeUnitTotal } from '../../utils/formPresets';

interface Props {
  fields: CustomField[];
  basePrice: number;
  shopId: string;
}

export default function FormPreview({ fields, basePrice, shopId }: Props) {
  const [values, setValues] = useState<Record<string, CustomValue>>({});
  const unit = computeUnitTotal(basePrice, fields, values);

  return (
    <div className="rounded-control border border-line bg-white p-3 animate-fade-in-up">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Buyer preview</p>
      <div className="mt-2">
        <DynamicFormEngine
          fields={fields}
          values={values}
          onChange={(id, v) => setValues((p) => ({ ...p, [id]: v }))}
          shopId={shopId}
          preview
        />
      </div>
      <div className="mt-3 border-t border-line pt-2 text-sm">
        <p className="flex justify-between text-muted">
          <span>Base price</span>
          <span>RM {basePrice.toFixed(2)}</span>
        </p>
        <p className="flex justify-between font-semibold text-ink">
          <span>Per-unit total</span>
          <span>RM {unit.toFixed(2)}</span>
        </p>
      </div>
    </div>
  );
}
