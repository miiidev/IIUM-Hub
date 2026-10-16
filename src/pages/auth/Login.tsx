import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { IIUM_EMAIL_DOMAIN, validateIiumEmail, validatePassword } from '../../utils/validation';

const inputCls =
  'h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-900 outline-none focus:border-emerald-600';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/seller';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    const eErr = validateIiumEmail(email);
    if (eErr) return setError(eErr);
    const pErr = validatePassword(password);
    if (pErr) return setError(pErr);
    setLoading(true);
    try {
      await signIn(email, password);
      navigate(from, { replace: true });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Login failed. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md min-h-screen bg-slate-50 p-4 sm:p-6">
      <Link to="/" className="inline-flex h-11 items-center text-sm font-bold text-slate-700">
        ← Marketplace
      </Link>
      <h1 className="mt-2 text-xl sm:text-2xl font-bold text-slate-900">Seller Log In</h1>
      <p className="text-sm text-slate-600">
        Only <span className="font-bold">@{IIUM_EMAIL_DOMAIN}</span> accounts.
      </p>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <div>
          <label className="mb-1 block text-sm font-bold text-slate-900">IIUM Email *</label>
          <input
            className={inputCls}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={`e.g. ali@${IIUM_EMAIL_DOMAIN}`}
            autoComplete="email"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-bold text-slate-900">Password *</label>
          <input
            className={inputCls}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </div>
      </div>

      {error && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="mt-4 h-12 w-full rounded-xl bg-emerald-600 font-bold text-white disabled:opacity-60"
      >
        {loading ? 'Logging in...' : 'Log In'}
      </button>
      <p className="mt-3 text-center text-sm text-slate-600">
        No account yet?{' '}
        <Link to="/seller/signup" className="font-bold text-emerald-700">
          Register shop
        </Link>
      </p>
    </div>
  );
}
