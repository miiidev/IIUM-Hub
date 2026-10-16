import type { CustomField } from '../../types';
import { FIELD_TYPE_LABEL } from '../../utils/fieldLabels';
import Badge from '../ui/Badge';

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
      className={`min-h-[48px] w-full rounded-control border border-line bg-white p-3 text-left transition-colors hover:bg-mint/20 disabled:opacity-50 ${
        off ? 'opacity-60' : ''
      }`}
    >
      <span className="flex flex-wrap items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
          {f.label || '(No label yet)'}
        </span>
        <Badge tone="muted">{FIELD_TYPE_LABEL[f.type]}</Badge>
        <Badge tone={f.required ? 'mint' : 'muted'}>{f.required ? 'Required' : 'Optional'}</Badge>
        {off && <Badge tone="muted">OFF</Badge>}
      </span>
      <span className="mt-1 block truncate text-xs text-muted">{compactView(f)}</span>
    </button>
  );
}
