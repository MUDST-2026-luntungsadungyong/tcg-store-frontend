import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Layers, RefreshCw } from 'lucide-react';
import { collectionApi, type PublicCollectionOwner } from '../api/collection';
import type { CollectionEntry } from '@/entities/card/model/types';
import { Skeleton } from '@/shared/components/Skeleton';

export function PublicCollectionPage() {
  const { userId = '' } = useParams<{ userId: string }>();
  const [owner, setOwner] = useState<PublicCollectionOwner | null>(null);
  const [items, setItems] = useState<CollectionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCollection = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await collectionApi.getPublicCollection(userId);
      setOwner(result.owner);
      setItems(result.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load this public collection.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void fetchCollection();
  }, [fetchCollection]);

  return (
    <div className="min-h-[calc(100vh-64px)] w-full bg-bg-base px-4 py-10 text-white md:px-8">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link to="/" className="mb-4 inline-flex items-center gap-2 text-sm text-text-secondary transition-colors hover:text-white">
              <ArrowLeft size={16} /> Back to home
            </Link>
            <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
              {owner?.displayName ?? 'Public Collection'}
            </h1>
            <p className="mt-2 text-sm text-text-secondary md:text-base">
              Public collection showcase
              {owner?.rareCardCount !== undefined ? ` · ${owner.rareCardCount} rare cards` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void fetchCollection()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-bg-surface px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-elevated hover:text-white disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {loading && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((index) => (
              <div key={index} className="flex gap-5 rounded-2xl border border-white/10 bg-bg-card p-5">
                <Skeleton className="h-36 w-28 shrink-0 bg-white/10" />
                <div className="flex flex-1 flex-col gap-3 pt-2">
                  <Skeleton className="h-4 w-3/4 bg-white/10" />
                  <Skeleton className="h-3 w-1/2 bg-white/10" />
                  <Skeleton className="h-3 w-2/3 bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div role="alert" className="flex flex-col items-center gap-4 rounded-2xl border border-status-danger/30 bg-bg-card p-10 text-center">
            <AlertCircle size={32} className="text-status-danger" />
            <div>
              <h2 className="text-lg font-bold">Unable to load public collection</h2>
              <p className="mt-1 text-sm text-text-secondary">{error}</p>
            </div>
            <button type="button" onClick={() => void fetchCollection()} className="rounded-lg bg-brand-blue px-5 py-2 text-sm font-semibold text-bg-base transition-colors hover:bg-brand-blue/90">
              Try again
            </button>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-bg-card px-6 py-20 text-center">
            <Layers size={36} className="text-text-secondary" />
            <div>
              <h2 className="text-xl font-bold">This collection is empty</h2>
              <p className="mt-1 text-sm text-text-secondary">There are no public cards to display yet.</p>
            </div>
            <Link to="/cards" className="rounded-lg bg-brand-blue px-5 py-2.5 text-sm font-semibold text-bg-base transition-colors hover:bg-brand-blue/90">
              Browse cards
            </Link>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((entry) => {
              const card = entry.listing;
              return (
                <article key={entry.id} className="group flex gap-5 rounded-2xl border border-white/10 bg-bg-card p-5 shadow-glow transition-transform hover:-translate-y-1">
                  <Link to={`/cards/${card.id}`} className="relative flex h-36 w-28 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-bg-base p-2" title={`View ${card.name}`}>
                    <img src={card.image || '/assets/expensive_card_1.png'} alt={card.name} className="h-full w-full object-contain drop-shadow-lg transition-transform group-hover:scale-105" />
                    <span className="absolute left-2 top-2 rounded bg-brand-blue/20 px-2 py-0.5 text-[10px] font-bold text-brand-blue">
                      OWNED {entry.quantity > 1 ? `×${entry.quantity}` : ''}
                    </span>
                  </Link>
                  <div className="min-w-0 py-1">
                    <Link to={`/cards/${card.id}`} className="transition-colors hover:text-brand-blue">
                      <h2 className="line-clamp-2 text-base font-bold">{card.name}</h2>
                    </Link>
                    <p className="mt-1 line-clamp-1 text-xs text-text-secondary">{card.set || card.game || 'Card set'}</p>
                    <p className="mt-2 line-clamp-1 text-xs text-text-secondary">{card.rarity || card.condition || 'Rare card'}</p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
