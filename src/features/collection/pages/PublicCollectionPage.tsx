import { Avatar } from '@/shared/components/Avatar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  Filter,
  Layers,
  Lock,
  RefreshCw,
  Search,
  Share2,
  Sparkles,
  Store,
  Trophy,
} from 'lucide-react';
import { collectionApi, type PublicCollectionOwner } from '../api/collection';
import { CollectionCard } from '../components/CollectionCard';
import type { CollectionEntry } from '@/entities/card/model/types';
import { Skeleton } from '@/shared/components/Skeleton';
import { useToastStore } from '@/shared/model/useToastStore';
import { useAuthStore } from '@/features/auth/model/useAuthStore';

type ErrorKind = 'NONE' | 'PRIVATE' | 'NOT_FOUND' | 'GENERIC';

export function PublicCollectionPage() {
  const { userId = '' } = useParams<{ userId: string }>();
  const currentUser = useAuthStore((s) => s.user);
  const isOwner = Boolean(currentUser?.id && String(currentUser.id) === String(userId));
  const requestId = useRef(0);
  const [owner, setOwner] = useState<PublicCollectionOwner | null>(null);
  const [items, setItems] = useState<CollectionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorKind, setErrorKind] = useState<ErrorKind>('NONE');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRarity, setSelectedRarity] = useState('ALL');
  const [selectedCondition, setSelectedCondition] = useState('ALL');

  const addToast = useToastStore((s) => s.addToast);

  const fetchCollection = useCallback(async () => {
    if (!userId) return;
    const request = ++requestId.current;
    setLoading(true);
    setErrorKind('NONE');
    setErrorMessage('');
    try {
      const result = await collectionApi.getPublicCollection(userId);
      if (request !== requestId.current) return;
      setOwner(result.owner);
      setItems(result.items);
    } catch (err: unknown) {
      if (request !== requestId.current) return;
      const errorObj = err as {
        status?: number;
        code?: string;
        response?: { status?: number; data?: { code?: string; message?: string } };
        message?: string;
      };

      const status = errorObj?.status || errorObj?.response?.status;
      const code = errorObj?.code || errorObj?.response?.data?.code;

      if (status === 403 || code === 'COLLECTION_PRIVATE') {
        setErrorKind('PRIVATE');
      } else if (status === 404 || code === 'PUBLIC_COLLECTION_NOT_FOUND') {
        setErrorKind('NOT_FOUND');
      } else {
        setErrorKind('GENERIC');
        setErrorMessage(errorObj?.message || 'Unable to load this public collection.');
      }
    } finally {
      if (request === requestId.current) setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void fetchCollection();
    const generation = requestId;
    return () => { generation.current++; };
  }, [fetchCollection]);

  const handleShare = () => {
    void navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    addToast({
      type: 'success',
      title: 'Link Copied',
      message: 'Collection showcase link copied to clipboard.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  // Filtered collection cards
  const filteredItems = useMemo(() => {
    return items.filter((entry) => {
      const card = entry.listing;
      const matchesSearch =
        !searchQuery.trim() ||
        card.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
        (card.set && card.set.toLowerCase().includes(searchQuery.trim().toLowerCase()));

      const matchesRarity =
        selectedRarity === 'ALL' ||
        (card.rarity && card.rarity.toLowerCase().includes(selectedRarity.toLowerCase()));

      const matchesCondition =
        selectedCondition === 'ALL' ||
        (card.condition && card.condition.toUpperCase() === selectedCondition.toUpperCase());

      return matchesSearch && matchesRarity && matchesCondition;
    });
  }, [items, searchQuery, selectedRarity, selectedCondition]);

  // Total quantity of cards in album
  const totalCardsCount = useMemo(() => {
    return items.reduce((acc, curr) => acc + (curr.quantity || 1), 0);
  }, [items]);

  // -------------------------------------------------------------
  // 403 Private Collection View (Handles Error Page as Requested)
  // -------------------------------------------------------------
  if (!loading && errorKind === 'PRIVATE') {
    return (
      <main
        className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-6 py-16 text-center font-['IBM_Plex_Sans_Thai',sans-serif]"
        aria-labelledby="private-collection-heading"
      >
        <div
          className="mb-8 flex h-32 w-24 items-center justify-center rounded-2xl border-2 border-dashed border-status-danger/40 bg-status-danger/10 text-status-danger"
          aria-hidden="true"
        >
          <Lock size={44} />
        </div>

        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-status-danger">
          403 — Private Collection
        </p>
        <h1
          id="private-collection-heading"
          className="mb-3 text-3xl font-bold text-white"
        >
          This collection is private
        </h1>
        <p className="mb-2 text-gray-400">
          The owner of this collection has set their collection album to private.
          Cards are hidden from public view.
        </p>
        <p className="mb-6 text-xs font-medium text-status-danger">
          404 — Collector Not Found (Showcase is hidden from public view)
        </p>

        {isOwner && (
          <div className="mb-8 w-full rounded-2xl border border-brand-gold/30 bg-brand-gold/10 p-4 text-left text-sm text-brand-gold">
            <p className="font-bold mb-1 flex items-center gap-2">
              <span>Owner Notice</span>
            </p>
            <p className="text-xs text-gray-300">
              You are logged in as the owner. Because your collection privacy is set to <strong className="text-white">Private</strong>, visitors see this error screen. You can view and manage all your cards in My Collection.
            </p>
          </div>
        )}

        <nav aria-label="Recovery navigation" className="flex flex-col items-center gap-3 sm:flex-row">
          {isOwner && (
            <Link
              to="/collection"
              className="inline-flex items-center justify-center rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-semibold text-bg-base transition-colors hover:bg-brand-blue/90"
            >
              Go to My Collection
            </Link>
          )}
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-bg-elevated px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-bg-elevated/80"
          >
            Back to homepage
          </Link>
          <Link
            to="/cards"
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-bg-elevated px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-bg-elevated/80"
          >
            Explore marketplace
          </Link>
        </nav>
      </main>
    );
  }

  // -------------------------------------------------------------
  // 404 Collector Not Found View
  // -------------------------------------------------------------
  if (!loading && errorKind === 'NOT_FOUND') {
    return (
      <main
        className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-6 py-16 text-center font-['IBM_Plex_Sans_Thai',sans-serif]"
        aria-labelledby="not-found-heading"
      >
        <div
          className="mb-8 flex h-32 w-24 items-center justify-center rounded-2xl border-2 border-dashed border-white/20 bg-bg-surface text-white/30"
          aria-hidden="true"
        >
          <Layers size={44} />
        </div>

        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-brand-gold">
          404 — Collector Not Found
        </p>
        <h1
          id="not-found-heading"
          className="mb-3 text-3xl font-bold text-white"
        >
          This collector doesn't exist
        </h1>
        <p className="mb-10 text-gray-400">
          The requested collection could not be found or has been removed.
        </p>

        <nav aria-label="Recovery navigation" className="flex flex-col items-center gap-3 sm:flex-row">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-semibold text-bg-base transition-colors hover:bg-brand-blue/90"
          >
            Back to homepage
          </Link>
          <Link
            to="/cards"
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-bg-elevated px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-bg-elevated/80"
          >
            Explore marketplace
          </Link>
        </nav>
      </main>
    );
  }

  // -------------------------------------------------------------
  // Main Storefront-style Showcase View
  // -------------------------------------------------------------
  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-bg-base px-4 py-8 text-white font-['IBM_Plex_Sans_Thai',sans-serif] md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
          >
            <ArrowLeft size={16} /> Back to homepage
          </Link>
        </div>

        {/* Loading Header Skeleton */}
        {loading && (
          <Skeleton className="h-48 w-full rounded-2xl" />
        )}

        {/* Storefront-style Collector Header Section */}
        {!loading && owner && (
          <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[.03] p-6 md:p-8 shadow-xl">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
              
              <div className="flex items-start gap-5">
                {/* Collector Avatar */}
                <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-brand-blue/20 to-brand-gold/20 text-2xl font-bold text-white shadow-md md:size-24 md:text-3xl">
                  <Avatar name={isOwner ? currentUser?.name : owner.displayName} src={isOwner ? currentUser?.avatarUrl : owner.avatarUrl} className="size-full" />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">
                      Collector Showcase
                    </p>
                    {owner.isSeller && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-brand-blue/30 bg-brand-blue/10 px-2.5 py-0.5 text-xs font-medium text-brand-blue">
                        <Store size={12} /> Verified Seller
                      </span>
                    )}
                  </div>

                  <h1 className="mt-1 text-3xl font-bold tracking-tight text-white md:text-4xl">
                    {isOwner ? currentUser?.name : owner.displayName}
                  </h1>

                  <p className="mt-2 text-sm text-gray-400">
                    Personal card binder showcasing rare and favorite collectible cards.
                  </p>

                  {/* Badges / Stats Bar */}
                  <div className="mt-4 flex flex-wrap items-center gap-4 text-xs md:text-sm text-gray-300">
                    <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-bg-surface px-3 py-1.5">
                      <Layers size={14} className="text-brand-blue" />
                      <span><strong>{totalCardsCount}</strong> cards owned</span>
                    </div>
                    {owner.rareCardCount !== undefined && (
                      <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-bg-surface px-3 py-1.5">
                        <Sparkles size={14} className="text-brand-gold" />
                        <span><strong>{owner.rareCardCount}</strong> rare cards</span>
                      </div>
                    )}
                    {owner.distinctRareCardCount !== undefined && (
                      <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-bg-surface px-3 py-1.5">
                        <Trophy size={14} className="text-brand-gold" />
                        <span><strong>{owner.distinctRareCardCount}</strong> unique rare cards</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Header Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
                {owner.isSeller && (
                  <Link
                    to={`/stores/${owner.userId}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-bg-base transition-colors hover:bg-brand-blue/90 shadow-md shadow-brand-blue/20"
                  >
                    <Store size={16} />
                    Visit Seller's Store
                  </Link>
                )}

                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-bg-surface px-4 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-bg-elevated hover:text-white"
                  title="Share this collection showcase"
                >
                  {copied ? <Check size={16} className="text-status-success" /> : <Share2 size={16} />}
                  {copied ? 'Copied!' : 'Share Showcase'}
                </button>

                <button
                  type="button"
                  onClick={() => void fetchCollection()}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-bg-surface px-3 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-bg-elevated hover:text-white disabled:opacity-50"
                  title="Refresh showcase"
                >
                  <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
              </div>

            </div>
          </section>
        )}

        {/* Generic Error Notification */}
        {!loading && errorKind === 'GENERIC' && (
          <div role="alert" className="flex flex-col items-center gap-4 rounded-2xl border border-status-danger/30 bg-bg-card p-10 text-center">
            <Layers size={32} className="text-status-danger" />
            <div>
              <h2 className="text-lg font-bold">Unable to load collection</h2>
              <p className="mt-1 text-sm text-gray-400">{errorMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => void fetchCollection()}
              className="rounded-xl bg-brand-blue px-5 py-2 text-sm font-semibold text-bg-base transition-colors hover:bg-brand-blue/90"
            >
              Try again
            </button>
          </div>
        )}

        {/* Search, Filter & Content Section */}
        {!loading && owner && (
          <section aria-labelledby="showcase-cards-heading">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-blue">
                  Cards In Binder
                </p>
                <h2 id="showcase-cards-heading" className="mt-1 text-2xl font-bold">
                  Collection Gallery
                </h2>
              </div>
              <p className="text-sm text-gray-400">
                Showing {filteredItems.length} of {items.length} card{items.length === 1 ? '' : 's'}
              </p>
            </div>

            {/* Filter & Search Bar */}
            <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-white/10 bg-bg-surface p-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search cards in this collection..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-bg-card py-2 pl-9 pr-3 text-sm text-white placeholder-gray-500 focus:border-brand-blue focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter size={16} className="text-gray-400 ml-1 hidden sm:block" />
                
                {/* Rarity Filter */}
                <select
                  value={selectedRarity}
                  onChange={(e) => setSelectedRarity(e.target.value)}
                  aria-label="Filter by rarity"
                  className="rounded-xl border border-white/10 bg-bg-card px-3 py-2 text-xs font-medium text-gray-300 focus:border-brand-blue focus:outline-none"
                >
                  <option value="ALL">All Rarities</option>
                  <option value="Secret Rare">Secret Rare</option>
                  <option value="Ultra Rare">Ultra Rare</option>
                  <option value="Rare">Rare</option>
                  <option value="Promo">Promo</option>
                  <option value="Common">Common</option>
                </select>

                {/* Condition Filter */}
                <select
                  value={selectedCondition}
                  onChange={(e) => setSelectedCondition(e.target.value)}
                  aria-label="Filter by condition"
                  className="rounded-xl border border-white/10 bg-bg-card px-3 py-2 text-xs font-medium text-gray-300 focus:border-brand-blue focus:outline-none"
                >
                  <option value="ALL">All Conditions</option>
                  <option value="NM">Near Mint (NM)</option>
                  <option value="LP">Lightly Played (LP)</option>
                  <option value="MP">Moderately Played (MP)</option>
                  <option value="HP">Heavily Played (HP)</option>
                </select>
              </div>
            </div>

            {/* Cards Grid */}
            <div className="mt-6">
              {filteredItems.length > 0 ? (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {filteredItems.map((entry) => (
                    <CollectionCard key={entry.id} entry={entry} />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 p-16 text-center">
                  <Layers size={40} className="text-gray-500 mb-3" />
                  <h3 className="text-lg font-bold text-white">This collection is empty</h3>
                  <p className="mt-1 text-sm text-gray-400">The collector has not added any cards to their binder yet.</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 p-16 text-center">
                  <Search size={40} className="text-gray-500 mb-3" />
                  <h3 className="text-lg font-bold text-white">No matching cards found</h3>
                  <p className="mt-1 text-sm text-gray-400">Try adjusting your search keywords or filter settings.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedRarity('ALL');
                      setSelectedCondition('ALL');
                    }}
                    className="mt-4 rounded-xl border border-white/10 bg-bg-surface px-4 py-2 text-xs font-semibold text-gray-300 hover:text-white"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
