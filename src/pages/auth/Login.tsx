import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { IIUM_EMAIL_DOMAIN, validateIiumEmail, validatePassword } from '../../utils/validation';
import Logo from '../../components/site/Logo';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const inputCls =
  'h-12 w-full rounded-control border border-line bg-white px-4 text-ink outline-none transition-colors placeholder:text-placeholder focus:border-emerald focus:ring-2 focus:ring-emerald/25';

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
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 w-full max-w-[1312px] items-center justify-between gap-4 px-5 sm:px-8">
          <Logo />
          <Link to="/marketplace" className="text-sm font-semibold text-emerald transition-colors hover:text-emerald/80">
            Back to marketplace
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-start justify-center px-5 py-10 sm:items-center sm:px-8">
        <div className="w-full max-w-md">
          <Card className="p-6 sm:p-8">
            <p className="text-overline font-semibold uppercase tracking-wider text-muted">
              Your IIUM Hub account
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">Welcome back</h1>
            <p className="mt-2 text-sm text-muted">
              Log in to manage your account and campus orders.
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label htmlFor="login-email" className="mb-1 block text-sm font-semibold text-ink">
                  Email address
                </label>
                <input
                  id="login-email"
                  className={inputCls}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={`e.g. ali@${IIUM_EMAIL_DOMAIN}`}
                  autoComplete="email"
                />
              </div>
              <div>
                <label htmlFor="login-password" className="mb-1 block text-sm font-semibold text-ink">
                  Password
                </label>
                <input
                  id="login-password"
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
              <div role="alert" className="mt-4 rounded-control border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <Button onClick={handleSubmit} disabled={loading} className="mt-5 w-full">
              {loading ? 'Logging in...' : 'Log in'}
            </Button>

            <div className="mt-5 rounded-control bg-mint/50 p-4">
              <Link
                to="/seller/signup"
                className="inline-flex items-center gap-1 text-sm font-semibold text-emerald"
              >
                New to selling? Register as a seller
                <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
              <p className="mt-1 text-xs text-muted">
                Use your @{IIUM_EMAIL_DOMAIN} email to register as a verified seller.
              </p>
            </div>
          </Card>

          <p className="mt-4 text-center text-sm text-muted">
            Just looking around?{' '}
            <Link to="/marketplace" className="font-semibold text-emerald">
              You can browse without logging in
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
