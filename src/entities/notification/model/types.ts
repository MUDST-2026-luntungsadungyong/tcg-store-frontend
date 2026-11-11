export type NotificationType =
  | 'ORDER_RESERVED'
  | 'ORDER_STATUS_CHANGED'
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
  | 'AUCTION_DEFAULTED_WARNING';

export interface Notification {
  id: string;
  recipientId?: string;
  type: NotificationType;
  title: string;
  message: string;
  orderId?: string | null;
  sellerApplicationId?: string | null;
  actionPath?: string | null;
  readAt?: string | null;
  createdAt: string;
}
