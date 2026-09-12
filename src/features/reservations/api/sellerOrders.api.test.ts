import { beforeEach, describe, expect, it, vi } from 'vitest';

const { get, patch } = vi.hoisted(() => ({ get: vi.fn(), patch: vi.fn() }));

vi.mock('@/shared/api/client', () => ({ default: { get, patch } }));
vi.mock('@/shared/config/env', () => ({
  ENV: { ENABLE_MOCK_API: false, API_BASE_URL: 'http://localhost:8080/api' },
}));

import { fetchProfitSummary, fetchSellerOrders, updateSellerOrderStatus } from './sellerOrders';

describe('seller orders API adapter', () => {
  beforeEach(() => vi.clearAllMocks());

  it('uses API-relative seller order paths and backend status values', async () => {
    get.mockResolvedValueOnce({ data: { content: [], totalPages: 0, totalElements: 0, number: 0 } });
    patch.mockResolvedValueOnce({ data: { id: 42, status: 'FULFILLED' } });
    get.mockResolvedValueOnce({ data: { totalRevenue: 0, totalCost: 0, netProfit: 0, totalOrders: 0, pendingOrders: 0, fulfilledOrders: 0, cancelledOrders: 0 } });

    await fetchSellerOrders(0, 20, 'PENDING');
    await updateSellerOrderStatus(42, 'FULFILLED');
    await fetchProfitSummary();

    expect(get).toHaveBeenNthCalledWith(1, '/seller/orders', { params: { page: 0, size: 20, status: 'PENDING' } });
    expect(patch).toHaveBeenCalledWith('/seller/orders/42/status', { status: 'FULFILLED' });
    expect(get).toHaveBeenNthCalledWith(2, '/seller/orders/profit');
  });

  it('propagates API failures instead of returning in-memory orders', async () => {
    get.mockRejectedValueOnce(new Error('API unavailable'));
    await expect(fetchSellerOrders()).rejects.toThrow('API unavailable');
  });
});
