import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Minus, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { CustomValue, OrderItemSummary, Product, Shop } from '../types';
import DynamicFormEngine from '../components/DynamicFormEngine';
import CheckoutModal from '../components/CheckoutModal';
import {
  activeFields,
  clampQty,
  computeUnitTotal,
  validateRequired,
} from '../utils/formPresets';
import { buildItemSnapshot } from '../utils/orderSnapshot';

const wrapCls =
  'mx-auto w-full max-w-md sm:max-w-2xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-[1600px] min-h-screen bg-slate-50';

export default function Storefront() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [qty, setQty] = useState<Record<string, number>>({});
  const [values, setValues] = useState<Record<string, Record<string, CustomValue>>>({});
  const [errors, setErrors] = useState<Record<string, Record<string, string>>>({});
  const [showCheckout, setShowCheckout] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const uploading = uploadingCount > 0;

  useEffect(() => {
    async function load() {
      if (!slug) {
        setError('Missing shop slug.');
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
        setError(e instanceof Error ? e.message : 'Failed to load shop.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  useEffect(() => {
    const target = searchParams.get('product');
    if (!target || products.length === 0) return;
    setHighlightId(target);
    const scroll = setTimeout(() => {
      document
        .getElementById(`product-${target}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
    const clear = setTimeout(() => setHighlightId(null), 3000);
    return () => {
      clearTimeout(scroll);
      clearTimeout(clear);
    };
  }, [products, searchParams]);

  function setValue(productId: string, fieldId: string, value: CustomValue) {
    setValues((prev) => ({
      ...prev,
      [productId]: { ...(prev[productId] ?? {}), [fieldId]: value },
    }));
    setErrors((prev) => ({
      ...prev,
      [productId]: { ...(prev[productId] ?? {}), [fieldId]: '' },
    }));
    setQty((prev) => (prev[productId] ?? 0) > 0 ? prev : { ...prev, [productId]: 1 });
  }

  function changeQty(productId: string, delta: number) {
    setQty((prev) => ({ ...prev, [productId]: clampQty((prev[productId] ?? 0) + delta) }));
  }

  const { count, total, itemsSummary, orderCustomData } = useMemo(() => {
    let c = 0;
    let t = 0;
    const items: OrderItemSummary[] = [];

    for (const p of products) {
      const q = qty[p.id] ?? 0;
      if (q <= 0) continue;
      const snap = buildItemSnapshot(
        { title: p.title, price: Number(p.price) },
        p.custom_fields ?? [],
        values[p.id] ?? {},
        q
      );
      c += q;
      t += snap.lineTotal;
      items.push(snap);
    }
    return { count: c, total: Math.round(t * 100) / 100, itemsSummary: items, orderCustomData: {} };
  }, [products, qty, values]);

  function handleCheckoutOpen() {
    if (count === 0 || total <= 0 || uploading) return;
    const nextErrors: Record<string, Record<string, string>> = {};
    let invalid = false;
    for (const p of products) {
      if ((qty[p.id] ?? 0) <= 0) continue;
      const errs = validateRequired(p.custom_fields ?? [], values[p.id] ?? {});
      if (Object.keys(errs).length > 0) {
        nextErrors[p.id] = errs;
        invalid = true;
      }
    }
    setErrors(nextErrors);
    if (invalid) return;
    setShowCheckout(true);
  }

  if (loading) {
    return (
      <div className={`${wrapCls} p-4 sm:p-6`}>
        <p className="text-sm text-slate-500">Loading shop...</p>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className={`${wrapCls} p-4 sm:p-6`}>
        <Link to="/" className="inline-flex h-11 items-center text-sm font-bold text-slate-700">
          ← Back
        </Link>
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error ?? 'Shop not found (invalid slug).'}
        </div>
      </div>
    );
  }

  return (
    <div className={`${wrapCls} pb-28 lg:pb-10`}>
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white p-4 sm:p-6">
        <Link to="/" className="inline-flex h-11 items-center gap-1 text-sm font-bold text-slate-700">
          <ArrowLeft size={16} /> Marketplace
        </Link>
        <h1 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">{shop.name}</h1>
        <div className="mt-1 flex flex-wrap gap-2">
          <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-1 text-xs font-medium text-slate-800">
            {shop.mahalla}
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-1 text-xs font-medium text-slate-800">
            {shop.category}
          </span>
        </div>
      </header>

      <main className="p-4 sm:p-6 lg:grid lg:grid-cols-[1fr_320px] lg:items-start lg:gap-6">
        <div>
          {products.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600">
              No products available right now.
            </div>
          )}

          <div className="space-y-3 sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0 xl:grid-cols-3">
            {products.map((p) => {
              const q = qty[p.id] ?? 0;
              const fields = p.custom_fields ?? [];
              const hasForm = activeFields(fields).length > 0;
              const vals = values[p.id] ?? {};
              const unit = computeUnitTotal(Number(p.price), fields, vals);
              const extra = unit - (Number(p.price) || 0);

              return (
                <div
                  key={p.id}
                  id={`product-${p.id}`}
                  className={`rounded-xl border bg-white p-4 ${
                    highlightId === p.id ? 'border-slate-900 ring-2 ring-slate-900' : 'border-slate-200'
                  }`}
                >
                  <div className="flex justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="break-words font-bold text-slate-900">{p.title}</h3>
                      <p className="text-sm font-bold text-slate-700">
                        RM {Number(p.price).toFixed(2)}
                      </p>
                    </div>
                    {hasForm ? (
                      q > 0 && (
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                            ✓ {q} in order
                          </span>
                          <button
                            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 bg-white"
                            onClick={() => changeQty(p.id, -1)}
                            aria-label={`Decrease ${p.title}`}
                          >
                            <Minus size={18} />
                          </button>
                          <span className="w-6 text-center font-bold">{q}</span>
                          <button
                            className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white"
                            onClick={() => changeQty(p.id, 1)}
                            aria-label={`Add ${p.title}`}
                          >
                            <Plus size={18} />
                          </button>
                          <button
                            onClick={() => changeQty(p.id, -q)}
                            aria-label={`Remove ${p.title}`}
                            className="h-11 px-2 text-xs font-bold text-red-600"
                          >
                            Remove
                          </button>
                        </div>
                      )
                    ) : (
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 bg-white"
                          onClick={() => changeQty(p.id, -1)}
                          aria-label={`Decrease ${p.title}`}
                        >
                          <Minus size={18} />
                        </button>
                        <span className="w-6 text-center font-bold">{q}</span>
                        <button
                          className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white"
                          onClick={() => changeQty(p.id, 1)}
                          aria-label={`Add ${p.title}`}
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                    )}
                  </div>

                  {hasForm && (
                    <div className="mt-3 border-t border-slate-200 pt-3">
                      <p className="mb-2 text-xs text-slate-500">
                        Fill in the form to order — quantity is automatically 1.
                      </p>
                      <DynamicFormEngine
                        fields={fields}
                        values={vals}
                        onChange={(fid, v) => setValue(p.id, fid, v)}
                        errors={errors[p.id]}
                        shopId={shop.id}
                        onBusyChange={(busy) =>
                          setUploadingCount((c) => Math.max(0, c + (busy ? 1 : -1)))
                        }
                      />
                      <p className="mt-3 text-sm text-slate-700">
                        RM {Number(p.price).toFixed(2)}
                        {extra > 0 && ` + RM ${extra.toFixed(2)}`} ={' '}
                        <span className="font-bold text-slate-900">RM {unit.toFixed(2)} / unit</span>
                        {q > 0 && (
                          <span className="block font-bold text-slate-900">
                            {q} × RM {unit.toFixed(2)} = RM {(unit * q).toFixed(2)}
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <aside className="sticky top-24 hidden rounded-xl border border-slate-200 bg-white p-5 lg:block">
          <h2 className="font-bold text-slate-900">Order Summary</h2>
          {itemsSummary.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No items yet. Pick from the menu.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {itemsSummary.map((it, i) => (
                <li key={i} className="flex justify-between gap-2 text-sm">
                  <span className="text-slate-700">
                    {it.title} × {it.qty}
                  </span>
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
              disabled={count === 0 || uploading}
              className="mt-3 h-12 w-full rounded-xl bg-emerald-600 font-bold text-white disabled:opacity-40"
            >
              Proceed to Checkout
            </button>
          </div>
        </aside>
      </main>

      <div className="safe-bottom fixed bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 border-t border-slate-200 bg-white p-4 sm:max-w-2xl lg:hidden">
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
          custom_data={orderCustomData}
          itemsSummary={itemsSummary}
          shop_id={shop.id}
          onClose={() => setShowCheckout(false)}
        />
      )}
    </div>
  );
}
