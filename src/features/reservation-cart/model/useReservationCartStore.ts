import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { CardListing } from '@/entities/card/model/types';
import type { ReservationCartItem } from '@/entities/reservation/model/types';

interface ReservationCartStore {
  items: ReservationCartItem[];
  addItem: (listing: CardListing, quantity?: number) => boolean;
  removeItem: (listingId: string) => void;
  updateQuantity: (listingId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getReservationValue: () => number;
}

export const useReservationCartStore = create<ReservationCartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (listing, quantity = 1) => {
        if (listing.status !== 'SHOW' || listing.stock <= 0) return false;

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
          return true;
        }

        const initialQuantity = Math.min(quantity, listing.stock);
        if (initialQuantity <= 0) return false;
        set({
          items: [
            ...currentItems,
            { listing, quantity: initialQuantity },
          ],
        });
        return true;
      },

      removeItem: (listingId) =>
        set({
          items: get().items.filter(
            (item) => item.listing.id !== listingId,
          ),
        }),

      updateQuantity: (listingId, quantity) =>
        set({
          items: get().items.map((item) =>
            item.listing.id === listingId
              ? {
                  ...item,
                  quantity: Math.max(
                    1,
                    Math.min(quantity, item.listing.stock),
                  ),
                }
              : item,
          ),
        }),

      clearCart: () => set({ items: [] }),
      getTotalItems: () =>
        get().items.reduce((total, item) => total + item.quantity, 0),
      getReservationValue: () =>
        get().items.reduce(
          (total, item) => total + item.listing.price * item.quantity,
          0,
        ),
    }),
    { name: 'mythix_reservation_cart_v1' },
  ),
);
