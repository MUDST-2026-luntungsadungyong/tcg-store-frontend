import apiClient from '@/shared/api/client';
export type StoreProfile = { sellerId: string; shopName: string; shopDescription?: string; phone?: string; line?: string; facebook?: string };
export type StoreProfileInput = Omit<StoreProfile, 'sellerId'>;
export const storesApi = { mine: async () => (await apiClient.get<StoreProfile>('/sellers/me/store')).data, update: async (value: StoreProfileInput) => (await apiClient.put<StoreProfile>('/sellers/me/store', value)).data, public: async (sellerId: string) => (await apiClient.get<StoreProfile>(`/stores/${sellerId}`)).data };
