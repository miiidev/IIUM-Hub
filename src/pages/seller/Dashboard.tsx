import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { Order, OrderStatus } from '../../types';
import SellerNav from '../../components/seller/SellerNav';
import Card from '../../components/ui/Card';
import Chip from '../../components/ui/Chip';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';

const FILTERS: Array<'all' | OrderStatus> = ['all', 'pending_verification', 'confirmed', 'ready', 'completed', 'cancelled'];

function refLast(ref: string): string {
  return ref.length <= 4 ? ref : ref.slice(-4);
}

function statusLabel(status: OrderStatus): string {
  return status.replace(/_/g, ' ');
}

export default function Dashboard() {
  const { shop } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | OrderStatus>('pending_verification');

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
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load orders.');
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
      if (o.status === 'pending_verification') pending++;
      if (o.status === 'completed') completed++;
      if (!o.created_at || new Date(o.created_at).toDateString() === today) {
        if (o.status !== 'cancelled') todayRM += Number(o.total_amount) || 0;
      }
    }
    return { pending, completed, todayRM, total: orders.length };
  }, [orders]);

  const visible = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="flex min-h-screen flex-col pb-10">
      <SellerNav />

      <main className="mx-auto w-full max-w-[1312px] flex-1 px-5 py-6 sm:px-8">
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <Card className="p-3 text-center sm:p-5">
            <p className="text-2xl font-bold text-amber-600 sm:text-3xl">{stats.pending}</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Pending</p>
          </Card>
          <Card className="p-3 text-center sm:p-5">
            <p className="text-2xl font-bold text-ink sm:text-3xl">RM {stats.todayRM.toFixed(0)}</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Today</p>
          </Card>
          <Card className="p-3 text-center sm:p-5">
            <p className="text-2xl font-bold text-emerald sm:text-3xl">{stats.completed}</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Done</p>
          </Card>
        </div>

        <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
              {f === 'all' ? `All (${orders.length})` : statusLabel(f)}
            </Chip>
          ))}
        </div>

        {loading && (
          <div className="mt-4 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-24 rounded-card" />
            ))}
          </div>
        )}
        {error && (
          <div role="alert" className="mt-4 rounded-card border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}
        {!loading && !error && visible.length === 0 && (
          <EmptyState
            title={`No orders${filter !== 'all' ? ` (${statusLabel(filter)})` : ''}`}
            description="New buyer orders appear here live."
            className="mt-4"
          />
        )}

        <div className="mt-4 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {visible.map((o) => (
            <Link
              key={o.id}
              to={`/seller/orders/${o.id}`}
              className="rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
            >
              <Card className="p-4 transition-shadow hover:shadow-button">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-semibold text-ink">{o.buyer_name}</p>
                  <Badge tone={o.status === 'pending_verification' ? 'muted' : 'mint'}>
                    {statusLabel(o.status)}
                  </Badge>
                </div>
                <p className="truncate text-sm text-muted">{o.location}</p>
                <div className="mt-1 flex items-center justify-between">
                  <p className="font-bold text-ink">RM {Number(o.total_amount).toFixed(2)}</p>
                  <p className="font-mono text-sm text-muted">…{refLast(o.payment_ref_id)}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
