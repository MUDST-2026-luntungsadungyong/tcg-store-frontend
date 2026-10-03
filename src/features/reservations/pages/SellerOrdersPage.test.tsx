import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { SellerOrdersPage } from './SellerOrdersPage';

const { mockOrdersList, mockSummary, mockUpdateStatus } = vi.hoisted(() => {
  const mockOrdersList = [
    {
      id: 1,
      orderNumber: 'ORD-2026-001',
      status: 'CONFIRMED',
      buyerId: 101,
      buyerName: 'Kittipong Wongsuwan',
      buyerEmail: 'kittipong@example.com',
      buyerPhone: '089-123-4567',
      buyerContactLine: 'kittipong_tcg',
      buyerContactFacebook: 'Kittipong W.',
      sellerRevenue: 1250,
      sellerCost: 750,
      sellerProfit: 500,
      createdAt: '2026-09-08T10:15:00Z',
      items: [
        {
          itemId: 1,
          cardId: 'sv03-015',
          productName: 'Charizard ex - Obsidian Flames',
          unitPrice: 1250,
          unitCost: 750,
          itemProfit: 500,
          quantity: 1,
          itemTotal: 1250,
        },
      ],
    },
    {
      id: 2,
      orderNumber: 'ORD-2026-002',
      status: 'SENT',
      buyerId: 102,
      buyerName: 'Piyawat Santisuk',
      buyerEmail: 'piyawat@example.com',
      buyerPhone: '081-987-6543',
      sellerRevenue: 2400,
      sellerCost: 1400,
      sellerProfit: 1000,
      createdAt: '2026-09-07T14:30:00Z',
      items: [
        {
          itemId: 2,
          cardId: 'sv04-182',
          productName: 'Roaring Moon ex',
          unitPrice: 1200,
          unitCost: 700,
          itemProfit: 500,
          quantity: 2,
          itemTotal: 2400,
        },
      ],
    },
  ];

  const mockSummary = {
    totalRevenue: 3650,
    totalCost: 2150,
    netProfit: 1500,
    totalOrders: 2,
    pendingOrders: 1,
    fulfilledOrders: 1,
    cancelledOrders: 0,
  };

  const mockUpdateStatus = vi.fn().mockResolvedValue({
    ...mockOrdersList[0],
    status: 'SENT',
  });

  return { mockOrdersList, mockSummary, mockUpdateStatus };
});

vi.mock('../api/sellerOrders', () => ({
  fetchSellerOrders: vi.fn().mockImplementation(async (_page, _size, status) => {
    let filtered = [...mockOrdersList];
    if (status && status !== 'ALL') {
      if (status.toUpperCase() === 'PENDING') { filtered = filtered.filter(o => o.status === 'PENDING' || o.status === 'CONFIRMED'); } else { filtered = filtered.filter((o) => o.status.toUpperCase() === status.toUpperCase()); }
    }
    return {
      orders: filtered,
      totalPages: 1,
      totalElements: filtered.length,
      currentPage: 0,
    };
  }),
  fetchProfitSummary: vi.fn().mockResolvedValue(mockSummary),
  updateSellerOrderStatus: (...args: unknown[]) => mockUpdateStatus(...args),
}));

describe('SellerOrdersPage (SCRUM-27)', () => {
  it('renders dashboard title and metrics overview cards', async () => {
    render(
      <MemoryRouter>
        <SellerOrdersPage />
      </MemoryRouter>
    );

    expect(
      screen.getByText('Seller Order Management & Profit Dashboard')
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Total Sales (Revenue)')).toBeInTheDocument();
      expect(screen.getByText('Total Cost')).toBeInTheDocument();
      expect(screen.getByText(/Net Profit/i)).toBeInTheDocument();
      expect(screen.getByText('Orders Overview')).toBeInTheDocument();
      expect(screen.getByText('เธฟ3,650.00')).toBeInTheDocument();
      expect(screen.getByText('เธฟ1,500.00')).toBeInTheDocument();
    });
  });

  it('renders order list and allows status tab filtering', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <SellerOrdersPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('ORD-2026-001')).toBeInTheDocument();
      expect(screen.getByText('ORD-2026-002')).toBeInTheDocument();
    });

    // Click Pending filter tab
    const pendingTab = screen.getByRole('button', { name: /^Pending$/i });
    await user.click(pendingTab);

    await waitFor(() => {
      expect(screen.getByText('ORD-2026-001')).toBeInTheDocument();
      expect(screen.queryByText('ORD-2026-002')).not.toBeInTheDocument();
    });
  });

  it('handles order status update to Sent', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <SellerOrdersPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('ORD-2026-001')).toBeInTheDocument();
    });

    const sentBtns = screen.getAllByRole('button', { name: /Mark as Sent/i });
    await user.click(sentBtns[0]);

    // Wait for the popup and click the confirm button
    const popupTitle = await screen.findByText('Mark this order as sent?');
    expect(popupTitle).toBeInTheDocument();

    const allSentBtns = screen.getAllByRole('button', { name: /Mark as Sent/i });
    await user.click(allSentBtns[allSentBtns.length - 1]);

    expect(mockUpdateStatus).toHaveBeenCalledWith(1, 'SENT', undefined);
  });
});
