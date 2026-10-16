import { ArrowUpRight, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from './Logo';

export default function SiteHeader() {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-cream/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[1312px] items-center justify-between gap-4 px-5 sm:px-8">
        <Logo />
        <nav aria-label="Primary" className="hidden items-center gap-7 text-sm font-semibold text-ink sm:flex">
          <Link to="/" className="transition-colors hover:text-emerald">
            Marketplace
          </Link>
          <Link to="/how-to-order" className="transition-colors hover:text-emerald">
            How to order
          </Link>
          <span className="inline-flex items-center gap-1.5 text-muted">
            <MapPin size={15} aria-hidden="true" /> IIUM Gombak
          </span>
        </nav>
        <Link
          to="/seller"
          className="inline-flex h-11 items-center gap-1.5 rounded-control bg-emerald px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
        >
          {user ? 'Dashboard' : 'Sell here'}
          <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
}
