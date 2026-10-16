import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Minus, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { CustomValue, Product, Shop } from '../types';
import CheckoutModal from '../components/CheckoutModal';
import ProductSheet from '../components/buyer/ProductSheet';
import ProductImage from '../components/ProductImage';
import { activeFields } from '../utils/formPresets';
import { formatRange, priceRange } from '../utils/priceRange';
import { buildCartSummary, removeLine, setLineQty, upsertLine, type Cart } from '../utils/cart';
import type { ReviewLine } from '../components/CheckoutModal';

const wrapCls =
  'mx-auto w-full max-w-md sm:max-w-2xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-[1600px] min-h-screen bg-slate-50';

interface Draft {
  productId: string;
  values: Record<string, CustomValue>;
  qty: number;
  editing: boolean;
  errors: Record<string, string>;
}

export default function Storefront() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [cart, setCart] = useState<Cart>({});
  const [draft, setDraft] = useState<Draft | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);

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

  const summary = useMemo(() => buildCartSummary(products, cart), [products, cart]);
  const { count, total, items } = summary;

  function openAdd(p: Product) {
    setDraft({ productId: p.id, values: {}, qty: 1, editing: false, errors: {} });
  }

  function openEdit(p: Product) {
    const line = cart[p.id];
    if (!line) return;
    setDraft({ productId: p.id, values: line.values, qty: line.qty, editing: true, errors: {} });
  }

  function editFromReview(productId: string, errs: Record<string, string>) {
    const p = products.find((x) => x.id === productId);
    const line = cart[productId];
    if (!p || !line) return;
    setShowCheckout(false);
    setDraft({ productId, values: line.values, qty: line.qty, editing: true, errors: errs });
  }

  function removeFromReview(productId: string) {
    const next = removeLine(cart, productId);
    setCart(next);
    if (Object.keys(next).length === 0) setShowCheckout(false);
  }

  function qtyFromReview(productId: string, qty: number) {
    const next = setLineQty(cart, productId, qty);
    setCart(next);
    if (Object.keys(next).length === 0) setShowCheckout(false);
  }

  function commitDraft(values: Record<string, CustomValue>, qty: number) {
    if (!draft) return;
    setCart((prev) => upsertLine(prev, draft.productId, qty, values));
    setDraft(null);
  }

  const draftProduct = draft ? products.find((p) => p.id === draft.productId) ?? null : null;

  const reviewLines: ReviewLine[] = summary.lines
    .map((l) => {
      const p = products.find((x) => x.id === l.productId);
      if (!p) return null;
      return { productId: l.productId, item: l.item, fields: p.custom_fields ?? [] };
    })
    .filter((l): l is ReviewLine => l !== null);

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
        {shop.banner_url && (
          <img
            src={shop.banner_url}
            alt=""
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
            className="mt-3 h-40 w-full rounded-xl bg-slate-100 object-cover sm:h-56"
          />
        )}
        <h1 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">{shop.name}</h1>
        <div className="mt-1 flex flex-wrap gap-2">
          <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-1 text-xs font-medium text-slate-800">
            {shop.mahalla}
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-1 text-xs font-medium text-slate-800">
            {shop.category}
          </span>
        </div>
        {shop.description && (
          <p className="mt-2 text-sm text-slate-600">{shop.description}</p>
        )}
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
              const fields = p.custom_fields ?? [];
              const hasForm = activeFields(fields).length > 0;
              const line = cart[p.id];
              const inCart = !!line && line.qty > 0;
              const base = Number(p.price) || 0;
              const lineUnit = summary.lines.find((l) => l.productId === p.id)?.item.unitPrice ?? base;

              return (
                <div
                  key={p.id}
                  id={`product-${p.id}`}
                  className={`rounded-xl border bg-white p-4 ${
                    highlightId === p.id ? 'border-slate-900 ring-2 ring-slate-900' : 'border-slate-200'
                  }`}
                >
                  <ProductImage src={p.image_url} className="mb-3 aspect-video w-full rounded-xl" />
                  <div className="min-w-0">
                    <h3 className="break-words font-bold text-slate-900">{p.title}</h3>
                    <p className="text-sm font-bold text-slate-700">
                      {hasForm ? formatRange(priceRange(base, fields)) : `RM ${base.toFixed(2)}`}
                    </p>
                  </div>

                  {hasForm ? (
                    inCart ? (
                      <div className="mt-3 border-t border-slate-200 pt-3">
                        <p className="text-sm text-slate-700">
                          In order:{' '}
                          <span className="font-bold text-slate-900">
                            {line.qty} × RM {lineUnit.toFixed(2)}
                          </span>
                        </p>
                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(p)}
                            className="h-11 flex-1 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-800"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setCart((prev) => removeLine(prev, p.id))}
                            aria-label={`Remove ${p.title}`}
                            className="h-11 rounded-xl border border-slate-300 px-4 text-sm font-bold text-red-600"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openAdd(p)}
                        className="mt-3 h-12 w-full rounded-xl bg-slate-900 font-bold text-white"
                      >
                        Add
                      </button>
                    )
                  ) : (
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 bg-white"
                        onClick={() =>
                          setCart((prev) => setLineQty(prev, p.id, (prev[p.id]?.qty ?? 0) - 1))
                        }
                        aria-label={`Decrease ${p.title}`}
                      >
                        <Minus size={18} />
                      </button>
                      <span className="w-6 text-center font-bold">{inCart ? line.qty : 0}</span>
                      <button
                        className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white"
                        onClick={() =>
                          setCart((prev) =>
                            upsertLine(prev, p.id, (prev[p.id]?.qty ?? 0) + 1, {})
                          )
                        }
                        aria-label={`Add ${p.title}`}
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <aside className="sticky top-24 hidden rounded-xl border border-slate-200 bg-white p-5 lg:block">
          <h2 className="font-bold text-slate-900">Order Summary</h2>
          {items.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No items yet. Pick from the menu.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {items.map((it, i) => (
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
            <p className="text-sm text-slate-600">
              {count} items · RM {total.toFixed(2)}
            </p>
            <button
              onClick={() => setShowCheckout(true)}
              disabled={count === 0}
              className="mt-3 h-12 w-full rounded-xl bg-emerald-600 font-bold text-white disabled:opacity-40"
            >
              Review order
            </button>
          </div>
        </aside>
      </main>

      <div className="safe-bottom fixed bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 border-t border-slate-200 bg-white p-4 sm:max-w-2xl lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-bold text-slate-900">
            {count} items · RM {total.toFixed(2)}
          </p>
          <button
            onClick={() => setShowCheckout(true)}
            disabled={count === 0}
            className="h-12 min-w-[180px] rounded-xl bg-emerald-600 px-6 font-bold text-white disabled:opacity-40"
          >
            Review order
          </button>
        </div>
      </div>

      <ProductSheet
        open={draft !== null}
        product={draftProduct}
        initialValues={draft?.values ?? {}}
        initialQty={draft?.qty ?? 1}
        initialErrors={draft?.errors ?? {}}
        editing={draft?.editing ?? false}
        shopId={shop.id}
        onClose={() => setDraft(null)}
        onCommit={commitDraft}
      />

      {showCheckout && (
        <CheckoutModal
          shop={shop}
          total={total}
          itemsSummary={items}
          shop_id={shop.id}
          lines={reviewLines}
          onEdit={editFromReview}
          onRemove={removeFromReview}
          onQty={qtyFromReview}
          onClose={() => setShowCheckout(false)}
        />
      )}
    </div>
  );
}
