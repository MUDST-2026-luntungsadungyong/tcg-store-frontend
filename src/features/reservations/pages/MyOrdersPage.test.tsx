import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReservationOrder } from '@/entities/reservation/model/types';
import { MyOrdersPage } from './MyOrdersPage';

const mockOrder1: ReservationOrder = {
  id: 'ord-101',
  buyerId: 'usr-buyer',
  sellerId: 'usr-seller-1',
  status: 'PENDING',
  totalAmount: 3500,
  createdAt: '2026-09-10T10:00:00Z',
  items: [
    {
      listing: {
        id: 'lst-1',
        sellerId: 'usr-seller-1',
        name: 'Mew - POP Series 4',
        game: 'Pokemon',
        image: 'https://images.pokemontcg.io/pop4/4.png',
        price: 3500,
        cost: 2000,
        stock: 2,
        status: 'SHOW',
        condition: 'NM',
        set: 'POP Series 4',
        cardNumber: '4/17',
      },
      quantity: 1,
    },
  ],
  logs: [
    {
      fromStatus: null,
      toStatus: 'PENDING',
      changedByRole: 'SYSTEM',
      note: 'Reservation created',
      createdAt: '2026-09-10T10:00:00Z',
    },
  ],
};

const mockOrder2: ReservationOrder = {
  id: 'ord-102',
  buyerId: 'usr-buyer',
  sellerId: 'usr-seller-2',
  status: 'SENT',
  totalAmount: 1200,
  createdAt: '2026-09-08T15:30:00Z',
  sentAt: '2026-09-09T09:00:00Z',
  items: [
    {
      listing: {
        id: 'lst-2',
        sellerId: 'usr-seller-2',
        name: 'Charizard Base Set 2',
        game: 'Pokemon',
        image: 'https://images.pokemontcg.io/base2/4.png',
        price: 1200,
        cost: 800,
        stock: 1,
        status: 'SHOW',
        condition: 'LP',
        set: 'Base Set 2',
      },
      quantity: 1,
    },
  ],
  logs: [
    {
      fromStatus: 'CONFIRMED',
      toStatus: 'SENT',
      changedByRole: 'SELLER',
      note: 'Package shipped with tracking',
      createdAt: '2026-09-09T09:00:00Z',
    },
  ],
};

const mockFetchBuyerOrders = vi.fn();
const mockFetchBuyerOrderById = vi.fn();
const mockUpdateBuyerOrderStatus = vi.fn();
let currentBuyerOrders: ReservationOrder[];

vi.mock('../api/buyerOrders', () => ({
  fetchBuyerOrders: (...args: unknown[]) => mockFetchBuyerOrders(...args),
  fetchBuyerOrderById: (...args: unknown[]) => mockFetchBuyerOrderById(...args),
  updateBuyerOrderStatus: (...args: unknown[]) => mockUpdateBuyerOrderStatus(...args),
}));

vi.mock('@/features/auth/model/useAuthStore', () => ({
  useAuthStore: (selector: (state: { user: { id: string; name: string } | null }) => unknown) =>
    selector({ user: { id: 'usr-buyer', name: 'Ash Ketchum' } }),
}));

describe('MyOrdersPage (SCRUM-80)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentBuyerOrders = [mockOrder1, mockOrder2];
    mockFetchBuyerOrders.mockImplementation(async () => currentBuyerOrders);
    mockFetchBuyerOrderById.mockImplementation(async (id: string) => {
      if (id === 'ord-101') return mockOrder1;
      if (id === 'ord-102') return mockOrder2;
      throw new Error(`Order #${id} was not found.`);
    });
  });

  it('renders order list with primary items and condition badges', async () => {
    render(
      <MemoryRouter>
        <MyOrdersPage />
      </MemoryRouter>
    );

    expect(screen.getByText('My Orders')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('#ORD-101')).toBeInTheDocument();
      expect(screen.getByText('#ORD-102')).toBeInTheDocument();
      expect(screen.getByText('Mew - POP Series 4')).toBeInTheDocument();
      expect(screen.getByText('Charizard Base Set 2')).toBeInTheDocument();
    });

    // Verify condition labels on orders list
    expect(screen.getByText('Near Mint')).toBeInTheDocument();
    expect(screen.getByText('Lightly Played')).toBeInTheDocument();
  });

  it('filters orders by status tabs', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <MyOrdersPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('#ORD-101')).toBeInTheDocument();
    });

    // Filter by Sent
    const sentTab = screen.getByRole('button', { name: /^Sent$/i });
    await user.click(sentTab);

    await waitFor(() => {
      expect(screen.queryByText('#ORD-101')).not.toBeInTheDocument();
      expect(screen.getByText('#ORD-102')).toBeInTheDocument();
    });

    // Filter by Cancelled (empty)
    const cancelledTab = screen.getByRole('button', { name: /^Cancelled$/i });
    await user.click(cancelledTab);

    await waitFor(() => {
      expect(screen.getByText('No orders found')).toBeInTheDocument();
    });
  });

  it('opens Order Details modal, fetches full order details, and displays item breakdown with condition label', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <MyOrdersPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('#ORD-101')).toBeInTheDocument();
    });

    const orderDetailsButtons = screen.getAllByRole('button', { name: /Order Details/i });
    await user.click(orderDetailsButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Order Details - #ORD-101')).toBeInTheDocument();
    });

    expect(mockFetchBuyerOrderById).toHaveBeenCalledWith('ord-101');
    expect(screen.getAllByText('Reserved Items (1)').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Mew - POP Series 4').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Near Mint').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Total Order Amount')).toBeInTheDocument();
    expect(screen.getAllByText(/3,500/).length).toBeGreaterThanOrEqual(1);

    // Verify timeline
    expect(screen.getByText('Order Timeline')).toBeInTheDocument();
    expect(screen.getByText('"Reservation created"')).toBeInTheDocument();

    // Close modal
    const closeBtn = screen.getByRole('button', { name: /^Close$/i });
    await user.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByText('Order Details - #ORD-101')).not.toBeInTheDocument();
    });
  });

  it('allows marking order as received from Sent order', async () => {
    const user = userEvent.setup();
    const fulfilledOrder = {
      ...mockOrder2,
      status: 'FULFILLED' as const,
    };
    mockUpdateBuyerOrderStatus.mockImplementation(async () => {
      currentBuyerOrders = [mockOrder1, fulfilledOrder];
      return fulfilledOrder;
    });

    render(
      <MemoryRouter>
        <MyOrdersPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('#ORD-102')).toBeInTheDocument();
    });

    const markReceivedBtn = screen.getByRole('button', { name: /Mark Received/i });
    await user.click(markReceivedBtn);

    expect(mockUpdateBuyerOrderStatus).toHaveBeenCalledWith('ord-102', 'FULFILLED', undefined);
    await waitFor(() => {
      expect(screen.getAllByText('Received')).toHaveLength(2);
      expect(screen.queryByRole('button', { name: /Mark Received/i })).not.toBeInTheDocument();
    });
  });

  it('opens Order Details modal when clicking the entire order row', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <MyOrdersPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('#ORD-102')).toBeInTheDocument();
    });

    const orderRow = screen.getByRole('button', { name: /View details for order #ord-102/i });
    await user.click(orderRow);

    await waitFor(() => {
      expect(screen.getByText('Order Details - #ORD-102')).toBeInTheDocument();
    });

    expect(mockFetchBuyerOrderById).toHaveBeenCalledWith('ord-102');
  });
});
