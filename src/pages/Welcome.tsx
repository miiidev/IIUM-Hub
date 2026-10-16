import { useNavigate } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import Button from '../components/ui/Button';

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-cream to-mint px-6 py-16 text-center">
      <div className="flex items-center gap-2 animate-fade-in-up" style={{ animationDelay: '0ms' }}>
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald text-white">
          <ShoppingBag size={26} strokeWidth={2.5} aria-hidden="true" />
        </span>
        <span className="text-3xl font-bold text-emerald">IIUM Hub</span>
      </div>

      <p
        className="mt-8 text-overline font-semibold uppercase tracking-[0.2em] text-emerald/70 animate-fade-in-up"
        style={{ animationDelay: '70ms' }}
      >
        From campus, for campus
      </p>
      <h1
        className="mt-3 w-full max-w-md text-3xl font-bold tracking-tight text-ink animate-fade-in-up sm:text-5xl"
        style={{ animationDelay: '140ms' }}
      >
        IIUM Campus Marketplace
      </h1>
      <p
        className="mt-4 w-full max-w-sm text-base text-muted animate-fade-in-up"
        style={{ animationDelay: '210ms' }}
      >
        Food, printing and everyday essentials. All nearby.
      </p>

      <div className="mt-9 animate-fade-in-up" style={{ animationDelay: '280ms' }}>
        <Button onClick={() => navigate('/start')} className="min-w-[200px]">
          Get started
        </Button>
      </div>
    </div>
  );
}
