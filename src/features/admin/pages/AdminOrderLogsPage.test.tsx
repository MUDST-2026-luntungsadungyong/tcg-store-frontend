import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminOrderLogsPage } from './AdminOrderLogsPage';
import apiClient from '@/shared/api/client';

vi.mock('@/shared/api/client', () => ({ default: { get: vi.fn() } }));

const response = { data: { content: [{ id: '1', orderNumber: 'ORD-2026-001', buyerName: 'Misty Cerulean', buyerEmail: 'misty@example.com', status: 'PAID', totalAmount: 2500, createdAt: '2026-09-30T10:00:00Z', platformFee: 250, sellerNetAmount: 2250, items: [{ id: 'item-1', productName: 'Blastoise ex', cardId: '006/165', sellerName: 'Brock Slate', sellerEmail: 'brock@example.com', shopName: 'Pewter Cards', price: 2500, quantity: 1 }] }], number: 0, totalPages: 1, totalElements: 1 } };

describe('AdminOrderLogsPage', () => {
  beforeEach(() => { vi.clearAllMocks(); vi.mocked(apiClient.get).mockResolvedValue(response); });
  it('loads 20 logs per page and opens item details', async () => {
    render(<AdminOrderLogsPage />);
    await screen.findAllByText('ORD-2026-001');
    expect(apiClient.get).toHaveBeenCalledWith('/admin/orders', expect.objectContaining({ params: expect.objectContaining({ page: 0, size: 20 }) }));
    await userEvent.click(screen.getAllByRole('button', { name: /ORD-2026-001/i })[0]);
    const modal = screen.getByTestId('modal-backdrop');
    expect(within(modal).getByText('Blastoise ex')).toBeInTheDocument();
    expect(within(modal).getByText('Pewter Cards')).toBeInTheDocument();
  });
  it('allows more than one status to be selected', async () => {
    render(<AdminOrderLogsPage />);
    await screen.findAllByText('ORD-2026-001');
    await userEvent.click(screen.getByRole('button', { name: 'PAID' }));
    await userEvent.click(screen.getByRole('button', { name: 'FULFILLED' }));
    await waitFor(() => expect(apiClient.get).toHaveBeenLastCalledWith('/admin/orders', expect.objectContaining({ params: expect.objectContaining({ statuses: ['PAID', 'FULFILLED'] }) })));
  });
  it('keeps rendering when the deployed API has not supplied item details yet', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { ...response.data, content: [{ ...response.data.content[0], items: undefined }] } });
    render(<AdminOrderLogsPage />);
    expect(await screen.findAllByText('ORD-2026-001')).toHaveLength(2);
    await userEvent.click(screen.getByRole('button', { name: /ORD-2026-001/i }));
    expect(screen.getByText('Item details will appear after the order-log API is updated.')).toBeInTheDocument();
  });
  it('refetches order logs when clicking Refresh button', async () => {
    render(<AdminOrderLogsPage />);
    await screen.findAllByText('ORD-2026-001');
    expect(apiClient.get).toHaveBeenCalledTimes(1);

    const refreshBtn = screen.getByRole('button', { name: /Refresh/i });
    await userEvent.click(refreshBtn);

    expect(apiClient.get).toHaveBeenCalledTimes(2);
  });
});
