import { describe, expect, it, vi } from 'vitest';
import type { CardListing } from '@/entities/card/model/types';
import { listingDiscoveryApi } from '@/features/discovery/api/listings';
import { filterAvailableStoreListings, storesApi } from './stores';

const listing = (overrides: Partial<CardListing> = {}): CardListing => ({
  id: 'listing-1',
  sellerId: 'seller-1',
  name: 'Pikachu',
  game: 'Pokemon',
  image: '',
  price: 100,
  cost: 50,
  stock: 1,
  status: 'SHOW',
  ...overrides,
});

describe('store listing adapter', () => {
  it('keeps only visible listings with stock ready for sale', () => {
    expect(filterAvailableStoreListings([
      listing({ id: 'available', stock: 2 }),
      listing({ id: 'hidden', status: 'HIDE' }),
      listing({ id: 'empty', stock: 0 }),
    ])).toEqual([listing({ id: 'available', stock: 2 })]);
  });

  it('loads all seller pages before applying availability rules', async () => {
    const getListings = vi.spyOn(listingDiscoveryApi, 'getListings')
      .mockResolvedValueOnce({
        items: [listing({ id: 'page-1', stock: 1 })],
        pageNumber: 0,
        pageSize: 100,
        totalElements: 2,
        totalPages: 2,
        last: false,
      })
      .mockResolvedValueOnce({
        items: [listing({ id: 'page-2', stock: 3 })],
        pageNumber: 1,
        pageSize: 100,
        totalElements: 2,
        totalPages: 2,
        last: true,
      });

    await expect(storesApi.availableListings(' seller-1 ')).resolves.toEqual([
      listing({ id: 'page-1', stock: 1 }),
      listing({ id: 'page-2', stock: 3 }),
    ]);
    expect(getListings).toHaveBeenNthCalledWith(1, {
      sellerId: 'seller-1',
      page: 0,
      size: 100,
      sortBy: 'price',
      sortDir: 'asc',
    });
    expect(getListings).toHaveBeenNthCalledWith(2, {
      sellerId: 'seller-1',
      page: 1,
      size: 100,
      sortBy: 'price',
      sortDir: 'asc',
    });
    getListings.mockRestore();
  });
});
