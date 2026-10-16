import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'md' | 'sm';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-emerald text-white hover:bg-emerald/90 active:bg-emerald',
  secondary: 'bg-mint text-emerald shadow-button hover:bg-mint/80 active:bg-mint',
  ghost: 'bg-transparent text-emerald border border-line hover:bg-mint/30',
};

const SIZES: Record<Size, string> = {
  md: 'h-12 px-5 text-base',
  sm: 'h-11 px-4 text-sm',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-control font-semibold',
        'transition-[color,background-color,border-color,box-shadow,transform] duration-150 ease-out-soft',
        'hover:-translate-y-px active:scale-[0.97]',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:active:scale-100',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald focus-visible:ring-offset-2 focus-visible:ring-offset-cream',
        VARIANTS[variant],
        SIZES[size],
        className,
      ].join(' ')}
      {...rest}
    />
  );
}
