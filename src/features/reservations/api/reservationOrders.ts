import apiClient from '@/shared/api/client';
import { ENV } from '@/shared/config/env';
import type { CollectionEntry } from '@/entities/card/model/types';
import type { Notification } from '@/entities/notification/model/types';
import { useAuthStore } from '@/features/auth/model/useAuthStore';
import {
  canTransitionReservationStatus,
  type BackendReservationStatus,
  type MockReservationStatus,
  type ReservationCartItem,
  type ReservationOrder,
  type ReservationStatus,
} from '@/entities/reservation/model/types';
import { initMockStorage, storage } from '@/infrastructure/mock-db/storage';

export type ReservationOrderErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION'
  | 'OUT_OF_STOCK'
  | 'INVALID_TRANSITION'
  | 'CONFLICT'
  | 'REQUEST_FAILED';

export class ReservationOrderError extends Error {
  readonly code: ReservationOrderErrorCode;

  constructor(code: ReservationOrderErrorCode, message: string) {
    super(message);
    this.name = 'ReservationOrderError';
    this.code = code;
  }
}

export interface CreateReservationOrdersInput {
  buyerId: string;
  items: ReservationCartItem[];
  idempotencyKey?: string;
}

export interface ReservationCheckoutGroup {
  sellerId: string;
  items: ReservationCartItem[];
  totalAmount: number;
}

export interface ReservationCheckoutPreview {
  groups: ReservationCheckoutGroup[];
  totalAmount: number;
}

interface CheckoutItemResponse {
  listingId: string;
  sellerId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface BackendOrderItemResponse {
  itemId?: string;
  productId?: string;
  cardId?: string;
  productName?: string;
  unitPrice?: number;
  quantity?: number;
  itemTotal?: number;
  imageUrl?: string;
  listing?: Partial<ReservationCartItem['listing']> & { id?: string; sellerId?: string };
}

interface BackendOrderResponse {
  id: string;
  orderNumber?: string;
  buyerId?: string;
  sellerId?: string;
  status: string;
  totalAmount?: number;
  totalPrice?: number;
  items?: Array<CheckoutItemResponse | BackendOrderItemResponse>;
  createdAt?: string;
  updatedAt?: string;
  paymentConfirmedAt?: string;
  sentAt?: string;
  ownershipTransferredAt?: string;
  cancelledAt?: string;
  logs?: any[];
}

const ORDER_ENDPOINT = '/orders';

function createId(prefix: string): string {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}`;
}

function validateCartItems(items: ReservationCartItem[]): void {
  if (items.length === 0) {
    throw new ReservationOrderError('VALIDATION', 'Reservation cart is empty.');
  }

  for (const item of items) {
    if (
      !item.listing.id ||
      !Number.isSafeInteger(item.quantity) ||
      item.quantity <= 0
    ) {
      throw new ReservationOrderError(
        'VALIDATION',
        'Reservation cart contains an invalid quantity.',
      );
    }
  }
}

/**
 * Preview is deliberately pure: it groups the cart for the checkout UI but
 * does not reserve stock, create orders, notify sellers, or transfer cards.
 */
export function previewReservationOrders(
  items: ReservationCartItem[],
): ReservationCheckoutPreview {
  validateCartItems(items);

  const groups = new Map<string, ReservationCheckoutGroup>();
  for (const item of items) {
    const existing = groups.get(item.listing.sellerId);
    if (existing) {
      existing.items.push(item);
      existing.totalAmount += item.listing.price * item.quantity;
    } else {
      groups.set(item.listing.sellerId, {
        sellerId: item.listing.sellerId,
        items: [item],
        totalAmount: item.listing.price * item.quantity,
      });
    }
  }

  const grouped = [...groups.values()];
  return {
    groups: grouped,
    totalAmount: grouped.reduce((total, group) => total + group.totalAmount, 0),
  };
}

function assertBuyer(buyerId: string): void {
  const buyer = storage.getUsers().find((user) => user.id === buyerId);
  if (!buyer) {
    throw new ReservationOrderError('UNAUTHORIZED', 'Buyer session is not valid.');
  }
  if (buyer.role !== 'USER') {
    throw new ReservationOrderError(
      'FORBIDDEN',
      'Only an authenticated buyer can create a reservation order.',
    );
  }
}

function buildMockOrders(input: CreateReservationOrdersInput): ReservationOrder[] {
  initMockStorage();
  assertBuyer(input.buyerId);
  validateCartItems(input.items);

  const listings = storage.getListings();
  const canonicalItems = new Map<string, ReservationCartItem>();

  for (const item of input.items) {
    const listing = listings.find((candidate) => candidate.id === item.listing.id);
    if (!listing) {
      throw new ReservationOrderError('NOT_FOUND', 'A reserved listing no longer exists.');
    }
    if (listing.status !== 'SHOW') {
      throw new ReservationOrderError(
        'CONFLICT',
        `Listing "${listing.name}" is no longer available.`,
      );
    }

    const previous = canonicalItems.get(listing.id);
    const quantity = (previous?.quantity ?? 0) + item.quantity;
    if (quantity > listing.stock) {
      throw new ReservationOrderError(
        'OUT_OF_STOCK',
        `Not enough stock remains for "${listing.name}".`,
      );
    }
    canonicalItems.set(listing.id, { listing, quantity });
  }

  const grouped = new Map<string, ReservationCartItem[]>();
  for (const item of canonicalItems.values()) {
    const sellerItems = grouped.get(item.listing.sellerId) ?? [];
    sellerItems.push(item);
    grouped.set(item.listing.sellerId, sellerItems);
  }

  const now = new Date().toISOString();
  const orders: ReservationOrder[] = [...grouped.entries()].map(
    ([sellerId, items]) => ({
      id: createId('ord'),
      buyerId: input.buyerId,
      sellerId,
      items,
      totalAmount: items.reduce(
        (total, item) => total + item.listing.price * item.quantity,
        0,
      ),
      status: 'RESERVED',
      createdAt: now,
    }),
  );

  // All validation completes before any storage write, keeping the mock's
  // reserve/order/notification operation atomic from the caller's perspective.
  storage.setListings(
    listings.map((listing) => {
      const reserved = canonicalItems.get(listing.id);
      return reserved
        ? { ...listing, stock: listing.stock - reserved.quantity }
        : listing;
    }),
  );
  storage.setReservations([...orders, ...storage.getReservations()]);

  const notifications: Notification[] = orders.map((order) => ({
    id: createId('ntf'),
    recipientId: order.sellerId,
    type: 'ORDER_RESERVED',
    title: 'New card reservation',
    message: 'A buyer reserved cards from your listings.',
    orderId: order.id,
    createdAt: now,
  }));
  storage.setNotifications([...notifications, ...storage.getNotifications()]);

  return orders;
}

function normalizeStatus(status: string): ReservationStatus {
  if (status === 'PENDING' || status === 'RESERVED') {
    return 'PENDING';
  }
  if (status === 'CONFIRMED') {
    return 'CONFIRMED';
  }
  if (status === 'SENT' || status === 'FULFILLED') {
    return 'SENT';
  }
  if (status === 'CANCELLED') {
    return 'CANCELLED';
  }
  throw new ReservationOrderError(
    'REQUEST_FAILED',
    `The server returned an unsupported reservation order status: ${status}.`,
  );
}

function toReservationItem(
  item: CheckoutItemResponse | BackendOrderItemResponse,
  sellerId: string,
): ReservationCartItem {
  const value = item as CheckoutItemResponse & BackendOrderItemResponse;
  const listing = value.listing;
  const price = Number(value.price ?? value.unitPrice ?? listing?.price ?? 0);
  const listingId = String(value.listingId ?? value.cardId ?? value.productId ?? listing?.id ?? '');
  return {
    listing: {
      id: listingId,
      sellerId: String(value.sellerId ?? listing?.sellerId ?? sellerId),
      name: String(value.name ?? value.productName ?? listing?.name ?? listingId),
      game: String(listing?.game ?? ''),
      image: String(value.imageUrl ?? listing?.image ?? ''),
      price,
      cost: Number(listing?.cost ?? price),
      stock: Number(listing?.stock ?? value.quantity ?? 0),
      status: listing?.status === 'HIDE' ? 'HIDE' : 'SHOW',
      condition: listing?.condition,
      set: listing?.set,
      rarity: listing?.rarity,
      cardNumber: listing?.cardNumber,
    },
    quantity: Number(value.quantity ?? 0),
  };
}

/** Maps checkout and buyer-order DTOs into the view model used by order pages. */
export function normalizeReservationOrder(
  value: unknown,
  fallbackBuyerId?: string,
): ReservationOrder {
  if (!value || typeof value !== 'object') {
    throw new ReservationOrderError('REQUEST_FAILED', 'The server returned an invalid reservation order response.');
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      throw new ReservationOrderError('REQUEST_FAILED', 'The server returned an incomplete reservation order response.');
    }
    return normalizeReservationOrder(value[0], fallbackBuyerId);
  }
  const record = value as BackendOrderResponse;
  if (!record.id || !record.status || !Array.isArray(record.items)) {
    throw new ReservationOrderError('REQUEST_FAILED', 'The server returned an incomplete reservation order response.');
  }
  const firstSellerId = record.items[0]
    ? String((record.items[0] as CheckoutItemResponse & BackendOrderItemResponse).sellerId
      ?? (record.items[0] as BackendOrderItemResponse).listing?.sellerId
      ?? record.sellerId
      ?? '')
    : String(record.sellerId ?? '');
  return {
    id: String(record.id),
    buyerId: String(record.buyerId ?? fallbackBuyerId ?? ''),
    sellerId: firstSellerId,
    items: record.items.map((item) => toReservationItem(item, firstSellerId)),
    totalAmount: Number(record.totalAmount ?? record.totalPrice ?? 0),
    status: normalizeStatus(record.status),
    createdAt: String(record.createdAt ?? new Date(0).toISOString()),
    paymentConfirmedAt: record.paymentConfirmedAt,
    sentAt: record.sentAt,
    ownershipTransferredAt: record.ownershipTransferredAt,
    cancelledAt: record.cancelledAt,
  };
}

async function createOrdersWithApi(
  input: CreateReservationOrdersInput,
): Promise<ReservationOrder[]> {
  validateCartItems(input.items);
  const response = input.idempotencyKey
    ? await apiClient.post<BackendOrderResponse | BackendOrderResponse[]>(ORDER_ENDPOINT, undefined, {
        headers: { 'Idempotency-Key': input.idempotencyKey },
      })
    : await apiClient.post<BackendOrderResponse | BackendOrderResponse[]>(ORDER_ENDPOINT);
  const data = response.data;
  if (Array.isArray(data)) {
    return data.map((item) => normalizeReservationOrder(item, input.buyerId));
  }
  return [normalizeReservationOrder(data, input.buyerId)];
}

function assertSellerOrder(
  order: ReservationOrder,
  sellerId: string,
): void {
  const seller = storage.getUsers().find((user) => user.id === sellerId);
  if (!seller || seller.role !== 'USER' || !seller.isSeller) {
    throw new ReservationOrderError('FORBIDDEN', 'Only the order seller can perform this action.');
  }
  if (order.sellerId !== sellerId) {
    throw new ReservationOrderError('FORBIDDEN', 'This order does not belong to the seller.');
  }
  if (!storage.getUsers().some((user) => user.id === order.buyerId && user.role === 'USER')) {
    throw new ReservationOrderError('CONFLICT', 'The order buyer is no longer valid.');
  }
  for (const item of order.items) {
    const listing = storage.getListings().find((candidate) => candidate.id === item.listing.id);
    if (!listing || listing.sellerId !== sellerId) {
      throw new ReservationOrderError(
        'CONFLICT',
        'The order contains a listing that is not owned by this seller.',
      );
    }
  }
}

function addOwnershipToCollection(
  order: ReservationOrder,
  acquiredAt: string,
): CollectionEntry[] {
  const collection = storage.getCollection();
  const updated = [...collection];

  for (const item of order.items) {
    const existing = updated.find(
      (entry) => entry.ownerId === order.buyerId && entry.listing.id === item.listing.id,
    );
    if (existing) {
      existing.quantity += item.quantity;
      continue;
    }
    updated.unshift({
      id: createId('col'),
      ownerId: order.buyerId,
      listing: item.listing,
      quantity: item.quantity,
      sourceOrderId: order.id,
      acquiredAt,
    });
  }

  return updated;
}

function transitionMockOrder(
  orderId: string,
  sellerId: string,
  status: Extract<MockReservationStatus, 'FULFILLED' | 'SENT'>,
): ReservationOrder {
  initMockStorage();
  const reservations = storage.getReservations();
  const order = reservations.find((candidate) => candidate.id === orderId);
  if (!order) {
    throw new ReservationOrderError('NOT_FOUND', 'Reservation order not found.');
  }
  assertSellerOrder(order, sellerId);
  if (!canTransitionReservationStatus(order.status, status, 'SELLER')) {
    throw new ReservationOrderError(
      'INVALID_TRANSITION',
      `Cannot change order status from ${order.status} to ${status}.`,
    );
  }

  const timestamp = new Date().toISOString();
  const updatedOrder: ReservationOrder =
    status === 'FULFILLED'
      ? { ...order, status, paymentConfirmedAt: timestamp }
      : {
          ...order,
          status,
          sentAt: timestamp,
          ownershipTransferredAt: timestamp,
        };

  const updatedReservations = reservations.map((candidate) =>
    candidate.id === orderId ? updatedOrder : candidate,
  );

  // SENT is the only transition that changes ownership. The checks above run
  // before either the order or collection is written.
  if (status === 'SENT') {
    storage.setCollection(addOwnershipToCollection(order, timestamp));
    storage.setNotifications([
      {
        id: createId('ntf'),
        recipientId: order.buyerId,
        type: 'ORDER_STATUS_CHANGED',
        title: 'Reservation shipped',
        message: 'The seller marked your reservation as sent. It is now in your collection.',
        orderId: order.id,
        createdAt: timestamp,
      },
      ...storage.getNotifications(),
    ]);
  }
  storage.setReservations(updatedReservations);
  return updatedOrder;
}

async function transitionOrderWithApi(
  orderId: string,
  status: BackendReservationStatus,
): Promise<ReservationOrder> {
  const response = await apiClient.patch(
    `${ORDER_ENDPOINT}/${encodeURIComponent(orderId)}/status`,
    { status },
  );
  return response.data as ReservationOrder;
}

export async function createReservationOrders(
  input: CreateReservationOrdersInput,
): Promise<ReservationOrder[]> {
  if (ENV.ENABLE_MOCK_API) return buildMockOrders(input);
  return createOrdersWithApi(input);
}

export async function transitionReservationOrder(
  orderId: string,
  sellerId: string,
  status: BackendReservationStatus,
): Promise<ReservationOrder> {
  if (ENV.ENABLE_MOCK_API) {
    if (status === 'FULFILLED') return transitionMockOrder(orderId, sellerId, status);
    throw new ReservationOrderError(
      'INVALID_TRANSITION',
      `${status} is not supported by the legacy mock transition adapter.`,
    );
  }
  return transitionOrderWithApi(orderId, status);
}

export async function getReservationOrder(orderId: string): Promise<ReservationOrder | null> {
  if (ENV.ENABLE_MOCK_API) {
    initMockStorage();
    const currentUser = useAuthStore.getState().user;
    if (!currentUser || currentUser.role !== 'USER') return null;
    return storage.getReservations().find(
      (order) => order.id === orderId && order.buyerId === currentUser.id,
    ) ?? null;
  }

  const response = await apiClient.get<BackendOrderResponse>(`${ORDER_ENDPOINT}/${encodeURIComponent(orderId)}`);
  return normalizeReservationOrder(response.data, useAuthStore.getState().user?.id);
}

export function confirmSellerPayment(
  orderId: string,
  sellerId: string,
): Promise<ReservationOrder> {
  return transitionReservationOrder(orderId, sellerId, 'FULFILLED');
}

export function markOrderSent(
  orderId: string,
  sellerId: string,
): Promise<ReservationOrder> {
  if (!ENV.ENABLE_MOCK_API) {
    return Promise.reject(
      new ReservationOrderError(
        'INVALID_TRANSITION',
        'SENT is a legacy mock-only status and is not supported by the backend order API.',
      ),
    );
  }
  return Promise.resolve().then(() => transitionMockOrder(orderId, sellerId, 'SENT'));
}

export const reservationOrdersApi = {
  create: createReservationOrders,
  preview: previewReservationOrders,
  get: getReservationOrder,
  transition: transitionReservationOrder,
  confirmSellerPayment,
  markOrderSent,
};
