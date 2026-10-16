import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { OrderItemSummary, Shop } from '../types';
import { generateWhatsAppLink } from '../utils/whatsapp';

interface Props {
  shop: Shop;
  total: number;
  itemsSummary: OrderItemSummary[];
  shop_id: string;
  onClose: () => void;
}

export default function CheckoutModal({
  shop,
  total,
  itemsSummary,
  shop_id,
  onClose,
}: Props) {
  const navigate = useNavigate();
  const [buyerName, setBuyerName] = useState('');
  const [location, setLocation] = useState('');
  const [refId, setRefId] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputCls =
    'h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-900 outline-none focus:border-slate-900';

  function handleNext() {
    setError(null);
    if (!buyerName.trim()) return setError('Buyer name is required.');
    if (!location.trim()) return setError('Mahalla / Room is required.');
    setStep(2);
  }

  async function handleSubmit() {
    setError(null);
    if (!/^\d{4,6}$/.test(refId.trim()))
      return setError('DuitNow Ref ID must be 4-6 digits.');

    if (!shop.whatsapp_number) {
      return setError("Seller has no WhatsApp number. Can't continue.");
    }

    setLoading(true);
    try {
      const payload = {
        shop_id,
        buyer_name: buyerName.trim(),
        location: location.trim(),
        total_amount: total,
        payment_ref_id: refId.trim(),
        custom_data: {},
        items: itemsSummary,
        status: 'pending_verification' as const,
      };

      const { data, error: insErr } = await supabase
        .from('orders')
        .insert(payload)
        .select('id')
        .single();

      if (insErr) throw insErr;
      const orderId = (data as { id: string }).id;

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
          <h2 className="text-lg font-bold text-slate-900">Pay via DuitNow</h2>
          <button
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

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

        {step === 1 ? (
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
        ) : (
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
            <button
              type="button"
              onClick={() => setStep(1)}
              className="mt-2 h-11 text-sm font-bold text-slate-600"
            >
              ← Back
            </button>
          </div>
        )}

        {error && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {step === 1 ? (
          <button
            onClick={handleNext}
            className="mt-4 h-12 w-full rounded-xl bg-emerald-600 font-bold text-white"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="mt-4 h-12 w-full rounded-xl bg-emerald-600 font-bold text-white disabled:opacity-60"
          >
            {loading ? 'Sending...' : 'Send Order via WhatsApp'}
          </button>
        )}
        <p className="mt-2 text-center text-xs text-slate-500">
          Order is saved, then WhatsApp opens in a new tab.
        </p>
      </div>
    </div>
  );
}
