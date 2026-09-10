import apiClient from '@/shared/api/client';
import { ENV } from '@/shared/config/env';
import type { ReservationOrder } from '@/entities/reservation/model/types';
import { initMockStorage, storage } from '@/infrastructure/mock-db/storage';

type BuyerOrdersResponse = ReservationOrder[] | { content?: ReservationOrder[] };

export async function fetchBuyerOrders(buyerId: string): Promise<ReservationOrder[]> {
  if (ENV.ENABLE_MOCK_API) {
    initMockStorage();
    await new Promise((resolve) => setTimeout(resolve, 300));
    return storage.getReservations().filter((order) => order.buyerId === buyerId);
  }

  const response = await apiClient.get<BuyerOrdersResponse>('/orders/me');
  const data = response.data;
  return Array.isArray(data) ? data : data.content ?? [];
}
