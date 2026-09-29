import apiClient from '@/shared/api/client';
import { ENV } from '@/shared/config/env';
import type { CardListing } from '@/entities/card/model/types';
import { normalizeConditionToCode } from '@/entities/card/model/condition';
import { initMockStorage, storage } from '@/infrastructure/mock-db/storage';

export interface ListingFilterParams {
  search?: string;
  rarity?: string;
  stage?: string;
  condition?: string;
  cardId?: string;
  sellerId?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface ListingPageResult {
  items: CardListing[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export const listingDiscoveryApi = {
  getListings: async (params?: ListingFilterParams): Promise<ListingPageResult> => {
    if (ENV.ENABLE_MOCK_API) {
      initMockStorage();
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 200));

      let all = storage.getListings().filter((listing) => listing.status === 'SHOW');

      if (params?.search && params.search.trim()) {
        const q = params.search.trim().toLowerCase();
        all = all.filter(l => l.name.toLowerCase().includes(q));
      }
      if (params?.rarity && params.rarity.trim()) {
        const r = params.rarity.trim().toLowerCase();
        all = all.filter(l => l.rarity?.toLowerCase() === r);
      }
      if (params?.stage && params.stage.trim()) {
        const s = params.stage.trim().toLowerCase();
        all = all.filter(l => l.stage?.toLowerCase().includes(s));
      }
      if (params?.condition && params.condition.trim()) {
        const c = normalizeConditionToCode(params.condition);
        all = all.filter(l => normalizeConditionToCode(l.condition) === c);
      }
      if (params?.cardId && params.cardId.trim()) {
        const cardId = params.cardId.trim();
        all = all.filter(l => (l.cardId ?? l.id) === cardId);
      }
      if (params?.sellerId && params.sellerId.trim()) {
        all = all.filter(l => l.sellerId === params.sellerId);
      }
      if (params?.minPrice !== undefined && params.minPrice > 0) {
        all = all.filter(l => l.price >= params.minPrice!);
      }
      if (params?.maxPrice !== undefined && params.maxPrice < 9999999999) {
        all = all.filter(l => l.price <= params.maxPrice!);
      }

      const page = params?.page ?? 0;
      const size = params?.size ?? 20;
      const totalElements = all.length;
      const totalPages = Math.max(1, Math.ceil(totalElements / size));
      const start = page * size;
      const items = all.slice(start, start + size);

      return {
        items,
        pageNumber: page,
        pageSize: size,
        totalElements,
        totalPages,
        last: page >= totalPages - 1,
      };
    }

    const queryParams: Record<string, unknown> = { ...params };
    if (params?.condition && params.condition.trim()) {
      queryParams.condition = normalizeConditionToCode(params.condition);
    }

    const response = await apiClient.get('/products', { params: queryParams });
    const data = response.data;

    // Handle raw array
    if (Array.isArray(data)) {
      const showItems = data.filter((l: CardListing) => l.status === 'SHOW');
      return {
        items: showItems,
        pageNumber: 0,
        pageSize: showItems.length,
        totalElements: showItems.length,
        totalPages: 1,
        last: true,
      };
    }

    // Handle envelope { items: [...], pageNumber: ... }
    if (data && Array.isArray(data.items)) {
      return {
        items: data.items.filter((l: CardListing) => l.status === 'SHOW'),
        pageNumber: data.pageNumber ?? 0,
        pageSize: data.pageSize ?? data.items.length,
        totalElements: data.totalElements ?? data.items.length,
        totalPages: data.totalPages ?? 1,
        last: data.last ?? true,
      };
    }

    // Handle Spring Page { content: [...], number: ... }
    if (data && Array.isArray(data.content)) {
      return {
        items: data.content.filter((l: CardListing) => l.status === 'SHOW'),
        pageNumber: data.number ?? 0,
        pageSize: data.size ?? data.content.length,
        totalElements: data.totalElements ?? data.content.length,
        totalPages: data.totalPages ?? 1,
        last: data.last ?? true,
      };
    }

    return {
      items: [],
      pageNumber: 0,
      pageSize: 20,
      totalElements: 0,
      totalPages: 1,
      last: true,
    };
  },

  getListingById: async (id: string): Promise<CardListing | undefined> => {
    if (ENV.ENABLE_MOCK_API) {
      initMockStorage();
      await new Promise(resolve => setTimeout(resolve, 150));
      const found = storage.getListings().find((listing) => listing.id === id);
      return found?.status === 'SHOW' ? found : undefined;
    }
    const response = await apiClient.get(`/products/${id}`);
    const data = response.data;
    return data && data.status === 'SHOW' ? data : undefined;
  },
};
