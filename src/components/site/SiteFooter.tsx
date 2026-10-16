import { Link } from 'react-router-dom';
import Logo from './Logo';

export default function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto flex w-full max-w-[1312px] flex-col items-center gap-3 px-5 py-8 text-sm text-muted sm:flex-row sm:justify-between sm:px-8">
        <Logo />
        <p>IIUM Hub · Our campus marketplace</p>
        <nav aria-label="Footer" className="flex gap-5">
          <Link to="/how-to-order" className="transition-colors hover:text-emerald">
            How to order
          </Link>
          <a href="https://wa.me/" className="transition-colors hover:text-emerald">
            Contact us
          </a>
        </nav>
      </div>
    </footer>
  );
}
