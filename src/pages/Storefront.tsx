import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Minus, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { CustomValue, OrderItemSummary, Product, Shop } from '../types';
import DynamicFormEngine, {
  computeModifierTotal,
  validateDynamicFields,
} from '../components/DynamicFormEngine';
import CheckoutModal from '../components/CheckoutModal';
import { fileNameFromUrl } from '../utils/files';

export default function Storefront() {
  const { slug } = useParams<{ slug: string }>();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [qty, setQty] = useState<Record<string, number>>({});
  const [customValues, setCustomValues] = useState<Record<string, CustomValue>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    async function load() {
      if (!slug) {
        setError('Slug kedai tiada.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const { data: shopData, error: shopErr } = await supabase
          .from('shops')
          .select('*')
          .eq('slug', slug)
          .single();
        if (shopErr) throw shopErr;
        const s = shopData as Shop;
        setShop(s);

        const { data: prodData, error: prodErr } = await supabase
          .from('products')
          .select('*')
          .eq('shop_id', s.id)
          .eq('is_available', true)
          .order('title');
        if (prodErr) throw prodErr;
        setProducts((prodData as Product[]) ?? []);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Gagal muat kedai.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  const isCustom = shop?.category === 'custom';
  const customProduct = isCustom ? products[0] : undefined;
  const customFields = customProduct?.custom_fields ?? [];

  const { count, total, itemsSummary, orderCustomData } = useMemo(() => {
    if (isCustom && customProduct) {
      const mod = computeModifierTotal(customFields, customValues);
      const base = Number(customProduct.price) || 0;
      const t = base + mod;
      const entries = Object.entries(customValues).filter(([, v]) =>
        Array.isArray(v) ? v.length > 0 : String(v) !== ''
      );
      const labelOf = (id: string) =>
        customFields.find((f) => f.id === id)?.label?.trim() || id;
      const shortOf = (v: CustomValue) => {
        if (Array.isArray(v)) return v.join(', ');
        const s = String(v);
        if (/^https?:\/\//.test(s)) return fileNameFromUrl(s) || 'fail dimuat naik';
        return s;
      };
      const orderCustomData: Record<string, CustomValue> = {};
      for (const [id, v] of entries) {
        orderCustomData[labelOf(id)] = v;
      }
      return {
        count: entries.length > 0 ? 1 : 0,
        total: t,
        itemsSummary: [
          {
            title: customProduct.title,
            qty: 1,
            unitPrice: base,
            lineTotal: t,
            selectedOptions: entries.map(([k, v]) => `${labelOf(k)}: ${shortOf(v)}`).join(', '),
          } as OrderItemSummary,
        ],
        orderCustomData,
      };
    }
    let c = 0;
    let t = 0;
    const items: OrderItemSummary[] = [];
    for (const p of products) {
      const q = qty[p.id] ?? 0;
      if (q > 0) {
        c += q;
        const line = Number(p.price) * q;
        t += line;
        items.push({ title: p.title, qty: q, unitPrice: Number(p.price), lineTotal: line });
      }
    }
    return { count: c, total: t, itemsSummary: items, orderCustomData: {} };
  }, [isCustom, customProduct, customFields, customValues, products, qty]);

  function handleCheckoutOpen() {
    if (isCustom) {
      const errs = validateDynamicFields(customFields, customValues);
      setFormErrors(errs);
      if (Object.keys(errs).length > 0) return;
    }
    if (total <= 0 || count === 0) return;
    setShowCheckout(true);
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-md sm:max-w-2xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-[1600px] min-h-screen bg-slate-50 p-4 sm:p-6">
        <div className="h-12 animate-pulse rounded-xl bg-white border border-slate-200" />
        <p className="mt-3 text-sm text-slate-500">Memuatkan kedai...</p>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="mx-auto w-full max-w-md sm:max-w-2xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-[1600px] min-h-screen bg-slate-50 p-4 sm:p-6">
        <Link to="/" className="inline-flex h-11 items-center text-sm font-bold text-slate-700">← Kembali</Link>
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error ?? 'Kedai tidak dijumpai (invalid slug).'}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md sm:max-w-2xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-[1600px] min-h-screen bg-slate-50 pb-28 lg:pb-10">
      <header className="bg-white border-b border-slate-200 p-4 sm:p-6 sticky top-0 z-10">
        <Link to="/" className="inline-flex h-11 items-center gap-1 text-sm font-bold text-slate-700">
          <ArrowLeft size={16} /> Marketplace
        </Link>
        <h1 className="mt-1 text-xl sm:text-2xl font-bold text-slate-900">{shop.name}</h1>
        <div className="mt-1 flex flex-wrap gap-2">
          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium">{shop.mahalla}</span>
          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium">{shop.category}</span>
        </div>
      </header>

      <main className="p-4 sm:p-6 lg:grid lg:grid-cols-[1fr_320px] lg:gap-6 lg:items-start">
        {products.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600">
            Tiada produk tersedia buat masa ini.
          </div>
        )}

        {isCustom && customProduct ? (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="font-bold text-slate-900">{customProduct.title}</h2>
            <p className="text-sm text-slate-600">
              Base: RM {Number(customProduct.price).toFixed(2)}
            </p>
            <div className="mt-3">
              <DynamicFormEngine
                fields={customFields}
                values={customValues}
                onChange={(id, v) => setCustomValues((p) => ({ ...p, [id]: v }))}
                errors={formErrors}
                shopId={shop?.id ?? ''}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3 sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0 lg:grid-cols-2 xl:grid-cols-3">
            {products.map((p) => {
              const q = qty[p.id] ?? 0;
              return (
                <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 break-words">{p.title}</h3>
                      <p className="text-sm font-bold text-slate-700">
                        RM {Number(p.price).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200"
                        onClick={() => setQty((prev) => ({ ...prev, [p.id]: Math.max(0, (prev[p.id] ?? 0) - 1) }))}
                        aria-label={`Kurang ${p.title}`}
                      >
                        <Minus size={18} />
                      </button>
                      <span className="w-6 text-center font-bold">{q}</span>
                      <button
                        className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white"
                        onClick={() => setQty((prev) => ({ ...prev, [p.id]: (prev[p.id] ?? 0) + 1 }))}
                        aria-label={`Tambah ${p.title}`}
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>
                  {p.custom_fields && p.custom_fields.length > 0 && q > 0 && (
                    <p className="mt-2 text-xs text-slate-500">
                      Ada {p.custom_fields.length} pilihan custom — gunakan pakej custom jika perlu.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      {/* Desktop summary sidebar — inside grid on lg */}
      <aside className="hidden lg:block sticky top-24 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-bold text-slate-900">Ringkasan Order</h2>
        {itemsSummary.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Belum ada item. Pilih menu di kiri.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {itemsSummary.map((it, i) => (
              <li key={i} className="flex justify-between gap-2 text-sm">
                <span className="text-slate-700">{it.title} × {it.qty}</span>
                <span className="font-bold text-slate-900">RM {it.lineTotal.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 border-t border-slate-200 pt-3">
          <p className="text-sm text-slate-600">{count} item</p>
          <p className="text-lg font-bold text-slate-900">RM {total.toFixed(2)}</p>
          <button
            onClick={handleCheckoutOpen}
            disabled={count === 0}
            className="mt-3 h-12 w-full rounded-xl bg-emerald-600 font-bold text-white disabled:opacity-40"
          >
            Proceed to Checkout
          </button>
        </div>
      </aside>
      </main>

      {/* Mobile sticky bottom bar — thumb-first */}
      <div className="safe-bottom fixed bottom-0 left-1/2 w-full max-w-md sm:max-w-2xl -translate-x-1/2 border-t border-slate-200 bg-white p-4 lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-600">{count} item</p>
            <p className="font-bold text-slate-900">RM {total.toFixed(2)}</p>
          </div>
          <button
            onClick={handleCheckoutOpen}
            disabled={count === 0}
            className="h-12 min-w-[180px] rounded-xl bg-emerald-600 px-6 font-bold text-white disabled:opacity-40"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>

      {showCheckout && (
        <CheckoutModal
          shop={shop}
          total={total}
          custom_data={isCustom ? orderCustomData : {}}
          itemsSummary={itemsSummary}
          shop_id={shop.id}
          onClose={() => setShowCheckout(false)}
        />
      )}
    </div>
  );
}
