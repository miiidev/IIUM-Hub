import { useState } from 'react';
import type { CustomField, PresetKey } from '../types';
import {
  PRESETS,
  QUESTION_CARD_TYPES,
  clonePresetFields,
  createQuestionCard,
} from '../utils/formPresets';
import { FIELD_TYPE_LABEL } from '../utils/fieldLabels';
import { formatRange, priceRange } from '../utils/priceRange';
import BottomSheet from './BottomSheet';
import FormPreview from './seller/FormPreview';
import QuestionRow from './seller/QuestionRow';
import QuestionEditorSheet from './seller/QuestionEditorSheet';

interface Props {
  fields: CustomField[];
  onChange: (fields: CustomField[]) => void;
  basePrice: number;
  shopId: string;
  disabled?: boolean;
  recommendedKey?: PresetKey | null;
  hidePresets?: boolean;
}

export default function SellerFormConfigurator({
  fields,
  onChange,
  basePrice,
  shopId,
  disabled = false,
  recommendedKey = null,
  hidePresets = false,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const editingField = fields.find((f) => f.id === editingId) ?? null;

  function applyPreset(key: PresetKey) {
    if (fields.length > 0 && !window.confirm('Replace all current questions with this preset?')) return;
    onChange(clonePresetFields(key));
  }

  function saveField(next: CustomField) {
    onChange(fields.map((f) => (f.id === next.id ? next : f)));
    setEditingId(null);
  }

  function removeField(id: string) {
    onChange(fields.filter((f) => f.id !== id));
  }

  const range = priceRange(basePrice, fields);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-sm text-slate-800">
          Customers pay{' '}
          <span className="font-bold text-slate-900">{formatRange(range)}</span>
        </p>
      </div>

      {!hidePresets && (
        <div>
          <p className="mb-2 text-sm font-bold text-slate-900">1. Choose a preset</p>
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              disabled={disabled}
              onClick={() => applyPreset(p.key)}
              className={`min-h-[44px] rounded-xl border bg-white px-3 py-2 text-left disabled:opacity-50 ${
                recommendedKey === p.key ? 'border-slate-900' : 'border-slate-300'
              }`}
            >
              <span className="flex items-center gap-1 text-sm font-bold text-slate-900">
                {p.label}
                {recommendedKey === p.key && (
                  <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs font-bold text-white">
                    Recommended
                  </span>
                )}
              </span>
              <span className="block text-xs text-slate-600">{p.description}</span>
            </button>
          ))}
        </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-sm font-bold text-slate-900">2. Questions ({fields.length})</p>
        {fields.length === 0 ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange([createQuestionCard('select')])}
            className="h-12 w-full rounded-xl bg-slate-900 font-bold text-white disabled:opacity-50"
          >
            + Add question
          </button>
        ) : (
          <div className="space-y-2">
            {fields.map((f) => (
              <QuestionRow key={f.id} field={f} onOpen={() => setEditingId(f.id)} disabled={disabled} />
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        disabled={disabled || fields.length === 0}
        onClick={() => setShowPreview(true)}
        className="h-12 w-full rounded-xl border border-slate-300 bg-white font-bold text-slate-800 disabled:opacity-50"
      >
        Preview as buyer
      </button>

      <details className="rounded-xl border border-slate-200 bg-white">
        <summary className="flex min-h-[44px] cursor-pointer items-center px-3 text-sm font-bold text-slate-800">
          Advanced
        </summary>
        <div className="space-y-3 border-t border-slate-200 p-3">
          <div>
            <p className="mb-2 text-xs font-bold text-slate-700">Add question</p>
            <div className="grid grid-cols-2 gap-2">
              {QUESTION_CARD_TYPES.map((t) => (
                <button
                  key={t.type}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange([...fields, createQuestionCard(t.type)])}
                  className="min-h-[44px] rounded-xl border border-slate-300 bg-white px-2 text-sm font-bold text-slate-800 disabled:opacity-50"
                >
                  + {FIELD_TYPE_LABEL[t.type]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs font-bold text-slate-700">Data (JSON)</p>
            <pre className="max-h-64 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800">
              {JSON.stringify(fields, null, 2)}
            </pre>
          </div>
        </div>
      </details>

      <QuestionEditorSheet
        open={editingId !== null}
        field={editingField}
        onClose={() => setEditingId(null)}
        onSave={saveField}
        onRemove={() => {
          if (editingId) removeField(editingId);
        }}
      />

      <BottomSheet
        open={showPreview}
        onClose={() => setShowPreview(false)}
        title="Buyer preview"
      >
        <FormPreview fields={fields} basePrice={basePrice} shopId={shopId} />
      </BottomSheet>
    </div>
  );
}
