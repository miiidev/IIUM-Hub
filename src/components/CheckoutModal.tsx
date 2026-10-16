import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Minus, Plus, X } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { CustomField, OrderItemSummary, Shop } from '../types';
import { generateWhatsAppLink } from '../utils/whatsapp';
import { randomUuid } from '../utils/uuid';
import { validateRequired } from '../utils/formPresets';
import { snapshotValues } from '../utils/cart';
import Button from './ui/Button';

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
  'h-12 w-full rounded-control border border-line bg-white px-4 text-ink outline-none transition-colors placeholder:text-placeholder focus:border-emerald focus:ring-2 focus:ring-emerald/25';

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
  const [waLink, setWaLink] = useState<string | null>(null);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
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

    // Open the tab synchronously inside the click gesture — browsers block
    // window.open() called after an await. Navigate it once the order saves.
    const waWin = window.open('', '_blank');

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

      if (waWin && !waWin.closed) {
        waWin.location.href = link;
        onClose();
        navigate(`/order/${orderId}/track`);
      } else {
        // Popup was blocked: keep the order (it saved fine) and let the buyer
        // open WhatsApp with a real tap instead.
        if (waWin) waWin.close();
        setPlacedOrderId(orderId);
        setWaLink(link);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to create order. Try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 animate-fade-in sm:items-center sm:p-4">
      <div className="safe-bottom max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-card bg-white p-5 pb-8 animate-fade-in-up sm:max-w-lg sm:rounded-card sm:pb-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">Checkout</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-control border border-line text-ink transition-colors hover:bg-mint/30"
            aria-label="Close"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <ol
          className="mb-4 flex items-center gap-2 text-sm font-semibold"
          aria-label={`Step ${step + 1} of 3: ${STEPS[step]}`}
        >
          {STEPS.map((s, i) => (
            <li key={s} className="flex items-center gap-2">
              <span
                aria-current={i === step ? 'step' : undefined}
                className={[
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
                  i <= step ? 'bg-emerald text-white' : 'bg-cream text-muted',
                ].join(' ')}
              >
                {i + 1}
              </span>
              <span className={i === step ? 'text-ink' : 'text-muted'}>{s}</span>
              {i < STEPS.length - 1 && <span aria-hidden="true" className="text-muted">›</span>}
            </li>
          ))}
        </ol>

        {waLink && placedOrderId && (
          <div className="mb-4 rounded-control border border-emerald/30 bg-mint/40 p-4 text-center animate-fade-in-up">
            <p className="font-bold text-ink">Order saved!</p>
            <p className="mt-1 text-sm text-muted">
              Your browser blocked the automatic tab. Tap below to open WhatsApp:
            </p>
            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              className="mt-3 flex h-12 items-center justify-center rounded-control bg-emerald font-semibold text-white transition-colors hover:bg-emerald/90"
            >
              Open WhatsApp
            </a>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onClose();
                navigate(`/order/${placedOrderId}/track`);
              }}
              className="mt-2 w-full"
            >
              View order status
            </Button>
          </div>
        )}

        {step === 0 && (
          <div>
            {invalidLines.length > 0 && (
              <p role="alert" className="mb-3 rounded-control border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                Some lines need attention before you continue.
              </p>
            )}
            <div className="space-y-3">
              {lines.map((line) => {
                const errs = lineErrors[line.productId] ?? {};
                const bad = Object.keys(errs).length > 0;
                return (
                  <div key={line.productId} className="rounded-control border border-line bg-white p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="min-w-0 flex-1 truncate font-semibold text-ink">{line.item.title}</p>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() => onQty(line.productId, line.item.qty - 1)}
                          className="flex h-11 w-11 items-center justify-center rounded-control border border-line bg-white text-ink transition-colors hover:bg-mint/30"
                        >
                          <Minus size={16} aria-hidden="true" />
                        </button>
                        <span key={line.item.qty} className="w-6 text-center text-sm font-semibold text-ink animate-scale-in">{line.item.qty}</span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          onClick={() => onQty(line.productId, line.item.qty + 1)}
                          className="flex h-11 w-11 items-center justify-center rounded-control bg-emerald text-white transition-colors hover:bg-emerald/90"
                        >
                          <Plus size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                    {(line.item.fields ?? []).map((f) => (
                      <p key={f.field_id} className="mt-1 text-sm text-muted">
                        {f.label}: {f.display}
                        {Number(f.price_applied) > 0 && (
                          <span className="font-semibold text-emerald"> (+RM {Number(f.price_applied).toFixed(2)})</span>
                        )}
                      </p>
                    ))}
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-ink">
                        RM {Number(line.item.lineTotal).toFixed(2)}
                      </p>
                      <div className="flex gap-2">
                        {bad && (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => onEdit(line.productId, errs)}
                            className="bg-danger hover:bg-danger/90"
                          >
                            Fix
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(line.productId, {})}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemove(line.productId)}
                          className="border-red-200 text-red-600 hover:bg-red-50"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-right text-lg font-bold text-ink">
              Total: RM {total.toFixed(2)}
            </p>
            <Button onClick={handleToDetails} className="mt-4 w-full">
              Continue
            </Button>
          </div>
        )}

        {step === 1 && (
          <div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-ink">
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
                <label className="mb-1 block text-sm font-semibold text-ink">
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
              <div role="alert" className="mt-3 rounded-control border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <Button variant="ghost" onClick={() => setStep(0)}>
                ← Back
              </Button>
              <Button onClick={handleToPay} className="flex-1">
                Continue to Pay
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="mb-4 rounded-control border border-line bg-cream p-4 text-center">
              {shop.duitnow_qr_url ? (
                <img
                  src={shop.duitnow_qr_url}
                  alt="DuitNow QR seller"
                  className="mx-auto h-40 w-40 rounded-control border border-line bg-white object-contain"
                />
              ) : (
                <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-control border border-line bg-white text-sm font-semibold text-muted">
                  QR PLACEHOLDER
                </div>
              )}
              {shop.duitnow_account && (
                <p className="mt-2 font-mono text-sm font-bold text-ink">{shop.duitnow_account}</p>
              )}
              <p className="mt-2 text-sm font-bold text-ink">
                Total: RM {total.toFixed(2)}
              </p>
              <p className="text-xs text-muted">
                Scan the seller's DuitNow QR, then enter the Ref ID below.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-ink">
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
              <div role="alert" className="mt-3 rounded-control border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <Button variant="ghost" onClick={() => setStep(1)}>
                ← Back
              </Button>
              <Button onClick={handleSubmit} disabled={loading} className="flex-1">
                {loading ? 'Sending...' : 'Send Order via WhatsApp'}
              </Button>
            </div>
            <p className="mt-2 text-center text-xs text-muted">
              Order is saved, then WhatsApp opens in a new tab.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
