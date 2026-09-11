import { storage, initMockStorage } from '@/infrastructure/mock-db/storage';
import { mockCollection, mockUsers } from '@/infrastructure/mock-db/data';
import { calculateCollectionScore } from '../lib/collectionScoring';
import type { FeaturedRareCard } from '../lib/collectionScoring';
import type { CollectionEntry } from '@/entities/card/model/types';
import type { User } from '@/entities/account/model/types';

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
 * Calculates top collectors from collection and user records.
 * Discards Common, Uncommon, Rare, and Rare Holo cards.
 */
export function calculateTopCollectors(
  collections: CollectionEntry[] = mockCollection,
  users: User[] = mockUsers,
  limit = 5
): CollectorRanking[] {
  const safeCollections = collections && collections.length > 0 ? collections : mockCollection;
  const safeUsers = users && users.length > 0 ? users : mockUsers;

  // Group collection entries by ownerId
  const collectionByUser = new Map<string, CollectionEntry[]>();
  for (const entry of safeCollections) {
    if (!entry.ownerId) continue;
    const list = collectionByUser.get(entry.ownerId) || [];
    list.push(entry);
    collectionByUser.set(entry.ownerId, list);
  }

  // Create user lookup map
  const userMap = new Map(safeUsers.map((u) => [u.id, u]));

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

/**
 * Retrieves the top collectors ranked by ultra-rare collection scores.
 * Discards all Common, Uncommon, Rare, and Rare Holo cards.
 *
 * @param limit Number of top collectors to return (default: 5)
 */
export async function getTopCollectors(limit = 5): Promise<CollectorRanking[]> {
  try {
    initMockStorage();
  } catch {
    // Ignore environments where localStorage is not accessible
  }

  const collections = storage.getCollection();
  const users = storage.getUsers();

  return calculateTopCollectors(collections, users, limit);
}
