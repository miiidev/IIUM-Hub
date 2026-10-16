import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { validateWhatsappMY } from '../../utils/validation';
import { MAHALLA_FORM_OPTIONS } from '../../utils/mahallas';
import SellerNav from '../../components/seller/SellerNav';

const CATEGORIES = ['food', 'printing', 'repairs', 'rentals', 'custom'];

const inputCls =
  'h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-900 outline-none focus:border-emerald-600';

export default function Settings() {
  const { shop, refreshShop } = useAuth();
  const [name, setName] = useState(shop?.name ?? '');
  const [whatsapp, setWhatsapp] = useState(shop?.whatsapp_number ?? '');
  const [mahalla, setMahalla] = useState(shop?.mahalla ?? 'Faruq');
  const [category, setCategory] = useState(shop?.category ?? 'food');
  const [isActive, setIsActive] = useState(shop?.is_active ?? true);
  const [account, setAccount] = useState(shop?.duitnow_account ?? '');
  const [qrUrl, setQrUrl] = useState(shop?.duitnow_qr_url ?? '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sync form when shop finishes loading (avoids saving stale empty values)
  useEffect(() => {
    if (!shop) return;
    setName(shop.name ?? '');
    setWhatsapp(shop.whatsapp_number ?? '');
    setMahalla(shop.mahalla ?? 'Faruq');
    setCategory(shop.category ?? 'food');
    setIsActive(shop.is_active ?? true);
    setAccount(shop.duitnow_account ?? '');
    setQrUrl(shop.duitnow_qr_url ?? '');
  }, [shop?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleQrUpload(file: File) {
    if (!shop) return;
    setError(null);
    setUploading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png';
      const path = `${shop.id}/qr.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('duitnow-qr')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('duitnow-qr').getPublicUrl(path);
      setQrUrl(`${data.publicUrl}?t=${Date.now()}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Gagal muat naik QR.');
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!shop) return;
    setError(null);
    setOk(false);
    if (!name.trim()) return setError('Nama kedai diperlukan.');
    const wErr = validateWhatsappMY(whatsapp);
    if (wErr) return setError(wErr);
    setSaving(true);
    try {
      const { error: err } = await supabase
        .from('shops')
        .update({
          name: name.trim(),
          whatsapp_number: whatsapp.replace(/\D/g, ''),
          mahalla,
          category,
          is_active: isActive,
          duitnow_account: account.trim() || null,
          duitnow_qr_url: qrUrl.split('?')[0] || null,
        })
        .eq('id', shop.id);
      if (err) throw err;
      await refreshShop();
      setOk(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Gagal simpan tetapan.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md sm:max-w-2xl min-h-screen bg-slate-50 pb-10">
      <SellerNav />
      <main className="p-4 sm:p-6">
        <div className="rounded-xl border border-slate-200 bg-white p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-bold text-slate-900">Nama Kedai *</label>
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-bold text-slate-900">WhatsApp (601...) *</label>
            <input className={inputCls} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} inputMode="tel" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-bold text-slate-900">Mahalla</label>
            <select className={inputCls} value={mahalla} onChange={(e) => setMahalla(e.target.value)}>
              {MAHALLA_FORM_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-bold text-slate-900">Kategori</label>
            <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-bold text-slate-900">No. Akaun DuitNow (dipapar di checkout)</label>
            <input className={inputCls} value={account} onChange={(e) => setAccount(e.target.value)} placeholder="cth: 60123456789 / 1234567890" inputMode="numeric" />
          </div>
          <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-bold text-slate-900">QR DuitNow</p>
            <div className="mt-2 flex items-center gap-3">
              {qrUrl ? (
                <img src={qrUrl} alt="QR DuitNow" className="h-24 w-24 rounded-xl border border-slate-200 bg-white object-contain" />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-400">
                  Tiada QR
                </div>
              )}
              <label className="inline-flex h-12 cursor-pointer items-center rounded-xl bg-slate-900 px-4 text-sm font-bold text-white">
                {uploading ? 'Muat naik...' : 'Muat naik QR'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleQrUpload(f);
                  }}
                />
              </label>
            </div>
          </div>
          <label className="sm:col-span-2 flex min-h-[48px] items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4">            <span className="text-sm font-bold text-slate-900">
              Kedai Open {isActive ? '(nampak di Marketplace)' : '(disorok)'}
            </span>
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-6 w-6" />
          </label>
          <p className="sm:col-span-2 text-xs text-slate-500 break-all">
            Link kedai: /s/{shop!.slug}
          </p>
        </div>

        {error && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}
        {ok && (
          <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-700">
            Tetapan disimpan.
          </div>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-4 h-12 w-full rounded-xl bg-emerald-600 font-bold text-white disabled:opacity-60"
        >
          {saving ? 'Menyimpan...' : 'Simpan Tetapan'}
        </button>
      </main>
    </div>
  );
}
