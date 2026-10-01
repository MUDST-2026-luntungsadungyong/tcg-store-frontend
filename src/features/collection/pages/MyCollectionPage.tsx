import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import { Layers, AlertCircle, Plus, RefreshCw, ShoppingBag, Store, X } from 'lucide-react';
import { collectionApi } from '../api/collection';
import { CollectionCard } from '../components/CollectionCard';
import { Skeleton } from '@/shared/components/Skeleton';
import { Modal } from '@/shared/components/Modal';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { useToastStore } from '@/shared/model/useToastStore';
import { useAuthStore } from '@/features/auth/model/useAuthStore';
import type { CardListing, CollectionEntry } from '@/entities/card/model/types';
import type { CatalogCard } from '@/features/discovery/api/catalog';
import { CardListingCard } from '@/features/discovery/components/CardListingCard';
import { groupListingsByCard } from '@/features/discovery/lib/groupListings';
import { listingsApi } from '@/features/listings/api/listings';
import {
  CatalogCardDetails,
  CatalogCardImageFrame,
  CatalogCardPicker,
} from '@/features/listings/components/CatalogCardPicker';

export function MyCollectionPage() {
  const user = useAuthStore((state) => state.user);
  const isSeller = user?.isSeller === true;
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedView = searchParams.get('view');
  const activeView: 'collection' | 'store' = isSeller && requestedView === 'store' ? 'store' : 'collection';

  const [collection, setCollection] = useState<CollectionEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [storeListings, setStoreListings] = useState<CardListing[]>([]);
  const [storeLoading, setStoreLoading] = useState(false);
  const [storeError, setStoreError] = useState<string | null>(null);
  const [storeLoaded, setStoreLoaded] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedEntryForDelete, setSelectedEntryForDelete] = useState<CollectionEntry | null>(null);

  const [addCardOpen, setAddCardOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CatalogCard | null>(null);
  const [addQuantity, setAddQuantity] = useState('1');
  const [addQuantityError, setAddQuantityError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [addCardError, setAddCardError] = useState<string | null>(null);
  const addCardDialogRef = useRef<HTMLDivElement>(null);

  const addToast = useToastStore((s) => s.addToast);

  const storeCards = useMemo(() => groupListingsByCard(storeListings), [storeListings]);

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

  const fetchStore = useCallback(async () => {
    if (!isSeller) return;
    setStoreLoading(true);
    setStoreError(null);
    try {
      const listings = await listingsApi.getListings({ status: 'SHOW', page: 0, size: 100 });
      setStoreListings(listings.filter((listing) => listing.status === 'SHOW' && listing.stock > 0));
    } catch (err) {
      setStoreError(err instanceof Error ? err.message : 'Failed to load your store.');
    } finally {
      setStoreLoaded(true);
      setStoreLoading(false);
    }
  }, [isSeller]);

  useEffect(() => {
    if (activeView === 'store' && !storeLoaded) void fetchStore();
  }, [activeView, fetchStore, storeLoaded]);

  const selectView = (view: 'collection' | 'store') => {
    const nextParams = new URLSearchParams(searchParams);
    if (view === 'collection') nextParams.delete('view');
    else nextParams.set('view', view);
    setSearchParams(nextParams);
  };

  const refreshActiveView = () => {
    if (activeView === 'store') {
      void fetchStore();
      return;
    }
    void fetchCollection();
  };

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
    setAddQuantity('1');
    setAddQuantityError(null);
    setAddCardError(null);
    setAddCardOpen(true);
  };

  const closeAddCard = () => {
    if (isAdding) return;
    setAddCardOpen(false);
    setSelectedCard(null);
    setAddQuantity('1');
    setAddQuantityError(null);
    setAddCardError(null);
  };

  const handleAddCard = async () => {
    if (!selectedCard) {
      setAddCardError('Select a card from the database.');
      return;
    }
    const quantity = Number(addQuantity);
    if (!Number.isSafeInteger(quantity) || quantity < 1) {
      setAddQuantityError('Enter a whole number of cards to add.');
      return;
    }
    if (isAdding) return;
    setIsAdding(true);
    setAddCardError(null);
    setAddQuantityError(null);
    try {
      const entry = await collectionApi.addCatalogCardToCollection(selectedCard, quantity);
      setCollection((prev) => {
        const exists = prev.find((item) => item.id === entry.id);
        if (exists) return prev.map((item) => (item.id === entry.id ? entry : item));
        return [entry, ...prev];
      });
      addToast({
        type: 'success',
        title: 'Card added',
        message: `${quantity} × "${selectedCard.name}" was added to your collection.`,
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
              {activeView === 'store' ? 'My Store' : 'My Collection'}
            </h1>
            <p className="text-sm md:text-base text-gray-400 mt-2 max-w-2xl leading-relaxed">
              {activeView === 'store'
                ? 'Cards you currently have listed for sale in your store.'
                : 'Cards you have saved to your personal collection. List any card for sale anytime.'}
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            {activeView === 'collection' ? (
              <button
                type="button"
                id="collection-add-card-button"
                onClick={openAddCard}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-blue hover:bg-brand-blue/90 text-sm font-semibold text-white transition-colors shadow-lg shadow-brand-blue/20"
              >
                <Plus size={16} />
                Add Card
              </button>
            ) : (
              <Link
                to="/workspace/listings"
                aria-label="Manage your listings"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-blue hover:bg-brand-blue/90 text-sm font-semibold text-white transition-colors shadow-lg shadow-brand-blue/20"
              >
                <Store size={16} />
                Manage Listings
              </Link>
            )}
            <button
              type="button"
              onClick={refreshActiveView}
              disabled={loading || storeLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-surface hover:bg-bg-elevated border border-white/10 text-sm font-medium text-gray-300 transition-colors disabled:opacity-50"
              title={`Refresh ${activeView === 'store' ? 'Store' : 'Collection'}`}
            >
              <RefreshCw size={16} className={loading || storeLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {isSeller && (
          <div
            role="tablist"
            aria-label="Seller inventory views"
            className="inline-flex w-fit rounded-xl border border-white/10 bg-bg-surface p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeView === 'collection'}
              aria-controls="seller-inventory-panel"
              onClick={() => selectView('collection')}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                activeView === 'collection' ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Layers size={16} />
              My Collection
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">{collection.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeView === 'store'}
              aria-controls="seller-inventory-panel"
              onClick={() => selectView('store')}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                activeView === 'store' ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Store size={16} />
              My Store
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">{storeCards.length}</span>
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {(activeView === 'collection' ? loading : storeLoading) && (
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
        {activeView === 'collection' && !loading && error && (
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
              onClick={() => void fetchCollection()}
              className="px-5 py-2 bg-brand-blue hover:bg-brand-blue/90 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {activeView === 'store' && !storeLoading && storeError && (
          <div className="bg-[#192338] border border-status-danger/30 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-4">
            <div className="size-12 rounded-full bg-status-danger/10 text-status-danger flex items-center justify-center">
              <AlertCircle size={28} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Unable to load store</h3>
              <p className="text-sm text-gray-400 mt-1">{storeError}</p>
            </div>
            <button type="button" onClick={refreshActiveView} className="px-5 py-2 bg-brand-blue hover:bg-brand-blue/90 text-white text-sm font-semibold rounded-lg transition-colors">
              Try Again
            </button>
          </div>
        )}

        {/* Collection empty state */}
        {activeView === 'collection' && !loading && !error && collection.length === 0 && (
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

        {/* Store empty state */}
        {activeView === 'store' && !storeLoading && !storeError && storeCards.length === 0 && (
          <div className="bg-[#192338] border border-[rgba(143,179,226,0.15)] rounded-2xl py-20 px-6 flex flex-col items-center justify-center text-center gap-4">
            <div className="size-16 rounded-full bg-white/5 flex items-center justify-center text-gray-400">
              <ShoppingBag size={32} />
            </div>
            <div className="max-w-md">
              <h3 className="text-xl font-bold text-white">Your store is empty</h3>
              <p className="text-sm text-gray-400 mt-1">Cards appear here only after you open a listing for sale with available stock.</p>
            </div>
            <Link to="/workspace/listings" className="mt-2 bg-brand-blue hover:bg-brand-blue/90 text-white font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors shadow-lg shadow-brand-blue/20">
              Manage Listings
            </Link>
          </div>
        )}

        {/* Collection cards */}
        {activeView === 'collection' && !loading && !error && collection.length > 0 && (
          <div id="seller-inventory-panel" role={isSeller ? 'tabpanel' : undefined} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
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

        {/* Seller store cards reuse the canonical public-store presentation. */}
        {activeView === 'store' && !storeLoading && !storeError && storeCards.length > 0 && (
          <div id="seller-inventory-panel" role="tabpanel" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 pt-2">
            {storeCards.map((card) => (
              <CardListingCard key={card.cardId || card.id} listing={card} sellerCount={card.sellerCount} />
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
