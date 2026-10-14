import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReservationCartItem } from '@/entities/reservation/model/types';

const { get, post, patch } = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
}));

vi.mock('@/shared/api/client', () => ({ default: { get, post, patch } }));
vi.mock('@/shared/config/env', () => ({
  ENV: { ENABLE_MOCK_API: false, API_BASE_URL: 'http://localhost:8080/api' },
}));

import { createReservationOrders, markOrderSent, normalizeReservationOrder } from './reservationOrders';

const cartItem: ReservationCartItem = {
  listing: {
    id: 'listing-1',
    sellerId: 'seller-1',
    name: 'Charizard',
    game: 'Pokemon',
    image: '/charizard.png',
    price: 1200,
    cost: 800,
    stock: 2,
    status: 'SHOW',
  },
  quantity: 1,
};

describe('reservation order API adapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends an empty checkout request and normalizes the single backend response', async () => {
    post.mockResolvedValueOnce({
      data: {
        id: 'order-1',
        orderNumber: 'ORD-1',
        status: 'PENDING',
        totalAmount: 1200,
        items: [{ listingId: 'listing-1', sellerId: 'seller-1', name: 'Charizard', price: 1200, quantity: 1, subtotal: 1200 }],
        createdAt: '2026-09-12T00:00:00Z',
      },
    });

    const orders = await createReservationOrders({ buyerId: 'buyer-1', items: [cartItem] });

    expect(post).toHaveBeenCalledWith('/orders');
    expect(orders).toHaveLength(1);
    expect(orders[0]).toMatchObject({
      id: 'order-1',
      buyerId: 'buyer-1',
      sellerId: 'seller-1',
      status: 'PENDING',
      totalAmount: 1200,
    });
  });

  it('uses the Idempotency-Key header without putting client fields in the body', async () => {
    post.mockResolvedValueOnce({
      data: {
        id: 'order-2',
        status: 'PENDING',
        totalAmount: 1200,
        items: [{ listingId: 'listing-1', sellerId: 'seller-1', name: 'Charizard', price: 1200, quantity: 1, subtotal: 1200 }],
      },
    });

    await createReservationOrders({ buyerId: 'buyer-1', items: [cartItem], idempotencyKey: 'checkout-key' });

    expect(post).toHaveBeenCalledWith('/orders', undefined, {
      headers: { 'Idempotency-Key': 'checkout-key' },
    });
  });

  it('blocks the legacy SENT transition on the production adapter', async () => {
    await expect(markOrderSent('order-1', 'seller-1')).rejects.toMatchObject({
      code: 'INVALID_TRANSITION',
    });
    expect(patch).not.toHaveBeenCalled();
  });

  it('normalizes CONFIRMED status without throwing an unsupported status error', () => {
    const normalized = normalizeReservationOrder({
      id: 'order-confirmed-1',
      status: 'CONFIRMED',
      totalAmount: 1500,
      items: [{ listingId: 'listing-1', sellerId: 'seller-1', name: 'Charizard', price: 1500, quantity: 1, subtotal: 1500 }],
    });
    expect(normalized.status).toBe('CONFIRMED');
  });
});
