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
import { SHOP_CATEGORIES } from '../../utils/categories';
import Logo from '../../components/site/Logo';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const inputCls =
  'h-12 w-full rounded-control border border-line bg-white px-4 text-ink outline-none transition-colors placeholder:text-placeholder focus:border-emerald focus:ring-2 focus:ring-emerald/25';

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
    if (!shopName.trim()) return setError('Shop name is required.');

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
          'Account created! Please verify your email (check your IIUM inbox), then log in to set up your shop.'
        );
      } else {
        navigate('/seller', { replace: true });
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Signup failed. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 w-full max-w-[1312px] items-center justify-between gap-4 px-5 sm:px-8">
          <Logo />
          <Link to="/" className="text-sm font-semibold text-emerald transition-colors hover:text-emerald/80">
            Back to marketplace
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-start justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-lg">
          <Card className="p-6 sm:p-8">
            <p className="text-overline font-semibold uppercase tracking-wider text-muted">
              Seller registration
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">Register Seller Shop</h1>
            <p className="mt-2 text-sm text-muted">One account for one shop only.</p>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="su-email" className="mb-1 block text-sm font-semibold text-ink">
                  IIUM email <span className="text-danger">*</span>
                </label>
                <input
                  id="su-email"
                  className={inputCls}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={`e.g. username@${IIUM_EMAIL_DOMAIN}`}
                  autoComplete="email"
                />
                <p className="mt-1 text-xs text-muted">
                  Only @{IIUM_EMAIL_DOMAIN} email addresses are accepted.
                </p>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="su-password" className="mb-1 block text-sm font-semibold text-ink">
                  Password <span className="text-danger">*</span>
                </label>
                <input
                  id="su-password"
                  className={inputCls}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  autoComplete="new-password"
                />
                <p className="mt-1 text-xs text-muted">At least 6 characters.</p>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="su-shop" className="mb-1 block text-sm font-semibold text-ink">
                  Shop name <span className="text-danger">*</span>
                </label>
                <input
                  id="su-shop"
                  className={inputCls}
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="e.g. Kak Jah Nasi Lemak"
                />
              </div>
              <div>
                <label htmlFor="su-mahalla" className="mb-1 block text-sm font-semibold text-ink">
                  Mahalla <span className="text-danger">*</span>
                </label>
                <select
                  id="su-mahalla"
                  className={inputCls}
                  value={mahalla}
                  onChange={(e) => setMahalla(e.target.value)}
                >
                  {MAHALLA_FORM_OPTIONS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="su-category" className="mb-1 block text-sm font-semibold text-ink">
                  Category <span className="text-danger">*</span>
                </label>
                <select
                  id="su-category"
                  className={inputCls}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {SHOP_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="su-wa" className="mb-1 block text-sm font-semibold text-ink">
                  WhatsApp number (601...) <span className="text-danger">*</span>
                </label>
                <input
                  id="su-wa"
                  className={inputCls}
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="e.g. 60123456789"
                  inputMode="tel"
                />
                <p className="mt-1 text-xs text-muted">Use country code 60, without + or spaces.</p>
              </div>
            </div>

            {error && (
              <div role="alert" className="mt-4 rounded-control border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}
            {info && (
              <div className="mt-4 rounded-control border border-blue-200 bg-blue-50 p-3 text-sm font-medium text-blue-800">
                {info}{' '}
                <Link to="/seller/login" className="font-bold underline">
                  To log in
                </Link>
              </div>
            )}

            <Button onClick={handleSubmit} disabled={loading} className="mt-5 w-full">
              {loading ? 'Registering...' : 'Register & Open Shop'}
            </Button>
            <p className="mt-3 text-center text-sm text-muted">
              Already have an account?{' '}
              <Link to="/seller/login" className="font-semibold text-emerald">
                Log in
              </Link>
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
}
