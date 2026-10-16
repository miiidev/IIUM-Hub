import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Minus, Plus, X } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { CustomField, OrderItemSummary, Shop } from '../types';
import { generateWhatsAppLink } from '../utils/whatsapp';
import { randomUuid } from '../utils/uuid';
import { validateRequired } from '../utils/formPresets';
import { snapshotValues } from '../utils/cart';

export interface ReviewLine {
  productId: string;
  item: OrderItemSummary;
  fields: CustomField[];
}

interface Props {
  shop: Shop;
  total: number;
  itemsSummary: OrderItemSummary[];
  shop_id: string;
  lines: ReviewLine[];
  onEdit: (productId: string, errors: Record<string, string>) => void;
  onRemove: (productId: string) => void;
  onQty: (productId: string, qty: number) => void;
  onClose: () => void;
}

const inputCls =
  'h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-900 outline-none focus:border-slate-900';

const STEPS = ['Review', 'Details', 'Pay'];

export default function CheckoutModal({
  shop,
  total,
  itemsSummary,
  shop_id,
  lines,
  onEdit,
  onRemove,
  onQty,
  onClose,
}: Props) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [buyerName, setBuyerName] = useState('');
  const [location, setLocation] = useState('');
  const [refId, setRefId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lineErrors, setLineErrors] = useState<Record<string, Record<string, string>>>({});

  useEffect(() => {
    const next: Record<string, Record<string, string>> = {};
    for (const line of lines) {
      const errs = validateRequired(line.fields, snapshotValues(line.item));
      if (Object.keys(errs).length > 0) next[line.productId] = errs;
    }
    setLineErrors(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const invalidLines = lines.filter((l) => lineErrors[l.productId] && Object.keys(lineErrors[l.productId]).length > 0);

  function handleToDetails() {
    setError(null);
    if (invalidLines.length > 0) {
      setError('Fix the highlighted lines before continuing.');
      return;
    }
    setStep(1);
  }

  function handleToPay() {
    setError(null);
    if (!buyerName.trim()) return setError('Buyer name is required.');
    if (!location.trim()) return setError('Mahalla / Room is required.');
    setStep(2);
  }

  async function handleSubmit() {
    setError(null);
    if (!isSupabaseConfigured) {
      return setError('App not configured. Missing Supabase settings — contact the seller.');
    }
    if (!/^\d{4,6}$/.test(refId.trim()))
      return setError('DuitNow Ref ID must be 4-6 digits.');

    if (!shop.whatsapp_number) {
      return setError("Seller has no WhatsApp number. Can't continue.");
    }

    setLoading(true);
    try {
      const orderId = randomUuid();
      const payload = {
        id: orderId,
        shop_id,
        buyer_name: buyerName.trim(),
        location: location.trim(),
        total_amount: total,
        payment_ref_id: refId.trim(),
        custom_data: {},
        items: itemsSummary,
        status: 'pending_verification' as const,
      };

      const { error: insErr } = await supabase.from('orders').insert(payload);

      if (insErr) {
        console.error('[checkout] insert error', {
          code: (insErr as { code?: string }).code,
          message: insErr.message,
          hint: (insErr as { hint?: string }).hint,
        });
        const code = (insErr as { code?: string }).code ?? '';
        if (code === '42501') {
          return setError('Order blocked by database permissions. Contact the seller.');
        }
        if (code === '23514') {
          return setError('Order rejected by the database. The app may need an update — contact the seller.');
        }
        if (code === '23505') {
          return setError('Please try again.');
        }
        throw insErr;
      }

      const link = generateWhatsAppLink(
        shop,
        {
          buyer_name: payload.buyer_name,
          location: payload.location,
          total_amount: payload.total_amount,
          payment_ref_id: payload.payment_ref_id,
          custom_data: payload.custom_data,
          items: itemsSummary,
          shop_id,
        },
        orderId
      );

      window.open(link, '_blank');
      onClose();
      navigate(`/order/${orderId}/track`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to create order. Try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div className="safe-bottom w-full max-w-md sm:max-w-lg rounded-t-2xl bg-white p-5 pb-8 sm:rounded-2xl sm:pb-5 max-h-[92dvh] overflow-y-auto">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Checkout</h2>
          <button
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <p className="mb-4 text-sm font-bold text-slate-600" aria-label={`Step ${step + 1} of 3: ${STEPS[step]}`}>
          {STEPS.map((s, i) => (
            <span key={s} className={i === step ? 'text-slate-900' : ''}>
              {i + 1} {s}
              {i < STEPS.length - 1 ? ' · ' : ''}
            </span>
          ))}
        </p>

        {step === 0 && (
          <div>
            {invalidLines.length > 0 && (
              <p role="alert" className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
                Some lines need attention before you continue.
              </p>
            )}
            <div className="space-y-3">
              {lines.map((line) => {
                const errs = lineErrors[line.productId] ?? {};
                const bad = Object.keys(errs).length > 0;
                return (
                  <div key={line.productId} className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="min-w-0 flex-1 truncate font-bold text-slate-900">{line.item.title}</p>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() => onQty(line.productId, line.item.qty - 1)}
                          className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 bg-white"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-6 text-center text-sm font-bold">{line.item.qty}</span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          onClick={() => onQty(line.productId, line.item.qty + 1)}
                          className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                    {(line.item.fields ?? []).map((f) => (
                      <p key={f.field_id} className="mt-1 text-sm text-slate-700">
                        {f.label}: {f.display}
                        {Number(f.price_applied) > 0 && (
                          <span className="font-bold"> (+RM {Number(f.price_applied).toFixed(2)})</span>
                        )}
                      </p>
                    ))}
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-slate-900">
                        RM {Number(line.item.lineTotal).toFixed(2)}
                      </p>
                      <div className="flex gap-2">
                        {bad && (
                          <button
                            type="button"
                            onClick={() => onEdit(line.productId, errs)}
                            className="h-11 rounded-xl bg-red-600 px-4 text-sm font-bold text-white"
                          >
                            Fix
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onEdit(line.productId, {})}
                          className="h-11 rounded-xl border border-slate-300 px-4 text-sm font-bold text-slate-800"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemove(line.productId)}
                          className="h-11 rounded-xl border border-slate-300 px-4 text-sm font-bold text-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-right text-lg font-bold text-slate-900">
              Total: RM {total.toFixed(2)}
            </p>
            <button
              onClick={handleToDetails}
              className="mt-4 h-12 w-full rounded-xl bg-emerald-600 font-bold text-white"
            >
              Continue
            </button>
          </div>
        )}

        {step === 1 && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-bold text-slate-900">
                  Buyer Name *
                </label>
                <input
                  className={inputCls}
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="e.g. Ahmad Ali"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-bold text-slate-900">
                  Mahalla / Room *
                </label>
                <input
                  className={inputCls}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Mahalla Faruq, C2-3-12"
                />
              </div>
            </div>

            {error && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setStep(0)}
                className="h-12 rounded-xl border border-slate-300 px-6 font-bold text-slate-700"
              >
                ← Back
              </button>
              <button
                onClick={handleToPay}
                className="h-12 flex-1 rounded-xl bg-emerald-600 font-bold text-white"
              >
                Continue to Pay
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
              {shop.duitnow_qr_url ? (
                <img
                  src={shop.duitnow_qr_url}
                  alt="DuitNow QR seller"
                  className="mx-auto h-40 w-40 rounded-xl border border-slate-200 bg-white object-contain"
                />
              ) : (
                <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-xl bg-white text-sm font-bold text-slate-400 border border-slate-200">
                  QR PLACEHOLDER
                </div>
              )}
              {shop.duitnow_account && (
                <p className="mt-2 font-mono text-sm font-bold text-slate-900">{shop.duitnow_account}</p>
              )}
              <p className="mt-2 text-sm font-bold text-slate-900">
                Total: RM {total.toFixed(2)}
              </p>
              <p className="text-xs text-slate-600">
                Scan the seller's DuitNow QR, then enter the Ref ID below.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold text-slate-900">
                DuitNow Ref ID (last 4-6 digits) *
              </label>
              <input
                className={inputCls}
                value={refId}
                onChange={(e) => setRefId(e.target.value)}
                placeholder="e.g. 9412"
                inputMode="numeric"
                maxLength={6}
              />
            </div>

            {error && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="h-12 rounded-xl border border-slate-300 px-6 font-bold text-slate-700"
              >
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="h-12 flex-1 rounded-xl bg-emerald-600 font-bold text-white disabled:opacity-60"
              >
                {loading ? 'Sending...' : 'Send Order via WhatsApp'}
              </button>
            </div>
            <p className="mt-2 text-center text-xs text-slate-500">
              Order is saved, then WhatsApp opens in a new tab.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
