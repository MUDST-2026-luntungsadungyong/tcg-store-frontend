export type NotificationType =
  | 'ORDER_RESERVED'
  | 'ORDER_STATUS_CHANGED'
  | 'ORDER_PLACED_BUYER'
  | 'ORDER_CONFIRMED_BUYER'
  | 'ORDER_CANCELLED_BUYER'
  | 'ORDER_CANCELLED_SELLER'
  | 'ORDER_FULFILLED_SELLER'
  | 'ORDER_SENT_BUYER'
  | 'SELLER_APPLICATION_SUBMITTED'
  | 'SELLER_APPLICATION_APPROVED'
  | 'SELLER_APPLICATION_REJECTED'
  | 'AUCTION_CANCELLATION_SUBMITTED'
  | 'AUCTION_CANCELLATION_DECIDED'
  | 'AUCTION_OUTBID'
  | 'AUCTION_WON'
  | 'AUCTION_ENDED_SELLER'
  | 'AUCTION_WATCHLIST_ENDING'
  | 'AUCTION_SECOND_CHANCE'
  | 'AUCTION_DEFAULTED_WARNING'
  | 'AUCTION_DISPUTE_OPENED'
  | 'AUCTION_DISPUTE_EVIDENCE_ADDED'
  | 'AUCTION_DISPUTE_DECIDED'
  | 'STOCK_AVAILABLE'
  | 'SELLER_STOCK_LOW'
  | 'SELLER_STOCK_CRITICAL'
  | 'SELLER_OUT_OF_STOCK';

export interface Notification {
  id: string;
  recipientId?: string;
  type: NotificationType;
  title: string;
  message: string;
  orderId?: string | null;
  sellerApplicationId?: string | null;
  globalCardId?: string | null;
  cardName?: string | null;
  actionPath?: string | null;
  readAt?: string | null;
  createdAt: string;
}
