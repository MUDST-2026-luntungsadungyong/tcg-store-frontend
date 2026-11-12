import apiClient from '@/shared/api/client';
import { ENV } from '@/shared/config/env';
import type { ReservationOrder } from '@/entities/reservation/model/types';
import { initMockStorage, storage } from '@/infrastructure/mock-db/storage';
import { normalizeReservationOrder } from './reservationOrders';
import type { BackendCartResponse } from '@/features/reservation-cart/api/cartApi';

type BuyerOrdersResponse = ReservationOrder[] | { content?: ReservationOrder[] };

import { useAuthStore } from '@/features/auth/model/useAuthStore';

export interface ReorderItemResult {
  listingId: string | null;
  productName: string;
  requestedQuantity: number;
  addedQuantity: number;
  availableQuantity: number;
  outcome: 'ADDED' | 'PARTIALLY_ADDED' | 'UNAVAILABLE' | 'STOCK_LIMIT_REACHED';
}

export interface ReorderResult {
  cart: BackendCartResponse;
  items: ReorderItemResult[];
  totalAddedItems: number;
  hasUnavailableItems: boolean;
}

export interface PublicOrderVerification {
  orderNumber: string;
  status: string;
  orderType: string;
  updatedAt: string;
}

export async function fetchPublicOrderVerification(orderNumber: string): Promise<PublicOrderVerification> {
  const response = await apiClient.get<PublicOrderVerification>(
    `/orders/verify/${encodeURIComponent(orderNumber)}`,
  );
  if (!response.data) throw new Error('The order verification response was empty.');
  return response.data;
}

export async function updateBuyerOrderStatus(
  orderId: string,
  newStatus: string,
  note?: string
): Promise<ReservationOrder> {
  const payload: any = { status: newStatus.toUpperCase() };
  if (note) {
    payload.note = note;
  }
  const response = await apiClient.patch(`/orders/${orderId}/status`, payload);
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

export async function fetchBuyerOrderById(orderId: string): Promise<ReservationOrder> {
  const buyerId = useAuthStore.getState().user?.id ?? 'usr-1';
  if (ENV.ENABLE_MOCK_API) {
    initMockStorage();
    await new Promise((resolve) => setTimeout(resolve, 300));
    const order = storage.getReservations().find((candidate) => candidate.id === orderId);
    if (!order) {
      throw new Error(`Order #${orderId} was not found.`);
    }
    // Prevent unauthorized IDOR access in mock mode
    if (order.buyerId && order.buyerId !== buyerId) {
      throw new Error('You do not have permission to view this order.');
    }
    return order;
  }

  const response = await apiClient.get(`/orders/${orderId}`);
  if (!response.data) {
    throw new Error('Empty response received for order details.');
  }
  return normalizeReservationOrder(response.data, buyerId);
}

export async function reorderBuyerOrder(orderId: string): Promise<ReorderResult> {
  const response = await apiClient.post<ReorderResult>(`/orders/${encodeURIComponent(orderId)}/reorder`);
  if (!response.data) throw new Error('The server returned an empty reorder response.');
  return response.data;
}

function invoiceFilename(contentDisposition: string | undefined, orderId: string): string {
  const match = contentDisposition?.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i);
  return match?.[1] ? decodeURIComponent(match[1].trim()) : `mythix-order-${orderId}.pdf`;
}

export async function downloadBuyerOrderInvoice(orderId: string): Promise<string> {
  const response = await apiClient.get<Blob>(`/orders/${encodeURIComponent(orderId)}/invoice-pdf`, {
    responseType: 'blob',
  });
  const filename = invoiceFilename(response.headers['content-disposition'], orderId);
  const url = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return filename;
}

export async function previewBuyerOrderInvoice(orderId: string): Promise<string> {
  const response = await apiClient.get<Blob>(`/orders/${encodeURIComponent(orderId)}/invoice-pdf`, {
    responseType: 'blob',
  });
  const filename = invoiceFilename(response.headers['content-disposition'], orderId);
  const url = URL.createObjectURL(response.data);
  const previewLink = document.createElement('a');
  previewLink.href = url;
  previewLink.target = '_blank';
  previewLink.rel = 'noopener';
  previewLink.style.display = 'none';
  document.body.appendChild(previewLink);
  previewLink.click();
  previewLink.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return filename;
}


