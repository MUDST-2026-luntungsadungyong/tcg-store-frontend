import apiClient from '@/shared/api/client';

export interface CatalogCard {
  id: string;
  name: string;
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

export const catalogApi = {
  getCardById: async (id: string): Promise<CatalogCard | undefined> => {
    const response = await apiClient.get<CatalogCard>(`/cards/${encodeURIComponent(id)}`);
    return response.data;
  },
};
