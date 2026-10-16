import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { CustomField, Product } from '../../types';
import SellerNav from '../../components/seller/SellerNav';
import SellerFormConfigurator from '../../components/SellerFormConfigurator';
import FormPreview from '../../components/seller/FormPreview';
import { activeFields, sanitizeFields } from '../../utils/formPresets';

const inputCls =
  'h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-900 outline-none focus:border-emerald-600';

export default function Products() {
  const { shop } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [available, setAvailable] = useState(true);
  const [fields, setFields] = useState<CustomField[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  async function load() {
    if (!shop) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', shop.id)
        .order('title');
      if (err) throw err;
      setProducts((data as Product[]) ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Gagal muat produk.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop?.id]);

  function startAdd() {
    setEditingId(null);
    setTitle('');
    setPrice('');
    setAvailable(true);
    setFields([]);
    setShowPreview(false);
    setError(null);
  }

  function startEdit(p: Product) {
    setEditingId(p.id);
    setTitle(p.title);
    setPrice(String(p.price));
    setAvailable(p.is_available);
    setFields(p.custom_fields ?? []);
    setShowPreview(false);
    setError(null);
  }

  async function handleSave() {
    if (!shop) return;
    setError(null);
    if (!title.trim()) return setError('Nama produk diperlukan.');
    const numPrice = Number(price);
    if (!price || isNaN(numPrice) || numPrice <= 0)
      return setError('Harga mesti nombor lebih dari 0.');
    const cleaned = sanitizeFields(fields);
    const missingLabel = cleaned.some((f) => f.enabled !== false && !f.label);
    if (missingLabel) return setError('Setiap soalan aktif mesti ada label.');
    const badSelect = cleaned.some((f) => f.enabled !== false && f.type === 'select' && (f.options ?? []).length === 0);
    if (badSelect) return setError('Soalan pilihan mesti ada sekurang-kurangnya satu pilihan.');
    setSaving(true);
    try {
      if (editingId) {
        const { error: err } = await supabase
          .from('products')
          .update({ title: title.trim(), price: numPrice, is_available: available, custom_fields: cleaned })
          .eq('id', editingId);
        if (err) throw err;
      } else {
        const { error: err } = await supabase.from('products').insert({
          shop_id: shop.id,
          title: title.trim(),
          price: numPrice,
          is_available: available,
          custom_fields: cleaned,
        });
        if (err) throw err;
      }
      startAdd();
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Gagal simpan produk.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleAvailable(p: Product) {
    const { error: err } = await supabase
      .from('products')
      .update({ is_available: !p.is_available })
      .eq('id', p.id);
    if (!err) {
      setProducts((prev) =>
        prev.map((x) => (x.id === p.id ? { ...x, is_available: !p.is_available } : x))
      );
    }
  }

  async function handleDelete(p: Product) {
    if (!window.confirm(`Padam "${p.title}"?`)) return;
    const { error: err } = await supabase.from('products').delete().eq('id', p.id);
    if (!err) setProducts((prev) => prev.filter((x) => x.id !== p.id));
  }

  return (
    <div className="mx-auto w-full max-w-md sm:max-w-2xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-[1600px] min-h-screen bg-slate-50 pb-10">
      <SellerNav />
      <main className="p-4 sm:p-6 lg:grid lg:grid-cols-[1fr_320px] lg:gap-6 lg:items-start">
        <div>
          <h2 className="font-bold text-slate-900">Produk ({products.length})</h2>
          {loading && <p className="mt-2 text-sm text-slate-500">Memuatkan...</p>}
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((p) => (
              <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-slate-900 truncate">{p.title}</h3>
                  <span
                    className={`shrink-0 rounded-full px-2 py-1 text-xs font-bold ${
                      p.is_available ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {p.is_available ? 'Ada' : 'Tiada'}
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-700">RM {Number(p.price).toFixed(2)}</p>
                <p className="mt-1 text-xs text-slate-600">
                  {activeFields(p.custom_fields).length} soalan aktif
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => toggleAvailable(p)}
                    className="h-11 flex-1 rounded-xl border border-slate-200 text-sm font-bold text-slate-700"
                  >
                    {p.is_available ? 'Sembunyi' : 'Tunjuk'}
                  </button>
                  <button
                    onClick={() => startEdit(p)}
                    className="h-11 flex-1 rounded-xl bg-slate-900 text-sm font-bold text-white"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p)}
                    className="h-11 rounded-xl border border-red-200 px-4 text-sm font-bold text-red-600"
                  >
                    Padam
                  </button>
                </div>
              </div>
            ))}
          </div>
          {!loading && products.length === 0 && (
            <div className="mt-3 rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600">
              Belum ada produk. Tambah yang pertama di borang.
            </div>
          )}
        </div>

        <div className="mt-4 lg:mt-0 rounded-xl border border-slate-200 bg-white p-4 lg:sticky lg:top-24">
          <h2 className="font-bold text-slate-900">{editingId ? 'Edit Produk' : 'Tambah Produk'}</h2>
          <div className="mt-3 space-y-3">
            <div>
              <label className="mb-1 block text-sm font-bold text-slate-900">Nama *</label>
              <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="cth: Nasi Lemak Ayam" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold text-slate-900">Harga (RM) *</label>
              <input className={inputCls} type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="cth: 8.50" min="0" step="0.10" />
            </div>
            <label className="flex h-12 items-center gap-2 text-sm font-bold text-slate-900">
              <input type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)} className="h-5 w-5" />
              Tersedia untuk jualan
            </label>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <SellerFormConfigurator fields={fields} onChange={setFields} basePrice={Number(price) || 0} disabled={saving} />
              {activeFields(fields).length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowPreview((s) => !s)}
                  className="mt-3 h-11 w-full rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-800"
                >
                  {showPreview ? 'Sembunyi preview' : 'Lihat preview'}
                </button>
              )}
              {showPreview && activeFields(fields).length > 0 && (
                <div className="mt-3">
                  <FormPreview fields={fields} basePrice={Number(price) || 0} />
                </div>
              )}
            </div>
          </div>
          {error && (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-3 h-12 w-full rounded-xl bg-emerald-600 font-bold text-white disabled:opacity-60"
          >
            {saving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambah Produk'}
          </button>
          {editingId && (
            <button onClick={startAdd} className="mt-2 h-11 w-full rounded-xl border border-slate-200 text-sm font-bold text-slate-700">
              Batal Edit
            </button>
          )}
        </div>
      </main>
    </div>
  );
}