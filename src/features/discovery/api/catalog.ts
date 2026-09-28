import apiClient from '@/shared/api/client';
import { ENV } from '@/shared/config/env';
import { initMockStorage, storage } from '@/infrastructure/mock-db/storage';

export interface CatalogCard {
  id: string;
  name: string;
  game?: string;
  supertype?: string;
  subtypes?: string;
  hp?: string;
  types?: string;
  rarity?: string;
  setName?: string;
  cardNumber?: string;
  artist?: string;
  imageSmall?: string;
  imageLarge?: string;
  marketPrice?: number;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function unwrapCatalogCards(value: unknown): CatalogCard[] {
  const outer = asRecord(value);
  const data = outer.data ?? value;
  const record = asRecord(data);
  const rows = Array.isArray(data)
    ? data
    : record.cards ?? record.items ?? record.content ?? outer.cards ?? outer.items;

  if (!Array.isArray(rows)) return [];
  return rows.filter((card): card is CatalogCard => {
    const record = asRecord(card);
    return typeof record.id === 'string' && typeof record.name === 'string';
  });
}

function mockCatalogSearch(query: string): CatalogCard[] {
  initMockStorage();
  const normalizedQuery = query.trim().toLowerCase();
  const seen = new Set<string>();

  return storage
    .getListings()
    .filter((listing) => {
      const key = [listing.name, listing.set, listing.rarity, listing.cardNumber]
        .filter(Boolean)
        .join('|')
        .toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);

      return [listing.name, listing.set, listing.rarity, listing.cardNumber]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedQuery));
    })
    .slice(0, 8)
    .map((listing) => ({
      id: listing.id,
      name: listing.name,
      game: listing.game,
      rarity: listing.rarity,
      setName: listing.set,
      cardNumber: listing.cardNumber,
      imageLarge: listing.image,
      marketPrice: listing.marketPrice ?? listing.price,
      supertype: listing.stage,
    }));
}

export const catalogApi = {
  getCardById: async (id: string): Promise<CatalogCard | undefined> => {
    if (ENV.ENABLE_MOCK_API) {
      initMockStorage();
      const listing = storage.getListings().find(item => item.cardId === id || item.id === id);
      if (!listing) return undefined;
      return {
        id: listing.cardId || listing.id,
        name: listing.name,
        game: listing.game,
        rarity: listing.rarity,
        setName: listing.set,
        cardNumber: listing.cardNumber,
        imageLarge: listing.image,
        marketPrice: listing.marketPrice ?? listing.price,
        supertype: listing.stage,
      };
    }
    const response = await apiClient.get<CatalogCard>(`/cards/${encodeURIComponent(id)}`);
    return response.data;
  },

  searchCards: async (query: string): Promise<CatalogCard[]> => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) return [];

    if (ENV.ENABLE_MOCK_API) {
      return mockCatalogSearch(normalizedQuery);
    }

    const response = await apiClient.get('/cards', {
      params: { search: normalizedQuery, size: 8 },
    });
    return unwrapCatalogCards(response.data);
  },
};
