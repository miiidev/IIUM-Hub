import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import BottomSheet from '../components/BottomSheet';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import type { Order, Shop } from '../types';
import { normalizeOrderFields, orderTotalCheck, type NormalizedEntry } from '../utils/orderSnapshot';
import { isFilePath, isLegacyFileUrl, signBuyerFile, storagePathFromValue } from '../utils/uploadFile';

function SellerFileLink({ path, name }: { path: string; name: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function sign() {
      setSigning(true);
      setFailed(false);
      try {
        const signed = await signBuyerFile(path);
        if (!cancelled) setUrl(signed);
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setSigning(false);
      }
    }
    sign();
    return () => {
      cancelled = true;
    };
  }, [path]);

  if (url) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="font-semibold text-emerald underline">
        View file ({name})
      </a>
    );
  }
  return (
    <span>
      <span className="font-semibold">{name}</span>{' '}
      <button
        type="button"
        disabled={signing}
        onClick={async () => {
          setSigning(true);
          setFailed(false);
          try {
            setUrl(await signBuyerFile(path));
          } catch {
            setFailed(true);
          } finally {
            setSigning(false);
          }
        }}
        className="h-11 px-2 text-xs font-semibold text-emerald underline disabled:opacity-50"
      >
        {signing ? 'Preparing link…' : failed ? 'Link expired — Retry' : 'Get link'}
      </button>
    </span>
  );
}

function renderEntry(entry: NormalizedEntry) {
  const raw = Array.isArray(entry.value) ? '' : String(entry.value);
  const legacyPath = !isFilePath(entry.value) ? storagePathFromValue(entry.value) : null;
  const body = entry.isFile ? (
    isFilePath(entry.value) ? (
      <SellerFileLink path={raw} name={entry.display} />
    ) : legacyPath ? (
      <SellerFileLink path={legacyPath} name={entry.display} />
    ) : isLegacyFileUrl(entry.value) ? (
      <span>
        {entry.display}{' '}
        <span className="text-xs font-medium text-muted">(file unavailable)</span>
      </span>
    ) : (
      entry.display
    )
  ) : (
    entry.display
  );
  return (
    <span>
      <span className="font-semibold text-ink">{entry.label}:</span> {body}
      {entry.price_applied > 0 && (
        <span className="ml-1 text-xs font-semibold text-emerald">
          (+RM {entry.price_applied.toFixed(2)})
        </span>
      )}
    </span>
  );
}

export default function SellerDashboard() {
  const { orderId } = useParams<{ orderId: string }>();
  const { shop: myShop } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

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
    status: 'confirmed' | 'ready' | 'completed' | 'cancelled',
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
    setCancelReason('');
    setShowCancel(true);
  }

  const CANCEL_REASONS = [
    'Payment not received',
    'Out of stock',
    "Can't fulfill",
    'Buyer requested',
  ];

  async function confirmCancel() {
    const reason = cancelReason.trim();
    if (!reason) return;
    await updateStatus('cancelled', reason);
    setShowCancel(false);
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-3xl min-h-screen px-5 py-6 sm:px-8">
        <p className="text-sm text-muted">Loading seller order...</p>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="mx-auto w-full max-w-3xl min-h-screen px-5 py-6 sm:px-8">
        <div role="alert" className="rounded-card border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!order) return null;

  const groups = normalizeOrderFields(order);
  const totalCheck = orderTotalCheck(order);

  // Ownership check: sellers can only manage their own shop's orders.
  if (myShop && order.shop_id !== myShop.id) {
    return (
      <div className="mx-auto w-full max-w-3xl min-h-screen px-5 py-6 sm:px-8">
        <Link to="/seller" className="inline-flex h-11 items-center text-sm font-semibold text-emerald">
          ← Dashboard
        </Link>
        <div role="alert" className="mt-3 rounded-card border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          403 — This order is not from your shop.
        </div>
      </div>
    );
  }

  const refLast = order.payment_ref_id.slice(-4);

  return (
    <div className="mx-auto w-full max-w-3xl min-h-screen px-5 py-6 sm:px-8">
      <Link to="/seller" className="inline-flex h-11 items-center text-sm font-semibold text-emerald">
        ← Dashboard
      </Link>
      <h1 className="mt-1 text-2xl font-bold text-ink sm:text-3xl">Seller Control</h1>
      <p className="break-all text-sm text-muted">
        {shop?.name ?? 'Shop'} — {order.id.slice(0, 8)}...
      </p>

      <div className="mt-5 grid gap-4 lg:grid-cols-2 lg:items-start animate-fade-in-up">
        <Card className="border-2 border-emerald p-5">
          <p className="text-sm font-semibold text-muted">DUITNOW REF ID — 2-SECOND CROSS-CHECK</p>
          <p className="break-all font-mono text-3xl font-bold tracking-widest text-ink sm:text-4xl">
            ...{refLast}
          </p>
          <p className="text-sm text-muted">Full: {order.payment_ref_id}</p>
          <p className="mt-2 text-lg font-bold text-ink">
            RM {Number(order.total_amount).toFixed(2)}
          </p>
          {!totalCheck.ok && !totalCheck.unknown && (
            <p role="alert" className="mt-2 inline-block rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
              Items add up to RM {totalCheck.expected.toFixed(2)} but the order total is RM{' '}
              {totalCheck.actual.toFixed(2)}
            </p>
          )}
        </Card>

        <Card className="mt-0 p-5">
          <p className="font-semibold text-ink">{order.buyer_name}</p>
          <p className="text-sm text-muted">{order.location}</p>
          {(order.items?.length ?? 0) > 0 && (
            <div className="mt-2 border-t border-line pt-2">
              {(order.items ?? []).map((it, i) => (
                <p key={i} className="flex justify-between gap-2 text-sm text-muted">
                  <span>{it.title} × {it.qty}</span>
                  <span className="font-semibold text-ink">RM {Number(it.lineTotal).toFixed(2)}</span>
                </p>
              ))}
            </div>
          )}
          {groups.map((g, gi) => (
            <div key={gi} className="mt-2 border-t border-line pt-2">
              {groups.length > 1 && (
                <p className="text-sm font-semibold text-ink">
                  {g.title} × {g.qty} — RM {g.lineTotal.toFixed(2)}
                </p>
              )}
              {g.entries.map((e, ei) => (
                <p key={ei} className="text-sm text-muted">
                  {renderEntry(e)}
                </p>
              ))}
              {g.mismatch && (
                <p role="alert" className="mt-1 inline-block rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                  Total doesn't match the form breakdown
                </p>
              )}
            </div>
          ))}
          <span className="mt-3 inline-block">
            <Badge tone="muted">{order.status.replace(/_/g, ' ')}</Badge>
          </span>
        </Card>

        {error && (
          <div role="alert" className="mt-0 rounded-card border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700 lg:col-span-2">
            {error}
          </div>
        )}

        {order.status === 'pending_verification' && (
          <div className="mt-0 grid gap-3 sm:grid-cols-2 lg:col-span-2">
            <Button
              size="md"
              onClick={() => updateStatus('confirmed')}
              disabled={updating}
              className="h-14 text-lg"
            >
              Verify Payment
            </Button>
            <Button
              size="md"
              variant="danger"
              onClick={handleCancel}
              disabled={updating}
              className="h-14 text-lg"
            >
              Cancel Order
            </Button>
          </div>
        )}

        {order.status === 'confirmed' && (
          <Button
            onClick={() => updateStatus('ready')}
            disabled={updating}
            className="mt-0 h-14 text-lg lg:col-span-2"
          >
            Mark Ready
          </Button>
        )}

        {order.status === 'ready' && (
          <Button
            onClick={() => updateStatus('completed')}
            disabled={updating}
            className="mt-0 h-14 text-lg lg:col-span-2"
          >
            Mark Completed
          </Button>
        )}

        {!['completed', 'cancelled'].includes(order.status) && order.status !== 'pending_verification' && (
          <Button
            variant="ghost"
            onClick={handleCancel}
            disabled={updating}
            className="mt-0 lg:col-span-2"
          >
            Cancel order
          </Button>
        )}

        {order.status === 'cancelled' && order.cancel_reason && (
          <Card className="mt-0 p-4 text-sm text-muted lg:col-span-2">
            <span className="font-semibold text-ink">Cancel reason:</span> {order.cancel_reason}
          </Card>
        )}

        {order.status === 'completed' && (
          <Card className="mt-0 p-4 text-center text-sm font-semibold text-ink lg:col-span-2">
            Order completed. No further action.
          </Card>
        )}
      </div>

      <BottomSheet
        open={showCancel}
        onClose={() => setShowCancel(false)}
        title="Cancel order"
        busy={updating}
        footer={
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowCancel(false)}
              disabled={updating}
            >
              Keep order
            </Button>
            <Button
              variant="danger"
              onClick={confirmCancel}
              disabled={updating || !cancelReason.trim()}
              className="flex-1"
            >
              {updating ? 'Cancelling…' : 'Cancel order'}
            </Button>
          </div>
        }
      >
        <p className="text-sm font-semibold text-ink">Why are you cancelling?</p>
        <p className="mt-1 text-xs text-muted">The buyer sees this reason on their tracker.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {CANCEL_REASONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setCancelReason((prev) => (prev === r ? '' : r))}
              className={`h-11 rounded-full border px-4 text-sm font-semibold transition-colors ${
                cancelReason === r
                  ? 'border-emerald bg-emerald text-white'
                  : 'border-line bg-white text-ink hover:bg-mint/30'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <label className="mt-3 block">
          <span className="text-xs font-semibold text-muted">Or type your own</span>
          <input
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="e.g. Ingredient ran out"
            className="mt-1 h-12 w-full rounded-control border border-line bg-white px-4 text-sm text-ink outline-none transition-colors placeholder:text-placeholder focus:border-emerald focus:ring-2 focus:ring-emerald/25"
          />
        </label>
      </BottomSheet>
    </div>
  );
}
