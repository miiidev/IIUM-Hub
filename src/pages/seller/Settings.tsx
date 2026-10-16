import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { validateWhatsappMY } from '../../utils/validation';
import { MAHALLA_FORM_OPTIONS } from '../../utils/mahallas';
import { SHOP_CATEGORIES } from '../../utils/categories';
import SellerNav from '../../components/seller/SellerNav';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const inputCls =
  'h-12 w-full rounded-control border border-line bg-white px-4 text-ink outline-none transition-colors placeholder:text-placeholder focus:border-emerald focus:ring-2 focus:ring-emerald/25';

export default function Settings() {
  const { shop, refreshShop } = useAuth();
  const [name, setName] = useState(shop?.name ?? '');
  const [whatsapp, setWhatsapp] = useState(shop?.whatsapp_number ?? '');
  const [mahalla, setMahalla] = useState(shop?.mahalla ?? 'Faruq');
  const [category, setCategory] = useState(shop?.category ?? 'food');
  const [isActive, setIsActive] = useState(shop?.is_active ?? true);
  const [account, setAccount] = useState(shop?.duitnow_account ?? '');
  const [qrUrl, setQrUrl] = useState(shop?.duitnow_qr_url ?? '');
  const [bannerUrl, setBannerUrl] = useState(shop?.banner_url ?? '');
  const [description, setDescription] = useState(shop?.description ?? '');
  const [uploading, setUploading] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
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
    setBannerUrl(shop.banner_url ?? '');
    setDescription(shop.description ?? '');
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
      setError(e instanceof Error ? e.message : 'Failed to upload QR.');
    } finally {
      setUploading(false);
    }
  }

  async function handleBannerUpload(file: File) {
    if (!shop) return;
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('Banner must be an image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Banner must be 2MB or smaller.');
      return;
    }
    setUploadingBanner(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
      const path = `${shop.id}/banner.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('shop-banners')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('shop-banners').getPublicUrl(path);
      setBannerUrl(`${data.publicUrl}?t=${Date.now()}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to upload banner.');
    } finally {
      setUploadingBanner(false);
    }
  }

  async function handleSave() {
    if (!shop) return;
    setError(null);
    setOk(false);
    if (!name.trim()) return setError('Shop name is required.');
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
          banner_url: bannerUrl.split('?')[0] || null,
          description: description.trim() || null,
        })
        .eq('id', shop.id);
      if (err) throw err;
      await refreshShop();
      setOk(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save profile settings.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col pb-10">
      <SellerNav />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-6 sm:px-8">
        <h1 className="mb-5 text-2xl font-bold text-ink sm:text-3xl">Profile Settings</h1>
        <Card className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-6 animate-fade-in-up">
          <div className="sm:col-span-2">
            <label htmlFor="set-name" className="mb-1 block text-sm font-semibold text-ink">Shop name *</label>
            <input id="set-name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="set-wa" className="mb-1 block text-sm font-semibold text-ink">WhatsApp (601...) *</label>
            <input id="set-wa" className={inputCls} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} inputMode="tel" />
          </div>
          <div>
            <label htmlFor="set-mahalla" className="mb-1 block text-sm font-semibold text-ink">Mahalla</label>
            <select id="set-mahalla" className={inputCls} value={mahalla} onChange={(e) => setMahalla(e.target.value)}>
              {MAHALLA_FORM_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="set-category" className="mb-1 block text-sm font-semibold text-ink">Category</label>
            {shop && category !== shop.category && (
              <p className="mt-1 text-xs text-muted">
                Category changed — go to Products to apply the new preset.
              </p>
            )}
            <select id="set-category" className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
              {SHOP_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="set-account" className="mb-1 block text-sm font-semibold text-ink">DuitNow account no. (shown at checkout)</label>
            <input id="set-account" className={inputCls} value={account} onChange={(e) => setAccount(e.target.value)} placeholder="e.g. 60123456789 / 1234567890" inputMode="numeric" />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="set-description" className="mb-1 block text-sm font-semibold text-ink">Shop description (optional)</label>
            <textarea
              id="set-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={300}
              placeholder="Tell buyers what you sell and when you're open"
              className="min-h-[96px] w-full rounded-control border border-line bg-white px-4 py-3 text-ink outline-none transition-colors placeholder:text-placeholder focus:border-emerald focus:ring-2 focus:ring-emerald/25"
            />
            <p className="mt-1 text-xs text-muted">{description.length}/300</p>
          </div>
          <div className="sm:col-span-2 rounded-control border border-line bg-cream p-3">
            <p className="text-sm font-semibold text-ink">Shop banner</p>
            <p className="text-xs text-muted">Shown on your shop card and page. JPG/PNG, max 2MB.</p>
            <div className="mt-2">
              {bannerUrl ? (
                <img src={bannerUrl} alt="Shop banner" className="aspect-video w-full rounded-control border border-line bg-white object-cover" />
              ) : (
                <div className="flex aspect-video w-full items-center justify-center rounded-control border border-line bg-white text-sm font-semibold text-muted">
                  No banner
                </div>
              )}
              <div className="mt-2 flex gap-2">
                <label className="inline-flex h-12 flex-1 cursor-pointer items-center justify-center rounded-control bg-emerald px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald/90">
                  {uploadingBanner ? 'Uploading...' : 'Upload banner'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingBanner}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleBannerUpload(f);
                      e.target.value = '';
                    }}
                  />
                </label>
                {bannerUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setBannerUrl('')}
                    disabled={uploadingBanner}
                    className="border-red-200 text-danger hover:bg-red-50"
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>
          <div className="sm:col-span-2 rounded-control border border-line bg-cream p-3">
            <p className="text-sm font-semibold text-ink">QR DuitNow</p>
            <div className="mt-2 flex items-center gap-3">
              {qrUrl ? (
                <img src={qrUrl} alt="QR DuitNow" className="h-24 w-24 rounded-control border border-line bg-white object-contain" />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-control border border-line bg-white text-xs font-semibold text-muted">
                  No QR
                </div>
              )}
              <label className="inline-flex h-12 cursor-pointer items-center rounded-control bg-emerald px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald/90">
                {uploading ? 'Uploading...' : 'Upload QR'}
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
          <label className="flex min-h-[48px] items-center justify-between rounded-control border border-line bg-cream px-4 sm:col-span-2">
            <span className="text-sm font-semibold text-ink">
              Shop open {isActive ? '(visible on Marketplace)' : '(hidden)'}
            </span>
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-6 w-6 accent-emerald" />
          </label>
          <p className="break-all text-xs text-muted sm:col-span-2">
            Shop link: /s/{shop!.slug}
          </p>
        </Card>

        {error && (
          <div role="alert" className="mt-3 rounded-control border border-red-200 bg-red-50 p-3 text-sm font-medium text-danger">
            {error}
          </div>
        )}
        {ok && (
          <div className="mt-3 rounded-control border border-emerald/30 bg-mint/40 p-3 text-sm font-semibold text-emerald animate-fade-in-up">
            Profile settings saved.
          </div>
        )}
        <Button onClick={handleSave} disabled={saving} className="mt-4 w-full">
          {saving ? 'Saving...' : 'Save Profile'}
        </Button>
      </main>
    </div>
  );
}
