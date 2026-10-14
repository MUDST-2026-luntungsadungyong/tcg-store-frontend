import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/config/env', () => ({
  ENV: { ENABLE_MOCK_API: false, API_BASE_URL: 'http://localhost:8080/api' },
}));

import apiClient from '@/shared/api/client';
import { getTopCollectors } from './leaderboard';

describe('leaderboard API adapter', () => {
  afterEach(() => vi.restoreAllMocks());

  it('reads and limits the backend leaderboard without using local mock storage', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: {
        items: [
          { userId: 'user-1', displayName: 'Red Champion', rank: 1, rareCardCount: 12, distinctRareCardCount: 7, highlights: [] },
          { userId: 'user-2', displayName: 'Cynthia Shirona', rank: 2, rareCardCount: 10, distinctRareCardCount: 6, highlights: [] },
        ],
      },
    } as never);

    await expect(getTopCollectors(10)).resolves.toMatchObject([
      { userId: 'user-1', displayName: 'Red Champion', rareCardCount: 12 },
      { userId: 'user-2', displayName: 'Cynthia Shirona', rareCardCount: 10 },
    ]);
    expect(get).toHaveBeenCalledWith('/collections/leaderboard', { params: { limit: 10 } });
  });

  it('normalizes highlight card fields and clamps the requested limit to ten', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: { items: [{ ownerId: 'user-1', name: 'Collector', totalRareCards: '4', highlights: [{ id: 9, cardName: 'Mew', image: '/mew.png', quantity: '2' }] }] },
    } as never);

    const result = await getTopCollectors(100);
    expect(result[0]).toMatchObject({ userId: 'user-1', displayName: 'Collector', rareCardCount: 4 });
    expect(result[0].highlights[0]).toMatchObject({ cardId: '9', name: 'Mew', imageUrl: '/mew.png', quantity: 2 });
    expect(apiClient.get).toHaveBeenCalledWith('/collections/leaderboard', { params: { limit: 10 } });
  });
});
