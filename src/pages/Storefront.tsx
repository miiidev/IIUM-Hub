import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, MapPin, Minus, Plus, ShoppingBag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { CustomValue, Product, Shop } from '../types';
import CheckoutModal from '../components/CheckoutModal';
import ProductSheet from '../components/buyer/ProductSheet';
import ProductImage from '../components/ProductImage';
import SiteHeader from '../components/site/SiteHeader';
import SiteFooter from '../components/site/SiteFooter';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { activeFields } from '../utils/formPresets';
import { formatRange, priceRange } from '../utils/priceRange';
import { buildCartSummary, removeLine, setLineQty, upsertLine, type Cart } from '../utils/cart';
import { categoryLabel } from '../utils/categories';
import type { ReviewLine } from '../components/CheckoutModal';

const wrapCls = 'mx-auto w-full max-w-[1312px] min-h-screen';

interface Draft {
  productId: string;
  values: Record<string, CustomValue>;
  qty: number;
  editing: boolean;
  errors: Record<string, string>;
}

const STEPS = ['Pick items', 'Checkout', 'WhatsApp'];

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
      <div className={`${wrapCls} px-5 py-6 sm:px-8`}>
        <p className="text-sm text-muted">Loading shop...</p>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className={`${wrapCls} px-5 py-6 sm:px-8`}>
        <Link to="/marketplace" className="inline-flex h-11 items-center text-sm font-semibold text-emerald">
          ← Back
        </Link>
        <div role="alert" className="mt-3 rounded-card border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error ?? 'Shop not found (invalid slug).'}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col pb-28 sm:pb-0">
      <SiteHeader />

      <main className="mx-auto w-full max-w-[1312px] flex-1 px-5 pt-6 sm:px-8 lg:grid lg:grid-cols-[1fr_340px] lg:items-start lg:gap-8">
        <div>
          <div className="flex items-center justify-between gap-3">
            <Link
              to="/marketplace"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald transition-colors hover:text-emerald/80"
            >
              <ArrowLeft size={16} aria-hidden="true" /> Marketplace
            </Link>
            <span className="inline-flex items-center gap-1.5 text-sm text-muted">
              <MapPin size={14} aria-hidden="true" /> {shop.mahalla}
            </span>
          </div>

          {shop.banner_url && (
            <img
              src={shop.banner_url}
              alt=""
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
              className="mt-4 h-40 w-full rounded-card bg-mint/40 object-cover animate-fade-in sm:h-56"
            />
          )}

          <p className="mt-4 text-overline font-semibold uppercase tracking-wider text-muted">
            {categoryLabel(shop.category)} · {shop.mahalla}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">{shop.name}</h1>
            <Badge tone="mint" dot>
              {shop.is_active ? 'Active' : 'Closed'}
            </Badge>
          </div>
          <p className="mt-2 text-base text-muted">Choose items and quantities before checkout.</p>
          {shop.description && <p className="mt-1 text-sm text-muted">{shop.description}</p>}

          <div className="mt-8 flex items-end justify-between gap-3">
            <h2 className="text-2xl font-semibold text-ink sm:text-3xl">Choose your items</h2>
            {products.length > 0 && (
              <p className="pb-1 text-sm text-muted">
                {products.length} {products.length === 1 ? 'item' : 'items'} available
              </p>
            )}
          </div>

          {products.length === 0 && (
            <div className="mt-3 rounded-card border border-line bg-white p-6 text-center text-sm text-muted">
              No products available right now.
            </div>
          )}

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {products.map((p, i) => {
              const fields = p.custom_fields ?? [];
              const hasForm = activeFields(fields).length > 0;
              const line = cart[p.id];
              const inCart = !!line && line.qty > 0;
              const base = Number(p.price) || 0;
              const lineUnit = summary.lines.find((l) => l.productId === p.id)?.item.unitPrice ?? base;

              return (
                <Card
                  key={p.id}
                  id={`product-${p.id}`}
                  className={`group p-4 animate-fade-in-up ${
                    highlightId === p.id ? 'ring-2 ring-emerald' : ''
                  }`}
                  style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                >
                  <div className="mb-3 overflow-hidden rounded-control">
                    <ProductImage
                      src={p.image_url}
                      className="aspect-video w-full rounded-control transition-transform duration-300 ease-out-soft group-hover:scale-105"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="break-words font-semibold text-ink">{p.title}</h3>
                    <p className="mt-0.5 text-sm font-semibold text-emerald">
                      {hasForm ? formatRange(priceRange(base, fields)) : `RM ${base.toFixed(2)}`}
                    </p>
                    {hasForm && <p className="text-xs text-muted">Price varies by your answers</p>}
                  </div>

                  {hasForm ? (
                    inCart ? (
                      <div className="mt-3 border-t border-line pt-3 animate-fade-in">
                        <p className="text-sm text-muted">
                          In order:{' '}
                          <span className="font-semibold text-ink">
                            {line.qty} × RM {lineUnit.toFixed(2)}
                          </span>
                        </p>
                        <div className="mt-2 flex gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(p)}
                            className="flex-1"
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setCart((prev) => removeLine(prev, p.id))}
                            aria-label={`Remove ${p.title}`}
                            className="border-red-200 text-red-600 hover:bg-red-50"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button type="button" onClick={() => openAdd(p)} className="mt-3 w-full">
                        Add
                      </Button>
                    )
                  ) : (
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        className="flex h-11 w-11 items-center justify-center rounded-control border border-line bg-white text-ink transition-colors hover:bg-mint/30"
                        onClick={() =>
                          setCart((prev) => setLineQty(prev, p.id, (prev[p.id]?.qty ?? 0) - 1))
                        }
                        aria-label={`Decrease ${p.title}`}
                      >
                        <Minus size={18} aria-hidden="true" />
                      </button>
                      <span
                        key={inCart ? line.qty : 0}
                        className="w-7 text-center font-semibold text-ink animate-scale-in"
                      >
                        {inCart ? line.qty : 0}
                      </span>
                      <button
                        type="button"
                        className="flex h-11 w-11 items-center justify-center rounded-control bg-emerald text-white transition-colors hover:bg-emerald/90"
                        onClick={() =>
                          setCart((prev) => upsertLine(prev, p.id, (prev[p.id]?.qty ?? 0) + 1, {}))
                        }
                        aria-label={`Add ${p.title}`}
                      >
                        <Plus size={18} aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          <div className="mt-6 flex flex-col gap-2 rounded-card bg-mint/50 p-4 sm:flex-row sm:items-center sm:gap-4">
            <p className="text-sm font-semibold text-ink">How to order</p>
            <ol className="flex flex-wrap items-center gap-2 text-sm font-semibold text-emerald">
              {STEPS.map((label, i) => (
                <li key={label} className="inline-flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald text-[11px] font-bold text-white">
                    {i + 1}
                  </span>
                  {label}
                  {i < STEPS.length - 1 && <ChevronRight size={14} aria-hidden="true" />}
                </li>
              ))}
            </ol>
            <p className="text-xs text-muted sm:ml-auto">
              Send your order via WhatsApp after checkout, then track your order.
            </p>
          </div>
        </div>

        <aside className="sticky top-24 mt-8 hidden lg:mt-0 lg:block">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-ink">Order Summary</h2>
              <ShoppingBag size={20} className="text-emerald" aria-hidden="true" />
            </div>
            {items.length === 0 ? (
              <p className="mt-3 text-sm text-muted">No items yet. Pick from the menu and use + to add.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {items.map((it, i) => (
                  <li key={i} className="flex justify-between gap-3 text-sm">
                    <span className="text-muted">
                      {it.title} × {it.qty}
                    </span>
                    <span className="font-semibold text-ink">RM {it.lineTotal.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 border-t border-line pt-4">
              <div className="flex items-end justify-between">
                <p className="text-sm text-muted">
                  {count} {count === 1 ? 'item' : 'items'}
                </p>
                <p key={total} className="text-2xl font-bold text-ink animate-scale-in">RM {total.toFixed(2)}</p>
              </div>
              <Button
                variant="secondary"
                onClick={() => setShowCheckout(true)}
                disabled={count === 0}
                className="mt-4 w-full"
              >
                Review order
              </Button>
              <p className="mt-2 text-center text-xs text-muted">
                {count === 0 ? 'Add items to enable checkout' : 'Review your selection before continuing.'}
              </p>
            </div>
          </Card>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted">
            Payment via DuitNow QR available at checkout.
          </p>
        </aside>
      </main>

      <SiteFooter />

      <div className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white p-4 animate-fade-in-up sm:hidden">
        <div className="mx-auto flex max-w-[1312px] items-center justify-between gap-3">
          <p key={total} className="text-sm font-semibold text-ink animate-scale-in">
            {count} items · RM {total.toFixed(2)}
          </p>
          <Button
            onClick={() => setShowCheckout(true)}
            disabled={count === 0}
            className="min-w-[170px]"
          >
            Review order
          </Button>
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
