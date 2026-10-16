import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { Product } from '../../types';
import SellerNav from '../../components/seller/SellerNav';
import ProductWizard from '../../components/seller/ProductWizard';
import { activeFields, clonePresetFields, getPreset, getPresetForCategory, sanitizeFields } from '../../utils/formPresets';

export default function Products() {
  const { shop } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [showWizard, setShowWizard] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

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
      setError(e instanceof Error ? e.message : 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop?.id]);

  function startAdd() {
    setEditing(null);
    setShowWizard(true);
    setError(null);
  }

  function startEdit(p: Product) {
    setEditing(p);
    setShowWizard(true);
    setError(null);
  }

  async function handleBulkApply(overwrite: boolean) {
    if (!shop) return;
    const preset = getPresetForCategory(shop.category);
    if (!preset) return;
    const targets = products.filter((p) =>
      overwrite ? true : activeFields(p.custom_fields).length === 0
    );
    if (targets.length === 0) {
      setError(
        overwrite
          ? 'No products to update.'
          : 'All products already have questions. Tick overwrite to replace.'
      );
      return;
    }
    if (
      !window.confirm(
        `Apply the ${getPreset(preset).label} preset to ${targets.length} products?` +
          (overwrite ? ' Existing questions will be replaced.' : '')
      )
    )
      return;
    setSaving(true);
    setError(null);
    try {
      const fields = sanitizeFields(clonePresetFields(preset));
      for (const p of targets) {
        const { error: err } = await supabase
          .from('products')
          .update({ custom_fields: fields })
          .eq('id', p.id);
        if (err) throw err;
      }
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to apply preset.');
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
    if (!window.confirm(`Delete "${p.title}"?`)) return;
    const { error: err } = await supabase.from('products').delete().eq('id', p.id);
    if (!err) setProducts((prev) => prev.filter((x) => x.id !== p.id));
  }

  return (
    <div className="mx-auto w-full max-w-md sm:max-w-2xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-[1600px] min-h-screen bg-slate-50 pb-10">
      <SellerNav />
      <main className="p-4 sm:p-6 lg:grid lg:grid-cols-[1fr_320px] lg:gap-6 lg:items-start">
        <div>
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-bold text-slate-900">Products ({products.length})</h2>
            <button
              type="button"
              onClick={startAdd}
              className="h-11 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white"
            >
              + Add product
            </button>
          </div>
          {shop && getPresetForCategory(shop.category) && (
            <div className="mt-2 rounded-xl border border-slate-300 bg-white p-3">
              <p className="text-sm text-slate-800">
                Preset <span className="font-bold">{getPreset(getPresetForCategory(shop.category)!).label}</span>{' '}
                recommended for your shop category.
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleBulkApply(false)}
                  className="h-11 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-800 disabled:opacity-50"
                >
                  Apply to empty products
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleBulkApply(true)}
                  className="h-11 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-800 disabled:opacity-50"
                >
                  Overwrite all
                </button>
              </div>
            </div>
          )}
          {loading && <p className="mt-2 text-sm text-slate-500">Loading...</p>}
          {error && (
            <div className="mt-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}
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
                    {p.is_available ? 'On' : 'Off'}
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-700">RM {Number(p.price).toFixed(2)}</p>
                <p className="mt-1 text-xs text-slate-600">
                  {activeFields(p.custom_fields).length} active questions
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => toggleAvailable(p)}
                    className="h-11 flex-1 rounded-xl border border-slate-200 text-sm font-bold text-slate-700"
                  >
                    {p.is_available ? 'Hide' : 'Show'}
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
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
          {!loading && products.length === 0 && (
            <div className="mt-3 rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600">
              No products yet. Tap + Add product to create your first one.
            </div>
          )}
        </div>

        <div className="mt-4 lg:mt-0 rounded-xl border border-slate-200 bg-white p-4 lg:sticky lg:top-24">
          {showWizard ? (
            <ProductWizard
              editing={editing}
              products={products}
              onDone={() => {
                setShowWizard(false);
                setEditing(null);
                load();
              }}
              onCancel={() => {
                setShowWizard(false);
                setEditing(null);
              }}
            />
          ) : (
            <div className="p-2 text-center">
              <p className="text-sm font-bold text-slate-900">Product editor</p>
              <p className="mt-1 text-sm text-slate-600">
                Add a new product or tap Edit on one above.
              </p>
              <button
                type="button"
                onClick={startAdd}
                className="mt-3 h-12 w-full rounded-xl bg-slate-900 font-bold text-white"
              >
                + Add product
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
