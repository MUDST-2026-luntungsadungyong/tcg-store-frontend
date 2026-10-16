import { beforeEach, describe, expect, it, vi } from 'vitest';

const { get } = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock('@/shared/api/client', () => ({
  default: { get },
}));

vi.mock('@/shared/config/env', () => ({
  ENV: { ENABLE_MOCK_API: false, API_BASE_URL: 'http://localhost:8080/api' },
}));

import { listingDiscoveryApi } from './listings';

describe('listingDiscoveryApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const sampleListing = {
    id: 'prd-1',
    cardId: 'crd-1',
    name: 'Charizard VMAX',
    price: 3500,
    status: 'SHOW',
    condition: 'Near Mint',
  };

  it('getListings() handles backend envelope response and normalizes condition', async () => {
    get.mockResolvedValueOnce({
      data: {
        items: [sampleListing, { ...sampleListing, id: 'prd-hidden', status: 'HIDE' }],
        pageNumber: 0,
        pageSize: 10,
        totalElements: 2,
        totalPages: 1,
        last: true,
      },
    });

    const result = await listingDiscoveryApi.getListings({ condition: 'Near Mint', search: 'Charizard' });

    expect(get).toHaveBeenCalledWith('/products', {
      params: { condition: 'NM', search: 'Charizard' },
    });
    // Only SHOW items returned
    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe('prd-1');
  });

  it('getListings() handles raw array response', async () => {
    get.mockResolvedValueOnce({
      data: [sampleListing],
    });

    const result = await listingDiscoveryApi.getListings();

    expect(result.items).toHaveLength(1);
    expect(result.totalElements).toBe(1);
  });

  it('getListings() handles Spring Page (content) response', async () => {
    get.mockResolvedValueOnce({
      data: {
        content: [sampleListing],
        number: 1,
        size: 20,
        totalElements: 25,
        totalPages: 2,
        last: true,
      },
    });

    const result = await listingDiscoveryApi.getListings({ page: 1 });

    expect(result.items).toHaveLength(1);
    expect(result.pageNumber).toBe(1);
    expect(result.totalPages).toBe(2);
  });

  it('getListingById() returns listing when status is SHOW', async () => {
    get.mockResolvedValueOnce({ data: sampleListing });

    const result = await listingDiscoveryApi.getListingById('prd-1');

    expect(get).toHaveBeenCalledWith('/products/prd-1');
    expect(result).toEqual(sampleListing);
  });

  it('getListingById() returns undefined when listing status is HIDE', async () => {
    get.mockResolvedValueOnce({ data: { ...sampleListing, status: 'HIDE' } });

    const result = await listingDiscoveryApi.getListingById('prd-hidden');

    expect(result).toBeUndefined();
  });
});
