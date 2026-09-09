import { ENV } from '@/shared/config/env';
import { getStorageData, setStorageData } from '@/shared/mocks/storage';
import { mockProducts } from '@/shared/mocks/data';
import type { Product } from '@/shared/types';
import apiClient from '@/shared/api/client';

const COLLECTION_STORAGE_PREFIX = 'mythix_user_collection_';

function getUserCollectionKey(): string {
  const token = localStorage.getItem('token');
  const userId = token?.includes('admin') ? 'usr-2' : token?.includes('seller') ? 'usr-3' : 'usr-1';
  return `${COLLECTION_STORAGE_PREFIX}${userId}`;
}

export const collectionApi = {
  getMyCollection: async (): Promise<Product[]> => {
    if (ENV.ENABLE_MOCK_API) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const key = getUserCollectionKey();
      let items = getStorageData<Product>(key);
      // Seed default initial mock collection if empty
      if (!localStorage.getItem(key)) {
        items = mockProducts.slice(0, 4);
        setStorageData(key, items);
      }
      return items;
    }
    const response = await apiClient.get<Product[]>('/collection');
    return response.data;
  },

  addToCollection: async (product: Product): Promise<Product> => {
    if (ENV.ENABLE_MOCK_API) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const key = getUserCollectionKey();
      const current = getStorageData<Product>(key);
      if (!current.some((p) => p.id === product.id)) {
        const updated = [product, ...current];
        setStorageData(key, updated);
      }
      return product;
    }
    const response = await apiClient.post<Product>('/collection', { productId: product.id });
    return response.data;
  },

  removeFromCollection: async (productId: string): Promise<void> => {
    if (ENV.ENABLE_MOCK_API) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const key = getUserCollectionKey();
      const current = getStorageData<Product>(key);
      const updated = current.filter((p) => p.id !== productId);
      setStorageData(key, updated);
      return;
    }
    await apiClient.delete(`/collection/${productId}`);
  },
};
