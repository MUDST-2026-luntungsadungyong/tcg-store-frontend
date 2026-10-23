import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Layers, RefreshCw } from 'lucide-react';
import { collectionApi, type PublicCollectionOwner } from '../api/collection';
import { CollectionCard } from '../components/CollectionCard';
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
    <div className="w-full min-h-[calc(100vh-64px)] bg-bg-base px-4 py-10 text-white font-['IBM_Plex_Sans_Thai',sans-serif] md:px-8">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <Link to="/" className="mb-4 inline-flex items-center gap-2 text-sm text-gray-300 transition-colors hover:text-white">
              <ArrowLeft size={16} /> Back to home
            </Link>
            <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
              {owner?.displayName ?? 'Public Collection'}
            </h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-400 md:text-base">
              <span>Public collection showcase</span>
              {owner?.rareCardCount !== undefined && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{owner.rareCardCount} rare cards</span>
                </>
              )}
              {owner?.distinctRareCardCount !== undefined && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{owner.distinctRareCardCount} unique rare cards</span>
                </>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void fetchCollection()}
            disabled={loading}
            className="self-start inline-flex items-center gap-2 rounded-lg border border-white/10 bg-bg-surface px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-bg-elevated hover:text-white disabled:opacity-50 sm:self-auto"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {loading && (
          <div className="grid grid-cols-1 gap-6 pt-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((index) => (
              <div key={index} className="flex gap-5 rounded-2xl border border-white/10 bg-bg-card p-5">
                <Skeleton className="h-36 w-28 shrink-0 rounded-xl bg-gray-200" />
                <div className="flex flex-1 flex-col gap-3 pt-2">
                  <Skeleton className="h-4 w-3/4 bg-gray-200" />
                  <Skeleton className="h-3 w-1/2 bg-gray-200" />
                  <Skeleton className="h-3 w-2/3 bg-gray-200" />
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
              <p className="mt-1 text-text-secondary">{error}</p>
            </div>
            <button type="button" onClick={() => void fetchCollection()} className="rounded-xl bg-brand-blue px-5 py-2 text-sm font-semibold text-bg-base transition-colors hover:bg-brand-blue/90">
              Try again
            </button>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-bg-card px-6 py-20 text-center">
            <Layers size={36} className="text-text-secondary" />
            <div>
              <h2 className="text-xl font-bold">This collection is empty</h2>
              <p className="mt-1 text-text-secondary">There are no public cards to display yet.</p>
            </div>
            <Link to="/cards" className="rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-semibold text-bg-base transition-colors hover:bg-brand-blue/90">
              Browse cards
            </Link>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="grid grid-cols-1 gap-6 pt-2 md:grid-cols-2 lg:grid-cols-3">
            {items.map((entry) => (
              <CollectionCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
