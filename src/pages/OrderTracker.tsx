import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { CustomValue, Order } from '../types';
import { displayFileName } from '../utils/uploadFile';

function renderValue(v: CustomValue) {
  if (Array.isArray(v)) return v.join(', ');
  const s = String(v);
  if (/^https?:\/\//.test(s)) {
    return (
      <a href={s} target="_blank" rel="noreferrer" className="font-bold text-emerald-700 underline">
        View file ({displayFileName(s)})
      </a>
    );
  }
  return s;
}

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
  const [live, setLive] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setError('Missing order ID.');
      setLoading(false);
      return;
    }
    async function fetchOrder() {
      setLoading(true);
      try {
        const { data, error: err } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();
        if (err) throw err;
        setOrder(data as Order);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load order.');
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();

    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload) => {
          setOrder(payload.new as Order);
        }
      )
      .subscribe((status) => {
        setLive(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
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
        </div>
      </div>
    );
  }

  const step = statusToStep(order.status);

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
        {Object.keys(order.custom_data || {}).length > 0 && (
          <div className="mt-2 border-t border-slate-200 pt-2">
            {Object.entries(order.custom_data).map(([k, v]) => (
              <p key={k} className="text-sm text-slate-700">
                <span className="font-bold">{k}:</span> {renderValue(v)}
              </p>
            ))}
          </div>
        )}
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
        {live ? 'LIVE - status updates automatically, no refresh needed.' : 'Connecting to live status... (refresh if nothing updates)'}
      </p>
      </div>
    </div>
  );
}
