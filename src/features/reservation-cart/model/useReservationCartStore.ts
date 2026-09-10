import { create } from 'zustand';

import type { CardListing } from '@/entities/card/model/types';
import type { ReservationCartItem } from '@/entities/reservation/model/types';
import { useAuthStore } from '@/features/auth/model/useAuthStore';
import { storage } from '@/infrastructure/mock-db/storage';

interface ReservationCartStore {
  items: ReservationCartItem[];
  /** The authenticated buyer or seller whose items are currently loaded. */
  ownerId: string | null;
  addItem: (listing: CardListing, quantity?: number) => boolean;
  removeItem: (listingId: string) => void;
  updateQuantity: (listingId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getReservationValue: () => number;
}

function getAuthenticatedAccountId(): string | null {
  const user = useAuthStore.getState().user;
  return user?.role === 'USER' ? user.id : null;
}

function loadCart(ownerId: string | null): ReservationCartItem[] {
  return ownerId ? storage.getReservationCart(ownerId) : [];
}

function syncOwner(
  get: () => ReservationCartStore,
  set: (state: Partial<ReservationCartStore>) => void,
): string | null {
  const ownerId = getAuthenticatedAccountId();
  if (get().ownerId !== ownerId) {
    set({ ownerId, items: loadCart(ownerId) });
  }
  return ownerId;
}

function saveCart(ownerId: string, items: ReservationCartItem[]): void {
  storage.setReservationCart(ownerId, items);
}

export const useReservationCartStore = create<ReservationCartStore>()((set, get) => ({
  ownerId: getAuthenticatedAccountId(),
  items: loadCart(getAuthenticatedAccountId()),

  addItem: (listing, quantity = 1) => {
    const ownerId = syncOwner(get, set);
    if (!ownerId || listing.status !== 'SHOW' || listing.stock <= 0) return false;
    if (!Number.isSafeInteger(quantity) || quantity <= 0) return false;

    const currentItems = get().items;
    const existingIndex = currentItems.findIndex(
      (item) => item.listing.id === listing.id,
    );

    if (existingIndex >= 0) {
      const updatedItems = [...currentItems];
      updatedItems[existingIndex] = {
        ...updatedItems[existingIndex],
        quantity: Math.min(
          updatedItems[existingIndex].quantity + quantity,
          listing.stock,
        ),
      };
      set({ items: updatedItems });
      saveCart(ownerId, updatedItems);
      return true;
    }

    const initialQuantity = Math.min(quantity, listing.stock);
    if (initialQuantity <= 0) return false;
    const updatedItems = [...currentItems, { listing, quantity: initialQuantity }];
    set({ items: updatedItems });
    saveCart(ownerId, updatedItems);
    return true;
  },

  removeItem: (listingId) => {
    const ownerId = syncOwner(get, set);
    if (!ownerId) return;
    const updatedItems = get().items.filter((item) => item.listing.id !== listingId);
    set({ items: updatedItems });
    saveCart(ownerId, updatedItems);
  },

  updateQuantity: (listingId, quantity) => {
    const ownerId = syncOwner(get, set);
    if (!ownerId || !Number.isSafeInteger(quantity)) return;
    const updatedItems = get().items.map((item) =>
      item.listing.id === listingId
        ? {
            ...item,
            quantity: Math.max(1, Math.min(quantity, item.listing.stock)),
          }
        : item,
    );
    set({ items: updatedItems });
    saveCart(ownerId, updatedItems);
  },

  clearCart: () => {
    const ownerId = syncOwner(get, set);
    set({ items: [] });
    if (ownerId) saveCart(ownerId, []);
  },
  getTotalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),
  getReservationValue: () =>
    get().items.reduce(
      (total, item) => total + item.listing.price * item.quantity,
      0,
    ),
}));

let subscribedAccountId = getAuthenticatedAccountId();
useAuthStore.subscribe((state) => {
  const nextAccountId = state.user?.role === 'USER'
    ? state.user.id
    : null;
  if (nextAccountId === subscribedAccountId) return;
  subscribedAccountId = nextAccountId;
  useReservationCartStore.setState({
    ownerId: nextAccountId,
    items: loadCart(nextAccountId),
  });
});
