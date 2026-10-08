import apiClient from '@/shared/api/client';
import type { Notification, NotificationType } from '@/entities/notification/model/types';

export interface NotificationsPage {
  content: Notification[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

interface NotificationDto extends Omit<Notification, 'id' | 'orderId' | 'sellerApplicationId' | 'recipientId'> {
  id: number | string;
  orderId?: number | string | null;
  sellerApplicationId?: number | string | null;
  type: NotificationType;
}

interface UnreadCountDto {
  unreadCount: number;
}

interface NotificationsPageDto {
  content: NotificationDto[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

function normalizeNotification(dto: NotificationDto): Notification {
  return {
    ...dto,
    id: String(dto.id),
    orderId: dto.orderId == null ? null : String(dto.orderId),
    sellerApplicationId: dto.sellerApplicationId == null
      ? null
      : String(dto.sellerApplicationId),
  };
}

export const notificationsApi = {
  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get<UnreadCountDto>('/notifications/unread-count');
    if (!response.data || !Number.isFinite(response.data.unreadCount) || response.data.unreadCount < 0) {
      throw new Error('The server returned an invalid unread notifications count.');
    }
    return response.data.unreadCount;
  },

  async list(page = 0, size = 20): Promise<NotificationsPage> {
    const response = await apiClient.get<NotificationsPageDto>('/notifications', {
      params: { page, size },
    });
    if (!response.data || !Array.isArray(response.data.content)) {
      throw new Error('The server returned an invalid notifications response.');
    }
    return {
      ...response.data,
      content: response.data.content.map(normalizeNotification),
    };
  },

  async markRead(notificationId: string): Promise<Notification> {
    const response = await apiClient.patch<NotificationDto>(
      `/notifications/${encodeURIComponent(notificationId)}/read`,
    );
    if (!response.data) throw new Error('The server returned an empty notification response.');
    return normalizeNotification(response.data);
  },

  async delete(notificationId: string): Promise<void> {
    await apiClient.delete(`/notifications/${encodeURIComponent(notificationId)}`);
  },
};
