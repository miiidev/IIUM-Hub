import { useNavigate } from 'react-router-dom';
import SiteHeader from '../components/site/SiteHeader';
import SiteFooter from '../components/site/SiteFooter';
import MobileTabBar from '../components/site/MobileTabBar';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const STEPS = [
  {
    n: 1,
    title: 'Pick your items',
    body: 'Browse a shop and add what you want. Fill in any options the seller asks for and check the live total before you add it to your order.',
  },
  {
    n: 2,
    title: 'Checkout',
    body: 'Review your order, add your name and Mahalla / room, then confirm. Nothing is ordered until you send the WhatsApp message.',
  },
  {
    n: 3,
    title: 'WhatsApp the seller',
    body: 'Your order opens in WhatsApp with every detail pre-filled. Tap send, then pay the seller directly (DuitNow QR where available).',
  },
];

export default function HowToOrder() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen flex-col pb-16 sm:pb-0">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:px-8">
        <p className="text-overline font-semibold uppercase tracking-wider text-muted">
          From campus, for campus
        </p>
        <h1 className="mt-2 text-3xl font-bold text-ink sm:text-4xl">How to order</h1>
        <p className="mt-3 text-base text-muted">
          IIUM Hub is an honour-system marketplace. Orders are arranged directly with the seller
          over WhatsApp — no online payment is taken on IIUM Hub.
        </p>

        <ol className="mt-8 space-y-4">
          {STEPS.map((s) => (
            <li key={s.n}>
              <Card className="flex gap-4 p-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mint text-sm font-bold text-emerald">
                  {s.n}
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-ink">{s.title}</h2>
                  <p className="mt-1 text-sm text-muted">{s.body}</p>
                </div>
              </Card>
            </li>
          ))}
        </ol>

        <Card className="mt-6 p-5">
          <h2 className="text-lg font-semibold text-ink">Payment</h2>
          <p className="mt-1 text-sm text-muted">
            Where a seller has set up DuitNow, their QR and account appear at checkout. Otherwise,
            agree on payment with the seller in the WhatsApp chat. IIUM Hub never collects card or
            bank details.
          </p>
        </Card>

        <div className="mt-8">
          <Button onClick={() => navigate('/marketplace')}>Browse the marketplace</Button>
        </div>
      </main>
      <SiteFooter />
      <MobileTabBar />
    </div>
  );
}
