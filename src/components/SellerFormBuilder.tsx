import { useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import type { CustomField, CustomFieldType, CustomOption } from '../types';

interface SellerFormBuilderProps {
  value: CustomField[];
  onChange: (next: CustomField[]) => void;
  onPersist?: (next: CustomField[]) => Promise<void> | void;
  disabled?: boolean;
}

const FIELD_TYPES: Array<{ type: CustomFieldType; label: string }> = [
  { type: 'select', label: 'Dropdown Select' },
  { type: 'radio', label: 'Radio Buttons' },
  { type: 'checkbox', label: 'Checkboxes' },
  { type: 'text', label: 'Text Input' },
  { type: 'number', label: 'Number Field' },
  { type: 'textarea', label: 'Textarea' },
  { type: 'file', label: 'File Upload' },
  { type: 'stepper', label: 'Stepper (+/-)' },
];

const TYPE_BADGES: Record<CustomFieldType, string> = {
  select: 'Pilihan',
  radio: 'Radio',
  checkbox: 'Kotak',
  text: 'Teks',
  number: 'Nombor',
  textarea: 'Catatan',
  file: 'Fail',
  stepper: 'Stepper',
};

function hasOptions(type: CustomFieldType): boolean {
  return type === 'select' || type === 'radio' || type === 'checkbox';
}

interface ChoiceDraft {
  name: string;
  price: string;
}

interface FieldDraft {
  label: string;
  required: boolean;
  choices: ChoiceDraft[];
  stepper: StepperDraft;
}

interface StepperDraft {
  min: string;
  max: string;
  step: string;
  unitPrice: string;
}

const KNOWN_TYPES: CustomFieldType[] = [
  'select',
  'radio',
  'checkbox',
  'text',
  'number',
  'textarea',
  'file',
  'stepper',
];

function numOr(raw: unknown, fallback: number): number {
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function randomId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `field_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function sanitize(fields: CustomField[]): CustomField[] {
  const seen = new Set<string>();
  const result: CustomField[] = [];
  for (const field of fields) {
    let id = field.id;
    if (!id || seen.has(id)) id = randomId();
    seen.add(id);
    const next: CustomField = {
      id,
      label: field.label.trim(),
      type: KNOWN_TYPES.includes(field.type) ? field.type : 'text',
      required: Boolean(field.required),
    };
    if (hasOptions(field.type)) {
      const options: CustomOption[] = [];
      for (const option of field.options ?? []) {
        const name = option.name.trim();
        if (!name) continue;
        const modifier = Number(option.price_modifier);
        options.push({ name, price_modifier: Number.isFinite(modifier) ? modifier : 0 });
      }
      next.options = options;
    }
    if (next.type === 'stepper') {
      next.min = numOr(field.min, 0);
      next.max = numOr(field.max, 10);
      next.step = Math.max(1, numOr(field.step, 1));
      next.unit_price = Math.max(0, numOr(field.unit_price, 0));
    }
    result.push(next);
  }
  return result;
}

function toDraft(field: CustomField): FieldDraft {
  return {
    label: field.label,
    required: field.required,
    choices:
      hasOptions(field.type)
        ? (field.options ?? []).map((option) => ({
            name: option.name,
            price: String(option.price_modifier),
          }))
        : [],
    stepper: {
      min: String(field.min ?? 0),
      max: String(field.max ?? 10),
      step: String(field.step ?? 1),
      unitPrice: String(field.unit_price ?? 0),
    },
  };
}

function choicesToOptions(choices: ChoiceDraft[]): CustomOption[] {
  return choices.map((choice) => ({
    name: choice.name,
    price_modifier: Number(choice.price) || 0,
  }));
}

interface SortableFieldCardProps {
  field: CustomField;
  disabled: boolean;
  onChangeField: (next: CustomField) => void;
  onDelete: () => void;
}

function SortableFieldCard({ field, disabled, onChangeField, onDelete }: SortableFieldCardProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: field.id });
  const [draft, setDraft] = useState<FieldDraft>(() => toDraft(field));

  function toField(patch: Partial<FieldDraft>): CustomField {
    const next = { ...draft, ...patch };
    return {
      ...field,
      label: next.label,
      required: next.required,
      options: next.choices.length > 0 ? choicesToOptions(next.choices) : undefined,
      ...(field.type === 'stepper'
        ? {
            min: numOr(next.stepper.min, 0),
            max: numOr(next.stepper.max, 10),
            step: Math.max(1, numOr(next.stepper.step, 1)),
            unit_price: Math.max(0, numOr(next.stepper.unitPrice, 0)),
          }
        : {}),
    };
  }

  function commit(patch: Partial<FieldDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
    onChangeField(toField(patch));
  }

  function patchChoice(index: number, patch: Partial<ChoiceDraft>) {
    const choices = draft.choices.map((choice, i) => (i === index ? { ...choice, ...patch } : choice));
    setDraft((current) => ({ ...current, choices }));
    onChangeField(toField({ choices }));
  }

  function addChoice() {
    const choices = [...draft.choices, { name: '', price: '' }];
    setDraft((current) => ({ ...current, choices }));
    onChangeField(toField({ choices }));
  }

  function removeChoice(index: number) {
    const choices = draft.choices.filter((_, i) => i !== index);
    setDraft((current) => ({ ...current, choices }));
    onChangeField(toField({ choices }));
  }

  function patchStepper(patch: Partial<StepperDraft>) {
    const stepper = { ...draft.stepper, ...patch };
    setDraft((current) => ({ ...current, stepper }));
    onChangeField(toField({ stepper }));
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-xl border border-slate-200 bg-white p-3 ${
        isDragging ? 'z-10 shadow-lg ring-2 ring-emerald-300' : ''
      }`}
    >
      <div className="flex items-start gap-2">
        <button
          ref={setActivatorNodeRef}
          type="button"
          aria-label="Alihkan field"
          disabled={disabled}
          {...attributes}
          {...listeners}
          style={{ touchAction: 'none' }}
          className="flex h-12 w-10 shrink-0 cursor-grab items-center justify-center rounded-xl text-slate-400 active:cursor-grabbing disabled:cursor-default disabled:opacity-40"
        >
          <GripVertical size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={draft.label}
              onChange={(e) => commit({ label: e.target.value })}
              placeholder="Label field"
              disabled={disabled}
              className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:bg-white disabled:opacity-50"
            />
            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500">
              {TYPE_BADGES[field.type]}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <label className="flex h-11 shrink-0 cursor-pointer items-center gap-2 text-sm font-bold text-slate-700">
              <input
                type="checkbox"
                checked={draft.required}
                disabled={disabled}
                onChange={(e) => commit({ required: e.target.checked })}
                className="h-5 w-5 rounded border-slate-300 accent-emerald-600"
              />
              Wajib *
            </label>
            <button
              type="button"
              onClick={onDelete}
              disabled={disabled}
              className="h-11 shrink-0 rounded-lg px-3 text-xs font-bold text-red-600 disabled:opacity-40"
            >
              Buang
            </button>
          </div>
          {hasOptions(field.type) && (
            <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
              <p className="text-xs font-bold text-slate-700">Pilihan & harga tambahan</p>
              <div className="mt-1 space-y-1.5">
                {draft.choices.map((choice, index) => (
                  <div key={index} className="flex flex-wrap items-center gap-1.5">
                    <input
                      type="text"
                      value={choice.name}
                      onChange={(e) => patchChoice(index, { name: e.target.value })}
                      placeholder="Nama pilihan"
                      disabled={disabled}
                      className="h-10 min-w-[128px] flex-1 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-900 outline-none focus:border-emerald-600 disabled:opacity-50"
                    />
                    <input
                      type="number"
                      value={choice.price}
                      onChange={(e) => patchChoice(index, { price: e.target.value })}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      disabled={disabled}
                      aria-label="Harga tambahan (RM)"
                      className="h-10 w-20 shrink-0 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-900 outline-none focus:border-emerald-600 disabled:opacity-50"
                    />
                    <span
                      className={`w-[70px] shrink-0 text-right text-xs font-bold ${
                        Number(choice.price) > 0 ? 'text-emerald-600' : 'text-slate-400'
                      }`}
                    >
                      +RM {Number(choice.price || 0).toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeChoice(index)}
                      disabled={disabled}
                      aria-label="Buang pilihan"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-red-600 disabled:opacity-40"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addChoice}
                disabled={disabled}
                className="mt-2 h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 disabled:opacity-40"
              >
                + Tambah pilihan
              </button>
            </div>
          )}
          {field.type === 'file' && (
            <p className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-slate-500">
              Pembeli boleh muat naik JPG, PNG, WEBP atau PDF (maks 5MB setiap fail).
            </p>
          )}
          {field.type === 'stepper' && (
            <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
              <p className="text-xs font-bold text-slate-700">Had & harga seunit (RM)</p>
              <div className="mt-1 grid grid-cols-4 gap-1.5">
                {(
                  [
                    { key: 'min', label: 'Min' },
                    { key: 'max', label: 'Maks' },
                    { key: 'step', label: 'Step' },
                    { key: 'unitPrice', label: '+RM' },
                  ] as const
                ).map((cfg) => (
                  <label key={cfg.key} className="block">
                    <span className="text-xs text-slate-500">{cfg.label}</span>
                    <input
                      type="number"
                      value={draft.stepper[cfg.key]}
                      onChange={(e) => patchStepper({ [cfg.key]: e.target.value })}
                      disabled={disabled}
                      className="mt-0.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-900 outline-none focus:border-emerald-600 disabled:opacity-50"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SellerFormBuilder({ value, onChange, disabled = false }: SellerFormBuilderProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const ids = value.map((field) => field.id);

  function emit(next: CustomField[]) {
    onChange(sanitize(next));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIndex = value.findIndex((field) => field.id === active.id);
    const toIndex = value.findIndex((field) => field.id === over.id);
    if (fromIndex === -1 || toIndex === -1) return;
    emit(arrayMove(value, fromIndex, toIndex));
  }

  function addField(type: CustomFieldType) {
    const field: CustomField = {
      id: randomId(),
      label: '',
      type,
      required: false,
      options: hasOptions(type) ? [{ name: '', price_modifier: 0 }] : undefined,
    };
    emit([...value, field]);
  }

  function updateField(next: CustomField) {
    emit(value.map((field) => (field.id === next.id ? next : field)));
  }

  function removeField(id: string) {
    emit(value.filter((field) => field.id !== id));
  }

  return (
    <div>
      <div className="max-h-[60vh] overflow-y-auto pr-0.5">
        {value.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
            Belum ada field. Tekan butang di bawah untuk tambah.
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {value.map((field) => (
                  <SortableFieldCard
                    key={field.id}
                    field={field}
                    disabled={disabled}
                    onChangeField={updateField}
                    onDelete={() => removeField(field.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {FIELD_TYPES.map((type) => (
          <button
            key={type.type}
            type="button"
            onClick={() => addField(type.type)}
            disabled={disabled}
            className="flex min-h-[44px] items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-2 text-center text-sm font-bold text-slate-700 disabled:opacity-50"
          >
            <Plus size={16} className="shrink-0" />
            {type.label}
          </button>
        ))}
      </div>
    </div>
  );
}