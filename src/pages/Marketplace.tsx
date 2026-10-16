import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Camera,
  Footprints,
  LayoutGrid,
  MapPin,
  Printer,
  Search,
  Sparkles,
  Store,
  UtensilsCrossed,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Shop } from '../types';
import { MAHALLAS } from '../utils/mahallas';
import { SHOP_CATEGORIES, categoryLabel } from '../utils/categories';
import SiteHeader from '../components/site/SiteHeader';
import SiteFooter from '../components/site/SiteFooter';
import MobileTabBar from '../components/site/MobileTabBar';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Chip from '../components/ui/Chip';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

const MAHALLA_FILTERS = ['All', ...MAHALLAS];

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  all: LayoutGrid,
  food: UtensilsCrossed,
  printing: Printer,
  shoe_wash: Footprints,
  repairs: Wrench,
  rentals: Camera,
  custom: Sparkles,
};

export default function Marketplace() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cat, setCat] = useState('all');
  const [mahalla, setMahalla] = useState('All');
  const [q, setQ] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchShops() {
      setLoading(true);
      setError(null);
      try {
        const { data, error: err } = await supabase
          .from('shops')
          .select('*')
          .eq('is_active', true)
          .order('name');
        if (err) throw err;
        setShops((data as Shop[]) ?? []);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load shops.');
      } finally {
        setLoading(false);
      }
    }
    fetchShops();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return shops.filter((s) => {
      if (cat !== 'all' && s.category !== cat) return false;
      if (mahalla !== 'All' && s.mahalla !== mahalla) return false;
      if (needle && !s.name.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [shops, cat, mahalla, q]);

  return (
    <div className="flex min-h-screen flex-col pb-16 sm:pb-0">
      <SiteHeader />

      <main className="mx-auto w-full max-w-[1312px] flex-1 px-5 pt-8 sm:px-8">
        <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald">
          <MapPin size={15} aria-hidden="true" /> IIUM Gombak
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          IIUM Campus Marketplace
        </h1>
        <p className="mt-2 max-w-xl text-base text-muted">
          Great food, assignment printing, local services. All nearby.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-1 gap-2">
            <input
              ref={searchRef}
              type="search"
              aria-label="Search shops"
              placeholder="Find shops..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="h-12 w-full rounded-control border border-line bg-white px-3.5 text-base text-ink placeholder:text-placeholder outline-none transition-colors focus:border-emerald focus:ring-2 focus:ring-emerald/25"
            />
            <button
              type="button"
              aria-label="Focus search"
              onClick={() => searchRef.current?.focus()}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-control bg-emerald text-white transition-[color,background-color,transform] duration-150 ease-out-soft hover:bg-emerald/90 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
            >
              <Search size={18} aria-hidden="true" />
            </button>
          </div>
          <label className="sm:w-64">
            <span className="sr-only">Filter by Mahallah</span>
            <select
              className="h-12 w-full rounded-control border border-line bg-white px-3.5 text-base text-ink outline-none focus:border-emerald focus:ring-2 focus:ring-emerald/25"
              value={mahalla}
              onChange={(e) => setMahalla(e.target.value)}
            >
              {MAHALLA_FILTERS.map((m) => (
                <option key={m} value={m}>
                  {m === 'All' ? 'All Mahallahs' : m}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto pb-1">
          {[{ value: 'all', label: 'All' }, ...SHOP_CATEGORIES].map((c) => {
            const Icon = CATEGORY_ICONS[c.value] ?? LayoutGrid;
            return (
              <Chip key={c.value} active={cat === c.value} onClick={() => setCat(c.value)}>
                <Icon size={16} aria-hidden="true" />
                {c.label}
              </Chip>
            );
          })}
        </div>

        <div className="mt-8 flex items-end justify-between gap-3">
          <h2 className="text-2xl font-semibold text-ink sm:text-3xl">Explore shops</h2>
          {!loading && !error && (
            <p className="pb-1 text-sm text-muted">
              {filtered.length} {filtered.length === 1 ? 'shop' : 'shops'}
            </p>
          )}
        </div>

        <div className="mt-4">
          {loading && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-56 rounded-card" />
              ))}
            </div>
          )}

          {error && (
            <div role="alert" className="rounded-card border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <EmptyState
              title="No shops found"
              description="Try a different search or filter."
              action={
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-muted">
                  <Store size={18} aria-hidden="true" /> No results
                </span>
              }
            />
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s, i) => (
              <Link
                key={s.id}
                to={`/s/${s.slug}`}
                className="group block rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
              >
                <Card
                  className="overflow-hidden group-hover:shadow-button group-hover:-translate-y-0.5 animate-fade-in-up"
                  style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                >
                  <div className="relative aspect-[16/10] w-full bg-mint/40">
                    {s.banner_url ? (
                      <img
                        src={s.banner_url}
                        alt=""
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                        className="h-full w-full object-cover animate-fade-in transition-transform duration-300 ease-out-soft group-hover:scale-105"
                      />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="flex h-full w-full items-center justify-center text-4xl font-bold text-emerald/40 animate-fade-in"
                      >
                        {s.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <Badge tone="mint" dot className="absolute left-3 top-3">
                      {s.is_active ? 'Open' : 'Closed'}
                    </Badge>
                    <span
                      aria-hidden="true"
                      className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-emerald"
                    >
                      <ArrowUpRight size={16} />
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="truncate font-semibold text-ink">{s.name}</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded-full bg-cream px-2.5 py-1 text-xs font-medium text-muted">
                        {s.mahalla}
                      </span>
                      <span className="rounded-full bg-cream px-2.5 py-1 text-xs font-medium text-muted">
                        {categoryLabel(s.category)}
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 rounded-card bg-mint p-6 sm:flex-row sm:items-center sm:p-8">
          <div>
            <h2 className="text-xl font-bold text-ink sm:text-2xl">
              Want to start a business in IIUM?
            </h2>
            <p className="mt-1 text-sm text-emerald/80">Open your shop on IIUM Hub.</p>
          </div>
          <Link
            to="/seller"
            className="inline-flex h-12 shrink-0 items-center gap-1.5 rounded-control bg-emerald px-5 font-semibold text-white transition-colors hover:bg-emerald/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald focus-visible:ring-offset-2 focus-visible:ring-offset-mint"
          >
            Sell here
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </main>

      <SiteFooter />
      <MobileTabBar />
    </div>
  );
}
