import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, ChevronRight, Layers, RefreshCw, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getTopCollectors, type CollectorRanking } from '@/features/collection/api/leaderboard';
import { listingDiscoveryApi } from '@/features/discovery/api/listings';
import { getMostExpensiveOnSaleCards } from '@/features/discovery/lib/expensiveCards';
import type { CardListing } from '@/entities/card/model/types';
import { Skeleton } from '@/shared/components/Skeleton';

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-4 rounded-2xl border border-status-danger/30 bg-bg-card p-8 text-center">
      <AlertCircle className="text-status-danger" />
      <p className="text-sm text-text-secondary">{message}</p>
      <button type="button" onClick={onRetry} className="inline-flex items-center gap-2 rounded-lg bg-brand-blue px-4 py-2 text-sm font-semibold text-bg-base hover:bg-brand-blue/90">
        <RefreshCw size={15} /> Try again
      </button>
    </div>
  );
}

function ExpensiveCards({ cards, loading, error, onRetry }: { cards: CardListing[]; loading: boolean; error: string | null; onRetry: () => void }) {
  return (
    <section className="bg-bg-surface py-16">
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
        {!loading && !error && cards.length === 0 && <div className="rounded-2xl border border-white/10 bg-bg-card p-10 text-center text-sm text-text-secondary">No cards are currently listed for sale.</div>}
        {!loading && !error && cards.length > 0 && (
          <div className="flex gap-8 overflow-x-auto px-4 pb-12 pt-16 snap-x custom-scrollbar">
            {cards.map((item) => (
              <Link key={item.id} to={`/cards/${item.id}`} className="group relative flex h-[380px] min-w-[260px] shrink-0 snap-start flex-col rounded-3xl border border-white/10 bg-bg-card p-4 shadow-glow transition-transform hover:-translate-y-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-blue md:h-[420px] md:min-w-[300px]">
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
                <div className="relative z-20 mt-auto rounded-xl border border-white/10 bg-bg-surface/95 p-3">
                  <div className="flex items-end justify-between gap-2">
                    <span className="text-xl font-black text-white">฿{item.price.toFixed(2)}</span>
                    <span className="line-clamp-2 text-right text-xs font-bold text-white">{item.name}</span>
                  </div>
                  <div className="mt-1 flex justify-between gap-2 text-[10px] text-text-secondary">
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
    <section className="bg-bg-base py-16">
      <div className="mx-auto max-w-[1440px] px-4 md:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-brand-gold/30 bg-brand-gold/15 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-brand-gold">
              <Sparkles size={13} /> Leaderboard
            </span>
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
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-bg-card p-10 text-center">
            <Layers className="text-text-secondary" />
            <p className="text-sm text-text-secondary">No public rare-card collections yet.</p>
          </div>
        )}
        {!loading && !error && collectors.length > 0 && (
          <div className="flex gap-6 overflow-x-auto pb-6 snap-x custom-scrollbar">
            {collectors.map((collector) => (
              <article key={collector.userId} className="flex min-w-[320px] snap-center shrink-0 flex-col rounded-3xl border border-white/10 bg-bg-card p-6 shadow-glow transition-transform hover:-translate-y-1 sm:min-w-[390px] md:min-w-[430px]">
                <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg font-black ${collector.rank === 1 ? 'bg-brand-gold text-bg-base' : 'bg-bg-elevated text-white'}`}>#{collector.rank}</span>
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-bold text-white">{collector.displayName}</h3>
                      <p className="text-xs text-text-secondary">{collector.distinctRareCardCount} unique rare cards</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary">Rare cards</span>
                    <span className="text-2xl font-black text-brand-gold">{collector.rareCardCount}</span>
                  </div>
                </div>
                <div className="mt-5">
                  <h4 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-text-secondary">Collection highlights</h4>
                  {collector.highlights.length > 0 ? (
                    <div className="grid grid-cols-3 gap-3">
                      {collector.highlights.map((card) => (
                        <Link key={card.cardId} to={`/cards/${card.cardId}`} className="rounded-xl border border-white/10 bg-bg-surface p-2 text-center hover:border-brand-blue/60">
                          <div className="relative flex h-24 items-center justify-center">
                            <img src={card.imageUrl || '/assets/expensive_card_1.png'} alt={card.name} className="max-h-full max-w-full object-contain drop-shadow-lg" />
                            {card.quantity > 1 && <span className="absolute right-0 top-0 rounded-full bg-bg-base px-1.5 py-0.5 text-[9px] font-bold text-white">×{card.quantity}</span>}
                          </div>
                          <span className="mt-2 block truncate text-[10px] font-semibold text-white">{card.name}</span>
                          <span className="mt-1 block truncate text-[9px] text-brand-gold">{card.rarity}</span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-text-secondary">Rare card details unavailable.</p>
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

  return (
    <div className="flex w-full flex-col overflow-hidden pb-20">
      <section className="relative h-[calc(100dvh-64px)] min-h-[560px] w-full overflow-hidden bg-bg-card">
        <img src="/assets/hero_castle_bg.png" alt="" aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-30" />
        <div className="hidden">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.35em] text-brand-gold">Mythix trading platform</p>
          <h1 className="text-5xl font-black tracking-tight text-white md:text-8xl">
            MYTHIC
            <br />
            <span className="text-brand-blue">TRADE</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-text-secondary">Discover rare Pokémon cards, build your collection, and trade with confidence.</p>
          <a href="#explore-section" className="mt-8 inline-flex rounded-xl bg-brand-blue px-6 py-3 font-bold text-bg-base hover:bg-brand-blue/90">
            Explore marketplace
          </a>
        </div>
        <span
          className="pointer-events-none absolute select-none whitespace-nowrap font-sans text-[rgba(255,255,255,0.3)]"
          style={{
            left: '10.9%',
            top: '25.7%',
            fontSize: 'clamp(2rem, 8.9vw, 8rem)',
            lineHeight: 1
          }}
          aria-hidden="true"
        >
          MYTHIC
        </span>
        <span
          className="pointer-events-none absolute select-none whitespace-nowrap font-sans text-[rgba(255,255,255,0.1)]"
          style={{
            left: '54.9%',
            top: '50%',
            fontSize: 'clamp(2rem, 8.9vw, 8rem)',
            lineHeight: 1
          }}
          aria-hidden="true"
        >
          MARKET
        </span>
        <div className="pointer-events-none absolute left-1/2 top-[35%] w-[clamp(220px,36vw,520px)] -translate-x-1/2 -translate-y-1/2">
          <img src="/assets/mythix_logo_white_v2.png" alt="Mythix Market" className="block h-auto w-full object-contain" />
        </div>
        <h1 className="sr-only">Mythix Trading Platform</h1>
        <a href="#explore-section" className="absolute left-1/2 top-[78.8%] flex -translate-x-1/2 flex-col items-center gap-2 font-sans text-[20px] font-bold text-[#DBE3F3] transition-colors duration-200 hover:text-status-warning md:text-[32px]">
          <span>Start!</span>
          <img src="/assets/chevron_double_down.svg" alt="" aria-hidden="true" className="h-6 w-6 animate-pulse md:h-8 md:w-8" />
        </a>
      </section>
      <div id="explore-section" className="w-full">
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
                  <Link key={item.id} to={`/cards/${item.id}`} className="flex h-[200px] min-w-[360px] snap-start gap-4 rounded-2xl border border-white/10 bg-bg-card p-4 hover:border-brand-blue/60">
                    <div className="flex w-[130px] shrink-0 items-center justify-center">
                      <img src={item.image || '/assets/expensive_card_1.png'} alt={item.name} className="h-full w-full object-contain drop-shadow-lg" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <h3 className="truncate text-lg font-bold text-white">{item.name}</h3>
                      <p className="mt-1 text-xs text-text-secondary">{item.set || item.game}</p>
                      <p className="mt-auto text-2xl font-black text-white">฿{item.price.toFixed(2)}</p>
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
