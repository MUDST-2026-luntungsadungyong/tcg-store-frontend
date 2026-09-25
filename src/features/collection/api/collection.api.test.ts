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

  it('calls POST /collection with cardId when adding a catalog card', async () => {
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

    const result = await collectionApi.addCatalogCardToCollection(mockCatalogCard);
    expect(post).toHaveBeenCalledWith('/collection', { cardId: 'card-1' });
    expect(result).toMatchObject({ id: 'col-new' });
  });
});

