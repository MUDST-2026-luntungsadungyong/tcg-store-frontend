import apiClient from '@/shared/api/client';
import type { CardListing } from '@/entities/card/model/types';
import { listingDiscoveryApi } from '@/features/discovery/api/listings';

export type StoreProfile = { sellerId: string; shopName: string; shopDescription?: string; phone?: string; line?: string; facebook?: string };
export type StoreProfileInput = Omit<StoreProfile, 'sellerId'>;

export function filterAvailableStoreListings(listings: readonly CardListing[]): CardListing[] {
  return listings.filter((listing) => {
    const stock = Number(listing.stock);
    return listing.status === 'SHOW' && Number.isFinite(stock) && stock > 0;
  }).map((listing) => ({
    ...listing,
    stock: Number(listing.stock),
  }));
}

async function getAvailableStoreListings(sellerId: string): Promise<CardListing[]> {
  const normalizedSellerId = sellerId.trim();
  if (!normalizedSellerId) return [];

  const pageSize = 100;
  const firstPage = await listingDiscoveryApi.getListings({
    sellerId: normalizedSellerId,
    page: 0,
    size: pageSize,
    sortBy: 'price',
    sortDir: 'asc',
  });
  const pages = [firstPage.items];

  for (let page = 1; page < firstPage.totalPages; page += 1) {
    const nextPage = await listingDiscoveryApi.getListings({
      sellerId: normalizedSellerId,
      page,
      size: pageSize,
      sortBy: 'price',
      sortDir: 'asc',
    });
    pages.push(nextPage.items);
  }

  return filterAvailableStoreListings(pages.flat());
}

export const storesApi = {
  mine: async () => (await apiClient.get<StoreProfile>('/sellers/me/store')).data,
  update: async (value: StoreProfileInput) => (await apiClient.put<StoreProfile>('/sellers/me/store', value)).data,
  public: async (sellerId: string) => (await apiClient.get<StoreProfile>(`/stores/${sellerId}`)).data,
  availableListings: getAvailableStoreListings,
};
