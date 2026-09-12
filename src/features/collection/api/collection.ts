import { ENV } from '@/shared/config/env';
import { storage } from '@/infrastructure/mock-db/storage';
import type { CardListing, CollectionEntry } from '@/entities/card/model/types';
import apiClient from '@/shared/api/client';

export interface CollectionPageMetadata {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface CollectionResponse {
  items: CollectionEntryResponse[];
  page: CollectionPageMetadata;
}

interface CollectionEntryResponse {
  id: string;
  ownerId: string;
  quantity?: number;
  cardId?: string;
  cardName?: string;
  game?: string;
  setName?: string;
  cardNumber?: string;
  rarity?: string;
  condition?: string;
  imageUrl?: string;
  sourceOrderId?: string;
  createdAt?: string;
  acquiredAt?: string;
  listing?: Partial<CardListing>;
}

function normalizeCollectionEntry(value: CollectionEntryResponse): CollectionEntry {
  const listing = value.listing ?? {};
  const listingId = String(listing.id ?? value.cardId ?? value.id);
  return {
    id: String(value.id),
    ownerId: String(value.ownerId),
    listing: {
      id: listingId,
      sellerId: String(listing.sellerId ?? ''),
      name: String(listing.name ?? value.cardName ?? listingId),
      game: String(listing.game ?? value.game ?? ''),
      image: String(listing.image ?? value.imageUrl ?? ''),
      price: Number(listing.price ?? 0),
      cost: Number(listing.cost ?? listing.price ?? 0),
      stock: Number(listing.stock ?? 0),
      status: listing.status === 'HIDE' ? 'HIDE' : 'SHOW',
      condition: listing.condition ?? value.condition,
      set: listing.set ?? value.setName,
      rarity: listing.rarity ?? value.rarity,
      cardNumber: listing.cardNumber ?? value.cardNumber,
    },
    quantity: Number(value.quantity ?? 0),
    sourceOrderId: String(value.sourceOrderId ?? ''),
    acquiredAt: String(value.acquiredAt ?? value.createdAt ?? new Date(0).toISOString()),
  };
}

export const collectionApi = {
  getMyCollection: async (): Promise<CollectionEntry[]> => {
    if (ENV.ENABLE_MOCK_API) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const token = localStorage.getItem('token');
      const userId = token?.includes('admin') ? 'usr-2' : token?.includes('seller') ? 'usr-3' : 'usr-1';
      return storage.getCollection().filter((item) => item.ownerId === userId);
    }
    const response = await apiClient.get<CollectionResponse>('/collection');
    return response.data.items.map(normalizeCollectionEntry);
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
