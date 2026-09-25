import type { CardListing } from '@/entities/card/model/types';

export type CanonicalCardListing = CardListing & { sellerCount: number };

export function canonicalCardKey(listing: CardListing): string {
  return listing.cardId || [listing.name, listing.set, listing.cardNumber].filter(Boolean).join('|').toLowerCase() || listing.id;
}

export function groupListingsByCard(listings: CardListing[]): CanonicalCardListing[] {
  const groups = new Map<string, CardListing[]>();
  listings.filter(listing => listing.status === 'SHOW').forEach(listing => {
    const key = canonicalCardKey(listing);
    groups.set(key, [...(groups.get(key) ?? []), listing]);
  });
  return [...groups.values()].map(offers => {
    const cheapest = [...offers].sort((a, b) => a.price - b.price)[0];
    return {
      ...cheapest,
      stock: offers.reduce((total, offer) => total + Math.max(offer.stock, 0), 0),
      sellerCount: new Set(offers.map(offer => offer.sellerId)).size,
    };
  });
}
