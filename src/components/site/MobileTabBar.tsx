import { ClipboardList, ShoppingBag, Store } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const TABS = [
  { to: '/', label: 'Marketplace', Icon: Store },
  { to: '/how-to-order', label: 'How to order', Icon: ClipboardList },
  { to: '/seller', label: 'Sell', Icon: ShoppingBag },
];

function isActive(pathname: string, to: string): boolean {
  if (to === '/') return pathname === '/';
  return pathname.startsWith(to);
}

export default function MobileTabBar() {
  const { pathname } = useLocation();
  return (
    <nav
      aria-label="Primary"
      className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white sm:hidden"
    >
      <ul className="flex">
        {TABS.map(({ to, label, Icon }) => {
          const active = isActive(pathname, to);
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                aria-current={active ? 'page' : undefined}
                className={[
                  'flex h-14 flex-col items-center justify-center gap-0.5 text-xs font-semibold',
                  active ? 'text-emerald' : 'text-muted',
                ].join(' ')}
              >
                <Icon size={20} aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
