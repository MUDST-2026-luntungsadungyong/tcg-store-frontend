export type NotificationType =
  | 'ORDER_RESERVED'
  | 'ORDER_STATUS_CHANGED'
  | 'SELLER_APPLICATION_SUBMITTED'
  | 'SELLER_APPLICATION_APPROVED'
  | 'SELLER_APPLICATION_REJECTED';

export interface Notification {
  id: string;
  recipientId?: string;
  type: NotificationType;
  title: string;
  message: string;
  orderId?: string | null;
  sellerApplicationId?: string | null;
  readAt?: string | null;
  createdAt: string;
}
