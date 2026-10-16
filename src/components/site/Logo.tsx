import { ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  className?: string;
}

export default function Logo({ className = '' }: Props) {
  return (
    <Link
      to="/"
      aria-label="IIUM Hub home"
      className={['inline-flex items-center gap-2 font-bold text-emerald', className].join(' ')}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald text-white">
        <ShoppingBag size={18} strokeWidth={2.5} aria-hidden="true" />
      </span>
      <span className="text-xl leading-none">IIUM Hub</span>
    </Link>
  );
}
