import { beforeEach, describe, expect, it, vi } from 'vitest';

const { get, patch, deleteRequest } = vi.hoisted(() => ({
  get: vi.fn(),
  patch: vi.fn(),
  deleteRequest: vi.fn(),
}));

vi.mock('@/shared/api/client', () => ({ default: { get, patch, delete: deleteRequest } }));

import { notificationsApi } from './notifications';

describe('notificationsApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('loads a paginated list from the backend and normalizes ids', async () => {
    get.mockResolvedValue({
      data: {
        content: [{
          id: 41,
          type: 'ORDER_RESERVED',
          title: 'New reservation',
          message: 'Order ORD-41 was reserved.',
          orderId: 41,
          readAt: null,
          createdAt: '2026-09-20T10:00:00',
        }],
        totalElements: 21,
        totalPages: 2,
        number: 1,
        size: 20,
        first: false,
        last: true,
      },
    });

    await expect(notificationsApi.list(1, 20)).resolves.toMatchObject({
      content: [{ id: '41', orderId: '41', type: 'ORDER_RESERVED' }],
      totalElements: 21,
      number: 1,
      last: true,
    });
    expect(get).toHaveBeenCalledWith('/notifications', { params: { page: 1, size: 20 } });
  });

  it('marks a notification as read and deletes it through the backend API', async () => {
    patch.mockResolvedValue({ data: {
      id: 8,
      type: 'ORDER_STATUS_CHANGED',
      title: 'Order sent',
      message: 'The seller marked order ORD-8 as sent.',
      orderId: 8,
      readAt: '2026-09-20T11:00:00',
      createdAt: '2026-09-20T10:00:00',
    } });
    deleteRequest.mockResolvedValue({ status: 204 });

    await expect(notificationsApi.markRead('8')).resolves.toMatchObject({
      id: '8', orderId: '8', readAt: '2026-09-20T11:00:00',
    });
    await expect(notificationsApi.delete('8')).resolves.toBeUndefined();
    expect(patch).toHaveBeenCalledWith('/notifications/8/read');
    expect(deleteRequest).toHaveBeenCalledWith('/notifications/8');
  });

  it('rejects an invalid page response instead of treating mock data as success', async () => {
    get.mockResolvedValue({ data: { content: 'not-an-array' } });
    await expect(notificationsApi.list()).rejects.toThrow('invalid notifications response');
  });
});
