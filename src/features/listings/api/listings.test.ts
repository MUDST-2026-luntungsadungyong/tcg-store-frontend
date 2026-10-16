import { beforeEach, describe, expect, it, vi } from 'vitest';

const { get, post, put, patch, delete: del } = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('@/shared/api/client', () => ({
  default: { get, post, put, patch, delete: del },
}));

vi.mock('@/shared/config/env', () => ({
  ENV: { ENABLE_MOCK_API: false, API_BASE_URL: 'http://localhost:8080/api' },
}));

import {
  listingsApi,
  normalizeManagedListing,
  ListingError,
  type ManagedListingInput,
} from './listings';

describe('sellerListingsApi and listing normalization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validRawListing = {
    id: 'prd-101',
    sellerId: 'usr-2',
    name: 'Pikachu',
    game: 'Pokemon',
    price: 1000,
    cost: 500,
    stock: 5,
    status: 'SHOW',
    image: 'https://img/pikachu.png',
    condition: 'Near Mint',
    activeReservationCount: 1,
  };

  describe('normalizeManagedListing (ISP input partitioning)', () => {
    it('normalizes valid raw backend listing correctly', () => {
      const result = normalizeManagedListing(validRawListing);
      expect(result).toMatchObject({
        id: 'prd-101',
        sellerId: 'usr-2',
        name: 'Pikachu',
        price: 1000,
        cost: 500,
        stock: 5,
        status: 'SHOW',
        activeReservationCount: 1,
      });
    });

    it('throws ListingError when price or cost is negative (ISP boundary)', () => {
      expect(() =>
        normalizeManagedListing({ ...validRawListing, price: -10 }),
      ).toThrow(ListingError);
      expect(() =>
        normalizeManagedListing({ ...validRawListing, cost: -5 }),
      ).toThrow(ListingError);
    });

    it('throws ListingError when stock is not a positive integer (ISP boundary)', () => {
      expect(() =>
        normalizeManagedListing({ ...validRawListing, stock: -1 }),
      ).toThrow(ListingError);
      expect(() =>
        normalizeManagedListing({ ...validRawListing, stock: 1.5 }),
      ).toThrow(ListingError);
    });

    it('throws ListingError when status is invalid', () => {
      expect(() =>
        normalizeManagedListing({ ...validRawListing, status: 'INVALID_STATUS' }),
      ).toThrow(ListingError);
    });
  });

  describe('listingsApi methods', () => {
    const sampleInput: ManagedListingInput = {
      name: 'Charizard VMAX',
      game: 'Pokemon',
      price: 3500,
      cost: 2000,
      stock: 3,
      status: 'SHOW',
      image: 'https://img/charizard.png',
      condition: 'Near Mint',
    };

    it('getListings() calls GET /seller/listings with query params', async () => {
      get.mockResolvedValueOnce({
        data: [validRawListing],
      });

      const result = await listingsApi.getListings({ search: 'Pikachu' });

      expect(get).toHaveBeenCalledWith('/seller/listings', {
        params: { search: 'Pikachu' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Pikachu');
    });

    it('createListing() calls POST /seller/listings with json payload', async () => {
      post.mockResolvedValueOnce({
        data: { ...validRawListing, id: 'prd-new', name: 'Charizard VMAX' },
      });

      const result = await listingsApi.createListing(sampleInput);

      expect(post).toHaveBeenCalledWith('/seller/listings', sampleInput);
      expect(result.id).toBe('prd-new');
      expect(result.name).toBe('Charizard VMAX');
    });

    it('updateListing() calls PUT /seller/listings/:id', async () => {
      put.mockResolvedValueOnce({
        status: 200,
        data: { ...validRawListing, price: 1200 },
      });

      const result = await listingsApi.updateListing('prd-101', sampleInput);

      expect(put).toHaveBeenCalledWith('/seller/listings/prd-101', sampleInput);
      expect(result.price).toBe(1200);
    });

    it('setVisibility() calls PATCH /seller/listings/:id/visibility', async () => {
      patch.mockResolvedValueOnce({ data: { success: true } });

      await listingsApi.setVisibility('prd-101', 'HIDE');

      expect(patch).toHaveBeenCalledWith('/seller/listings/prd-101/visibility', {
        status: 'HIDE',
      });
    });

    it('deleteListing() calls DELETE /seller/listings/:id', async () => {
      del.mockResolvedValueOnce({ data: null });

      await listingsApi.deleteListing('prd-101');

      expect(del).toHaveBeenCalledWith('/seller/listings/prd-101');
    });
  });
});
