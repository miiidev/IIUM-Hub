import { ShoppingBag } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function SellerNav() {
  const { shop, signOut } = useAuth();
  const location = useLocation();

  const tabs = [
    { to: '/seller', label: 'Orders' },
    { to: '/seller/products', label: 'Products' },
    { to: '/seller/settings', label: 'Profile Settings' },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-cream">
      <div className="mx-auto w-full max-w-[1312px] px-5 sm:px-8">
        <div className="flex h-16 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              to="/"
              aria-label="IIUM Hub home"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald text-white transition-transform duration-150 ease-out-soft hover:scale-105"
            >
              <ShoppingBag size={16} strokeWidth={2.5} aria-hidden="true" />
            </Link>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold text-ink">{shop?.name ?? 'My Shop'}</h1>
              <p className="text-xs">
                {shop ? (
                  <span className={shop.is_active ? 'font-semibold text-emerald' : 'font-semibold text-muted'}>
                    {shop.is_active ? 'Open' : 'Closed'}
                  </span>
                ) : (
                  <span className="text-muted">Seller panel</span>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => signOut()}
            className="h-11 shrink-0 rounded-control border border-line px-4 text-sm font-semibold text-ink transition-colors hover:bg-mint/30"
          >
            Log out
          </button>
        </div>
        <nav aria-label="Seller" className="flex gap-1">
          {tabs.map((t) => {
            const active =
              t.to === '/seller'
                ? location.pathname === '/seller'
                : location.pathname.startsWith(t.to);
            return (
              <Link
                key={t.to}
                to={t.to}
                aria-current={active ? 'page' : undefined}
                className={[
                  'inline-flex h-11 items-center border-b-2 px-4 text-sm font-semibold transition-colors',
                  active
                    ? 'border-emerald text-ink'
                    : 'border-transparent text-muted hover:text-ink',
                ].join(' ')}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
