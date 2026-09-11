import { beforeEach, describe, expect, it } from 'vitest';
import { getTopCollectors } from './leaderboard';
import { initMockStorage } from '@/infrastructure/mock-db/storage';

describe('leaderboard: getTopCollectors', () => {
  beforeEach(() => {
    localStorage.clear();
    initMockStorage();
  });

  it('returns exactly top 5 collectors ranked by score in descending order', async () => {
    const topCollectors = await getTopCollectors(5);

    expect(topCollectors).toHaveLength(5);
    expect(topCollectors[0].rank).toBe(1);
    expect(topCollectors[0].name).toBe('Red Champion');
    expect(topCollectors[0].totalScore).toBe(175);

    expect(topCollectors[1].rank).toBe(2);
    expect(topCollectors[1].name).toBe('Cynthia Shirona');
    expect(topCollectors[1].totalScore).toBe(160);

    expect(topCollectors[2].rank).toBe(3);
    expect(topCollectors[2].name).toBe('Steven Stone');
    expect(topCollectors[2].totalScore).toBe(130);

    expect(topCollectors[3].rank).toBe(4);
    expect(topCollectors[3].name).toBe('Lance Dragon');
    expect(topCollectors[3].totalScore).toBe(90);

    expect(topCollectors[4].rank).toBe(5);
    expect(topCollectors[4].name).toBe('Ash Ketchum');
    expect(topCollectors[4].totalScore).toBe(70);

    // Verify Gary Oak (Rank 6, 35 pts) is excluded
    const garyInTop5 = topCollectors.find((c) => c.name === 'Gary Oak');
    expect(garyInTop5).toBeUndefined();

    // Verify scores are strictly descending
    for (let i = 0; i < topCollectors.length - 1; i++) {
      expect(topCollectors[i].totalScore).toBeGreaterThanOrEqual(topCollectors[i + 1].totalScore);
    }
  });

  it('featured cards only include ultra-rare cards and discard common cards', async () => {
    const topCollectors = await getTopCollectors(1);
    const red = topCollectors[0];

    expect(red.name).toBe('Red Champion');
    // In mockCollection, Red has Caterpie (Common) x 10, which must NOT be in featuredCards
    const hasCommonCard = red.featuredCards.some((card) => card.rarity.toLowerCase() === 'common');
    expect(hasCommonCard).toBe(false);

    // Top card should be Trophy Pikachu (30 pts)
    expect(red.featuredCards[0].points).toBe(30);
  });
});
