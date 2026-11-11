import { beforeEach, describe, expect, it, vi } from 'vitest';

const { get, post } = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));

vi.mock('@/shared/api/client', () => ({ default: { get, post } }));
vi.mock('@/shared/config/env', () => ({
  ENV: { ENABLE_MOCK_API: false, API_BASE_URL: 'http://localhost:8080/api' },
}));

import type { CatalogCard } from '@/features/discovery/api/catalog';
import { collectionApi } from './collection';

describe('collection API adapter', () => {
  beforeEach(() => vi.clearAllMocks());

  it('unwraps the backend collection envelope before returning entries', async () => {
    get.mockResolvedValueOnce({
      data: {
        items: [{
          id: 'collection-1',
          ownerId: 'buyer-1',
          cardId: 'card-1',
          cardName: 'Pikachu',
          imageUrl: '/pikachu.png',
          quantity: 2,
          acquiredAt: '2026-09-12T00:00:00Z',
        }],
        page: { page: 0, size: 20, totalElements: 1, totalPages: 1 },
      },
    });

    await expect(collectionApi.getMyCollection()).resolves.toMatchObject([{
      id: 'collection-1',
      ownerId: 'buyer-1',
      quantity: 2,
      listing: { id: 'card-1', name: 'Pikachu', image: '/pikachu.png' },
    }]);
    expect(get).toHaveBeenCalledWith('/collection');
  });

  it('calls POST /collection with cardId and quantity when adding a catalog card', async () => {
    post.mockResolvedValueOnce({
      data: {
        id: 'col-new',
        ownerId: 'buyer-1',
        quantity: 1,
        listing: { id: 'card-1', name: 'Charizard' },
      },
    });

    const mockCatalogCard: CatalogCard = {
      id: 'card-1',
      name: 'Charizard',
      game: 'Pokemon',
      marketPrice: 1500,
    };

    const result = await collectionApi.addCatalogCardToCollection(mockCatalogCard, 3);
    expect(post).toHaveBeenCalledWith('/collection', { cardId: 'card-1', quantity: 3 });
    expect(result).toMatchObject({ id: 'col-new' });
  });

  it('calls GET /collections/:userId/compare when comparing a public collection (US-22-2)', async () => {
    get.mockResolvedValueOnce({
      data: {
        targetUserId: 'usr-10',
        visitorUserId: 'usr-1',
        totalTargetDistinctCards: 2,
        sharedDistinctCards: 1,
        missingDistinctCards: 1,
        ownedQuantities: { 'card-1': 2, 'card-2': 0 },
        items: [],
      },
    });

    const res = await collectionApi.comparePublicCollection('usr-10');
    expect(get).toHaveBeenCalledWith('/collections/usr-10/compare');
    expect(res.sharedDistinctCards).toBe(1);
    expect(res.ownedQuantities['card-1']).toBe(2);
  });
});
