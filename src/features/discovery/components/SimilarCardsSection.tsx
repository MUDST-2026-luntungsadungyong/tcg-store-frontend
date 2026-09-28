import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { CardListing } from '@/entities/card/model/types';
import { listingDiscoveryApi } from '@/features/discovery/api/listings';
import { canonicalCardKey, groupListingsByCard } from '@/features/discovery/lib/groupListings';

interface SimilarCardsSectionProps { card: CardListing }

export function SimilarCardsSection({ card }: SimilarCardsSectionProps) {
  const [listings, setListings] = useState<CardListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    const filters = [
      ...(card.rarity ? [{ rarity: card.rarity }] : []),
      ...(card.stage ? [{ stage: card.stage }] : []),
    ];
    Promise.all(filters.length
      ? filters.map(filter => listingDiscoveryApi.getListings({ ...filter, page: 0, size: 100 }))
      : [listingDiscoveryApi.getListings({ page: 0, size: 100 })])
      .then(results => {
        if (cancelled) return;
        const unique = new Map<string, CardListing>();
        results.flatMap(result => result.items).forEach(listing => unique.set(listing.id, listing));
        setListings([...unique.values()]);
      })
      .catch(() => { if (!cancelled) setFailed(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [card.cardId, card.name, card.rarity, card.set, card.stage, card.cardNumber]);

  const similarCards = useMemo(() => {
    const currentKey = canonicalCardKey(card);
    const matches: CardListing[] = [];
    for (const listing of listings) {
      const sameCard = canonicalCardKey(listing) === currentKey || (
        listing.name.trim().toLowerCase() === card.name.trim().toLowerCase() &&
        (listing.set || '').trim().toLowerCase() === (card.set || '').trim().toLowerCase() &&
        (listing.cardNumber || '').trim().toLowerCase() === (card.cardNumber || '').trim().toLowerCase()
      );
      if (sameCard) continue;
      const rarityMatch = Boolean(card.rarity && listing.rarity === card.rarity);
      const stageMatch = Boolean(card.stage && listing.stage === card.stage);
      if (!rarityMatch && !stageMatch) continue;
      matches.push(listing);
    }
    return groupListingsByCard(matches).slice(0, 6);
  }, [card, listings]);

  return (
    <section className="mt-12" aria-labelledby="similar-cards-heading">
      <h2 id="similar-cards-heading" className="text-2xl font-bold">Similar cards</h2>
      {loading ? <p role="status" className="mt-4 text-sm text-gray-400">Loading similar cards…</p> : failed ? <p className="mt-4 text-sm text-gray-400">Similar cards are unavailable right now.</p> : similarCards.length ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {similarCards.map(item => <Link key={canonicalCardKey(item)} to={`/cards/${encodeURIComponent(item.cardId || item.id)}`} className="flex min-w-0 items-center gap-4 rounded-xl border border-white/10 bg-white/[.03] p-3 transition-colors hover:border-brand-blue/50">
            <img src={item.image || '/assets/expensive_card_1.png'} alt="" className="h-24 w-20 shrink-0 rounded-lg bg-white object-contain" />
            <span className="min-w-0"><span className="block truncate font-semibold text-white">{item.name}</span><span className="mt-1 block text-sm text-gray-400">{item.sellerCount} {item.sellerCount === 1 ? 'seller' : 'sellers'} · From ฿{item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></span>
          </Link>)}
        </div>
      ) : <p className="mt-4 text-sm text-gray-400">No similar listings found.</p>}
    </section>
  );
}
