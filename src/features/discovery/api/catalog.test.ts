import { describe, expect, it, vi } from 'vitest';
import apiClient from '@/shared/api/client';
import { catalogApi } from './catalog';

vi.mock('@/shared/api/client', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('catalog API adapter', () => {
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
});
