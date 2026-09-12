import { describe, expect, it } from 'vitest';
import { getMostExpensiveOnSaleCards } from './expensiveCards';
import type { CardListing } from '@/entities/card/model/types';

describe('expensiveCards: getMostExpensiveOnSaleCards', () => {
  const createMockCard = (partial: Partial<CardListing>): CardListing => ({
    id: 'test-card',
    sellerId: 'seller-1',
    name: 'Card Name',
    game: 'Pokemon',
    image: '/test.png',
    price: 100,
    cost: 50,
    stock: 5,
    status: 'SHOW',
    ...partial,
  });

  it('filters out cards that have stock === 0 (not ready to sell)', () => {
    const list: CardListing[] = [
      createMockCard({ id: '1', name: 'Charizard', price: 5000, stock: 0 }),
      createMockCard({ id: '2', name: 'Pikachu', price: 1000, stock: 2 }),
    ];

    const result = getMostExpensiveOnSaleCards(list, 10);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('filters out cards with status !== "SHOW"', () => {
    const list: CardListing[] = [
      createMockCard({ id: '1', name: 'Hidden Mewtwo', price: 9000, stock: 10, status: 'HIDE' }),
      createMockCard({ id: '2', name: 'Public Mew', price: 2000, stock: 5, status: 'SHOW' }),
    ];

    const result = getMostExpensiveOnSaleCards(list, 10);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('sorts available cards by price descending (highest price first)', () => {
    const list: CardListing[] = [
      createMockCard({ id: '1', name: 'Card 50', price: 50, stock: 1 }),
      createMockCard({ id: '2', name: 'Card 500', price: 500, stock: 1 }),
      createMockCard({ id: '3', name: 'Card 150', price: 150, stock: 1 }),
      createMockCard({ id: '4', name: 'Card 2000', price: 2000, stock: 1 }),
    ];

    const result = getMostExpensiveOnSaleCards(list, 10);
    expect(result.map((c) => c.price)).toEqual([2000, 500, 150, 50]);
  });

  it('limits results to top 10 most expensive cards', () => {
    const list: CardListing[] = Array.from({ length: 15 }, (_, i) =>
      createMockCard({ id: `card-${i}`, price: (i + 1) * 100, stock: 2, status: 'SHOW' })
    );

    const result = getMostExpensiveOnSaleCards(list, 10);
    expect(result).toHaveLength(10);
    expect(result[0].price).toBe(1500);
    expect(result[9].price).toBe(600);
  });

  it('returns empty array when input is empty or null', () => {
    expect(getMostExpensiveOnSaleCards([])).toEqual([]);
    expect(getMostExpensiveOnSaleCards(null as unknown as CardListing[])).toEqual([]);
  });
});
