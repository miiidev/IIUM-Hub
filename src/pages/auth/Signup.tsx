import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  IIUM_EMAIL_DOMAIN,
  validateIiumEmail,
  validatePassword,
  validateWhatsappMY,
} from '../../utils/validation';
import { MAHALLA_FORM_OPTIONS } from '../../utils/mahallas';

const CATEGORIES = ['food', 'printing', 'repairs', 'rentals', 'custom'];

const inputCls =
  'h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-900 outline-none focus:border-emerald-600';

export default function Signup() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [shopName, setShopName] = useState('');
  const [mahalla, setMahalla] = useState('Faruq');
  const [category, setCategory] = useState('food');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    setInfo(null);
    const eErr = validateIiumEmail(email);
    if (eErr) return setError(eErr);
    const pErr = validatePassword(password);
    if (pErr) return setError(pErr);
    const wErr = validateWhatsappMY(whatsapp);
    if (wErr) return setError(wErr);
    if (!shopName.trim()) return setError('Nama kedai diperlukan.');

    setLoading(true);
    try {
      const { needsConfirmation } = await signUp({
        email,
        password,
        whatsappNumber: whatsapp.replace(/\D/g, ''),
        shopName,
        mahalla,
        category,
      });
      if (needsConfirmation) {
        setInfo(
          'Akaun dicipta! Sila sahkan email anda (cek inbox IIUM), kemudian log masuk untuk siapkan kedai.'
        );
      } else {
        navigate('/seller', { replace: true });
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Pendaftaran gagal. Cuba lagi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md sm:max-w-lg min-h-screen bg-slate-50 p-4 sm:p-6 pb-10">
      <Link to="/" className="inline-flex h-11 items-center text-sm font-bold text-slate-700">
        ← Marketplace
      </Link>
      <h1 className="mt-2 text-xl sm:text-2xl font-bold text-slate-900">Daftar Kedai Seller</h1>
      <p className="text-sm text-slate-600">
        Email <span className="font-bold">@{IIUM_EMAIL_DOMAIN}</span> sahaja. Satu akaun = satu kedai.
      </p>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-bold text-slate-900">Email IIUM *</label>
          <input
            className={inputCls}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={`cth: ali@${IIUM_EMAIL_DOMAIN}`}
            autoComplete="email"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-bold text-slate-900">Password (min 6) *</label>
          <input
            className={inputCls}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-bold text-slate-900">Nama Kedai *</label>
          <input
            className={inputCls}
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            placeholder="cth: Nasi Lemak Kak Jah"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-bold text-slate-900">Mahalla *</label>
          <select className={inputCls} value={mahalla} onChange={(e) => setMahalla(e.target.value)}>
            {MAHALLA_FORM_OPTIONS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-bold text-slate-900">Kategori *</label>
          <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-bold text-slate-900">
            Nombor WhatsApp (601...) *
          </label>
          <input
            className={inputCls}
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="cth: 60123456789"
            inputMode="tel"
          />
        </div>
      </div>

      {error && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}
      {info && (
        <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm font-medium text-blue-800">
          {info}{' '}
          <Link to="/seller/login" className="font-bold underline">
            Ke log masuk
          </Link>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="mt-4 h-12 w-full rounded-xl bg-emerald-600 font-bold text-white disabled:opacity-60"
      >
        {loading ? 'Mendaftar...' : 'Daftar & Buka Kedai'}
      </button>
      <p className="mt-3 text-center text-sm text-slate-600">
        Sudah ada akaun?{' '}
        <Link to="/seller/login" className="font-bold text-emerald-700">
          Log masuk
        </Link>
      </p>
    </div>
  );
}
