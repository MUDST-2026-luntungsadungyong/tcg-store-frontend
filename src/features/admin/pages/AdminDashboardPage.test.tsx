import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';

const { get } = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock('@/shared/api/client', () => ({
  default: { get },
}));

import { AdminDashboardPage } from './AdminDashboardPage';

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading placeholder initially and displays platform metrics upon success', async () => {
    get.mockResolvedValueOnce({
      data: {
        totalUsers: 120,
        totalAdmins: 2,
        regularBuyers: 100,
        pendingSellerApplications: 3,
        approvedSellers: 15,
        totalCards: 2000,
        totalOrders: 45,
        totalOrderAmount: 156000,
      },
    });

    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Overview' })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('3 seller applications await review.')).toBeInTheDocument();
    });

    expect(screen.getByText('฿156,000')).toBeInTheDocument();
    expect(screen.getByText('45 completed orders')).toBeInTheDocument();
    expect(screen.getByText('Marketplace GMV')).toBeInTheDocument();
    expect(screen.getAllByText('Approved sellers')).toHaveLength(2);
    expect(screen.getByText('Catalog records')).toBeInTheDocument();

    const reviewLink = screen.getByRole('link', { name: /Review applications/i });
    expect(reviewLink).toHaveAttribute('href', '/admin/seller-applications');
  });

  it('displays empty queue message when there are no pending seller applications', async () => {
    get.mockResolvedValueOnce({
      data: {
        totalUsers: 50,
        totalAdmins: 1,
        regularBuyers: 45,
        pendingSellerApplications: 0,
        approvedSellers: 4,
        totalCards: 500,
        totalOrders: 10,
        totalOrderAmount: 25000,
      },
    });

    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No seller applications are waiting for review.')).toBeInTheDocument();
    });

    expect(screen.getByText('Approval queue is clear')).toBeInTheDocument();
  });

  it('displays error alert when fetching dashboard data fails and allows retry', async () => {
    get.mockRejectedValueOnce(new Error('Network error'));

    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Could not load dashboard data. Refresh to try again.');
    });

    // Mock successful retry
    get.mockResolvedValueOnce({
      data: {
        totalUsers: 10,
        totalAdmins: 1,
        pendingSellerApplications: 0,
        approvedSellers: 2,
        totalCards: 100,
        totalOrders: 2,
        totalOrderAmount: 1500,
      },
    });

    const refreshButton = screen.getByRole('button', { name: /Refresh/i });
    await userEvent.click(refreshButton);

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
    expect(screen.getByText('฿1,500')).toBeInTheDocument();
  });
});
