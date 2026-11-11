import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OrderVerificationPage } from './OrderVerificationPage';

const mockFetchPublicOrderVerification = vi.fn();

vi.mock('../api/buyerOrders', () => ({
  fetchPublicOrderVerification: (...args: unknown[]) => mockFetchPublicOrderVerification(...args),
}));

function renderPage(path = '/orders/verify/ORD-US25-001') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/orders/verify/:orderNumber" element={<OrderVerificationPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('OrderVerificationPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the public order status returned by the verification endpoint', async () => {
    mockFetchPublicOrderVerification.mockResolvedValue({
      orderNumber: 'ORD-US25-001',
      status: 'FULFILLED',
      orderType: 'DIRECT',
      updatedAt: '2026-11-12T10:00:00Z',
    });

    renderPage();

    expect(await screen.findByText('ORD-US25-001')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Direct sale')).toBeInTheDocument();
    expect(mockFetchPublicOrderVerification).toHaveBeenCalledWith('ORD-US25-001');
    expect(screen.getByText(/does not show buyer details/i)).toBeInTheDocument();
  });

  it('shows a retryable error when the verification endpoint fails', async () => {
    mockFetchPublicOrderVerification.mockRejectedValue(new Error('Order not found.'));

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Order not found.');
    });
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});
