import { useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';
import { validateWhatsappMY } from '../../utils/validation';
import { MAHALLA_FORM_OPTIONS } from '../../utils/mahallas';
import { SHOP_CATEGORIES } from '../../utils/categories';
import Card from '../ui/Card';
import Button from '../ui/Button';

const inputCls =
  'h-12 w-full rounded-control border border-line bg-white px-4 text-ink outline-none transition-colors placeholder:text-placeholder focus:border-emerald focus:ring-2 focus:ring-emerald/25';

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
      <div className="mx-auto w-full max-w-md min-h-screen p-4">
        <p className="text-sm text-muted">Checking session...</p>
      </div>
    );
  }

  if (shop) {
    return children;
  }

  async function handleSubmit() {
    setError(null);
    if (!name.trim()) return setError('Shop name is required.');
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
      setError(e instanceof Error ? e.message : 'Failed to open shop. Try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg min-h-screen px-5 py-10 sm:px-8">
      <h2 className="text-2xl font-bold text-ink">Set Up Your Shop</h2>
      <p className="mt-1 text-sm text-muted">Complete the details to start selling.</p>

      <Card className="mt-5 p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="rs-name" className="mb-1 block text-sm font-semibold text-ink">
              Shop name *
            </label>
            <input
              id="rs-name"
              className={inputCls}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Kak Jah Nasi Lemak"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="rs-wa" className="mb-1 block text-sm font-semibold text-ink">
              WhatsApp (601...) *
            </label>
            <input
              id="rs-wa"
              className={inputCls}
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="e.g. 60123456789"
              inputMode="tel"
            />
          </div>
          <div>
            <label htmlFor="rs-mahalla" className="mb-1 block text-sm font-semibold text-ink">
              Mahalla
            </label>
            <select
              id="rs-mahalla"
              className={inputCls}
              value={mahalla}
              onChange={(e) => setMahalla(e.target.value)}
            >
              {MAHALLA_FORM_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="rs-category" className="mb-1 block text-sm font-semibold text-ink">
              Category
            </label>
            <select
              id="rs-category"
              className={inputCls}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {SHOP_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>

        {error && (
          <div role="alert" className="mt-4 rounded-control border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <Button onClick={handleSubmit} disabled={saving} className="mt-5 w-full">
          {saving ? 'Setting up...' : 'Open Shop'}
        </Button>
      </Card>
    </div>
  );
}
