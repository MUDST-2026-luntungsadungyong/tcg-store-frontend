import type { CardListing, CollectionEntry } from '@/entities/card/model/types';

/**
 * Standard card rarity tiers that MUST be discarded immediately upfront.
 * Skipping calculation for common, uncommon, rare, and standard rare holos
 * saves processing resources per performance requirements.
 */
const STANDARD_TIERS_TO_DISCARD = new Set([
  'common',
  'uncommon',
  'rare',
  'rare holo',
  'holo',
  'normal',
]);

/**
 * Calculates the score value of a card based strictly on ultra-rare status.
 *
 * Scoring:
 * - Promo / Trophy: 30 pts
 * - Secret Rare / Hyper Rare / Rainbow Rare: 25 pts
 * - GX / EX / Tag Team: 20 pts (User spec: Gx = 20)
 * - Ultra Rare / V / VMAX / VSTAR: 15 pts
 * - Common / Uncommon / Rare / Rare Holo: 0 pts (Discarded immediately)
 */
export function getCardUltraRarityPoints(rarity?: string | null, name?: string | null): number {
  const r = (rarity ?? '').trim().toLowerCase();
  const n = (name ?? '').trim().toLowerCase();

  // 1. Fast path: Discard standard / non-rare / common / rare holo tiers immediately
  if (STANDARD_TIERS_TO_DISCARD.has(r)) {
    return 0;
  }

  // 2. Promotional & Trophy Cards (30 pts)
  if (r.includes('promo') || r.includes('trophy') || n.includes('trophy')) {
    return 30;
  }

  // 3. Secret Rare / Hyper Rare / Rainbow Rare (25 pts)
  if (r.includes('secret') || r.includes('hyper') || r.includes('rainbow')) {
    return 25;
  }

  // 4. GX / EX / Tag Team (20 pts - explicit user spec: Gx = 20)
  if (
    r.includes('gx') ||
    r.includes('tag team') ||
    n.endsWith('-gx') ||
    n.endsWith(' gx') ||
    n.includes('-gx ') ||
    n.includes(' gx ') ||
    r.includes('ex') ||
    n.endsWith('-ex') ||
    n.endsWith(' ex')
  ) {
    return 20;
  }

  // 5. Ultra Rare / V / VMAX / VSTAR (15 pts)
  if (
    r.includes('ultra rare') ||
    r.includes('vmax') ||
    r.includes('vstar') ||
    r.includes('holo v') ||
    r === 'rare ultra' ||
    n.endsWith(' vmax') ||
    n.endsWith(' vstar') ||
    n.endsWith(' v')
  ) {
    return 15;
  }

  // Any other uncategorized tier discarded
  return 0;
}

export interface FeaturedRareCard {
  id: string;
  name: string;
  image: string;
  rarity: string;
  points: number;
  quantity: number;
}

export interface CollectionScoreResult {
  totalScore: number;
  ultraRareCount: number;
  featuredCards: FeaturedRareCard[];
}

/**
 * Computes total rare collection score for a list of collection entries.
 * Entries that are Common, Uncommon, Rare, or Rare Holo yield 0 points.
 */
export function calculateCollectionScore(entries: CollectionEntry[]): CollectionScoreResult {
  let totalScore = 0;
  let ultraRareCount = 0;
  const featuredCards: FeaturedRareCard[] = [];

  for (const entry of entries) {
    const listing = entry.listing as CardListing | undefined;
    if (!listing) continue;

    const pointsPerCard = getCardUltraRarityPoints(listing.rarity, listing.name);
    // Discard cards with 0 points (Common, Uncommon, Rare, Rare Holo)
    if (pointsPerCard === 0) {
      continue;
    }

    const qty = Math.max(1, entry.quantity || 1);
    totalScore += pointsPerCard * qty;
    ultraRareCount += qty;

    featuredCards.push({
      id: listing.id,
      name: listing.name,
      image: listing.image,
      rarity: listing.rarity || 'Ultra Rare',
      points: pointsPerCard,
      quantity: qty,
    });
  }

  // Sort featured cards by points descending
  featuredCards.sort((a, b) => b.points - a.points);

  return {
    totalScore,
    ultraRareCount,
    featuredCards,
  };
}
