import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product } from '@/types';

interface CartStore {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => boolean;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
  getShippingFee: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product: Product, quantity = 1) => {
        const currentItems = get().items;
        const existingIndex = currentItems.findIndex(item => item.product.id === product.id);

        if (existingIndex > -1) {
          const currentQty = currentItems[existingIndex].quantity;
          const newQty = Math.min(currentQty + quantity, product.stock);

          const updatedItems = [...currentItems];
          updatedItems[existingIndex] = {
            ...updatedItems[existingIndex],
            quantity: newQty,
          };
          set({ items: updatedItems });
          return true;
        } else {
          const initialQty = Math.min(quantity, product.stock);
          if (initialQty <= 0) return false;
          set({
            items: [...currentItems, { product, quantity: initialQty }],
          });
          return true;
        }
      },

      removeItem: (productId: string) => {
        set({
          items: get().items.filter(item => item.product.id !== productId),
        });
      },

      updateQuantity: (productId: string, quantity: number) => {
        const currentItems = get().items;
        const target = currentItems.find(item => item.product.id === productId);
        if (!target) return;

        // Clamp quantity between 1 and available stock
        const validQuantity = Math.max(1, Math.min(quantity, target.product.stock));

        set({
          items: currentItems.map(item =>
            item.product.id === productId ? { ...item, quantity: validQuantity } : item
          ),
        });
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
      },

      getShippingFee: () => {
        const subtotal = get().getSubtotal();
        if (subtotal === 0) return 0;
        return 0; // Free shipping or flat fee
      },

      getTotal: () => {
        return get().getSubtotal() + get().getShippingFee();
      },
    }),
    {
      name: 'mythix_cart',
    }
  )
);
