import apiClient from '@/shared/api/client';
import { ENV } from '@/shared/config/env';
import type { CardListing } from '@/entities/card/model/types';
import { initMockStorage, storage } from '@/infrastructure/mock-db/storage';

export const listingDiscoveryApi = {
  getListings: async (): Promise<CardListing[]> => {
    if (ENV.ENABLE_MOCK_API) {
      initMockStorage();
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return storage.getListings().filter((listing) => listing.status === 'SHOW');
    }
    const response = await apiClient.get('/listings');
    return response.data;
  },

  getListingById: async (id: string): Promise<CardListing | undefined> => {
    if (ENV.ENABLE_MOCK_API) {
      initMockStorage();
      await new Promise(resolve => setTimeout(resolve, 300));
      return storage.getListings().find((listing) => listing.id === id);
    }
    const response = await apiClient.get(`/listings/${id}`);
    return response.data;
  },
};
