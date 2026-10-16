import type { InputHTMLAttributes } from 'react';

export default function Input({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={[
        'h-12 w-full rounded-control border border-line bg-white px-3.5 text-base text-ink',
        'placeholder:text-placeholder outline-none transition-[border-color,box-shadow] duration-150 ease-out-soft',
        'focus:border-emerald focus:ring-2 focus:ring-emerald/25 disabled:opacity-50',
        className,
      ].join(' ')}
      {...rest}
    />
  );
}
