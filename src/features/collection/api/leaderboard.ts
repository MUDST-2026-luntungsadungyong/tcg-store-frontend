import apiClient from '@/shared/api/client';

export interface PublicRareCardHighlight {
  cardId: string;
  name: string;
  imageUrl: string;
  rarity: string;
  quantity: number;
}

export interface CollectorRanking {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  rareCardCount: number;
  distinctRareCardCount: number;
  highlights: PublicRareCardHighlight[];
}

interface LeaderboardResponse {
  items?: unknown;
}

function toNumber(value: unknown): number {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
}

function normalizeHighlight(value: unknown): PublicRareCardHighlight {
  const item = (value ?? {}) as Record<string, unknown>;
  return {
    cardId: String(item.cardId ?? item.id ?? ''),
    name: String(item.name ?? item.cardName ?? 'Unknown card'),
    imageUrl: String(item.imageUrl ?? item.image ?? ''),
    rarity: String(item.rarity ?? 'Rare'),
    quantity: toNumber(item.quantity),
  };
}

function normalizeCollector(value: unknown, index: number): CollectorRanking {
  const item = (value ?? {}) as Record<string, unknown>;
  const owner = (item.owner ?? {}) as Record<string, unknown>;
  const highlights = item.highlights ?? item.featuredCards ?? [];

  return {
    rank: toNumber(item.rank) || index + 1,
    userId: String(item.userId ?? item.ownerId ?? owner.id ?? ''),
    displayName: String(
      item.displayName ?? item.name ?? owner.displayName ?? owner.name ?? 'Anonymous collector',
    ),
    avatarUrl: (item.avatarUrl ?? owner.avatarUrl ?? null) as string | null,
    rareCardCount: toNumber(item.rareCardCount ?? item.totalRareCards ?? item.quantity),
    distinctRareCardCount: toNumber(item.distinctRareCardCount ?? item.uniqueRareCards),
    highlights: Array.isArray(highlights) ? highlights.map(normalizeHighlight).slice(0, 3) : [],
  };
}

/** Reads the public, backend-owned collection leaderboard. */
export async function getTopCollectors(limit = 5): Promise<CollectorRanking[]> {
  const safeLimit = Math.min(10, Math.max(1, Math.trunc(limit)));
  const response = await apiClient.get<LeaderboardResponse | unknown[]>('/collections/leaderboard', {
    params: { limit: safeLimit },
  });
  const payload = response.data;
  const items = !Array.isArray(payload) && Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(response.data)
      ? response.data
      : [];

  return items.map(normalizeCollector).slice(0, safeLimit);
}

export const leaderboardApi = { getTopCollectors };
