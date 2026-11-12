import apiClient from '@/shared/api/client';
import type { ReservationOrder } from '@/entities/reservation/model/types';
import { ENV } from '@/shared/config/env';
import { useAuthStore } from '@/features/auth/model/useAuthStore';
import { initMockStorage, storage } from '@/infrastructure/mock-db/storage';
import { reservationOrdersApi } from './reservationOrders';

export type SellerOrderStatus = 'PENDING' | 'CONFIRMED' | 'AWAITING_BUYER_CONTACT' | 'PENDING_SELLER_ACTION' | 'SENT' | 'FULFILLED' | 'CANCELLED';

export interface OrderStatusLog {
  fromStatus: string | null;
  toStatus: string;
  changedByRole: string;
  note: string | null;
  createdAt: string;
}

export interface SellerOrderItem {
  itemId: number | string;
  cardId: string;
  productName: string;
  unitPrice: number;
  unitCost: number;
  itemProfit: number;
  quantity: number;
  itemTotal: number;
  condition?: string;
  image?: string;
}

export interface SellerOrder {
  id: number | string;
  orderNumber: string;
  status: SellerOrderStatus;
  trackingNumber?: string;
  shippingCarrier?: string;
  orderType?: 'AUCTION' | 'DIRECT';
  buyerId?: number | string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  buyerContactLine?: string;
  buyerContactFacebook?: string;
  logs?: OrderStatusLog[];
  sellerRevenue: number;
  sellerPlatformFee: number;
  sellerNetRevenue: number;
  sellerCost: number;
  sellerProfit: number;
  items: SellerOrderItem[];
  createdAt: string;
  updatedAt?: string;
}

export interface SellerProfitSummary {
  totalRevenue: number;
  totalPlatformFee: number;
  totalCost: number;
  netProfit: number;
  totalOrders: number;
  pendingOrders: number;
  fulfilledOrders: number;
  cancelledOrders: number;
}

export interface SellerMonthlyPoint {
  year: number;
  month: number;
  grossSales: number;
  platformFee: number;
  netRevenue: number;
  totalCost: number;
  netProfit: number;
  orderCount: number;
}

export interface SellerMonthlyDashboard {
  selectedMonth: SellerMonthlyPoint;
  lastTwelveMonths: SellerMonthlyPoint[];
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
    condition: item.listing.condition,
    image: item.listing.image,
  }));
  // Platform absorbs voucher discount; seller always receives the full item subtotal
  const sellerRevenue = order.subtotalAmount ?? items.reduce((sum, item) => sum + item.itemTotal, 0);
  const sellerPlatformFee = order.platformFee ?? Math.min(sellerRevenue, Math.max(Math.round(sellerRevenue * 0.05 * 100) / 100, 20));
  const sellerCost = items.reduce((sum, item) => sum + item.unitCost * item.quantity, 0);
  const status: SellerOrderStatus = order.status === 'SENT' || order.status === 'FULFILLED'
    ? 'SENT'
    : order.status === 'CANCELLED'
      ? 'CANCELLED'
      : order.status === 'CONFIRMED'
        ? 'CONFIRMED'
        : 'PENDING';

  return {
    id: order.id,
    orderNumber: order.orderNumber ?? String(order.id).toUpperCase(),
    status,
    trackingNumber: order.trackingNumber,
    shippingCarrier: order.shippingCarrier,
    buyerId: order.buyerId,
    buyerName: buyer?.name ?? `Buyer ${order.buyerId}`,
    buyerEmail: buyer?.email,
    buyerPhone: buyer?.phone,
    buyerContactLine: buyer?.line,
    buyerContactFacebook: buyer?.facebook,
    logs: order.logs ?? [],
    sellerRevenue,
    sellerPlatformFee,
    sellerNetRevenue: sellerRevenue - sellerPlatformFee,
    sellerCost,
    sellerProfit: sellerRevenue - sellerPlatformFee - sellerCost,
    items,
    createdAt: order.createdAt,
    updatedAt: order.sentAt ?? order.paymentConfirmedAt ?? order.cancelledAt ?? order.createdAt,
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
    if (status && status !== 'ALL') {
      const upper = status.toUpperCase();
      filtered = filtered.filter((order) => {
        if (upper === 'PENDING' || upper === 'RESERVED') {
          return order.status === 'PENDING' || order.status === 'CONFIRMED';
        }
        if (upper === 'SENT' || upper === 'FULFILLED') {
          return order.status === 'SENT';
        }
        return order.status === upper;
      });
    }
    return {
      orders: filtered.slice(page * size, (page + 1) * size),
      totalPages: Math.max(1, Math.ceil(filtered.length / size)),
      totalElements: filtered.length,
      currentPage: page,
    };
  }

  const params: Record<string, unknown> = { page, size };
  if (status && status !== 'ALL') {
    params.status = status;
  }
  const response = await apiClient.get('/seller/orders', { params });
  const data = response.data;
  if (!data || !Array.isArray(data.content)) {
    throw new Error('The server returned an invalid seller orders response.');
  }
  return {
    orders: (data.content as any[]).map((raw) => ({
      ...raw,
      items: (raw.items || []).map((item: any) => ({
        ...item,
        condition: item.condition ?? item.listing?.condition,
        image: item.image ?? item.imageUrl ?? item.listing?.image,
      })),
    })),
    totalPages: data.totalPages ?? 1,
    totalElements: data.totalElements ?? data.content.length,
    currentPage: data.number ?? page,
  };
}

export async function updateSellerOrderStatus(
  orderId: number | string,
  newStatus: SellerOrderStatus | string,
  note?: string,
  trackingNumber?: string,
  noBuyerContact?: boolean
): Promise<SellerOrder> {
  const normalizedStatus = newStatus.toUpperCase();
  if (!['PENDING', 'CONFIRMED', 'AWAITING_BUYER_CONTACT', 'PENDING_SELLER_ACTION', 'SENT', 'FULFILLED', 'CANCELLED'].includes(normalizedStatus)) {
    throw new Error(`Unsupported seller order status: ${newStatus}`);
  }

  if (ENV.ENABLE_MOCK_API) {
    initMockStorage();
    const reservations = storage.getReservations();
    const orderIndex = reservations.findIndex((candidate) => String(candidate.id) === String(orderId));
    if (orderIndex >= 0) {
      const order = reservations[orderIndex];
      const previousStatus = order.status;
      const timestamp = new Date().toISOString();
      if (normalizedStatus === 'SENT' || normalizedStatus === 'FULFILLED') {
        const sellerId = useAuthStore.getState().user?.id ?? 'usr-3';
        const updated = await reservationOrdersApi.markOrderSent(String(orderId), sellerId, trackingNumber?.trim(), note?.trim());
        const storedReservations = storage.getReservations();
        const storedOrder = storedReservations.find((candidate) => String(candidate.id) === String(orderId));
        if (storedOrder) {
          storedOrder.trackingNumber = trackingNumber?.trim();
          storedOrder.shippingCarrier = note?.trim();
          storedOrder.logs = [
            ...(storedOrder.logs || []),
            {
              fromStatus: previousStatus,
              toStatus: 'SENT',
              changedByRole: 'SELLER',
              note: note
                ? `${note} (Tracking: ${trackingNumber})`
                : (trackingNumber ? `Tracking: ${trackingNumber}` : null),
              createdAt: timestamp,
            },
          ];
          storage.setReservations(storedReservations);
        }
        return mapReservationOrder(storedOrder ?? updated);
      }
      order.status = normalizedStatus as any;
      if (normalizedStatus === 'CONFIRMED') {
        order.paymentConfirmedAt = timestamp;
      } else if (normalizedStatus === 'CANCELLED') {
        order.cancelledAt = timestamp;
      }
      order.logs = [
        ...(order.logs || []),
        {
          fromStatus: previousStatus,
          toStatus: normalizedStatus,
          changedByRole: 'SELLER',
          note: note ?? null,
          createdAt: timestamp,
        },
      ];
      storage.setReservations(reservations);
      return mapReservationOrder(order);
    }
  }

  const payload: { status: string; note?: string; trackingNumber?: string; noBuyerContact?: boolean } = { status: normalizedStatus };
  if (note) {
    payload.note = note;
  }
  if (trackingNumber) {
    payload.trackingNumber = trackingNumber;
  }
  if (noBuyerContact) {
    payload.noBuyerContact = true;
  }
  const response = await apiClient.patch(`/seller/orders/${encodeURIComponent(orderId)}/status`, payload);
  if (!response.data) throw new Error('The server returned an empty seller order update response.');
  const result = response.data as SellerOrder;
  return result;
}

export async function fetchProfitSummary(): Promise<SellerProfitSummary> {
  if (ENV.ENABLE_MOCK_API) {
    const orders = getMockSellerOrders();
    const active = orders.filter((order) => order.status !== 'CANCELLED');
    const totalRevenue = active.reduce((sum, order) => sum + order.sellerRevenue, 0);
    const totalCost = active.reduce((sum, order) => sum + order.sellerCost, 0);
    return {
      totalRevenue,
      totalPlatformFee: active.reduce((sum, order) => sum + order.sellerPlatformFee, 0),
      totalCost,
      netProfit: totalRevenue - active.reduce((sum, order) => sum + order.sellerPlatformFee, 0) - totalCost,
      totalOrders: orders.length,
      pendingOrders: orders.filter((order) => order.status === 'PENDING' || order.status === 'CONFIRMED').length,
      fulfilledOrders: orders.filter((order) => order.status === 'SENT' || order.status === 'FULFILLED').length,
      cancelledOrders: orders.filter((order) => order.status === 'CANCELLED').length,
    };
  }

  const response = await apiClient.get('/seller/orders/profit');
  if (!response.data) throw new Error('The server returned an empty seller profit response.');
  return response.data as SellerProfitSummary;
}

function emptyMonthlyPoint(year: number, month: number): SellerMonthlyPoint {
  return { year, month, grossSales: 0, platformFee: 0, netRevenue: 0, totalCost: 0, netProfit: 0, orderCount: 0 };
}

function mockMonthlyDashboard(year: number, month: number): SellerMonthlyDashboard {
  const selected = new Date(year, month - 1, 1);
  const orders = getMockSellerOrders();
  const points = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(selected.getFullYear(), selected.getMonth() - 11 + index, 1);
    const point = emptyMonthlyPoint(date.getFullYear(), date.getMonth() + 1);
    for (const order of orders) {
      const created = new Date(order.createdAt);
      if (created.getFullYear() !== point.year || created.getMonth() + 1 !== point.month || order.status === 'CANCELLED') continue;
      point.grossSales += order.sellerRevenue;
      point.platformFee += order.sellerPlatformFee;
      point.totalCost += order.sellerCost;
      point.orderCount += 1;
    }
    point.netRevenue = point.grossSales - point.platformFee;
    point.netProfit = point.netRevenue - point.totalCost;
    return point;
  });
  return { selectedMonth: points.at(-1) ?? emptyMonthlyPoint(year, month), lastTwelveMonths: points };
}

export async function fetchMonthlyDashboard(year: number, month: number): Promise<SellerMonthlyDashboard> {
  if (ENV.ENABLE_MOCK_API) return mockMonthlyDashboard(year, month);
  const response = await apiClient.get<SellerMonthlyDashboard>('/seller/orders/dashboard/monthly', { params: { year, month } });
  if (!response.data?.selectedMonth || !Array.isArray(response.data.lastTwelveMonths)) {
    throw new Error('The server returned an invalid monthly dashboard response.');
  }
  return response.data;
}



