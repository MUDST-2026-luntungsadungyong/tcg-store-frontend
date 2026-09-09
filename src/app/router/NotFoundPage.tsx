import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-6 text-center">
      <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-brand-gold">404</p>
      <h1 className="mb-3 text-4xl font-bold text-white">Page not found</h1>
      <p className="mb-8 text-gray-400">The page may have moved while the trading platform is being updated.</p>
      <Link
        to="/"
        className="inline-flex items-center justify-center rounded-full bg-brand-blue px-4 py-2 font-medium text-white transition-colors hover:bg-[#4a85e0] focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 focus:ring-offset-bg-base"
      >
        Back to homepage
      </Link>
    </main>
  );
}
