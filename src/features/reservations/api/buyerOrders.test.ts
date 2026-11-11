import { beforeEach, describe, expect, it, vi } from 'vitest';

const { get, patch, post } = vi.hoisted(() => ({ get: vi.fn(), patch: vi.fn(), post: vi.fn() }));

vi.mock('@/shared/api/client', () => ({ default: { get, patch, post } }));
vi.mock('@/shared/config/env', () => ({
  ENV: { ENABLE_MOCK_API: false, API_BASE_URL: 'http://localhost:8080/api' },
}));
vi.mock('@/features/auth/model/useAuthStore', () => ({
  useAuthStore: { getState: () => ({ user: { id: 'buyer-1' } }) },
}));

import { downloadBuyerOrderInvoice, previewBuyerOrderInvoice, reorderBuyerOrder, updateBuyerOrderStatus } from './buyerOrders';

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

  it('posts to the reorder endpoint and returns the stock-aware cart response', async () => {
    const response = {
      cart: { items: [], totalItems: 0, totalAmount: 0 },
      items: [],
      totalAddedItems: 0,
      hasUnavailableItems: true,
    };
    post.mockResolvedValueOnce({ data: response });

    await expect(reorderBuyerOrder('42')).resolves.toEqual(response);
    expect(post).toHaveBeenCalledWith('/orders/42/reorder');
  });

  it('downloads the PDF response using the server-provided filename', async () => {
    const blob = new Blob(['%PDF'], { type: 'application/pdf' });
    get.mockResolvedValueOnce({
      data: blob,
      headers: { 'content-disposition': 'attachment; filename="mythix-order-ORD-42.pdf"' },
    });
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:invoice');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    await expect(downloadBuyerOrderInvoice('42')).resolves.toBe('mythix-order-ORD-42.pdf');

    expect(get).toHaveBeenCalledWith('/orders/42/invoice-pdf', { responseType: 'blob' });
    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(click).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:invoice');
  });

  it('opens the PDF response in a new browser tab for preview', async () => {
    const blob = new Blob(['%PDF'], { type: 'application/pdf' });
    get.mockResolvedValueOnce({
      data: blob,
      headers: { 'content-disposition': 'attachment; filename="mythix-order-ORD-42.pdf"' },
    });
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:invoice-preview');
    const setTimeoutSpy = vi.spyOn(window, 'setTimeout').mockImplementation((() => 1) as unknown as typeof window.setTimeout);
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    await expect(previewBuyerOrderInvoice('42')).resolves.toBe('mythix-order-ORD-42.pdf');

    expect(get).toHaveBeenCalledWith('/orders/42/invoice-pdf', { responseType: 'blob' });
    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(click).toHaveBeenCalledOnce();
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 60_000);
    setTimeoutSpy.mockRestore();
  });
});
