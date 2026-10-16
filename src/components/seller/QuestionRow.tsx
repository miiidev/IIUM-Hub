import type { CustomField } from '../../types';
import { FIELD_TYPE_LABEL } from '../../utils/fieldLabels';

interface Props {
  field: CustomField;
  onOpen: () => void;
  disabled?: boolean;
}

function compactView(f: CustomField): string {
  if (f.type === 'select' || f.type === 'multiselect') {
    const opts = f.options ?? [];
    if (opts.length === 0) return 'No options yet';
    return opts
      .map((o) =>
        Number(o.price_modifier) > 0 ? `${o.name} (+RM ${Number(o.price_modifier).toFixed(2)})` : o.name
      )
      .join(' · ');
  }
  if (f.type === 'number') {
    const parts: string[] = [];
    if (Number(f.price_per_unit) > 0) parts.push(`RM ${Number(f.price_per_unit).toFixed(2)} each`);
    if (Number.isFinite(Number(f.min)) || Number.isFinite(Number(f.max))) {
      const lo = Number.isFinite(Number(f.min)) ? String(f.min) : '…';
      const hi = Number.isFinite(Number(f.max)) ? String(f.max) : '…';
      parts.push(`${lo} to ${hi}`);
    }
    return parts.length > 0 ? parts.join(', ') : 'Any number';
  }
  return f.placeholder || '—';
}

export default function QuestionRow({ field: f, onOpen, disabled = false }: Props) {
  const off = f.enabled === false;
  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={disabled}
      className={`min-h-[48px] w-full rounded-xl border bg-white p-3 text-left disabled:opacity-50 ${
        off ? 'border-slate-200 opacity-60' : 'border-slate-300'
      }`}
    >
      <span className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-900">
          {f.label || '(No label yet)'}
        </span>
        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
          {FIELD_TYPE_LABEL[f.type]}
        </span>
        <span
          className={`shrink-0 rounded-full px-2 py-1 text-xs font-bold ${
            f.required ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {f.required ? 'Required' : 'Optional'}
        </span>
        {off && (
          <span className="shrink-0 rounded-full bg-slate-200 px-2 py-1 text-xs font-bold text-slate-600">
            OFF
          </span>
        )}
      </span>
      <span className="mt-1 block truncate text-xs text-slate-600">{compactView(f)}</span>
    </button>
  );
}
