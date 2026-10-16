import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Order, Shop } from '../types';

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
        setError('Order ID tiada.');
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
        setError(e instanceof Error ? e.message : 'Gagal muat order.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [orderId]);

  async function updateStatus(status: 'confirmed' | 'rejected' | 'completed') {
    if (!orderId || !order) return;
    setUpdating(true);
    setError(null);
    const prev = order.status;
    setOrder({ ...order, status });
    try {
      const { error: err } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);
      if (err) throw err;
    } catch (e: unknown) {
      setOrder({ ...order, status: prev });
      setError(e instanceof Error ? e.message : 'Gagal update status.');
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-md sm:max-w-2xl lg:max-w-4xl min-h-screen bg-slate-50 p-4 sm:p-6">
        <p className="text-sm text-slate-500">Memuatkan order seller...</p>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="mx-auto w-full max-w-md sm:max-w-2xl lg:max-w-4xl min-h-screen bg-slate-50 p-4 sm:p-6">
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
      <div className="mx-auto w-full max-w-md sm:max-w-2xl min-h-screen bg-slate-50 p-4 sm:p-6">
        <Link to="/seller" className="inline-flex h-11 items-center text-sm font-bold text-slate-700">
          ← Dashboard
        </Link>
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          403 — Order ini bukan dari kedai anda.
        </div>
      </div>
    );
  }

  const refLast = order.payment_ref_id.slice(-4);

  return (
    <div className="mx-auto w-full max-w-md sm:max-w-2xl lg:max-w-4xl min-h-screen bg-slate-50 p-4 sm:p-6 pb-10">
      <Link to="/seller" className="inline-flex h-11 items-center text-sm font-bold text-slate-700">
        ← Dashboard
      </Link>
      <h1 className="mt-1 text-xl sm:text-2xl font-bold text-slate-900">Seller Control</h1>
      <p className="text-sm text-slate-600 break-all">{shop?.name ?? 'Kedai'} — {order.id.slice(0, 8)}...</p>

      <div className="mt-4 grid gap-4 lg:grid-cols-2 lg:items-start">
      <div className="rounded-xl border-2 border-slate-900 bg-white p-4">
        <p className="text-sm font-bold text-slate-500">DUITNOW REF ID — CROSS-CHECK 2 SAAT</p>
        <p className="font-mono text-3xl sm:text-4xl font-bold tracking-widest text-slate-900 break-all">
          ...{refLast}
        </p>
        <p className="text-sm text-slate-600">Full: {order.payment_ref_id}</p>
        <p className="mt-2 text-lg font-bold text-slate-900">
          RM {Number(order.total_amount).toFixed(2)}
        </p>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
        <p className="font-bold text-slate-900">{order.buyer_name}</p>
        <p className="text-sm text-slate-600">{order.location}</p>
        {Object.keys(order.custom_data || {}).length > 0 && (
          <div className="mt-2 border-t border-slate-200 pt-2">
            {Object.entries(order.custom_data).map(([k, v]) => (
              <p key={k} className="text-sm text-slate-700">
                <span className="font-bold">{k}:</span> {String(v)}
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

      {order.status === 'pending' && (
        <div className="mt-4 lg:mt-0 lg:col-span-2 grid gap-3 sm:grid-cols-2">
          <button
            onClick={() => updateStatus('confirmed')}
            disabled={updating}
            className="h-14 w-full rounded-xl bg-emerald-600 text-lg font-bold text-white disabled:opacity-60"
          >
            🟢 Confirm & Start Prep
          </button>
          <button
            onClick={() => updateStatus('rejected')}
            disabled={updating}
            className="h-14 w-full rounded-xl bg-red-600 text-lg font-bold text-white disabled:opacity-60"
          >
            🔴 Reject Order
          </button>
        </div>
      )}

      {order.status === 'confirmed' && (
        <button
          onClick={() => updateStatus('completed')}
          disabled={updating}
          className="mt-4 lg:col-span-2 h-14 w-full rounded-xl bg-slate-900 text-lg font-bold text-white disabled:opacity-60"
        >
          Mark Completed / Ready
        </button>
      )}

      {(order.status === 'completed' || order.status === 'rejected') && (
        <div className="mt-4 lg:col-span-2 rounded-xl border border-slate-200 bg-white p-4 text-center text-sm font-bold text-slate-700">
          Order {order.status}. Tiada tindakan lanjut.
        </div>
      )}
      </div>
    </div>
  );
}
