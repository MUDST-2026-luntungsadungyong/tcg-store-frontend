import { create } from 'zustand';

import type { CardListing } from '@/entities/card/model/types';
import type { ReservationCartItem } from '@/entities/reservation/model/types';
import { useAuthStore } from '@/features/auth/model/useAuthStore';
import { ENV } from '@/shared/config/env';
import { initMockStorage, storage } from '@/infrastructure/mock-db/storage';
import { cartApi, toReservationCartItems } from '../api/cartApi';

interface ReservationCartStore {
  items: ReservationCartItem[];
  ownerId: string | null;
  isLoading: boolean;
  error: string | null;
  loadCart: () => Promise<void>;
  addItem: (listing: CardListing, quantity?: number) => Promise<boolean>;
  removeItem: (listingId: string) => Promise<boolean>;
  updateQuantity: (listingId: string, quantity: number) => Promise<boolean>;
  clearCart: () => void;
  getTotalItems: () => number;
  getReservationValue: () => number;
}

function getAuthenticatedAccountId(): string | null {
  const user = useAuthStore.getState().user;
  return user?.role === 'USER' ? user.id : null;
}

function loadMockCart(ownerId: string | null): ReservationCartItem[] {
  if (!ownerId) return [];
  initMockStorage();
  return storage.getReservationCart(ownerId);
}

function syncOwner(
  get: () => ReservationCartStore,
  set: (state: Partial<ReservationCartStore>) => void,
): string | null {
  const ownerId = getAuthenticatedAccountId();
  if (get().ownerId !== ownerId) {
    set({ ownerId, items: ENV.ENABLE_MOCK_API ? loadMockCart(ownerId) : [], error: null });
  }
  return ownerId;
}

function saveMockCart(ownerId: string, items: ReservationCartItem[]): void {
  initMockStorage();
  storage.setReservationCart(ownerId, items);
}

function errorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return error instanceof Error ? error.message : 'Unable to update the cart. Please try again.';
}

export const useReservationCartStore = create<ReservationCartStore>()((set, get) => ({
  ownerId: getAuthenticatedAccountId(),
  items: loadMockCart(getAuthenticatedAccountId()),
  isLoading: false,
  error: null,

  loadCart: async () => {
    const ownerId = syncOwner(get, set);
    if (!ownerId) {
      set({ items: [], isLoading: false, error: null });
      return;
    }
    if (ENV.ENABLE_MOCK_API) {
      set({ items: loadMockCart(ownerId), isLoading: false, error: null });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const response = await cartApi.get();
      if (get().ownerId === ownerId) {
        set({ items: toReservationCartItems(response), error: null });
      }
    } catch (error) {
      if (get().ownerId === ownerId) set({ error: errorMessage(error) });
    } finally {
      if (get().ownerId === ownerId) set({ isLoading: false });
    }
  },

  addItem: async (listing, quantity = 1) => {
    const ownerId = syncOwner(get, set);
    if (!ownerId || listing.status !== 'SHOW' || listing.stock <= 0) return false;
    if (!Number.isSafeInteger(quantity) || quantity <= 0) return false;

    if (!ENV.ENABLE_MOCK_API) {
      set({ isLoading: true, error: null });
      try {
        const response = await cartApi.addItem(listing.id, quantity);
        set({ items: toReservationCartItems(response), error: null });
        return true;
      } catch (error) {
        set({ error: errorMessage(error) });
        return false;
      } finally {
        set({ isLoading: false });
      }
    }

    const currentItems = get().items;
    const existingIndex = currentItems.findIndex((item) => item.listing.id === listing.id);
    if (existingIndex >= 0) {
      const updatedItems = [...currentItems];
      updatedItems[existingIndex] = {
        ...updatedItems[existingIndex],
        quantity: Math.min(updatedItems[existingIndex].quantity + quantity, listing.stock),
      };
      set({ items: updatedItems });
      saveMockCart(ownerId, updatedItems);
      return true;
    }

    const initialQuantity = Math.min(quantity, listing.stock);
    if (initialQuantity <= 0) return false;
    const updatedItems = [...currentItems, { listing, quantity: initialQuantity }];
    set({ items: updatedItems });
    saveMockCart(ownerId, updatedItems);
    return true;
  },

  removeItem: async (listingId) => {
    const ownerId = syncOwner(get, set);
    if (!ownerId) return false;

    if (!ENV.ENABLE_MOCK_API) {
      set({ isLoading: true, error: null });
      try {
        await cartApi.removeItem(listingId);
        set({ items: get().items.filter((item) => item.listing.id !== listingId), error: null });
        return true;
      } catch (error) {
        set({ error: errorMessage(error) });
        return false;
      } finally {
        set({ isLoading: false });
      }
    }

    const updatedItems = get().items.filter((item) => item.listing.id !== listingId);
    set({ items: updatedItems });
    saveMockCart(ownerId, updatedItems);
    return true;
  },

  updateQuantity: async (listingId, quantity) => {
    const ownerId = syncOwner(get, set);
    if (!ownerId || !Number.isSafeInteger(quantity) || quantity <= 0) return false;

    if (!ENV.ENABLE_MOCK_API) {
      set({ isLoading: true, error: null });
      try {
        const response = await cartApi.updateItem(listingId, quantity);
        set({ items: toReservationCartItems(response), error: null });
        return true;
      } catch (error) {
        set({ error: errorMessage(error) });
        return false;
      } finally {
        set({ isLoading: false });
      }
    }

    const updatedItems = get().items.map((item) =>
      item.listing.id === listingId
        ? { ...item, quantity: Math.max(1, Math.min(quantity, item.listing.stock)) }
        : item,
    );
    set({ items: updatedItems });
    saveMockCart(ownerId, updatedItems);
    return true;
  },

  clearCart: () => {
    const ownerId = syncOwner(get, set);
    set({ items: [] });
    if (ownerId && ENV.ENABLE_MOCK_API) saveMockCart(ownerId, []);
  },

  getTotalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),
  getReservationValue: () => get().items.reduce(
    (total, item) => total + item.listing.price * item.quantity,
    0,
  ),
}));

let subscribedAccountId = getAuthenticatedAccountId();
useAuthStore.subscribe((state) => {
  const nextAccountId = state.user?.role === 'USER' ? state.user.id : null;
  if (nextAccountId === subscribedAccountId) return;
  subscribedAccountId = nextAccountId;
  useReservationCartStore.setState({
    ownerId: nextAccountId,
    items: ENV.ENABLE_MOCK_API ? loadMockCart(nextAccountId) : [],
    error: null,
  });
  void useReservationCartStore.getState().loadCart();
});
