import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { OrderItemSummary, Shop } from '../types';
import { generateWhatsAppLink } from '../utils/whatsapp';

interface Props {
  shop: Shop;
  total: number;
  custom_data: Record<string, string | number>;
  itemsSummary: OrderItemSummary[];
  shop_id: string;
  onClose: () => void;
}

export default function CheckoutModal({
  shop,
  total,
  custom_data,
  itemsSummary,
  shop_id,
  onClose,
}: Props) {
  const navigate = useNavigate();
  const [buyerName, setBuyerName] = useState('');
  const [location, setLocation] = useState('');
  const [refId, setRefId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputCls =
    'h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-900 outline-none focus:border-emerald-600';

  async function handleSubmit() {
    setError(null);
    if (!buyerName.trim()) return setError('Nama pembeli diperlukan.');
    if (!location.trim()) return setError('Mahalla / Room diperlukan.');
    if (!refId.trim() || refId.trim().length < 4)
      return setError('DuitNow Ref ID (min 4 digit terakhir) diperlukan.');

    if (!shop.whatsapp_number) {
      return setError('Nombor WhatsApp seller tiada. Tidak boleh teruskan.');
    }

    setLoading(true);
    try {
      const payload = {
        shop_id,
        buyer_name: buyerName.trim(),
        location: location.trim(),
        total_amount: total,
        payment_ref_id: refId.trim(),
        custom_data,
        status: 'pending' as const,
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
      const msg = e instanceof Error ? e.message : 'Gagal cipta order. Cuba lagi.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div className="safe-bottom w-full max-w-md sm:max-w-lg rounded-t-2xl bg-white p-5 pb-8 sm:rounded-2xl sm:pb-5 max-h-[92dvh] overflow-y-auto">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Bayar via DuitNow</h2>
          <button
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200"
            aria-label="Tutup"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
          <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-xl bg-white text-sm font-bold text-slate-400 border border-slate-200">
            QR PLACEHOLDER
          </div>
          <p className="mt-2 text-sm font-bold text-slate-900">
            Total: RM {total.toFixed(2)}
          </p>
          <p className="text-xs text-slate-600">
            Scan QR DuitNow seller, kemudian masukkan Ref ID di bawah.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-bold text-slate-900">
              Nama Pembeli *
            </label>
            <input
              className={inputCls}
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              placeholder="cth: Ahmad Ali"
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
              placeholder="cth: Mahalla Faruq, C2-3-12"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-bold text-slate-900">
              DuitNow Ref ID (4-6 digit terakhir) *
            </label>
            <input
              className={inputCls}
              value={refId}
              onChange={(e) => setRefId(e.target.value)}
              placeholder="cth: 9412"
              inputMode="numeric"
            />
          </div>
        </div>

        {error && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-4 h-12 w-full rounded-xl bg-emerald-600 font-bold text-white disabled:opacity-60"
        >
          {loading ? 'Menghantar...' : 'Hantar Order via WhatsApp'}
        </button>
        <p className="mt-2 text-center text-xs text-slate-500">
          Order disimpan, kemudian WhatsApp dibuka di tab baru.
        </p>
      </div>
    </div>
  );
}
