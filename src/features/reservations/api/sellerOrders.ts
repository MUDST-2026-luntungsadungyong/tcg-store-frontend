import apiClient from '@/shared/api/client';
import type { ReservationOrder } from '@/entities/reservation/model/types';
import { ENV } from '@/shared/config/env';
import { useAuthStore } from '@/features/auth/model/useAuthStore';
import { initMockStorage, storage } from '@/infrastructure/mock-db/storage';
import { reservationOrdersApi } from './reservationOrders';

export type SellerOrderStatus = 'PENDING' | 'FULFILLED' | 'CANCELLED';

export interface SellerOrderItem {
  itemId: number | string;
  cardId: string;
  productName: string;
  unitPrice: number;
  unitCost: number;
  itemProfit: number;
  quantity: number;
  itemTotal: number;
}

export interface SellerOrder {
  id: number | string;
  orderNumber: string;
  status: SellerOrderStatus;
  buyerId?: number | string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  buyerContactLine?: string;
  buyerContactFacebook?: string;
  sellerRevenue: number;
  sellerCost: number;
  sellerProfit: number;
  items: SellerOrderItem[];
  createdAt: string;
  updatedAt?: string;
}

export interface SellerProfitSummary {
  totalRevenue: number;
  totalCost: number;
  netProfit: number;
  totalOrders: number;
  pendingOrders: number;
  fulfilledOrders: number;
  cancelledOrders: number;
}

export interface SellerOrdersPageResponse {
  orders: SellerOrder[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
}

function mapReservationOrder(order: ReservationOrder): SellerOrder {
  const buyer = storage.getUsers().find((user) => user.id === order.buyerId);
  const items = order.items.map((item, index) => ({
    itemId: `${order.id}-${index}`,
    cardId: item.listing.id,
    productName: item.listing.name,
    unitPrice: item.listing.price,
    unitCost: item.listing.cost,
    itemProfit: (item.listing.price - item.listing.cost) * item.quantity,
    quantity: item.quantity,
    itemTotal: item.listing.price * item.quantity,
  }));
  const sellerRevenue = order.totalAmount;
  const sellerCost = items.reduce((sum, item) => sum + item.unitCost * item.quantity, 0);
  const status: SellerOrderStatus = order.status === 'SENT' || order.status === 'FULFILLED'
    ? 'FULFILLED'
    : order.status === 'CANCELLED'
      ? 'CANCELLED'
      : 'PENDING';

  return {
    id: order.id,
    orderNumber: order.id.toUpperCase(),
    status,
    buyerId: order.buyerId,
    buyerName: buyer?.name ?? `Buyer ${order.buyerId}`,
    buyerEmail: buyer?.email,
    buyerPhone: buyer?.phone,
    buyerContactLine: buyer?.line,
    buyerContactFacebook: buyer?.facebook,
    sellerRevenue,
    sellerCost,
    sellerProfit: sellerRevenue - sellerCost,
    items,
    createdAt: order.createdAt,
    updatedAt: order.sentAt ?? order.createdAt,
  };
}

function getMockSellerOrders(): SellerOrder[] {
  initMockStorage();
  const sellerId = useAuthStore.getState().user?.id ?? 'usr-3';
  return storage.getReservations().filter((order) => order.sellerId === sellerId).map(mapReservationOrder);
}

export async function fetchSellerOrders(
  page: number = 0,
  size: number = 20,
  status?: string,
): Promise<SellerOrdersPageResponse> {
  if (ENV.ENABLE_MOCK_API) {
    let filtered = getMockSellerOrders();
    if (status && status !== 'ALL') filtered = filtered.filter((order) => order.status === status);
    return {
      orders: filtered.slice(page * size, (page + 1) * size),
      totalPages: Math.max(1, Math.ceil(filtered.length / size)),
      totalElements: filtered.length,
      currentPage: page,
    };
  }

  const params: Record<string, unknown> = { page, size };
  if (status && status !== 'ALL') params.status = status;
  const response = await apiClient.get('/seller/orders', { params });
  const data = response.data;
  if (!data || !Array.isArray(data.content)) {
    throw new Error('The server returned an invalid seller orders response.');
  }
  return {
    orders: data.content as SellerOrder[],
    totalPages: data.totalPages ?? 1,
    totalElements: data.totalElements ?? data.content.length,
    currentPage: data.number ?? page,
  };
}

export async function updateSellerOrderStatus(
  orderId: number | string,
  newStatus: SellerOrderStatus | string,
): Promise<SellerOrder> {
  const normalizedStatus = newStatus.toUpperCase();
  if (!['PENDING', 'FULFILLED', 'CANCELLED'].includes(normalizedStatus)) {
    throw new Error(`Unsupported seller order status: ${newStatus}`);
  }

  if (ENV.ENABLE_MOCK_API && normalizedStatus === 'FULFILLED') {
    const sellerId = useAuthStore.getState().user?.id ?? 'usr-3';
    const updated = await reservationOrdersApi.confirmSellerPayment(String(orderId), sellerId);
    return mapReservationOrder(updated);
  }

  const response = await apiClient.patch(`/seller/orders/${encodeURIComponent(orderId)}/status`, {
    status: normalizedStatus,
  });
  if (!response.data) throw new Error('The server returned an empty seller order update response.');
  return response.data as SellerOrder;
}

export async function fetchProfitSummary(): Promise<SellerProfitSummary> {
  if (ENV.ENABLE_MOCK_API) {
    const orders = getMockSellerOrders();
    const active = orders.filter((order) => order.status !== 'CANCELLED');
    const totalRevenue = active.reduce((sum, order) => sum + order.sellerRevenue, 0);
    const totalCost = active.reduce((sum, order) => sum + order.sellerCost, 0);
    return {
      totalRevenue,
      totalCost,
      netProfit: totalRevenue - totalCost,
      totalOrders: orders.length,
      pendingOrders: orders.filter((order) => order.status === 'PENDING').length,
      fulfilledOrders: orders.filter((order) => order.status === 'FULFILLED').length,
      cancelledOrders: orders.filter((order) => order.status === 'CANCELLED').length,
    };
  }

  const response = await apiClient.get('/seller/orders/profit');
  if (!response.data) throw new Error('The server returned an empty seller profit response.');
  return response.data as SellerProfitSummary;
}
