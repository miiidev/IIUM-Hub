import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { validateWhatsappMY } from '../../utils/validation';
import { MAHALLA_FORM_OPTIONS } from '../../utils/mahallas';
import { SHOP_CATEGORIES } from '../../utils/categories';
import SellerNav from '../../components/seller/SellerNav';


const inputCls =
  'h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-900 outline-none focus:border-emerald-600';

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
      setError(e instanceof Error ? e.message : 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md sm:max-w-2xl lg:max-w-4xl min-h-screen bg-slate-50 pb-10">
      <SellerNav />
      <main className="p-4 sm:p-6">
        <div className="rounded-xl border border-slate-200 bg-white p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-bold text-slate-900">Shop Name *</label>
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-bold text-slate-900">WhatsApp (601...) *</label>
            <input className={inputCls} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} inputMode="tel" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-bold text-slate-900">Mahalla</label>
            <select className={inputCls} value={mahalla} onChange={(e) => setMahalla(e.target.value)}>
              {MAHALLA_FORM_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-bold text-slate-900">Category</label>
            {shop && category !== shop.category && (
              <p className="mt-1 text-xs text-slate-600">
                Category changed — go to Products to apply the new preset.
              </p>
            )}
            <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
              {SHOP_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-bold text-slate-900">DuitNow Account No. (shown at checkout)</label>
            <input className={inputCls} value={account} onChange={(e) => setAccount(e.target.value)} placeholder="e.g. 60123456789 / 1234567890" inputMode="numeric" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-bold text-slate-900">Shop description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={300}
              placeholder="Tell buyers what you sell and when you're open"
              className="min-h-[96px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-emerald-600"
            />
            <p className="mt-1 text-xs text-slate-500">{description.length}/300</p>
          </div>
          <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-bold text-slate-900">Shop Banner</p>
            <p className="text-xs text-slate-500">Shown on your shop card and page. JPG/PNG, max 2MB.</p>
            <div className="mt-2">
              {bannerUrl ? (
                <img src={bannerUrl} alt="Shop banner" className="aspect-video w-full rounded-xl border border-slate-200 bg-white object-cover" />
              ) : (
                <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-400">
                  No banner
                </div>
              )}
              <div className="mt-2 flex gap-2">
                <label className="inline-flex h-12 flex-1 cursor-pointer items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-bold text-white">
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
                  <button
                    type="button"
                    onClick={() => setBannerUrl('')}
                    disabled={uploadingBanner}
                    className="h-12 rounded-xl border border-red-200 px-4 text-sm font-bold text-red-600 disabled:opacity-40"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-bold text-slate-900">QR DuitNow</p>
            <div className="mt-2 flex items-center gap-3">
              {qrUrl ? (
                <img src={qrUrl} alt="QR DuitNow" className="h-24 w-24 rounded-xl border border-slate-200 bg-white object-contain" />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-400">
                  No QR
                </div>
              )}
              <label className="inline-flex h-12 cursor-pointer items-center rounded-xl bg-slate-900 px-4 text-sm font-bold text-white">
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
          <label className="sm:col-span-2 flex min-h-[48px] items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4">            <span className="text-sm font-bold text-slate-900">
              Shop Open {isActive ? '(visible on Marketplace)' : '(hidden)'}
            </span>
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-6 w-6" />
          </label>
          <p className="sm:col-span-2 text-xs text-slate-500 break-all">
            Shop link: /s/{shop!.slug}
          </p>
        </div>

        {error && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}
        {ok && (
          <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-700">
            Settings saved.
          </div>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-4 h-12 w-full rounded-xl bg-emerald-600 font-bold text-white disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </main>
    </div>
  );
}
