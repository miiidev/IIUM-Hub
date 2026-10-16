import type { HTMLAttributes } from 'react';

export default function Card({ className = '', ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={[
        'rounded-card border border-line bg-white shadow-card',
        'transition-[box-shadow,transform] duration-200 ease-out-soft',
        className,
      ].join(' ')}
      {...rest}
    />
  );
}
