import { useState } from 'react';
import type { CustomField, PresetKey } from '../types';
import {
  PRESETS,
  QUESTION_CARD_TYPES,
  clonePresetFields,
  createQuestionCard,
  getPreset,
} from '../utils/formPresets';
import { FIELD_TYPE_LABEL } from '../utils/fieldLabels';
import { formatRange, priceRange } from '../utils/priceRange';
import BottomSheet from './BottomSheet';
import FormPreview from './seller/FormPreview';
import QuestionRow from './seller/QuestionRow';
import QuestionEditorSheet from './seller/QuestionEditorSheet';
import Button from './ui/Button';
import Badge from './ui/Badge';
import ConfirmDialog from './ui/ConfirmDialog';

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
  const [pendingPreset, setPendingPreset] = useState<PresetKey | null>(null);
  const editingField = fields.find((f) => f.id === editingId) ?? null;

  function applyPreset(key: PresetKey) {
    if (fields.length > 0) {
      setPendingPreset(key);
      return;
    }
    onChange(clonePresetFields(key));
  }

  function confirmApplyPreset() {
    if (pendingPreset) onChange(clonePresetFields(pendingPreset));
    setPendingPreset(null);
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
    <>
      <div className="space-y-4">
      <div className="rounded-control bg-mint/50 p-3">
        <p className="text-sm text-ink">
          Customers pay{' '}
          <span className="font-bold">{formatRange(range)}</span>
        </p>
      </div>

      {!hidePresets && (
        <div>
          <p className="mb-2 text-sm font-semibold text-ink">1. Choose a preset</p>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                disabled={disabled}
                onClick={() => applyPreset(p.key)}
                className={`min-h-[44px] rounded-control border bg-white px-3 py-2 text-left transition-colors hover:bg-mint/30 disabled:opacity-50 ${
                  recommendedKey === p.key ? 'border-emerald' : 'border-line'
                }`}
              >
                <span className="flex flex-wrap items-center gap-1 text-sm font-semibold text-ink">
                  {p.label}
                  {recommendedKey === p.key && <Badge tone="emerald">Recommended</Badge>}
                </span>
                <span className="block text-xs text-muted">{p.description}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-sm font-semibold text-ink">2. Questions ({fields.length})</p>
        {fields.length === 0 ? (
          <Button
            type="button"
            disabled={disabled}
            onClick={() => onChange([createQuestionCard('select')])}
            className="w-full"
          >
            + Add question
          </Button>
        ) : (
          <div className="space-y-2">
            {fields.map((f) => (
              <QuestionRow key={f.id} field={f} onOpen={() => setEditingId(f.id)} disabled={disabled} />
            ))}
          </div>
        )}
      </div>

      <Button
        type="button"
        variant="ghost"
        disabled={disabled || fields.length === 0}
        onClick={() => setShowPreview(true)}
        className="w-full"
      >
        Preview as buyer
      </Button>

      <details className="rounded-control border border-line bg-white">
        <summary className="flex min-h-[44px] cursor-pointer items-center px-3 text-sm font-semibold text-ink">
          Advanced
        </summary>
        <div className="space-y-3 border-t border-line p-3">
          <div>
            <p className="mb-2 text-xs font-semibold text-muted">Add question</p>
            <div className="grid grid-cols-2 gap-2">
              {QUESTION_CARD_TYPES.map((t) => (
                <button
                  key={t.type}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange([...fields, createQuestionCard(t.type)])}
                  className="min-h-[44px] rounded-control border border-line bg-white px-2 text-sm font-semibold text-ink transition-colors hover:bg-mint/30 disabled:opacity-50"
                >
                  + {FIELD_TYPE_LABEL[t.type]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold text-muted">Data (JSON)</p>
            <pre className="max-h-64 overflow-auto rounded-control border border-line bg-cream p-3 text-xs text-ink">
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

      <ConfirmDialog
        open={pendingPreset !== null}
        title="Replace questions?"
        message={
          <>
            Applying the{' '}
            <span className="font-semibold text-ink">
              {pendingPreset ? getPreset(pendingPreset).label : ''}
            </span>{' '}
            preset will replace all current questions. This can’t be undone.
          </>
        }
        confirmLabel="Replace questions"
        onConfirm={confirmApplyPreset}
        onClose={() => setPendingPreset(null)}
      />
    </>
  );
}
