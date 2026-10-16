import type { ReactNode } from 'react';

interface Props {
  title: ReactNode;
  overline?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export default function SectionHeader({ title, overline, action, className = '' }: Props) {
  return (
    <div className={['flex items-end justify-between gap-3 animate-fade-in', className].join(' ')}>
      <div className="min-w-0">
        {overline && (
          <p className="text-overline font-semibold uppercase tracking-wider text-muted">{overline}</p>
        )}
        <h2 className="text-2xl font-semibold text-ink sm:text-3xl">{title}</h2>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
