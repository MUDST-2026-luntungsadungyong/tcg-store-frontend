import { ENV } from '@/shared/config/env';
import { storage } from '@/infrastructure/mock-db/storage';
import type { CardListing, CollectionEntry } from '@/entities/card/model/types';
import apiClient from '@/shared/api/client';

export const collectionApi = {
  getMyCollection: async (): Promise<CollectionEntry[]> => {
    if (ENV.ENABLE_MOCK_API) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const token = localStorage.getItem('token');
      const userId = token?.includes('admin') ? 'usr-2' : token?.includes('seller') ? 'usr-3' : 'usr-1';
      return storage.getCollection().filter((item) => item.ownerId === userId);
    }
    const response = await apiClient.get<CollectionEntry[]>('/collection');
    return response.data;
  },

  addToCollection: async (listing: CardListing): Promise<CollectionEntry> => {
    if (ENV.ENABLE_MOCK_API) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const token = localStorage.getItem('token');
      const userId = token?.includes('admin') ? 'usr-2' : token?.includes('seller') ? 'usr-3' : 'usr-1';
      const all = storage.getCollection();
      const existing = all.find((item) => item.ownerId === userId && item.listing.id === listing.id);
      if (existing) {
        existing.quantity += 1;
        storage.setCollection(all);
        return existing;
      }
      const newEntry: CollectionEntry = {
        id: `col-${Date.now()}`,
        ownerId: userId,
        listing,
        quantity: 1,
        sourceOrderId: `ord-direct-${Date.now()}`,
        acquiredAt: new Date().toISOString(),
      };
      storage.setCollection([newEntry, ...all]);
      return newEntry;
    }
    const response = await apiClient.post<CollectionEntry>('/collection', { listingId: listing.id });
    return response.data;
  },

  removeFromCollection: async (collectionEntryId: string): Promise<void> => {
    if (ENV.ENABLE_MOCK_API) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const all = storage.getCollection();
      storage.setCollection(all.filter((item) => item.id !== collectionEntryId && item.listing.id !== collectionEntryId));
      return;
    }
    await apiClient.delete(`/collection/${collectionEntryId}`);
  },
};
