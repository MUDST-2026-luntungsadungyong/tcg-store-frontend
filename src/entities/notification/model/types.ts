export type NotificationType = 'ORDER_RESERVED' | 'ORDER_STATUS_CHANGED';

export interface Notification {
  id: string;
  recipientId?: string;
  type: NotificationType;
  title: string;
  message: string;
  orderId: string;
  readAt?: string | null;
  createdAt: string;
}
