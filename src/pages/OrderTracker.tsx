import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Order } from '../types';
import { normalizeOrderFields } from '../utils/orderSnapshot';

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
    case 'rejected':
      return -1;
    default:
      return 0;
  }
}

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
      return status === 'completed' || status === 'cancelled' || status === 'rejected';
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
      <div className="mx-auto w-full max-w-md sm:max-w-2xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-[1600px] min-h-screen bg-slate-50 p-4 sm:p-6">
        <p className="text-sm text-slate-500">Loading order status...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto w-full max-w-md sm:max-w-2xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-[1600px] min-h-screen bg-slate-50 p-4 sm:p-6">
        <Link to="/" className="inline-flex h-11 items-center text-sm font-bold text-slate-700">← Marketplace</Link>
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error ?? 'Order not found.'}
          {debugDetail && (
            <p className="mt-1 break-all font-mono text-xs">{debugDetail}</p>
          )}
        </div>
      </div>
    );
  }

  const step = statusToStep(order.status);
  const groups = normalizeOrderFields(order);

  return (
    <div className="mx-auto w-full max-w-md sm:max-w-2xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-[1600px] min-h-screen bg-slate-50 p-4 sm:p-6 pb-10">
      <Link to="/" className="inline-flex h-11 items-center text-sm font-bold text-slate-700">← Marketplace</Link>
      <h1 className="mt-2 text-xl sm:text-2xl font-bold text-slate-900">Track Order</h1>
      <p className="text-sm text-slate-600 break-all">ID: {order.id.slice(0, 8)}... | Ref: {order.payment_ref_id}</p>

      <div className="mt-4 grid gap-4 lg:grid-cols-2 lg:items-start">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="font-bold text-slate-900">RM {Number(order.total_amount).toFixed(2)}</p>
        <p className="text-sm text-slate-600">{order.buyer_name} — {order.location}</p>
        {(order.items?.length ?? 0) > 0 && (
          <div className="mt-2 border-t border-slate-200 pt-2">
            {(order.items ?? []).map((it, i) => (
              <p key={i} className="flex justify-between gap-2 text-sm text-slate-700">
                <span>{it.title} × {it.qty}</span>
                <span className="font-bold">RM {Number(it.lineTotal).toFixed(2)}</span>
              </p>
            ))}
          </div>
        )}
        {groups.map((g, gi) => (
          <div key={gi} className="mt-2 border-t border-slate-200 pt-2">
            {groups.length > 1 && (
              <p className="text-sm font-bold text-slate-900">
                {g.title} × {g.qty}
              </p>
            )}
            {g.entries.map((e, ei) => (
              <p key={ei} className="text-sm text-slate-700">
                <span className="font-bold">{e.label}:</span> {e.display}
                {e.price_applied > 0 && (
                  <span className="ml-1 text-xs font-bold text-emerald-700">
                    (+RM {e.price_applied.toFixed(2)})
                  </span>
                )}
              </p>
            ))}
          </div>
        ))}
        <span
          className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-bold ${
            order.status === 'completed'
              ? 'bg-emerald-100 text-emerald-700'
              : order.status === 'rejected' || order.status === 'cancelled'
                ? 'bg-red-100 text-red-700'
                : order.status === 'confirmed' || order.status === 'ready'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-amber-100 text-amber-700'
          }`}
        >
          {order.status.toUpperCase()}
        </span>
      </div>

      {order.status === 'rejected' || order.status === 'cancelled' ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {order.status === 'cancelled' ? 'Order cancelled.' : 'Order rejected by seller.'}{' '}
          {order.cancel_reason ? `Reason: ${order.cancel_reason}` : 'Please contact the seller on WhatsApp for info.'}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          {STEPS.map((s, i) => {
            const done = i <= step;
            const current = i === step;
            return (
              <div key={s} className="flex gap-3 pb-4 last:pb-0">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border font-bold ${
                    done ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-400 border-slate-200'
                  }`}
                >
                  {done ? <Check size={16} /> : <span className="text-sm">{i + 1}</span>}
                </div>
                <div>
                  <p className={`font-bold ${current ? 'text-slate-900' : done ? 'text-slate-700' : 'text-slate-400'}`}>
                    {s}
                  </p>
                  {current && <p className="text-xs text-slate-500">Current status</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-4 text-xs text-slate-500 lg:col-span-2">
        Status auto-refreshes every few seconds — no need to reload.
      </p>
      </div>
    </div>
  );
}
