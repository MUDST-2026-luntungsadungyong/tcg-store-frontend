import apiClient from '@/shared/api/client';
import { ENV } from '@/shared/config/env';
import type { ReservationOrder } from '@/entities/reservation/model/types';
import { initMockStorage, storage } from '@/infrastructure/mock-db/storage';
import { normalizeReservationOrder } from './reservationOrders';

type BuyerOrdersResponse = ReservationOrder[] | { content?: ReservationOrder[] };

import { useAuthStore } from '@/features/auth/model/useAuthStore';

export async function updateBuyerOrderStatus(
  orderId: string,
  newStatus: string,
  note?: string
): Promise<ReservationOrder> {
  const payload: any = { status: newStatus.toUpperCase() };
  if (note) {
    payload.note = note;
  }
  const response = await apiClient.patch(`/orders/me/${orderId}/status`, payload);
  if (!response.data) throw new Error('The server returned an empty buyer order update response.');
  
  const buyerId = useAuthStore.getState().user?.id ?? 'usr-1';
  return normalizeReservationOrder(response.data, buyerId);
}

export async function fetchBuyerOrders(buyerId: string): Promise<ReservationOrder[]> {
  if (ENV.ENABLE_MOCK_API) {
    initMockStorage();
    await new Promise((resolve) => setTimeout(resolve, 300));
    return storage.getReservations().filter((order) => order.buyerId === buyerId);
  }

  const response = await apiClient.get<BuyerOrdersResponse>('/orders/me');
  const data = response.data;
  const orders = Array.isArray(data) ? data : data.content ?? [];
  return orders.map((order) => normalizeReservationOrder(order, buyerId));
}

