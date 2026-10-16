import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Store } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Shop } from '../types';

const CATEGORIES = ['All', 'Food', 'Printing', 'Repairs', 'Rentals', 'Others / Custom'];
const MAHALLAS = ['All', 'Aminah', 'Faruq', 'Ali', 'Bilal', 'Maryam', 'Asma', 'Ruqayyah'];

function categoryToDb(cat: string): string | null {
  if (cat === 'All') return null;
  if (cat === 'Others / Custom') return 'custom';
  return cat.toLowerCase();
}

export default function Marketplace() {
  const { user } = useAuth();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cat, setCat] = useState('All');
  const [mahalla, setMahalla] = useState('All');
  const [q, setQ] = useState('');

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
        setError(e instanceof Error ? e.message : 'Gagal muat kedai.');
      } finally {
        setLoading(false);
      }
    }
    fetchShops();
  }, []);

  const filtered = useMemo(() => {
    const dbCat = categoryToDb(cat);
    return shops.filter((s) => {
      if (dbCat && s.category !== dbCat) return false;
      if (mahalla !== 'All' && s.mahalla !== mahalla) return false;
      if (q && !s.name.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [shops, cat, mahalla, q]);

  return (
    <div className="mx-auto w-full max-w-md sm:max-w-2xl lg:max-w-5xl min-h-screen bg-slate-50 pb-10">
      <header className="bg-white border-b border-slate-200 p-4 sm:p-6 sticky top-0 z-10">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">IIUM Hub</h1>
            <p className="text-sm text-slate-600">Marketplace kampus — zero cost</p>
          </div>
          <Link
            to="/seller"
            className="inline-flex h-11 items-center rounded-xl bg-slate-900 px-4 text-sm font-bold text-white"
          >
            {user ? 'Seller Dashboard' : 'Jual di sini'}
          </Link>
        </div>
        <div className="mt-3 flex flex-col sm:flex-row gap-2">
          <div className="flex h-12 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
            <Search size={18} className="shrink-0 text-slate-500" />
            <input
              className="w-full bg-transparent outline-none text-slate-900"
              placeholder="Cari kedai..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <select
            className="h-12 w-full sm:w-48 rounded-xl border border-slate-200 bg-white px-3 text-slate-900"
            value={mahalla}
            onChange={(e) => setMahalla(e.target.value)}
          >
            {MAHALLAS.map((m) => (
              <option key={m} value={m}>
                {m === 'All' ? 'Semua Mahalla' : m}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="no-scrollbar flex gap-2 overflow-x-auto p-4 sm:px-6">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`h-11 shrink-0 rounded-full border px-4 font-bold text-sm ${
              cat === c
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <main className="px-4 sm:px-6">
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-white border border-slate-200" />
            ))}
            <p className="text-sm text-slate-500">Memuatkan kedai...</p>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
            <Store className="mx-auto text-slate-400" />
            <p className="mt-2 font-bold text-slate-900">Tiada kedai dijumpai</p>
            <p className="text-sm text-slate-600">Cuba tukar kategori / carian.</p>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <Link
              key={s.id}
              to={`/s/${s.slug}`}
              className="rounded-xl border border-slate-200 bg-white p-4 min-h-[88px]"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-slate-900">{s.name}</h2>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-bold ${
                    s.is_active
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {s.is_active ? 'Open' : 'Closed'}
                </span>
              </div>
              <div className="mt-2 flex gap-2">
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                  {s.mahalla}
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                  {s.category}
                </span>
              </div>
            </Link>
          ))}
        </div>

      </main>
    </div>
  );
}
