import { beforeEach, describe, expect, it, vi } from 'vitest';

const { patch } = vi.hoisted(() => ({ patch: vi.fn() }));

vi.mock('@/shared/api/client', () => ({ default: { patch } }));
vi.mock('@/shared/config/env', () => ({
  ENV: { ENABLE_MOCK_API: false, API_BASE_URL: 'http://localhost:8080/api' },
}));
vi.mock('@/features/auth/model/useAuthStore', () => ({
  useAuthStore: { getState: () => ({ user: { id: 'buyer-1' } }) },
}));

import { updateBuyerOrderStatus } from './buyerOrders';

describe('buyer order API adapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('patches the buyer-owned order status route without the list-only me segment', async () => {
    patch.mockResolvedValueOnce({
      data: {
        id: '42',
        status: 'FULFILLED',
        totalAmount: 1200,
        items: [],
      },
    });

    await updateBuyerOrderStatus('42', 'fulfilled');

    expect(patch).toHaveBeenCalledWith('/orders/42/status', { status: 'FULFILLED' });
  });
});
