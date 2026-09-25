import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiClient from '@/shared/api/client';
import { catalogApi } from './catalog';

vi.mock('@/shared/api/client', () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock('@/shared/config/env', () => ({
  ENV: { ENABLE_MOCK_API: false },
}));

describe('catalog API adapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads a catalog card by its set/card identifier', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        id: 'base1-4',
        name: 'Charizard',
        setName: 'Base',
        cardNumber: '4',
        imageLarge: '/charizard.png',
        marketPrice: 31401.65,
      },
    });

    await expect(catalogApi.getCardById('base1-4')).resolves.toMatchObject({
      id: 'base1-4',
      name: 'Charizard',
    });
    expect(apiClient.get).toHaveBeenCalledWith('/cards/base1-4');
  });

  it('searches catalog cards and unwraps a paginated response', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        data: {
          content: [
            {
              id: 'base1-4',
              name: 'Charizard',
              game: 'Pokemon',
              setName: 'Base',
              cardNumber: '4',
            },
          ],
        },
      },
    });

    await expect(catalogApi.searchCards('  Charizard  ')).resolves.toEqual([
      expect.objectContaining({
        id: 'base1-4',
        name: 'Charizard',
        game: 'Pokemon',
      }),
    ]);
    expect(apiClient.get).toHaveBeenCalledWith('/cards', {
      params: { search: 'Charizard', size: 8 },
    });
  });

  it('does not call the API for an empty catalog search', async () => {
    await expect(catalogApi.searchCards('   ')).resolves.toEqual([]);
    expect(apiClient.get).not.toHaveBeenCalled();
  });
});
