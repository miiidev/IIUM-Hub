import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { Order, OrderStatus } from '../../types';
import SellerNav from '../../components/seller/SellerNav';

const FILTERS: Array<'all' | OrderStatus> = ['all', 'pending', 'confirmed', 'completed', 'rejected'];

function refLast(ref: string): string {
  return ref.length <= 4 ? ref : ref.slice(-4);
}

export default function Dashboard() {
  const { shop } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | OrderStatus>('pending');

  useEffect(() => {
    if (!shop) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data, error: err } = await supabase
          .from('orders')
          .select('*')
          .eq('shop_id', shop!.id)
          .order('created_at', { ascending: false })
          .limit(100);
        if (err) throw err;
        if (!cancelled) setOrders((data as Order[]) ?? []);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Gagal muat orders.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();

    // Live updates for this shop's orders
    const channel = supabase
      .channel(`shop-orders-${shop.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `shop_id=eq.${shop.id}` },
        () => load()
      )
      .subscribe();

    // Polling fallback (demo wifi / realtime blocked)
    const timer = setInterval(load, 15000);
    return () => {
      cancelled = true;
      clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, [shop?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    let pending = 0;
    let completed = 0;
    let todayRM = 0;
    for (const o of orders) {
      if (o.status === 'pending') pending++;
      if (o.status === 'completed') completed++;
      if (!o.created_at || new Date(o.created_at).toDateString() === today) {
        if (o.status !== 'rejected') todayRM += Number(o.total_amount) || 0;
      }
    }
    return { pending, completed, todayRM, total: orders.length };
  }, [orders]);

  const visible = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="mx-auto w-full max-w-md sm:max-w-2xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-[1600px] min-h-screen bg-slate-50 pb-10">
      <SellerNav />

      <main className="p-4 sm:p-6">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4 text-center">
            <p className="text-2xl sm:text-3xl font-bold text-amber-600">{stats.pending}</p>
            <p className="text-xs font-bold text-slate-600">PENDING</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4 text-center">
            <p className="text-2xl sm:text-3xl font-bold text-slate-900">RM {stats.todayRM.toFixed(0)}</p>
            <p className="text-xs font-bold text-slate-600">HARI INI</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4 text-center">
            <p className="text-2xl sm:text-3xl font-bold text-emerald-600">{stats.completed}</p>
            <p className="text-xs font-bold text-slate-600">SIAP</p>
          </div>
        </div>

        <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`h-11 shrink-0 rounded-full border px-4 text-sm font-bold ${
                filter === f
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              {f === 'all' ? `Semua (${orders.length})` : f}
            </button>
          ))}
        </div>

        {loading && (
          <div className="mt-3 space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-white border border-slate-200" />
            ))}
          </div>
        )}
        {error && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}
        {!loading && !error && visible.length === 0 && (
          <div className="mt-3 rounded-xl border border-slate-200 bg-white p-6 text-center">
            <p className="font-bold text-slate-900">Tiada order {filter !== 'all' ? `(${filter})` : ''}</p>
            <p className="text-sm text-slate-600">Order baru dari buyer akan muncul di sini live.</p>
          </div>
        )}

        <div className="mt-3 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {visible.map((o) => (
            <Link
              key={o.id}
              to={`/seller/orders/${o.id}`}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold text-slate-900 truncate">{o.buyer_name}</p>
                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs font-bold">
                  {o.status.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-slate-600 truncate">{o.location}</p>
              <div className="mt-1 flex items-center justify-between">
                <p className="font-bold text-slate-900">RM {Number(o.total_amount).toFixed(2)}</p>
                <p className="font-mono text-sm font-bold text-slate-500">...{refLast(o.payment_ref_id)}</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
