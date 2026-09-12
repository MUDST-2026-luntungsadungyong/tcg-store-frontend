import { describe, expect, it } from 'vitest';
import {
  calculateCollectionScore,
  getCardUltraRarityPoints,
} from './collectionScoring';
import type { CardListing, CollectionEntry } from '@/entities/card/model/types';

describe('collectionScoring: getCardUltraRarityPoints', () => {
  it('discards Common, Uncommon, Rare, and Rare Holo immediately (returns 0)', () => {
    expect(getCardUltraRarityPoints('Common', 'Pikachu')).toBe(0);
    expect(getCardUltraRarityPoints('Uncommon', 'Kakuna')).toBe(0);
    expect(getCardUltraRarityPoints('Rare', 'Mew')).toBe(0);
    expect(getCardUltraRarityPoints('Rare Holo', 'Dark Blastoise')).toBe(0);
    expect(getCardUltraRarityPoints('Holo', 'Kangaskhan')).toBe(0);
    expect(getCardUltraRarityPoints('', 'Unknown')).toBe(0);
    expect(getCardUltraRarityPoints(undefined, undefined)).toBe(0);
  });

  it('assigns 20 points to GX / EX / Tag Team cards per user spec (Gx = 20)', () => {
    expect(getCardUltraRarityPoints('Rare Holo GX', 'Vileplume-GX')).toBe(20);
    expect(getCardUltraRarityPoints('GX', 'Pinsir-GX')).toBe(20);
    expect(getCardUltraRarityPoints(undefined, 'Mewtwo-GX')).toBe(20);
    expect(getCardUltraRarityPoints('TAG TEAM GX', 'Reshiram & Charizard-GX')).toBe(20);
    expect(getCardUltraRarityPoints('EX', 'Rayquaza-EX')).toBe(20);
  });

  it('assigns 30 points to Promo and Trophy cards', () => {
    expect(getCardUltraRarityPoints('Promo', 'Mewtwo')).toBe(30);
    expect(getCardUltraRarityPoints('Promotional Trophy Card', 'Trophy Pikachu - #3')).toBe(30);
    expect(getCardUltraRarityPoints('Wizards Black Star Promos', 'Pikachu')).toBe(30);
  });

  it('assigns 25 points to Secret Rare and Hyper Rare cards', () => {
    expect(getCardUltraRarityPoints('Secret Rare', 'Charizard VMAX')).toBe(25);
    expect(getCardUltraRarityPoints('Hyper Rare', 'Mew Secret')).toBe(25);
    expect(getCardUltraRarityPoints('Rainbow Rare', 'Pikachu VMAX')).toBe(25);
  });

  it('assigns 15 points to Ultra Rare, V, VMAX, and VSTAR cards', () => {
    expect(getCardUltraRarityPoints('Ultra Rare', 'Charizard V')).toBe(15);
    expect(getCardUltraRarityPoints('Rare Holo V', 'Eldegoss V')).toBe(15);
    expect(getCardUltraRarityPoints('Rare Holo VMAX', 'Rayquaza VMAX')).toBe(15);
    expect(getCardUltraRarityPoints(undefined, 'Arceus VSTAR')).toBe(15);
  });
});

describe('collectionScoring: calculateCollectionScore', () => {
  const mockListing = (partial: Partial<CardListing>): CardListing => ({
    id: 'test-id',
    sellerId: 'seller-1',
    name: 'Test Card',
    game: 'Pokemon',
    image: '/test.png',
    price: 100,
    cost: 50,
    stock: 1,
    status: 'SHOW',
    ...partial,
  });

  it('skips standard/common cards completely and calculates score only for ultra-rares', () => {
    const entries: CollectionEntry[] = [
      {
        id: 'entry-1',
        ownerId: 'user-1',
        listing: mockListing({ name: 'Caterpie', rarity: 'Common' }),
        quantity: 10,
        sourceOrderId: 'ord-1',
        acquiredAt: '2026-01-01',
      },
      {
        id: 'entry-2',
        ownerId: 'user-1',
        listing: mockListing({ name: 'Blastoise', rarity: 'Rare Holo' }),
        quantity: 5,
        sourceOrderId: 'ord-2',
        acquiredAt: '2026-01-01',
      },
      {
        id: 'entry-3',
        ownerId: 'user-1',
        listing: mockListing({ name: 'Mewtwo-GX', rarity: 'Rare Holo GX' }),
        quantity: 2, // 2 x 20 = 40
        sourceOrderId: 'ord-3',
        acquiredAt: '2026-01-01',
      },
      {
        id: 'entry-4',
        ownerId: 'user-1',
        listing: mockListing({ name: 'Trophy Pikachu', rarity: 'Promo' }),
        quantity: 1, // 1 x 30 = 30
        sourceOrderId: 'ord-4',
        acquiredAt: '2026-01-01',
      },
    ];

    const result = calculateCollectionScore(entries);

    // Only ultra-rare cards counted: 40 + 30 = 70
    expect(result.totalScore).toBe(70);
    expect(result.ultraRareCount).toBe(3); // 2 GX + 1 Promo
    expect(result.featuredCards).toHaveLength(2);
    // Highest points first
    expect(result.featuredCards[0].name).toBe('Trophy Pikachu');
    expect(result.featuredCards[1].name).toBe('Mewtwo-GX');
  });

  it('returns 0 score when collection has only common and standard rare cards', () => {
    const entries: CollectionEntry[] = [
      {
        id: 'entry-1',
        ownerId: 'user-2',
        listing: mockListing({ name: 'Pidgey', rarity: 'Common' }),
        quantity: 20,
        sourceOrderId: 'ord-1',
        acquiredAt: '2026-01-01',
      },
      {
        id: 'entry-2',
        ownerId: 'user-2',
        listing: mockListing({ name: 'Venusaur', rarity: 'Rare' }),
        quantity: 8,
        sourceOrderId: 'ord-2',
        acquiredAt: '2026-01-01',
      },
    ];

    const result = calculateCollectionScore(entries);
    expect(result.totalScore).toBe(0);
    expect(result.ultraRareCount).toBe(0);
    expect(result.featuredCards).toHaveLength(0);
  });
});
