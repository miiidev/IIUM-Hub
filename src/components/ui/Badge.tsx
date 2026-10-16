import type { HTMLAttributes } from 'react';

type Tone = 'mint' | 'emerald' | 'muted';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  dot?: boolean;
}

const TONES: Record<Tone, string> = {
  mint: 'bg-mint text-emerald',
  emerald: 'bg-emerald text-white',
  muted: 'bg-cream text-muted border border-line',
};

export default function Badge({ tone = 'mint', dot = false, className = '', children, ...rest }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
        'transition-colors duration-150 ease-out-soft',
        TONES[tone],
        className,
      ].join(' ')}
      {...rest}
    >
      {dot && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
