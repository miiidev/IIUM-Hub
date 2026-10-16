interface Props {
  className?: string;
}

export default function Skeleton({ className = '' }: Props) {
  return (
    <div
      aria-hidden="true"
      className={['animate-pulse rounded-control bg-mint/40', className].join(' ')}
    />
  );
}
