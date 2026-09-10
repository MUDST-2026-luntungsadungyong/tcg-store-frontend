import { beforeEach, describe, expect, it } from 'vitest';

import type { CardListing } from '@/entities/card/model/types';
import { useAuthStore } from '@/features/auth/model/useAuthStore';
import { useReservationCartStore } from './useReservationCartStore';

const buyerOne = {
  id: 'buyer-one',
  name: 'Buyer One',
  email: 'one@example.com',
  role: 'USER' as const,
  isSeller: false,
};

const buyerTwo = {
  id: 'buyer-two',
  name: 'Buyer Two',
  email: 'two@example.com',
  role: 'USER' as const,
  isSeller: false,
};

const seller = {
  id: 'seller-one',
  name: 'Seller One',
  email: 'seller@example.com',
  role: 'USER' as const,
  isSeller: true,
};

const listing: CardListing = {
  id: 'listing-1',
  sellerId: 'seller-1',
  name: 'Test Card',
  game: 'Pokemon',
  image: '/card.png',
  price: 100,
  cost: 50,
  stock: 3,
  status: 'SHOW',
};

describe('useReservationCartStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null, user: null, isHydrating: false });
    useReservationCartStore.setState({ ownerId: null, items: [] });
    localStorage.clear();
  });

  it('persists a cart under the authenticated account and does not share it', () => {
    useAuthStore.getState().login('buyer-one-token', buyerOne);
    expect(useReservationCartStore.getState().addItem(listing, 2)).toBe(true);

    useAuthStore.getState().login('buyer-two-token', buyerTwo);
    expect(useReservationCartStore.getState().items).toEqual([]);
    expect(useReservationCartStore.getState().addItem(listing)).toBe(true);

    useAuthStore.getState().login('buyer-one-token', buyerOne);
    expect(useReservationCartStore.getState().items).toMatchObject([
      { listing: { id: 'listing-1' }, quantity: 2 },
    ]);
  });

  it('allows a seller to use a separate cart as a buyer', () => {
    useAuthStore.getState().login('seller-one-token', seller);
    expect(useReservationCartStore.getState().addItem(listing)).toBe(true);
    expect(useReservationCartStore.getState().items).toMatchObject([
      { listing: { id: 'listing-1' }, quantity: 1 },
    ]);

    useAuthStore.getState().login('buyer-one-token', buyerOne);
    expect(useReservationCartStore.getState().items).toEqual([]);
  });

  it('does not add an item without an authenticated account', () => {
    expect(useReservationCartStore.getState().addItem(listing)).toBe(false);
    expect(useReservationCartStore.getState().items).toEqual([]);
  });
});
