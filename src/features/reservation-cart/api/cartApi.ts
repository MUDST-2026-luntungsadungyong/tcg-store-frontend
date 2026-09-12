import apiClient from '@/shared/api/client';
import type { CardListing } from '@/entities/card/model/types';
import type { ReservationCartItem } from '@/entities/reservation/model/types';

export interface BackendCartItem {
  listingId: string;
  sellerId: string;
  name: string;
  game: string;
  image: string;
  price: number;
  condition?: string;
  set?: string;
  rarity?: string;
  quantity: number;
  available: boolean;
  availableQuantity: number;
  subtotal: number;
}

export interface BackendCartResponse {
  items: BackendCartItem[];
  totalItems: number;
  totalAmount: number;
}

function toListing(item: BackendCartItem): CardListing {
  return {
    id: String(item.listingId),
    sellerId: String(item.sellerId),
    name: item.name,
    game: item.game,
    image: item.image,
    price: Number(item.price),
    cost: 0,
    stock: Math.max(0, Number(item.availableQuantity)),
    status: 'SHOW',
    condition: item.condition,
    set: item.set,
    rarity: item.rarity,
  };
}

export function toReservationCartItems(response: BackendCartResponse): ReservationCartItem[] {
  return response.items.map((item) => ({
    listing: toListing(item),
    quantity: item.quantity,
    available: item.available,
    availableQuantity: item.availableQuantity,
  }));
}

export const cartApi = {
  get: async (): Promise<BackendCartResponse> =>
    (await apiClient.get<BackendCartResponse>('/cart')).data,

  addItem: async (listingId: string, quantity: number): Promise<BackendCartResponse> =>
    (await apiClient.post<BackendCartResponse>('/cart/items', { listingId, quantity })).data,

  updateItem: async (listingId: string, quantity: number): Promise<BackendCartResponse> =>
    (await apiClient.patch<BackendCartResponse>(`/cart/items/${encodeURIComponent(listingId)}`, { quantity })).data,

  removeItem: async (listingId: string): Promise<void> => {
    await apiClient.delete(`/cart/items/${encodeURIComponent(listingId)}`);
  },
};
