import { storage } from '@/infrastructure/mock-db/storage';
import { calculateCollectionScore } from '../lib/collectionScoring';
import type { FeaturedRareCard } from '../lib/collectionScoring';
import type { CollectionEntry } from '@/entities/card/model/types';

export interface CollectorRanking {
  rank: number;
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  totalScore: number;
  ultraRareCount: number;
  featuredCards: FeaturedRareCard[];
}

/**
 * Retrieves the top collectors ranked by ultra-rare collection scores.
 * Discards all Common, Uncommon, Rare, and Rare Holo cards.
 *
 * @param limit Number of top collectors to return (default: 5)
 */
export async function getTopCollectors(limit = 5): Promise<CollectorRanking[]> {
  const collections = storage.getCollection();
  const users = storage.getUsers();

  // Group collection entries by ownerId
  const collectionByUser = new Map<string, CollectionEntry[]>();
  for (const entry of collections) {
    if (!entry.ownerId) continue;
    const list = collectionByUser.get(entry.ownerId) || [];
    list.push(entry);
    collectionByUser.set(entry.ownerId, list);
  }

  // Create user lookup map
  const userMap = new Map(users.map((u) => [u.id, u]));

  const rankings: Array<Omit<CollectorRanking, 'rank'>> = [];

  for (const [ownerId, entries] of collectionByUser.entries()) {
    const user = userMap.get(ownerId);
    const scoreResult = calculateCollectionScore(entries);

    // Only include collectors who have a score > 0
    if (scoreResult.totalScore > 0) {
      rankings.push({
        userId: ownerId,
        name: user?.name || `Collector ${ownerId.replace('usr-', '#')}`,
        email: user?.email || '',
        avatarUrl: user?.avatarUrl,
        totalScore: scoreResult.totalScore,
        ultraRareCount: scoreResult.ultraRareCount,
        featuredCards: scoreResult.featuredCards,
      });
    }
  }

  // Sort descending by total score
  rankings.sort((a, b) => b.totalScore - a.totalScore);

  // Assign ranks and take top limit
  return rankings.slice(0, limit).map((collector, index) => ({
    ...collector,
    rank: index + 1,
  }));
}
