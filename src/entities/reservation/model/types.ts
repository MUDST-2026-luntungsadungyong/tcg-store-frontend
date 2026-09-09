import type { CardListing } from '@/entities/card/model/types';

export type ReservationStatus =
  | 'RESERVED'
  | 'FULFILLED'
  | 'SENT'
  | 'CANCELLED';

export interface ReservationCartItem {
  listing: CardListing;
  quantity: number;
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
