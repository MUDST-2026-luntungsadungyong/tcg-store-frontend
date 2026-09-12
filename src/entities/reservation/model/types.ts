import type { CardListing } from '@/entities/card/model/types';

export type ReservationStatus =
  | 'RESERVED'
  | 'FULFILLED'
  | 'SENT'
  | 'CANCELLED';

export type ReservationTransitionActor = 'SYSTEM' | 'SELLER';

export interface ReservationStatusTransition {
  from: ReservationStatus;
  to: ReservationStatus;
  actor: ReservationTransitionActor;
}

/**
 * The approved happy path is intentionally directional. Cancellation remains
 * a terminal escape hatch until its stock-restoration policy is defined.
 */
export const RESERVATION_STATUS_TRANSITIONS: readonly ReservationStatusTransition[] = [
  { from: 'RESERVED', to: 'FULFILLED', actor: 'SELLER' },
  { from: 'FULFILLED', to: 'SENT', actor: 'SELLER' },
  { from: 'RESERVED', to: 'SENT', actor: 'SELLER' },
];

export function canTransitionReservationStatus(
  from: ReservationStatus,
  to: ReservationStatus,
  actor: ReservationTransitionActor,
): boolean {
  return RESERVATION_STATUS_TRANSITIONS.some(
    (transition) =>
      transition.from === from &&
      transition.to === to &&
      transition.actor === actor,
  );
}

export interface ReservationCartItem {
  listing: CardListing;
  quantity: number;
  available?: boolean;
  availableQuantity?: number;
}

export interface ReservationOrder {
  id: string;
  buyerId: string;
  sellerId: string;
  items: ReservationCartItem[];
  totalAmount: number;
  status: ReservationStatus;
  createdAt: string;
  paymentConfirmedAt?: string;
  sentAt?: string;
  ownershipTransferredAt?: string;
  cancelledAt?: string;
}

export interface ReservationCheckoutItem {
  listingId: string;
  quantity: number;
}

export interface CreateReservationOrderInput {
  buyerId: string;
  items: ReservationCheckoutItem[];
}
