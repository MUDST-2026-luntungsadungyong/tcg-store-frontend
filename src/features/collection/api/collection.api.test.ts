import { beforeEach, describe, expect, it, vi } from 'vitest';

const { get } = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock('@/shared/api/client', () => ({ default: { get } }));
vi.mock('@/shared/config/env', () => ({
  ENV: { ENABLE_MOCK_API: false, API_BASE_URL: 'http://localhost:8080/api' },
}));

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
});
