import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { Product } from '../../types';
import SellerNav from '../../components/seller/SellerNav';
import ProductWizard from '../../components/seller/ProductWizard';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { activeFields, clonePresetFields, getPreset, getPresetForCategory, sanitizeFields } from '../../utils/formPresets';

export default function Products() {
  const { shop } = useAuth();
  const presetKey = shop ? getPresetForCategory(shop.category) : null;
  const presetLabel = presetKey ? getPreset(presetKey).label : '';
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [showWizard, setShowWizard] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [applyRequest, setApplyRequest] = useState<{ overwrite: boolean; count: number } | null>(null);

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

  function requestApply(overwrite: boolean) {
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
    setError(null);
    setApplyRequest({ overwrite, count: targets.length });
  }

  async function performApply() {
    if (!shop || !applyRequest) return;
    const preset = getPresetForCategory(shop.category);
    if (!preset) {
      setApplyRequest(null);
      return;
    }
    const { overwrite } = applyRequest;
    const targets = products.filter((p) =>
      overwrite ? true : activeFields(p.custom_fields).length === 0
    );
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
      setApplyRequest(null);
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

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    const { error: err } = await supabase.from('products').delete().eq('id', pendingDelete.id);
    if (!err) setProducts((prev) => prev.filter((x) => x.id !== pendingDelete.id));
    setDeleting(false);
    setPendingDelete(null);
  }

  return (
    <div className="flex min-h-screen flex-col pb-10">
      <SellerNav />
      <main className="mx-auto w-full max-w-[1312px] flex-1 px-5 py-6 sm:px-8 lg:grid lg:grid-cols-[1fr_360px] lg:items-start lg:gap-8">
        <div>
          <h2 className="text-xl font-semibold text-ink">Products ({products.length})</h2>

          {presetKey && (
            <Card className="mt-3 bg-mint/40 p-4">
              <p className="text-sm text-ink">
                Preset <span className="font-bold">{presetLabel}</span>{' '}
                recommended for your shop category.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={saving}
                  onClick={() => requestApply(false)}
                >
                  Apply to empty products
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={saving}
                  onClick={() => requestApply(true)}
                >
                  Overwrite all
                </Button>
              </div>
            </Card>
          )}

          {loading && <p className="mt-3 text-sm text-muted">Loading...</p>}
          {error && (
            <div role="alert" className="mt-3 rounded-card border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((p, i) => (
              <Card
                key={p.id}
                className="p-4 animate-fade-in-up"
                style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate font-semibold text-ink">{p.title}</h3>
                  <Badge tone={p.is_available ? 'mint' : 'muted'}>{p.is_available ? 'On' : 'Off'}</Badge>
                </div>
                <p className="text-sm font-semibold text-emerald">RM {Number(p.price).toFixed(2)}</p>
                <p className="mt-1 text-xs text-muted">
                  {activeFields(p.custom_fields).length} active questions
                </p>
                <div className="mt-3 flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => toggleAvailable(p)} className="flex-1">
                    {p.is_available ? 'Hide' : 'Show'}
                  </Button>
                  <Button size="sm" onClick={() => startEdit(p)} className="flex-1">
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPendingDelete(p)}
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {!loading && products.length === 0 && (
            <EmptyState
              title="No products yet"
              description="Tap + Add product to create your first one."
              className="mt-4"
            />
          )}
        </div>

        <div className="mt-4 lg:mt-0 lg:sticky lg:top-24">
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
            <Card className="p-6 text-center">
              <p className="font-semibold text-ink">Product editor</p>
              <p className="mt-1 text-sm text-muted">
                Add a new product or tap Edit on one above.
              </p>
              <Button type="button" onClick={startAdd} className="mt-4 w-full">
                + Add product
              </Button>
            </Card>
          )}
        </div>
      </main>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete product?"
        message={
          <>
            “{pendingDelete?.title}” will be permanently removed. This can’t be undone.
          </>
        }
        busy={deleting}
        onConfirm={confirmDelete}
        onClose={() => setPendingDelete(null)}
      />

      <ConfirmDialog
        open={applyRequest !== null}
        title={
          applyRequest?.overwrite
            ? 'Overwrite all questions?'
            : 'Apply preset to empty products?'
        }
        message={
          applyRequest?.overwrite
            ? `The ${presetLabel} preset will replace the questions on ${applyRequest.count} ${
                applyRequest.count === 1 ? 'product' : 'products'
              }. Existing questions and options will be lost.`
            : `The ${presetLabel} preset will be added to ${applyRequest?.count} ${
                applyRequest?.count === 1 ? 'product' : 'products'
              } that have no questions yet.`
        }
        confirmLabel={applyRequest?.overwrite ? 'Overwrite all' : 'Apply preset'}
        destructive={applyRequest?.overwrite ?? false}
        busy={saving}
        onConfirm={performApply}
        onClose={() => setApplyRequest(null)}
      />
    </div>
  );
}
