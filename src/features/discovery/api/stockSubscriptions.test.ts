import { beforeEach, describe, expect, it, vi } from 'vitest';

const { get, put, deleteRequest } = vi.hoisted(() => ({
  get: vi.fn(),
  put: vi.fn(),
  deleteRequest: vi.fn(),
}));

vi.mock('@/shared/api/client', () => ({ default: { get, put, delete: deleteRequest } }));

import { isStockAlreadyAvailable, stockSubscriptionsApi } from './stockSubscriptions';

describe('stockSubscriptionsApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('reads the subscription state for a global card id', async () => {
    get.mockResolvedValueOnce({ data: { globalCardId: 'card/alpha', subscribed: true, subscribedAt: '2026-11-12T00:00:00Z' } });

    await expect(stockSubscriptionsApi.get('card/alpha')).resolves.toEqual({
      globalCardId: 'card/alpha',
      subscribed: true,
      subscribedAt: '2026-11-12T00:00:00Z',
    });
    expect(get).toHaveBeenCalledWith('/stock-subscriptions/card%2Falpha');
  });

  it('treats an absent subscription response as unsubscribed', async () => {
    get.mockResolvedValueOnce({ data: { subscribed: false } });
    await expect(stockSubscriptionsApi.get('card-1')).resolves.toMatchObject({ subscribed: false });
  });

  it('creates and deletes a subscription', async () => {
    put.mockResolvedValueOnce({ data: { globalCardId: 'card-1', subscribed: true, subscribedAt: null } });
    deleteRequest.mockResolvedValueOnce({ status: 204 });

    await expect(stockSubscriptionsApi.subscribe('card-1')).resolves.toMatchObject({ subscribed: true });
    await stockSubscriptionsApi.unsubscribe('card-1');
    expect(put).toHaveBeenCalledWith('/stock-subscriptions/card-1');
    expect(deleteRequest).toHaveBeenCalledWith('/stock-subscriptions/card-1');
  });

  it('recognizes the stable stock-already-available conflict code', () => {
    const conflict = Object.assign(new Error('Conflict'), {
      isAxiosError: true,
      response: { status: 409, data: { code: 'STOCK_ALREADY_AVAILABLE', message: 'Card has stock.' } },
    });
    expect(isStockAlreadyAvailable(conflict)).toBe(true);
    expect(isStockAlreadyAvailable(new Error('Conflict'))).toBe(false);
  });
});
