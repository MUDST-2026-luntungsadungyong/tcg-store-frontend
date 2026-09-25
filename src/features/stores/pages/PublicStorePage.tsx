import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { CardListing } from '@/entities/card/model/types';
import { listingDiscoveryApi } from '@/features/discovery/api/listings';
import { CardListingCard } from '@/features/discovery/components/CardListingCard';
import { Skeleton } from '@/shared/components/Skeleton';
import { storesApi, type StoreProfile } from '../api/stores';
import { groupListingsByCard } from '@/features/discovery/lib/groupListings';

export function PublicStorePage() {
  const { sellerId = '' } = useParams();
  const [store, setStore] = useState<StoreProfile>();
  const [listings, setListings] = useState<CardListing[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const cards = useMemo(() => groupListingsByCard(listings), [listings]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError('');

    Promise.all([
      storesApi.public(sellerId),
      listingDiscoveryApi.getListings({ sellerId, page: 0, size: 100, sortBy: 'price', sortDir: 'asc' }),
    ])
      .then(([profile, result]) => {
        if (cancelled) return;
        setStore(profile);
        setListings(result.items);
      })
      .catch(() => {
        if (!cancelled) setError('Store not found.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sellerId]);

  if (isLoading) {
    return (
      <main className="mx-auto max-w-7xl p-8">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map(item => <Skeleton key={item} className="h-[200px] rounded-2xl" />)}
        </div>
      </main>
    );
  }

  if (error || !store) return <main className="p-8 text-center text-gray-300">{error || 'Store not found.'}</main>;

  return (
    <main className="mx-auto max-w-7xl p-6 md:p-8">
      <section className="rounded-2xl border border-white/10 bg-white/[.03] p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">Seller storefront</p>
        <h1 className="mt-2 text-3xl font-bold md:text-4xl">{store.shopName}</h1>
        {store.shopDescription && <p className="mt-4 max-w-3xl text-gray-300">{store.shopDescription}</p>}
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-300">
          {store.phone && <p>Phone: {store.phone}</p>}
          {store.line && <p>Line: {store.line}</p>}
          {store.facebook && <p>Facebook: {store.facebook}</p>}
        </div>
      </section>

      <section className="mt-10" aria-labelledby="store-listings-heading">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-blue">Available now</p>
            <h2 id="store-listings-heading" className="mt-1 text-2xl font-bold">Cards from this seller</h2>
          </div>
          <p className="text-sm text-gray-400">{cards.length} card{cards.length === 1 ? '' : 's'}</p>
        </div>

        {listings.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {cards.map(card => <CardListingCard key={card.cardId || card.id} listing={card} sellerCount={card.sellerCount} />)}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/15 p-12 text-center text-gray-400">
            This seller has no public listings right now.
          </div>
        )}
      </section>
    </main>
  );
}
