import apiClient from './client';
import { ENV } from '@/config/env';
import type { Product } from '@/types';
import { initMockStorage, storage } from './storage';

export const productsApi = {
  getProducts: async (): Promise<Product[]> => {
    if (ENV.ENABLE_MOCK_API) {
      initMockStorage();
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return storage.getProducts().filter(p => p.status === 'SHOW');
    }
    const response = await apiClient.get('/products');
    return response.data;
  },

  getProductById: async (id: string): Promise<Product | undefined> => {
    if (ENV.ENABLE_MOCK_API) {
      initMockStorage();
      await new Promise(resolve => setTimeout(resolve, 300));
      return storage.getProducts().find(p => p.id === id);
    }
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  },
};
