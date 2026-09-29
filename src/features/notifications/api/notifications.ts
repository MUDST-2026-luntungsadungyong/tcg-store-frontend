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

interface NotificationDto extends Omit<Notification, 'id' | 'orderId' | 'recipientId'> {
  id: number | string;
  orderId: number | string;
  type: NotificationType;
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
    orderId: String(dto.orderId),
  };
}

export const notificationsApi = {
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
