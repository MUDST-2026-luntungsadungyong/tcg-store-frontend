import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <main
      className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-6 py-16 text-center"
      aria-labelledby="not-found-heading"
    >
      {/* Ghost card frame */}
      <div
        className="mb-8 flex h-32 w-24 items-center justify-center rounded-xl border-2 border-dashed border-white/20 bg-bg-surface text-white/20"
        aria-hidden="true"
      >
        <svg
          className="h-12 w-12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
          />
        </svg>
      </div>

      {/* Status & heading */}
      <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-brand-gold">
        404 — Card Not Found
      </p>
      <h1
        id="not-found-heading"
        className="mb-3 text-3xl font-bold text-white"
      >
        This page doesn't exist
      </h1>
      <p className="mb-10 text-gray-400">
        The page may have moved or been removed while the trading platform is being updated.
        Head back to a safe spot below.
      </p>

      {/* Navigation actions */}
      <nav aria-label="Recovery navigation" className="flex flex-col items-center gap-3 sm:flex-row">
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-full bg-brand-blue px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#4a85e0] focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 focus:ring-offset-bg-base"
        >
          Back to homepage
        </Link>
        <Link
          to="/browse"
          className="inline-flex items-center justify-center rounded-full border border-white/10 bg-bg-elevated px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-bg-elevated/80 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-bg-base"
        >
          Explore marketplace
        </Link>
        <Link
          to="/collections/public"
          className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium text-gray-400 transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-bg-base"
        >
          Browse collections
        </Link>
      </nav>
    </main>
  );
}
