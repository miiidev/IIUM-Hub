import { useNavigate } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import Button from '../components/ui/Button';

export default function SellerOrBuyer() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-cream to-mint px-6 py-16 text-center">
      <div className="flex items-center gap-2 animate-fade-in-up" style={{ animationDelay: '0ms' }}>
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald text-white">
          <ShoppingBag size={26} strokeWidth={2.5} aria-hidden="true" />
        </span>
        <span className="text-3xl font-bold text-emerald">IIUM Hub</span>
      </div>

      <h1
        className="mt-8 w-full max-w-lg text-2xl font-bold tracking-tight text-ink animate-fade-in-up sm:text-3xl"
        style={{ animationDelay: '90ms' }}
      >
        Are you a BUYER or a SELLER?
      </h1>

      <div
        className="mt-8 flex flex-wrap items-center justify-center gap-3 animate-fade-in-up"
        style={{ animationDelay: '180ms' }}
      >
        <Button onClick={() => navigate('/marketplace')} className="min-w-[140px]">
          Buyer
        </Button>
        <Button onClick={() => navigate('/seller/login')} className="min-w-[140px]">
          Seller
        </Button>
      </div>
    </div>
  );
}
