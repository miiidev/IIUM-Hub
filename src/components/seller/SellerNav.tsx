import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function SellerNav() {
  const { shop, signOut } = useAuth();
  const location = useLocation();

  const tabs = [
    { to: '/seller', label: 'Orders' },
    { to: '/seller/products', label: 'Products' },
    { to: '/seller/settings', label: 'Settings' },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="p-4 sm:p-6 pb-0">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
              {shop?.name ?? 'My Shop'}
            </h1>
            <p className="text-xs text-slate-500">
              {shop ? (
                <span className={`font-bold ${shop.is_active ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {shop.is_active ? '● Open' : '● Closed'}
                </span>
              ) : (
                'Seller panel'
              )}
            </p>
          </div>
          <button
            onClick={() => signOut()}
            className="h-11 shrink-0 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700"
          >
            Log keluar
          </button>
        </div>
        <nav className="mt-3 flex gap-1">
          {tabs.map((t) => {
            const active =
              t.to === '/seller'
                ? location.pathname === '/seller'
                : location.pathname.startsWith(t.to);
            return (
              <Link
                key={t.to}
                to={t.to}
                className={`h-11 flex-1 rounded-t-xl border border-b-0 px-4 py-3 text-center text-sm font-bold ${
                  active
                    ? 'border-slate-200 bg-slate-50 text-slate-900'
                    : 'border-transparent text-slate-500'
                }`}
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
