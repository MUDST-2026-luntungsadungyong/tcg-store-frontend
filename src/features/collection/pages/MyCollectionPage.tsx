import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Layers, AlertCircle, Plus, RefreshCw, X } from 'lucide-react';
import { collectionApi } from '../api/collection';
import { CollectionCard } from '../components/CollectionCard';
import { Skeleton } from '@/shared/components/Skeleton';
import { Modal } from '@/shared/components/Modal';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import { useToastStore } from '@/shared/model/useToastStore';
import type { CollectionEntry } from '@/entities/card/model/types';
import type { CatalogCard } from '@/features/discovery/api/catalog';
import {
  CatalogCardDetails,
  CatalogCardImageFrame,
  CatalogCardPicker,
} from '@/features/listings/components/CatalogCardPicker';

export function MyCollectionPage() {
  const [collection, setCollection] = useState<CollectionEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedEntryForDelete, setSelectedEntryForDelete] = useState<CollectionEntry | null>(null);

  const [addCardOpen, setAddCardOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CatalogCard | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [addCardError, setAddCardError] = useState<string | null>(null);
  const addCardDialogRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!addCardOpen) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    addCardDialogRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [addCardOpen]);

  const openAddCard = () => {
    setSelectedCard(null);
    setAddCardError(null);
    setAddCardOpen(true);
  };

  const closeAddCard = () => {
    if (isAdding) return;
    setAddCardOpen(false);
    setSelectedCard(null);
    setAddCardError(null);
  };

  const handleAddCard = async () => {
    if (!selectedCard) {
      setAddCardError('Select a card from the database.');
      return;
    }
    if (isAdding) return;
    setIsAdding(true);
    setAddCardError(null);
    try {
      const entry = await collectionApi.addCatalogCardToCollection(selectedCard);
      setCollection((prev) => {
        const exists = prev.find((item) => item.id === entry.id);
        if (exists) return prev.map((item) => (item.id === entry.id ? entry : item));
        return [entry, ...prev];
      });
      addToast({
        type: 'success',
        title: 'Card added',
        message: `"${selectedCard.name}" was added to your collection.`,
      });
      closeAddCard();
    } catch (err) {
      addToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to add card to collection.',
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedEntryForDelete) return;
    const entryId = selectedEntryForDelete.id;
    const cardName = selectedEntryForDelete.listing.name;

    try {
      setDeletingId(entryId);
      await collectionApi.removeFromCollection(entryId);
      setCollection((prev) => prev.filter((item) => item.id !== entryId));
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
      setSelectedEntryForDelete(null);
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

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <button
              type="button"
              id="collection-add-card-button"
              onClick={openAddCard}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-blue hover:bg-brand-blue/90 text-sm font-semibold text-white transition-colors shadow-lg shadow-brand-blue/20"
            >
              <Plus size={16} />
              Add Card
            </button>
            <button
              type="button"
              onClick={fetchCollection}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-surface hover:bg-bg-elevated border border-white/10 text-sm font-medium text-gray-300 transition-colors disabled:opacity-50"
              title="Refresh Collection"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
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
              to="/cards"
              className="mt-2 bg-brand-blue hover:bg-brand-blue/90 text-white font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors shadow-lg shadow-brand-blue/20"
            >
              Browse Cards
            </Link>
          </div>
        )}

        {/* Collection Cards Grid (2-column or 3-column according to Figma 641:1898) */}
        {!loading && !error && collection.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {collection.map((entry) => (
              <CollectionCard
                key={entry.id}
                entry={entry}
                onDelete={() => setSelectedEntryForDelete(entry)}
                isDeleting={deletingId === entry.id}
              />
            ))}
          </div>
        )}

        {/* Confirmation Modal before Deleting */}
        <Modal
          isOpen={selectedEntryForDelete !== null}
          onClose={() => setSelectedEntryForDelete(null)}
          title="Delete from Collection"
        >
          <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-300">
              Are you sure you want to remove{' '}
              <strong className="text-white font-semibold">"{selectedEntryForDelete?.listing.name}"</strong> from your
              personal collection?
            </p>
            <div className="flex items-center justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => setSelectedEntryForDelete(null)}
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

        {/* Add Card Dialog */}
        {addCardOpen &&
          createPortal(
            <div
              className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget && !isAdding) closeAddCard();
              }}
            >
              <div
                ref={addCardDialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="add-card-dialog-title"
                tabIndex={-1}
                onKeyDown={(event) => {
                  if (event.key === 'Escape' && !isAdding) closeAddCard();
                }}
                className="glass-elevated flex max-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-xl"
              >
                <div className="flex shrink-0 items-center justify-between border-b border-white/10 p-4">
                  <h2 id="add-card-dialog-title" className="text-lg font-semibold text-white">
                    Add Card to Collection
                  </h2>
                  <button
                    type="button"
                    aria-label="Close add card dialog"
                    disabled={isAdding}
                    onClick={closeAddCard}
                    className="text-gray-400 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-4">
                  <div className="space-y-5">
                    <div className="grid gap-5 md:grid-cols-[180px_minmax(0,1fr)]">
                      <CatalogCardImageFrame card={selectedCard} />

                      <div className="space-y-4">
                        <CatalogCardPicker
                          card={selectedCard}
                          error={addCardError ?? undefined}
                          onSelect={(card) => {
                            setSelectedCard(card);
                            setAddCardError(null);
                          }}
                        />

                        <Input
                          id="collection-card-market-price"
                          type="number"
                          label="Market price (฿)"
                          value={selectedCard?.marketPrice ?? ''}
                          disabled
                          placeholder="—"
                          onChange={() => undefined}
                        />

                        {selectedCard && <CatalogCardDetails card={selectedCard} />}
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 border-t border-white/10 pt-5">
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={isAdding}
                        onClick={closeAddCard}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        isLoading={isAdding}
                        onClick={() => void handleAddCard()}
                      >
                        Add to Collection
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )}

      </div>
    </div>
  );
}
