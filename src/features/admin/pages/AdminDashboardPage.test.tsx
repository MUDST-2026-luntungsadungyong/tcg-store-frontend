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
        listedCards: 42,
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
    expect(screen.getByText('Listed cards')).toBeInTheDocument();
    expect(screen.getByText('Currently visible on the marketplace')).toBeInTheDocument();

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
        listedCards: 8,
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
        listedCards: 3,
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

  it('renders recent administrator activity and approved sellers when fetched', async () => {
    get.mockImplementation((url: string) => {
      if (url === '/admin/dashboard') {
        return Promise.resolve({
          data: {
            totalUsers: 10,
            totalAdmins: 1,
            pendingSellerApplications: 0,
            approvedSellers: 1,
            totalCards: 100,
            listedCards: 3,
            totalOrders: 2,
            totalOrderAmount: 1500,
          },
        });
      }
      if (url === '/admin/audit-logs') {
        return Promise.resolve({
          data: {
            content: [
              {
                id: '1',
                action: 'APPROVE_SELLER',
                actorName: 'Admin Guide',
                details: 'Approved Brock shop',
                createdAt: '2026-09-30T10:00:00Z',
              },
            ],
          },
        });
      }
      if (url === '/admin/users') {
        return Promise.resolve({
          data: [
            {
              id: '2',
              name: 'Brock Pewter',
              email: 'brock@pewter.com',
              role: 'USER',
              sellerStatus: 'APPROVED',
            },
          ],
        });
      }
      return Promise.reject(new Error('not found'));
    });

    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('APPROVE SELLER')).toBeInTheDocument();
    });
    expect(screen.getByText('Approved Brock shop')).toBeInTheDocument();
    expect(screen.getByText('Brock Pewter')).toBeInTheDocument();
    expect(screen.getByText('brock@pewter.com')).toBeInTheDocument();
  });

  it('renders GMV and Orders chart with daily trends', async () => {
    get.mockResolvedValueOnce({
      data: {
        totalUsers: 10,
        totalAdmins: 1,
        pendingSellerApplications: 0,
        approvedSellers: 1,
        totalCards: 100,
        listedCards: 3,
        totalOrders: 5,
        totalOrderAmount: 2690,
        trends: [
          { date: '2026-09-24', gmv: 500, orders: 1 },
          { date: '2026-09-25', gmv: 0, orders: 0 },
          { date: '2026-09-26', gmv: 1200, orders: 2 },
          { date: '2026-09-27', gmv: 0, orders: 0 },
          { date: '2026-09-28', gmv: 450, orders: 1 },
          { date: '2026-09-29', gmv: 0, orders: 0 },
          { date: '2026-09-30', gmv: 540, orders: 1 },
        ],
      },
    });

    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Marketplace performance over the last 7 days')).toBeInTheDocument();
    });
    expect(screen.getByText('Last 7 days')).toBeInTheDocument();
    expect(screen.getByText('Sep 24')).toBeInTheDocument();
    expect(screen.getByText('Sep 26')).toBeInTheDocument();
    expect(screen.getByText('Sep 30')).toBeInTheDocument();
    expect(screen.getByText('Total ฿2,690 across 5 orders')).toBeInTheDocument();
  });
});
