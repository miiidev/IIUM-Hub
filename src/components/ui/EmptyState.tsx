import type { ReactNode } from 'react';

interface Props {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({ title, description, action, className = '' }: Props) {
  return (
    <div
      className={[
        'rounded-card border border-dashed border-line bg-white/60 px-6 py-10 text-center animate-fade-in-up',
        className,
      ].join(' ')}
    >
      <p className="text-base font-semibold text-ink">{title}</p>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
