import apiClient from './client';
import { ENV } from '@/config/env';
import type { Order, CartItem } from '@/types';
import { storage } from './storage';

export const ordersApi = {
  createOrder: async (items: CartItem[], shippingAddress: string, paymentMethod: string): Promise<Order> => {
    if (ENV.ENABLE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const orders = storage.getOrders();
      const token = localStorage.getItem('token');
      const userId = token?.includes('admin') ? 'usr-2' : 'usr-1'; // Simple mock identity

      const totalAmount = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
      
      const newOrder: Order = {
        id: `ord-${Date.now()}`,
        userId,
        items,
        totalAmount,
        status: 'PENDING',
        shippingAddress,
        paymentMethod,
        createdAt: new Date().toISOString()
      };
      
      storage.setOrders([newOrder, ...orders]);
      
      // Also update product stock
      const products = storage.getProducts();
      items.forEach(cartItem => {
          const prodIndex = products.findIndex(p => p.id === cartItem.product.id);
          if (prodIndex !== -1) {
              products[prodIndex].stock -= cartItem.quantity;
          }
      });
      storage.setProducts(products);

      return newOrder;
    }
    const response = await apiClient.post('/orders', { items, shippingAddress, paymentMethod });
    return response.data;
  },

  getMyOrders: async (): Promise<Order[]> => {
    if (ENV.ENABLE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const orders = storage.getOrders();
      const token = localStorage.getItem('token');
      const userId = token?.includes('admin') ? 'usr-2' : 'usr-1';
      return orders.filter(o => o.userId === userId);
    }
    const response = await apiClient.get('/orders/me');
    return response.data;
  }
};
