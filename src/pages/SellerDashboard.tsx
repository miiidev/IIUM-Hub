import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { CustomValue, Order, Shop } from '../types';
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

export default function SellerDashboard() {
  const { orderId } = useParams<{ orderId: string }>();
  const { shop: myShop } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function load() {
      if (!orderId) {
        setError('Missing order ID.');
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const { data, error: err } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();
        if (err) throw err;
        const o = data as Order;
        setOrder(o);

        const { data: sData } = await supabase
          .from('shops')
          .select('*')
          .eq('id', o.shop_id)
          .single();
        if (sData) setShop(sData as Shop);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load order.');
      } finally {
        setLoading(false);
      }
    }
    load();

    if (!orderId) return;
    const channel = supabase
      .channel(`seller-order-${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload) => setOrder(payload.new as Order)
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  async function updateStatus(
    status: 'confirmed' | 'ready' | 'completed' | 'rejected' | 'cancelled',
    cancelReason?: string
  ) {
    if (!orderId || !order) return;
    setUpdating(true);
    setError(null);
    const prev = order.status;
    setOrder({ ...order, status, cancel_reason: cancelReason ?? order.cancel_reason });
    try {
      const { error: err } = await supabase
        .from('orders')
        .update(cancelReason !== undefined ? { status, cancel_reason: cancelReason } : { status })
        .eq('id', orderId);
      if (err) throw err;
    } catch (e: unknown) {
      setOrder({ ...order, status: prev });
      setError(e instanceof Error ? e.message : 'Failed to update status.');
    } finally {
      setUpdating(false);
    }
  }

  function handleCancel() {
    const reason = window.prompt('Reason for cancelling this order?');
    if (reason === null) return;
    updateStatus('cancelled', reason.trim());
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-md sm:max-w-2xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-[1600px] min-h-screen bg-slate-50 p-4 sm:p-6">
        <p className="text-sm text-slate-500">Loading seller order...</p>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="mx-auto w-full max-w-md sm:max-w-2xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-[1600px] min-h-screen bg-slate-50 p-4 sm:p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!order) return null;

  // Ownership check: sellers can only manage their own shop's orders.
  if (myShop && order.shop_id !== myShop.id) {
    return (
      <div className="mx-auto w-full max-w-md sm:max-w-2xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-[1600px] min-h-screen bg-slate-50 p-4 sm:p-6">
        <Link to="/seller" className="inline-flex h-11 items-center text-sm font-bold text-slate-700">
          ← Dashboard
        </Link>
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          403 — This order is not from your shop.
        </div>
      </div>
    );
  }

  const refLast = order.payment_ref_id.slice(-4);

  return (
    <div className="mx-auto w-full max-w-md sm:max-w-2xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-[1600px] min-h-screen bg-slate-50 p-4 sm:p-6 pb-10">
      <Link to="/seller" className="inline-flex h-11 items-center text-sm font-bold text-slate-700">
        ← Dashboard
      </Link>
      <h1 className="mt-1 text-xl sm:text-2xl font-bold text-slate-900">Seller Control</h1>
      <p className="text-sm text-slate-600 break-all">{shop?.name ?? 'Shop'} — {order.id.slice(0, 8)}...</p>

      <div className="mt-4 grid gap-4 lg:grid-cols-2 lg:items-start">
      <div className="rounded-xl border-2 border-slate-900 bg-white p-4">
        <p className="text-sm font-bold text-slate-500">DUITNOW REF ID — 2-SECOND CROSS-CHECK</p>
        <p className="font-mono text-3xl sm:text-4xl font-bold tracking-widest text-slate-900 break-all">
          ...{refLast}
        </p>
        <p className="text-sm text-slate-600">Full: {order.payment_ref_id}</p>
        <p className="mt-2 text-lg font-bold text-slate-900">
          RM {Number(order.total_amount).toFixed(2)}
        </p>
      </div>

      <div className="mt-4 lg:mt-0 rounded-xl border border-slate-200 bg-white p-4">
        <p className="font-bold text-slate-900">{order.buyer_name}</p>
        <p className="text-sm text-slate-600">{order.location}</p>
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
        <span className="mt-2 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">
          {order.status.toUpperCase()}
        </span>
      </div>

      {error && (
        <div className="mt-3 lg:col-span-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {order.status === 'pending_verification' && (
        <div className="mt-4 lg:mt-0 lg:col-span-2 grid gap-3 sm:grid-cols-2">
          <button
            onClick={() => updateStatus('confirmed')}
            disabled={updating}
            className="h-14 w-full rounded-xl bg-emerald-600 text-lg font-bold text-white disabled:opacity-60"
          >
            Verify Payment
          </button>
          <button
            onClick={() => updateStatus('rejected')}
            disabled={updating}
            className="h-14 w-full rounded-xl bg-red-600 text-lg font-bold text-white disabled:opacity-60"
          >
            Reject Order
          </button>
        </div>
      )}

      {order.status === 'confirmed' && (
        <button
          onClick={() => updateStatus('ready')}
          disabled={updating}
          className="mt-4 lg:col-span-2 h-14 w-full rounded-xl bg-slate-900 text-lg font-bold text-white disabled:opacity-60"
        >
          Mark Ready
        </button>
      )}

      {order.status === 'ready' && (
        <button
          onClick={() => updateStatus('completed')}
          disabled={updating}
          className="mt-4 lg:col-span-2 h-14 w-full rounded-xl bg-slate-900 text-lg font-bold text-white disabled:opacity-60"
        >
          Mark Completed
        </button>
      )}

      {!['completed', 'rejected', 'cancelled'].includes(order.status) && (
        <button
          onClick={handleCancel}
          disabled={updating}
          className="mt-3 lg:col-span-2 h-11 w-full rounded-xl border border-slate-300 text-sm font-bold text-slate-600 disabled:opacity-60"
        >
          Cancel order
        </button>
      )}

      {order.status === 'cancelled' && order.cancel_reason && (
        <div className="mt-4 lg:col-span-2 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
          <span className="font-bold">Cancel reason:</span> {order.cancel_reason}
        </div>
      )}

      {(order.status === 'completed' || order.status === 'rejected') && (
        <div className="mt-4 lg:col-span-2 rounded-xl border border-slate-200 bg-white p-4 text-center text-sm font-bold text-slate-700">
          Order {order.status}. No further action.
        </div>
      )}
      </div>
    </div>
  );
}
