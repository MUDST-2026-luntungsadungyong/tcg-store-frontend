import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layers, AlertCircle, RefreshCw } from 'lucide-react';
import { collectionApi } from '../api/collection';
import { CollectionCard } from '../components/CollectionCard';
import { Skeleton } from '@/shared/components/Skeleton';
import { Modal } from '@/shared/components/Modal';
import { useToastStore } from '@/shared/model/useToastStore';
import type { Product } from '@/shared/types';

export function MyCollectionPage() {
  const [collection, setCollection] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedCardForDelete, setSelectedCardForDelete] = useState<Product | null>(null);

  const addToast = useToastStore((s) => s.addToast);

  const fetchCollection = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await collectionApi.getMyCollection();
      setCollection(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load your collection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCollection();
  }, [fetchCollection]);

  const handleConfirmDelete = async () => {
    if (!selectedCardForDelete) return;
    const cardId = selectedCardForDelete.id;
    const cardName = selectedCardForDelete.name;

    try {
      setDeletingId(cardId);
      await collectionApi.removeFromCollection(cardId);
      setCollection((prev) => prev.filter((item) => item.id !== cardId));
      addToast({
        type: 'info',
        message: `Removed "${cardName}" from your collection`,
      });
    } catch (err) {
      addToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to remove card',
      });
    } finally {
      setDeletingId(null);
      setSelectedCardForDelete(null);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-[#0B141F] text-white font-['IBM_Plex_Sans_Thai',sans-serif] px-4 md:px-8 py-10">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
        
        {/* Header Section from Figma 641:1898 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
              My Collection
            </h1>
            <p className="text-sm md:text-base text-gray-400 mt-2 max-w-2xl leading-relaxed">
              Cards you have saved to your personal collection. List any card for sale anytime.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchCollection}
            disabled={loading}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-surface hover:bg-bg-elevated border border-white/10 text-sm font-medium text-gray-300 transition-colors disabled:opacity-50"
            title="Refresh Collection"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex gap-5 animate-pulse">
                <Skeleton className="w-28 h-36 rounded-xl bg-white/10 shrink-0" />
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-3/4 bg-white/10" />
                    <Skeleton className="h-3 w-1/2 bg-white/10" />
                    <Skeleton className="h-3 w-2/3 bg-white/10 mt-2" />
                  </div>
                  <Skeleton className="h-8 w-32 rounded-lg bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State with Retry */}
        {!loading && error && (
          <div className="bg-[#192338] border border-status-danger/30 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-4">
            <div className="size-12 rounded-full bg-status-danger/10 text-status-danger flex items-center justify-center">
              <AlertCircle size={28} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Unable to load collection</h3>
              <p className="text-sm text-gray-400 mt-1">{error}</p>
            </div>
            <button
              type="button"
              onClick={fetchCollection}
              className="px-5 py-2 bg-brand-blue hover:bg-brand-blue/90 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && collection.length === 0 && (
          <div className="bg-[#192338] border border-[rgba(143,179,226,0.15)] rounded-2xl py-20 px-6 flex flex-col items-center justify-center text-center gap-4">
            <div className="size-16 rounded-full bg-white/5 flex items-center justify-center text-gray-400">
              <Layers size={32} />
            </div>
            <div className="max-w-md">
              <h3 className="text-xl font-bold text-white">Your collection is empty</h3>
              <p className="text-sm text-gray-400 mt-1">
                Save rare cards you own or wish to track to build your personal showcase!
              </p>
            </div>
            <Link
              to="/browse"
              className="mt-2 bg-brand-blue hover:bg-brand-blue/90 text-white font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors shadow-lg shadow-brand-blue/20"
            >
              Browse Cards
            </Link>
          </div>
        )}

        {/* Collection Cards Grid (2-column or 3-column according to Figma 641:1898) */}
        {!loading && !error && collection.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {collection.map((card) => (
              <CollectionCard
                key={card.id}
                card={card}
                onDelete={() => setSelectedCardForDelete(card)}
                isDeleting={deletingId === card.id}
              />
            ))}
          </div>
        )}

        {/* Confirmation Modal before Deleting */}
        <Modal
          isOpen={selectedCardForDelete !== null}
          onClose={() => setSelectedCardForDelete(null)}
          title="Delete from Collection"
        >
          <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-300">
              Are you sure you want to remove{' '}
              <strong className="text-white font-semibold">"{selectedCardForDelete?.name}"</strong> from your
              personal collection?
            </p>
            <div className="flex items-center justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => setSelectedCardForDelete(null)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deletingId !== null}
                className="px-4 py-2 bg-status-danger hover:bg-status-danger/90 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {deletingId ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </Modal>

      </div>
    </div>
  );
}
