import type { HTMLAttributes } from 'react';

export default function Card({ className = '', ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={['rounded-card border border-line bg-white shadow-card', className].join(' ')}
      {...rest}
    />
  );
}
