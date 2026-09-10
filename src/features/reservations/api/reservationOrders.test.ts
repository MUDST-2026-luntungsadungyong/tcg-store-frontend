import { beforeEach, describe, expect, it, vi } from 'vitest';

import { initMockStorage, storage } from '@/infrastructure/mock-db/storage';
import { mockListings, mockUsers } from '@/infrastructure/mock-db/data';
import type { ReservationCartItem } from '@/entities/reservation/model/types';
import {
  ReservationOrderError,
  confirmSellerPayment,
  createReservationOrders,
  markOrderSent,
  previewReservationOrders,
} from './reservationOrders';

vi.mock('@/shared/config/env', () => ({
  ENV: {
    ENABLE_MOCK_API: true,
    API_BASE_URL: 'http://localhost:8080/api',
  },
}));

const buyer = mockUsers.find((user) => user.role === 'USER' && !user.isSeller)!;
const seller = mockUsers.find((user) => user.isSeller)!;
const secondSeller = { ...seller, id: 'seller-two' };

function cartItems(): ReservationCartItem[] {
  return [
    { listing: mockListings[0], quantity: 1 },
    { listing: { ...mockListings[1], sellerId: secondSeller.id }, quantity: 2 },
  ];
}

describe('reservation order mock adapter', () => {
  beforeEach(() => {
    localStorage.clear();
    initMockStorage();
    storage.setUsers([...mockUsers, secondSeller]);
    storage.setListings(
      mockListings.map((listing) =>
        listing.id === mockListings[1].id
          ? { ...listing, sellerId: secondSeller.id }
          : listing,
      ),
    );
    storage.setReservations([]);
    storage.setCollection([]);
    storage.setNotifications([]);
  });

  it('previews seller splits without reserving stock or creating orders', () => {
    const initialStock = mockListings[0].stock;
    const preview = previewReservationOrders(cartItems());

    expect(preview.groups).toHaveLength(2);
    expect(preview.groups.map((group) => group.sellerId)).toEqual([
      seller.id,
      secondSeller.id,
    ]);
    expect(storage.getReservations()).toEqual([]);
    expect(storage.getListings()[0].stock).toBe(initialStock);
    expect(initialStock).toBe(mockListings[0].stock);
  });

  it('reserves stock and creates RESERVED orders without transferring ownership', async () => {
    const orders = await createReservationOrders({ buyerId: buyer.id, items: cartItems() });

    expect(orders).toHaveLength(2);
    expect(orders[0]).toMatchObject({
      buyerId: buyer.id,
      sellerId: seller.id,
      status: 'RESERVED',
    });
    expect(storage.getListings().find((listing) => listing.id === mockListings[0].id)?.stock).toBe(2);
    expect(orders[1]).toMatchObject({ sellerId: secondSeller.id, status: 'RESERVED' });
    expect(storage.getCollection()).toEqual([]);
  });

  it('requires the order seller and transfers ownership only at SENT', async () => {
    const orders = await createReservationOrders({ buyerId: buyer.id, items: [cartItems()[0]] });
    const order = orders[0];

    await expect(markOrderSent(order.id, buyer.id)).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
    expect(storage.getCollection()).toEqual([]);

    await expect(confirmSellerPayment(order.id, seller.id)).resolves.toMatchObject({ status: 'FULFILLED' });
    expect(storage.getCollection()).toEqual([]);

    await expect(markOrderSent(order.id, seller.id)).resolves.toMatchObject({ status: 'SENT' });
    expect(storage.getCollection()).toHaveLength(1);
    expect(storage.getCollection()[0]).toMatchObject({
      ownerId: buyer.id,
      sourceOrderId: order.id,
      quantity: 1,
    });

    await expect(markOrderSent(order.id, seller.id)).rejects.toMatchObject({
      code: 'INVALID_TRANSITION',
    });
    expect(storage.getCollection()).toHaveLength(1);
  });

  it('rejects invalid quantities before writing any reservation state', async () => {
    await expect(
      createReservationOrders({
        buyerId: buyer.id,
        items: [{ listing: mockListings[0], quantity: 99 }],
      }),
    ).rejects.toBeInstanceOf(ReservationOrderError);
    expect(storage.getReservations()).toEqual([]);
    expect(storage.getCollection()).toEqual([]);
  });
});
