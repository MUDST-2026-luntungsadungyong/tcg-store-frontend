import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight, Layers, Medal, RefreshCw, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getTopCollectors, type CollectorRanking } from '@/features/collection/api/leaderboard';
import { listingDiscoveryApi } from '@/features/discovery/api/listings';
import { getMostExpensiveOnSaleCards } from '@/features/discovery/lib/expensiveCards';
import type { CardListing } from '@/entities/card/model/types';
import { Skeleton } from '@/shared/components/Skeleton';

type HomeBanner = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  href: string;
};

const HOME_BANNERS: HomeBanner[] = [
  {
    id: 'pokemon-30th-celebration',
    eyebrow: 'Featured update',
    title: 'Pokémon TCG: 30th Celebration',
    description: 'Celebrate three decades of Pokémon through a playful new card collection.',
    image: '/assets/whats_new_91_28.png',
    href: '/cards'
  },
  {
    id: 'marketplace-highlights',
    eyebrow: 'Marketplace guide',
    title: 'Discover the most valuable cards on Mythix',
    description: 'Explore high-value cards currently listed and available from verified sellers.',
    image: '/assets/expensive_card_banner_132_306.png',
    href: '/cards'
  }
];

function FeaturedBannerPreview({ banner, onMouseEnter, onMouseLeave }: { banner: HomeBanner; onMouseEnter: () => void; onMouseLeave: () => void }) {
  return (
    <Link
      to={banner.href}
      aria-label={`Open ${banner.title}`}
      data-testid="hero-banner-preview"
      data-banner-id={banner.id}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={onMouseEnter}
      onBlur={onMouseLeave}
      className="group absolute bottom-5 left-5 right-5 z-30 flex h-[152px] w-auto overflow-hidden rounded-[28px] border border-white/10 bg-bg-card p-3 text-gray-100 shadow-[0_24px_70px_rgba(0,0,0,0.42)] transition-transform duration-300 hover:-translate-y-1 md:bottom-8 md:left-auto md:right-6 md:w-[min(42vw,540px)]"
    >
      <div className="h-32 w-40 shrink-0 overflow-hidden rounded-[20px] bg-bg-card">
        <img src={banner.image} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col px-5 py-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-status-warning">{banner.eyebrow}</span>
        <h2 className="mt-2 line-clamp-2 text-xl font-bold leading-tight text-gray-100">{banner.title}</h2>
        <div className="mt-auto flex items-center justify-between gap-3">
          <span className="text-xs font-medium text-gray-400">Discover the story</span>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-status-warning text-bg-base transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">
            <ChevronRight size={22} />
          </span>
        </div>
      </div>
    </Link>
  );
}

function EditorialBanners({ activeIndex, onChange, onPause, onResume }: { activeIndex: number; onChange: (index: number) => void; onPause: () => void; onResume: () => void }) {
  const banner = HOME_BANNERS[activeIndex];

  return (
    <section id="latest-stories" role="region" aria-roledescription="carousel" aria-label="Featured stories" className="bg-bg-card py-16">
      <div className="mx-auto max-w-[1440px] px-4 md:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-status-warning">Mythix stories</p>
            <h2 className="mt-2 text-3xl font-bold text-[#DBE3F3] md:text-4xl">What&apos;s new</h2>
          </div>
          <span className="text-sm text-[#DBE3F3]/60">{HOME_BANNERS.length.toString().padStart(2, '0')} stories</span>
        </div>
        <div
          className="relative"
          onMouseEnter={onPause}
          onMouseLeave={onResume}
          onFocus={onPause}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) onResume();
          }}
        >
          <Link
            to={banner.href}
            data-testid="editorial-banner"
            data-banner-id={banner.id}
            aria-label={`Story ${activeIndex + 1} of ${HOME_BANNERS.length}: ${banner.title}`}
            className="group grid h-[520px] w-full overflow-hidden rounded-[28px] border border-white/10 bg-bg-card text-gray-100 shadow-xl transition-opacity duration-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-status-warning md:h-[390px] md:grid-cols-[1.15fr_0.85fr]"
          >
            <div className="relative h-[220px] overflow-hidden bg-bg-card md:h-full">
              <img src={banner.image} alt="" className={`h-full w-full transition-transform duration-500 group-hover:scale-[1.03] ${activeIndex === 1 ? 'object-contain p-5' : 'object-cover'}`} />
            </div>
            <div className="flex flex-col p-6 md:p-10">
              <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-brand-gold">{banner.eyebrow}</span>
              <h3 className="mt-3 text-3xl font-black leading-tight md:text-4xl">{banner.title}</h3>
              <p className="mt-4 max-w-md text-base leading-relaxed text-gray-400">{banner.description}</p>
              <span className="mt-auto inline-flex min-h-11 w-fit items-center gap-2 rounded-lg border border-white/15 bg-bg-elevated px-5 py-3 text-sm font-bold text-gray-100 transition-colors group-hover:bg-bg-elevated">
                Learn more <ChevronRight size={18} />
              </span>
            </div>
          </Link>
          <p className="sr-only" aria-live="polite">Showing story {activeIndex + 1} of {HOME_BANNERS.length}: {banner.title}</p>
          <div className="pointer-events-none absolute inset-x-4 bottom-4 z-10 flex items-center justify-between md:inset-x-6">
            <button
              type="button"
              aria-label="Previous story"
              onClick={(event) => {
                event.preventDefault();
                onChange((activeIndex - 1 + HOME_BANNERS.length) % HOME_BANNERS.length);
              }}
              className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-bg-card/90 text-[#DBE3F3] shadow-lg transition-colors hover:bg-bg-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-status-warning"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-bg-card/90 px-3 py-2" aria-label="Story navigation">
              {HOME_BANNERS.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  aria-label={`Show story ${index + 1}`}
                  aria-current={index === activeIndex ? 'true' : undefined}
                  onClick={(event) => {
                    event.preventDefault();
                    onChange(index);
                  }}
                  className={`h-2 rounded-full transition-all ${index === activeIndex ? 'w-7 bg-status-warning' : 'w-2 bg-[#DBE3F3]/50 hover:bg-[#DBE3F3]'}`}
                />
              ))}
            </div>
            <button
              type="button"
              aria-label="Next story"
              onClick={(event) => {
                event.preventDefault();
                onChange((activeIndex + 1) % HOME_BANNERS.length);
              }}
              className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-bg-card/90 text-[#DBE3F3] shadow-lg transition-colors hover:bg-bg-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-status-warning"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-4 rounded-2xl border border-status-danger/30 bg-bg-card p-8 text-center text-gray-100">
      <AlertCircle className="text-status-danger" />
      <p className="text-sm text-gray-400">{message}</p>
      <button type="button" onClick={onRetry} className="inline-flex items-center gap-2 rounded-lg bg-bg-card px-4 py-2 text-sm font-semibold text-white hover:bg-bg-elevated">
        <RefreshCw size={15} /> Try again
      </button>
    </div>
  );
}

function ExpensiveCards({ cards, loading, error, onRetry }: { cards: CardListing[]; loading: boolean; error: string | null; onRetry: () => void }) {
  return (
    <section id="expensive-cards" className="bg-bg-surface py-16">
      <div className="mx-auto max-w-[1440px] px-4 md:px-8">
        <div className="mb-12 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-brand-gold">Marketplace spotlight</p>
            <h2 className="text-3xl font-bold leading-tight text-white">The 10 Most Expensive Cards on sale</h2>
            <p className="mt-1 text-sm text-text-secondary">Highest-value cards currently in stock and ready for purchase</p>
          </div>
          <Link to="/cards" className="inline-flex items-center gap-1 text-sm font-semibold text-text-secondary transition-colors hover:text-white">
            Explore all cards <ChevronRight size={18} />
          </Link>
        </div>
        {loading && (
          <div className="flex gap-6 overflow-hidden px-2 pt-16">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-[380px] min-w-[260px] rounded-3xl bg-white/10" />
            ))}
          </div>
        )}
        {!loading && error && <ErrorState message={error} onRetry={onRetry} />}
        {!loading && !error && cards.length === 0 && <div className="rounded-2xl border border-white/10 bg-bg-card p-10 text-center text-sm text-gray-400">No cards are currently listed for sale.</div>}
        {!loading && !error && cards.length > 0 && (
          <div className="flex gap-8 overflow-x-auto px-4 pb-12 pt-16 snap-x custom-scrollbar">
            {cards.map((item) => (
              <Link key={item.id} to={`/cards/${item.id}`} className="group relative flex h-[380px] min-w-[260px] shrink-0 snap-start flex-col rounded-3xl border border-white/10 bg-bg-card text-gray-100 p-4 shadow-glow transition-transform hover:-translate-y-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-blue md:h-[420px] md:min-w-[300px]">
                <span className="absolute left-4 top-4 z-20 rounded-full bg-status-success px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-bg-base">In stock ({item.stock})</span>
                <div className="absolute -right-5 bottom-24 z-10 flex w-[100%] items-center justify-center rotate-[4deg] drop-shadow-[0_24px_34px_rgba(0,0,0,0.55)] transition-transform duration-300 group-hover:-translate-y-4 group-hover:rotate-0">
                  <img
                    src={item.image || '/assets/expensive_card_1.png'}
                    alt={item.name}
                    onError={(e) => {
                      e.currentTarget.src = '/assets/expensive_card_1.png';
                    }}
                    className="max-h-[280px] w-full object-contain md:max-h-[320px]"
                  />
                </div>
                <div className="relative z-20 mt-auto rounded-xl border border-white/10 bg-bg-surface p-3">
                  <div className="flex items-end justify-between gap-2">
                    <span className="text-xl font-black text-gray-100">฿{item.price.toFixed(2)}</span>
                    <span className="line-clamp-2 text-right text-xs font-bold text-gray-100">{item.name}</span>
                  </div>
                  <div className="mt-1 flex justify-between gap-2 text-[10px] text-gray-400">
                    <span>
                      Market: <strong className="text-status-success">฿{(item.marketPrice ?? item.price).toFixed(2)}</strong>
                    </span>
                    <span className="line-clamp-2 text-right">{item.set || item.rarity || item.game}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Leaderboard({ collectors, loading, error, onRetry }: { collectors: CollectorRanking[]; loading: boolean; error: string | null; onRetry: () => void }) {
  return (
    <section className="bg-bg-surface py-16">
      <div className="mx-auto max-w-[1440px] px-4 md:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-gold">Leaderboard</p>
            <h2 className="mt-2 text-3xl font-bold text-white">The Best Collections</h2>
            <p className="mt-1 text-sm text-text-secondary">Top 10 collectors ranked by the number of rare Pokémon cards they own</p>
          </div>
          <Link to="/cards" className="inline-flex items-center gap-1 text-sm font-semibold text-text-secondary hover:text-white">
            Explore all cards <ChevronRight size={18} />
          </Link>
        </div>
        {loading && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-3xl border border-white/10 bg-bg-card p-6">
                <Skeleton className="h-12 w-2/3 bg-white/10" />
                <Skeleton className="mt-6 h-28 w-full bg-white/10" />
                <Skeleton className="mt-6 h-10 w-full bg-white/10" />
              </div>
            ))}
          </div>
        )}
        {!loading && error && <ErrorState message={error} onRetry={onRetry} />}
        {!loading && !error && collectors.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-bg-card p-10 text-center text-gray-100">
            <Layers className="text-gray-400" />
            <p className="text-sm text-gray-400">No public rare-card collections yet.</p>
          </div>
        )}
        {!loading && !error && collectors.length > 0 && (
          <div data-testid="home-collector-rail" className="flex gap-6 overflow-x-auto pb-6 snap-x custom-scrollbar">
            {collectors.map((collector) => (
              <article key={collector.userId} className="flex min-w-[320px] snap-center shrink-0 flex-col rounded-3xl border border-white/10 bg-bg-card p-6 text-gray-100 shadow-[0_14px_40px_rgba(15,23,42,0.16)] transition-transform hover:-translate-y-1 sm:min-w-[390px] md:min-w-[430px]">
                <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`relative flex h-12 w-12 shrink-0 items-center justify-center gap-1 rounded-2xl text-lg font-black ${
                        collector.rank === 1
                          ? 'bg-[#FFF4C2] text-[#9A7410]'
                          : collector.rank === 2
                            ? 'bg-[#EEF1F5] text-[#667085]'
                            : collector.rank === 3
                              ? 'bg-[#F8E2D2] text-[#9A5B31]'
                              : 'bg-white/10 text-gray-100'
                      }`}
                    >
                      {collector.rank === 1 && <Trophy size={22} strokeWidth={2.4} aria-hidden="true" />}
                      {collector.rank === 2 && <Medal size={22} strokeWidth={2.4} aria-hidden="true" />}
                      {collector.rank === 3 && <Medal size={22} strokeWidth={2.4} aria-hidden="true" />}
                      {collector.rank > 3 && collector.rank}
                      <span className="sr-only">Rank {collector.rank}</span>
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-bold text-gray-100">{collector.displayName}</h3>
                      <p className="text-xs text-gray-400">{collector.distinctRareCardCount} unique rare cards</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Rare cards</span>
                    <span className="text-2xl font-black text-brand-gold">{collector.rareCardCount}</span>
                  </div>
                </div>
                <div className="mt-5">
                  <h4 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">Collection highlights</h4>
                  {collector.highlights.length > 0 ? (
                    <div className="grid grid-cols-3 gap-3">
                      {collector.highlights.map((card) => (
                        <Link key={card.cardId} to={`/cards/${card.cardId}`} className="rounded-xl border border-white/10 bg-bg-surface p-2 text-center hover:border-brand-blue/60">
                          <div className="relative flex h-24 items-center justify-center">
                            <img src={card.imageUrl || '/assets/expensive_card_1.png'} alt={card.name} className="max-h-full max-w-full object-contain drop-shadow-lg" />
                            {card.quantity > 1 && <span className="absolute right-0 top-0 rounded-full bg-bg-card px-1.5 py-0.5 text-[9px] font-bold text-white">×{card.quantity}</span>}
                          </div>
                          <span className="mt-2 block truncate text-[10px] font-semibold text-gray-100">{card.name}</span>
                          <span className="mt-1 block truncate text-[9px] text-brand-gold">{card.rarity}</span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">Rare card details unavailable.</p>
                  )}
                </div>
                <Link to={`/collections/${encodeURIComponent(collector.userId)}`} className="mt-6 rounded-xl bg-brand-blue py-3 text-center text-sm font-bold text-bg-base hover:bg-brand-blue/90">
                  View public collection
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function HomePage() {
  // --- FOR TESTING ERROR BOUNDARY (CASE 2) ---
  // UNCOMMENT THE LINE BELOW TO TEST THE REACT ERROR BOUNDARY
  // throw new Error("Test ErrorBoundary (Case 2): Simulated React crash");
  // ---------------------------------------------
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [bannerPaused, setBannerPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState<CardListing[]>([]);
  const [expensiveCards, setExpensiveCards] = useState<CardListing[]>([]);
  const [topCollectors, setTopCollectors] = useState<CollectorRanking[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [listingsError, setListingsError] = useState<string | null>(null);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);

  const loadHomeData = useCallback(() => {
    setListingsLoading(true);
    setListingsError(null);
    setLeaderboardLoading(true);
    setLeaderboardError(null);
    void listingDiscoveryApi
      .getListings({ size: 100 })
      .then((res) => {
        setFeaturedProducts(res.items.slice(0, 5));
        setExpensiveCards(getMostExpensiveOnSaleCards(res.items, 10));
      })
      .catch(() => {
        setListingsError('Unable to load marketplace highlights.');
        setFeaturedProducts([]);
        setExpensiveCards([]);
      })
      .finally(() => setListingsLoading(false));
    void getTopCollectors(10)
      .then(setTopCollectors)
      .catch(() => {
        setLeaderboardError('Unable to load leaderboard data.');
        setTopCollectors([]);
      })
      .finally(() => setLeaderboardLoading(false));
  }, []);

  useEffect(() => {
    loadHomeData();
  }, [loadHomeData]);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener?.('change', updatePreference);
    return () => mediaQuery.removeEventListener?.('change', updatePreference);
  }, []);

  useEffect(() => {
    if (bannerPaused || reducedMotion || HOME_BANNERS.length < 2) return undefined;
    const timer = window.setInterval(() => {
      setActiveBannerIndex((index) => (index + 1) % HOME_BANNERS.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [activeBannerIndex, bannerPaused, reducedMotion]);

  return (
    <div className="flex w-full flex-col overflow-hidden pb-20">
      <section className="relative h-[calc(100dvh-64px)] min-h-[680px] w-full overflow-hidden bg-bg-card">
        <img src="/assets/hero_castle_bg.png" alt="" aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-30" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-bg-card/10 via-transparent to-bg-card/80" aria-hidden="true" />
        <div className="absolute inset-x-5 top-[38%] z-20 mx-auto max-w-4xl -translate-y-1/2 text-center md:left-[7%] md:right-auto md:mx-0 md:text-left">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.32em] text-status-warning sm:text-sm">Buy • collect • trade</p>
          <h1 className="text-6xl font-black leading-[0.9] tracking-[-0.055em] text-[#DBE3F3] sm:text-7xl lg:text-[84px] xl:text-[96px]">
            Buy rare cards.<br /><span className="text-status-warning">Trade with confidence.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-[#DBE3F3]/80 sm:text-base md:mx-0">Discover rare Pokémon cards, build your collection, and trade with confidence.</p>
          <a href="#explore-section" className="mt-8 inline-flex min-h-12 items-center rounded-xl bg-status-warning px-6 py-3 text-sm font-bold text-bg-base shadow-lg shadow-black/20 transition-transform duration-200 hover:-translate-y-0.5 hover:bg-status-warning/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-status-warning">
            Explore marketplace
          </a>
        </div>
        <FeaturedBannerPreview
          banner={HOME_BANNERS[activeBannerIndex]}
          onMouseEnter={() => setBannerPaused(true)}
          onMouseLeave={() => setBannerPaused(false)}
        />
      </section>
      <div id="explore-section" className="w-full">
        <EditorialBanners
          activeIndex={activeBannerIndex}
          onChange={setActiveBannerIndex}
          onPause={() => setBannerPaused(true)}
          onResume={() => setBannerPaused(false)}
        />
        <ExpensiveCards cards={expensiveCards} loading={listingsLoading} error={listingsError} onRetry={loadHomeData} />
        <Leaderboard collectors={topCollectors} loading={leaderboardLoading} error={leaderboardError} onRetry={loadHomeData} />
        <section className="bg-bg-surface py-12">
          <div className="mx-auto max-w-[1440px] px-4 md:px-8">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-3xl font-bold text-white">The Pokémon Cards Collection</h2>
              <Link to="/cards" className="inline-flex items-center gap-1 text-sm font-semibold text-text-secondary hover:text-white">
                Watch more <ChevronRight size={18} />
              </Link>
            </div>
            {listingsLoading ? (
              <Skeleton className="h-[200px] w-full bg-white/10" />
            ) : listingsError ? (
              <ErrorState message={listingsError} onRetry={loadHomeData} />
            ) : (
              <div className="flex gap-6 overflow-x-auto pb-6 snap-x custom-scrollbar">
                {featuredProducts.map((item) => (
                  <Link key={item.id} to={`/cards/${item.id}`} className="flex h-[200px] min-w-[360px] snap-start gap-4 rounded-2xl border border-white/10 bg-bg-card p-4 text-gray-100 hover:border-brand-blue/60">
                    <div className="flex w-[130px] shrink-0 items-center justify-center">
                      <img src={item.image || '/assets/expensive_card_1.png'} alt={item.name} className="h-full w-full object-contain drop-shadow-lg" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <h3 className="truncate text-lg font-bold text-gray-100">{item.name}</h3>
                      <p className="mt-1 text-xs text-gray-400">{item.set || item.game}</p>
                      <p className="mt-auto text-2xl font-black text-gray-100">฿{item.price.toFixed(2)}</p>
                      <p className="text-xs text-status-success">Market: ฿{(item.marketPrice ?? item.price).toFixed(2)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
