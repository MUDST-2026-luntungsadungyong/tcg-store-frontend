import { beforeEach, describe, expect, it, vi } from 'vitest';

const { get, post, patch, delete: del } = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('@/shared/api/client', () => ({
  default: { get, post, patch, delete: del },
}));

import {
  cartApi,
  toReservationCartItems,
  type BackendCartResponse,
  type BackendCartItem,
} from './cartApi';

describe('cartApi and data mapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const sampleBackendItem: BackendCartItem = {
    listingId: 'prd-22',
    sellerId: 'usr-3',
    name: 'Mew',
    game: 'Pokemon',
    image: 'https://images.pokemontcg.io/pop4/4.png',
    price: 320,
    condition: 'Near Mint',
    set: 'POP Series 4',
    rarity: 'Rare',
    quantity: 2,
    available: true,
    availableQuantity: 5,
    subtotal: 640,
  };

  const sampleCartResponse: BackendCartResponse = {
    items: [sampleBackendItem],
    totalItems: 2,
    totalAmount: 640,
  };

  describe('toReservationCartItems', () => {
    it('correctly adapts backend cart response to frontend ReservationCartItem format', () => {
      const result = toReservationCartItems(sampleCartResponse);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        listing: {
          id: 'prd-22',
          sellerId: 'usr-3',
          name: 'Mew',
          game: 'Pokemon',
          image: 'https://images.pokemontcg.io/pop4/4.png',
          price: 320,
          cost: 0,
          stock: 5,
          status: 'SHOW',
          condition: 'Near Mint',
          set: 'POP Series 4',
          rarity: 'Rare',
        },
        quantity: 2,
        available: true,
        availableQuantity: 5,
      });
    });

    it('handles availableQuantity <= 0 by clamping stock to 0', () => {
      const outOfStockResponse: BackendCartResponse = {
        items: [{ ...sampleBackendItem, availableQuantity: -1, available: false }],
        totalItems: 1,
        totalAmount: 320,
      };

      const result = toReservationCartItems(outOfStockResponse);
      expect(result[0].listing.stock).toBe(0);
      expect(result[0].available).toBe(false);
    });
  });

  describe('cartApi endpoints', () => {
    it('get() calls GET /cart and returns data', async () => {
      get.mockResolvedValueOnce({ data: sampleCartResponse });

      const result = await cartApi.get();

      expect(get).toHaveBeenCalledWith('/cart');
      expect(result).toEqual(sampleCartResponse);
    });

    it('addItem() calls POST /cart/items with listingId and quantity', async () => {
      post.mockResolvedValueOnce({ data: sampleCartResponse });

      const result = await cartApi.addItem('prd-22', 2);

      expect(post).toHaveBeenCalledWith('/cart/items', { listingId: 'prd-22', quantity: 2 });
      expect(result).toEqual(sampleCartResponse);
    });

    it('updateItem() calls PATCH /cart/items/:id with quantity', async () => {
      patch.mockResolvedValueOnce({ data: sampleCartResponse });

      const result = await cartApi.updateItem('prd-22', 3);

      expect(patch).toHaveBeenCalledWith('/cart/items/prd-22', { quantity: 3 });
      expect(result).toEqual(sampleCartResponse);
    });

    it('removeItem() calls DELETE /cart/items/:id', async () => {
      del.mockResolvedValueOnce({ data: null });

      await cartApi.removeItem('prd-22');

      expect(del).toHaveBeenCalledWith('/cart/items/prd-22');
    });
  });
});
