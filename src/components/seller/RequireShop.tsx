import { useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';
import { validateWhatsappMY } from '../../utils/validation';
import { MAHALLA_FORM_OPTIONS } from '../../utils/mahallas';
import { SHOP_CATEGORIES } from '../../utils/categories';


const inputCls =
  'h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-900 outline-none focus:border-emerald-600';

let prefilled = false;

export default function RequireShop({ children }: { children: ReactNode }) {
  const { shop, loading, setupShop } = useAuth();

  const raw = localStorage.getItem('iium-pending-shop');
  let initName = '';
  let initWhatsapp = '';
  let initMahalla = 'Faruq';
  let initCategory = 'food';
  if (raw && !prefilled) {
    try {
      const p = JSON.parse(raw) as {
        shopName?: string;
        whatsappNumber?: string;
        mahalla?: string;
        category?: string;
      };
      initName = p.shopName ?? '';
      initWhatsapp = p.whatsappNumber ?? '';
      initMahalla = p.mahalla ?? 'Faruq';
      initCategory = p.category ?? 'food';
    } catch { /* ignore */ }
  }

  const [name, setName] = useState(initName);
  const [whatsapp, setWhatsapp] = useState(initWhatsapp);
  const [mahalla, setMahalla] = useState(initMahalla);
  const [category, setCategory] = useState(initCategory);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-md min-h-screen bg-slate-50 p-4">
        <p className="text-sm text-slate-500">Memeriksa sesi...</p>
      </div>
    );
  }

  if (shop) {
    return children;
  }

  async function handleSubmit() {
    setError(null);
    if (!name.trim()) return setError('Nama kedai diperlukan.');
    const wErr = validateWhatsappMY(whatsapp);
    if (wErr) return setError(wErr);
    setSaving(true);
    try {
      await setupShop({
        whatsappNumber: whatsapp.replace(/\D/g, ''),
        shopName: name.trim(),
        mahalla,
        category,
      });
      prefilled = true;
      localStorage.removeItem('iium-pending-shop');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Gagal buka kedai. Cuba lagi.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md sm:max-w-2xl min-h-screen bg-slate-50 pb-10">
      <main className="p-4 sm:p-6">
        <h2 className="text-xl font-bold text-slate-900">Siapkan Kedai Anda</h2>
        <p className="text-sm text-slate-600">Lengkapkan butiran untuk mula berjualan.</p>
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-bold text-slate-900">Nama Kedai *</label>
            <input
              className={inputCls}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="cth: Nasi Lemak Kak Jah"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-bold text-slate-900">WhatsApp (601...) *</label>
            <input
              className={inputCls}
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="cth: 60123456789"
              inputMode="tel"
            />
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
              {SHOP_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>
        {error && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="mt-4 h-12 w-full rounded-xl bg-emerald-600 font-bold text-white disabled:opacity-60"
        >
          {saving ? 'Menyediakan...' : 'Buka Kedai'}
        </button>
      </main>
    </div>
  );
}