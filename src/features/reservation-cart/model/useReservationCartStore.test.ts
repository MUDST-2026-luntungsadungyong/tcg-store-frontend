import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CardListing } from '@/entities/card/model/types';
import { useAuthStore } from '@/features/auth/model/useAuthStore';
import { useReservationCartStore } from './useReservationCartStore';

vi.mock('@/shared/config/env', () => ({
  ENV: { ENABLE_MOCK_API: true },
}));

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

  it('persists a cart under the authenticated account and does not share it', async () => {
    useAuthStore.getState().login('buyer-one-token', buyerOne);
    await expect(useReservationCartStore.getState().addItem(listing, 2)).resolves.toBe(true);

    useAuthStore.getState().login('buyer-two-token', buyerTwo);
    expect(useReservationCartStore.getState().items).toEqual([]);
    await expect(useReservationCartStore.getState().addItem(listing)).resolves.toBe(true);

    useAuthStore.getState().login('buyer-one-token', buyerOne);
    expect(useReservationCartStore.getState().items).toMatchObject([
      { listing: { id: 'listing-1' }, quantity: 2 },
    ]);
  });

  it('allows a seller to use a separate cart as a buyer', async () => {
    useAuthStore.getState().login('seller-one-token', seller);
    await expect(useReservationCartStore.getState().addItem(listing)).resolves.toBe(true);
    expect(useReservationCartStore.getState().items).toMatchObject([
      { listing: { id: 'listing-1' }, quantity: 1 },
    ]);

    useAuthStore.getState().login('buyer-one-token', buyerOne);
    expect(useReservationCartStore.getState().items).toEqual([]);
  });

  it('does not add an item without an authenticated account', async () => {
    await expect(useReservationCartStore.getState().addItem(listing)).resolves.toBe(false);
    expect(useReservationCartStore.getState().items).toEqual([]);
  });
});
