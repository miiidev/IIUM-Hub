import type { ButtonHTMLAttributes } from 'react';

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export default function Chip({ active = false, className = '', children, type = 'button', ...rest }: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={active}
      className={[
        'inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald focus-visible:ring-offset-2 focus-visible:ring-offset-cream',
        active
          ? 'bg-emerald text-white'
          : 'border border-line bg-white text-ink hover:bg-mint/30',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
}
