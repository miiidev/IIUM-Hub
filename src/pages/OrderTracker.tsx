import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Order } from '../types';
import { normalizeOrderFields } from '../utils/orderSnapshot';
import SiteHeader from '../components/site/SiteHeader';
import SiteFooter from '../components/site/SiteFooter';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';

const STEPS = ['Order Placed', 'Payment Verified', 'Preparing', 'Ready'];

function statusToStep(status: Order['status']): number {
  switch (status) {
    case 'pending_verification':
      return 0;
    case 'confirmed':
      return 2;
    case 'ready':
    case 'completed':
      return 3;
    case 'cancelled':
      return -1;
    default:
      return 0;
  }
}

const wrapCls = 'mx-auto w-full max-w-3xl px-5 py-8 sm:px-8';

export default function OrderTracker() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugDetail, setDebugDetail] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError('Missing order ID.');
      setLoading(false);
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    function terminal(status: Order['status']): boolean {
      return status === 'completed' || status === 'cancelled';
    }

    async function fetchRow(): Promise<Order | null> {
      const debug =
        typeof window !== 'undefined' &&
        new URLSearchParams(window.location.search).get('debug') === '1';
      try {
        const { data, error: rpcErr } = await supabase.rpc('get_order', { p_id: orderId });
        if (!rpcErr) {
          const row = (data as Order[] | null)?.[0] ?? null;
          if (row) return row;
        } else if (debug) {
          setDebugDetail(`rpc get_order: ${rpcErr.code ?? '?'} ${rpcErr.message}`);
        }
      } catch (e: unknown) {
        if (debug) setDebugDetail(`rpc get_order threw: ${e instanceof Error ? e.message : e}`);
      }
      // Fallback for databases where 0011 hasn't run yet (anon SELECT still open).
      const { data: fbData, error: fbErr } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .maybeSingle();
      if (fbErr) throw fbErr;
      return (fbData as Order | null) ?? null;
    }

    async function fetchOrder(first = false) {
      if (document.hidden) return;
      if (first) setLoading(true);
      try {
        const row = await fetchRow();
        if (cancelled) return;
        if (!row) {
          setError('Order not found.');
          setOrder(null);
        } else {
          setError(null);
          setOrder(row);
          if (terminal(row.status) && timer) {
            clearInterval(timer);
            timer = null;
          }
        }
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load order.');
      } finally {
        if (!cancelled && first) setLoading(false);
      }
    }

    fetchOrder(true);
    timer = setInterval(() => fetchOrder(false), 5000);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <div className={wrapCls}>
          <p className="text-sm text-muted">Loading order status...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <div className={wrapCls}>
          <Link to="/marketplace" className="inline-flex h-11 items-center text-sm font-semibold text-emerald">
            ← Marketplace
          </Link>
          <div role="alert" className="mt-3 rounded-card border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error ?? 'Order not found.'}
            {debugDetail && <p className="mt-1 break-all font-mono text-xs">{debugDetail}</p>}
          </div>
        </div>
      </div>
    );
  }

  const step = statusToStep(order.status);
  const groups = normalizeOrderFields(order);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className={`${wrapCls} flex-1`}>
        <Link to="/" className="inline-flex h-11 items-center text-sm font-semibold text-emerald">
          ← Marketplace
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">Track Order</h1>
        <p className="break-all text-sm text-muted">
          ID: {order.id.slice(0, 8)}... · Ref: {order.payment_ref_id}
        </p>

        <div className="mt-6 grid gap-4 lg:grid-cols-2 lg:items-start animate-fade-in-up">
          <Card className="p-5">
            <p className="text-xl font-bold text-ink">RM {Number(order.total_amount).toFixed(2)}</p>
            <p className="text-sm text-muted">
              {order.buyer_name} — {order.location}
            </p>
            {(order.items?.length ?? 0) > 0 && (
              <div className="mt-2 border-t border-line pt-2">
                {(order.items ?? []).map((it, i) => (
                  <p key={i} className="flex justify-between gap-2 text-sm text-muted">
                    <span>
                      {it.title} × {it.qty}
                    </span>
                    <span className="font-semibold text-ink">RM {Number(it.lineTotal).toFixed(2)}</span>
                  </p>
                ))}
              </div>
            )}
            {groups.map((g, gi) => (
              <div key={gi} className="mt-2 border-t border-line pt-2">
                {groups.length > 1 && (
                  <p className="text-sm font-semibold text-ink">
                    {g.title} × {g.qty}
                  </p>
                )}
                {g.entries.map((e, ei) => (
                  <p key={ei} className="text-sm text-muted">
                    <span className="font-semibold text-ink">{e.label}:</span> {e.display}
                    {e.price_applied > 0 && (
                      <span className="ml-1 text-xs font-semibold text-emerald">
                        (+RM {e.price_applied.toFixed(2)})
                      </span>
                    )}
                  </p>
                ))}
              </div>
            ))}
            <span key={order.status} className="mt-3 inline-block animate-scale-in">
              <Badge
                tone={order.status === 'completed' ? 'mint' : 'muted'}
                className={
                  order.status === 'completed'
                    ? ''
                    : order.status === 'cancelled'
                      ? 'bg-red-100 text-red-700'
                      : order.status === 'confirmed' || order.status === 'ready'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-amber-100 text-amber-700'
                }
              >
                {order.status.toUpperCase()}
              </Badge>
            </span>
          </Card>

          {order.status === 'cancelled' ? (
            <div className="rounded-card border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              Order cancelled.{' '}
              {order.cancel_reason
                ? `Reason: ${order.cancel_reason}`
                : 'Please contact the seller on WhatsApp for info.'}
            </div>
          ) : (
            <Card className="p-5">
              {STEPS.map((s, i) => {
                const done = i <= step;
                const current = i === step;
                return (
                  <div key={s} className="flex gap-3 pb-4 last:pb-0">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full border font-bold ${
                        done ? 'border-emerald bg-emerald text-white' : 'border-line bg-white text-muted'
                      }`}
                    >
                      {done ? <Check size={16} aria-hidden="true" /> : <span className="text-sm">{i + 1}</span>}
                    </div>
                    <div>
                      <p className={`font-semibold ${current ? 'text-ink' : done ? 'text-ink/80' : 'text-muted'}`}>
                        {s}
                      </p>
                      {current && <p className="text-xs text-emerald">Current status</p>}
                    </div>
                  </div>
                );
              })}
            </Card>
          )}

          <p className="text-xs text-muted lg:col-span-2">
            Status auto-refreshes every few seconds — no need to reload.
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
