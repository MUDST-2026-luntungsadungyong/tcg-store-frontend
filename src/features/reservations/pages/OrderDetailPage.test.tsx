import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReservationOrder } from '@/entities/reservation/model/types';
import { OrderDetailPage } from './OrderDetailPage';

const mockOrderPending: ReservationOrder = {
  id: 'ord-101',
  orderNumber: 'ORD-2026-101',
  buyerId: 'usr-buyer',
  sellerId: 'usr-seller-1',
  sellerName: 'PokeMaster Store',
  status: 'PENDING',
  totalAmount: 3500,
  createdAt: '2026-09-10T10:00:00Z',
  updatedAt: '2026-09-10T10:05:00Z',
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
        rarity: 'Rare',
      },
      quantity: 1,
    },
  ],
  logs: [
    {
      fromStatus: null,
      toStatus: 'PENDING',
      changedByRole: 'SYSTEM',
      note: 'Reservation created by buyer',
      createdAt: '2026-09-10T10:00:00Z',
    },
  ],
};

const mockOrderSent: ReservationOrder = {
  id: 'ord-102',
  orderNumber: 'ORD-2026-102',
  buyerId: 'usr-buyer',
  sellerId: 'usr-seller-2',
  status: 'SENT',
  totalAmount: 2400,
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
        stock: 5,
        status: 'SHOW',
        condition: 'LP',
        set: 'Base Set 2',
        cardNumber: '4/130',
        rarity: 'Holo Rare',
      },
      quantity: 2,
    },
  ],
  logs: [],
};

const mockOrderSpecial: ReservationOrder = {
  id: 'ord-103',
  buyerId: 'usr-buyer',
  sellerId: 'usr-seller-3',
  status: 'FULFILLED',
  totalAmount: 5000,
  createdAt: '2026-09-01T12:00:00Z',
  items: [
    {
      listing: {
        id: 'lst-3',
        sellerId: 'usr-seller-3',
        name: 'Pikachu Illustrator',
        game: 'Pokemon',
        image: 'https://images.pokemontcg.io/promo/1.png',
        price: 5000,
        cost: 4000,
        stock: 1,
        status: 'SHOW',
        condition: 'PSA 10 Gem Mint',
        set: 'CoroCoro Promo',
      },
      quantity: 1,
    },
    {
      listing: {
        id: 'lst-4',
        sellerId: 'usr-seller-3',
        name: 'Ancient Mew',
        game: 'Pokemon',
        image: 'https://images.pokemontcg.io/promo/2.png',
        price: 0,
        cost: 0,
        stock: 1,
        status: 'SHOW',
        condition: undefined,
        set: 'Movie Promo',
      },
      quantity: 1,
    },
  ],
  logs: [],
};

const mockFetchBuyerOrderById = vi.fn();
const mockUpdateBuyerOrderStatus = vi.fn();
const mockPublicStore = vi.fn();

vi.mock('../api/buyerOrders', () => ({
  fetchBuyerOrderById: (...args: unknown[]) => mockFetchBuyerOrderById(...args),
  updateBuyerOrderStatus: (...args: unknown[]) => mockUpdateBuyerOrderStatus(...args),
}));

vi.mock('@/features/stores/api/stores', () => ({
  storesApi: {
    public: (...args: unknown[]) => mockPublicStore(...args),
  },
}));

vi.mock('@/features/auth/model/useAuthStore', () => ({
  useAuthStore: (selector: (state: { user: { id: string; name: string } | null }) => unknown) =>
    selector({ user: { id: 'usr-buyer', name: 'Ash Ketchum' } }),
}));

function renderOrderDetailPage(orderId: string) {
  return render(
    <MemoryRouter initialEntries={[`/orders/${orderId}`]}>
      <Routes>
        <Route path="/orders" element={<div>My Orders List</div>} />
        <Route path="/orders/:orderId" element={<OrderDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('OrderDetailPage (SCRUM-80)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPublicStore.mockResolvedValue({
      sellerId: 'usr-seller-1',
      shopName: 'PokeMaster Official Store',
      phone: '0812345678',
      line: '@pokemaster',
      facebook: 'PokeMasterTH',
    });
  });

  it('renders order detail with status banner, full condition label, seller contact, and financial summary', async () => {
    mockFetchBuyerOrderById.mockResolvedValue(mockOrderPending);

    renderOrderDetailPage('ord-101');

    await waitFor(() => {
      expect(screen.getByText('Order Placed & Awaiting Confirmation')).toBeInTheDocument();
      expect(screen.getAllByText(/#ORD-2026-101/i).length).toBeGreaterThanOrEqual(1);
    });

    // Check full condition label (Near Mint from NM)
    expect(screen.getByText('Near Mint')).toBeInTheDocument();
    expect(screen.queryByText(/^NM$/)).not.toBeInTheDocument();

    // Check seller store profile and contact details
    await waitFor(() => {
      expect(screen.getByText('PokeMaster Official Store')).toBeInTheDocument();
      expect(screen.getByText('0812345678')).toBeInTheDocument();
      expect(screen.getByText('Line: @pokemaster')).toBeInTheDocument();
      expect(screen.getByText('PokeMasterTH')).toBeInTheDocument();
    });

    // Check product details
    expect(screen.getByText('Mew - POP Series 4')).toBeInTheDocument();
    expect(screen.getByText(/POP Series 4 · #4\/17 · Rare/)).toBeInTheDocument();
    expect(screen.getByText('Qty: 1')).toBeInTheDocument();

    // Check totals
    expect(screen.getAllByText('฿3,500').length).toBeGreaterThanOrEqual(1);

    // Check notice
    expect(screen.getByText(/Mythix Marketplace Notice:/i)).toBeInTheDocument();

    // Check timeline
    expect(screen.getByText('Order Timeline & Audit History')).toBeInTheDocument();
    expect(screen.getByText('"Reservation created by buyer"')).toBeInTheDocument();
  });

  it('renders useful empty state when order has no timeline logs', async () => {
    mockFetchBuyerOrderById.mockResolvedValue(mockOrderSent);

    renderOrderDetailPage('ord-102');

    await waitFor(() => {
      expect(screen.getByText('Order Dispatched / In Transit')).toBeInTheDocument();
    });

    // Verify empty timeline notice
    expect(screen.getByText('No timeline logs recorded yet.')).toBeInTheDocument();
    // Does not hide other order content
    expect(screen.getByText('Charizard Base Set 2')).toBeInTheDocument();
    expect(screen.getByText('Lightly Played')).toBeInTheDocument();
    expect(screen.getAllByText('฿2,400').length).toBeGreaterThanOrEqual(1);
  });

  it('preserves custom graded condition and uses "Not specified" for missing condition', async () => {
    mockFetchBuyerOrderById.mockResolvedValue(mockOrderSpecial);

    renderOrderDetailPage('ord-103');

    await waitFor(() => {
      expect(screen.getByText('Pikachu Illustrator')).toBeInTheDocument();
    });

    expect(screen.getByText('PSA 10 Gem Mint')).toBeInTheDocument();
    expect(screen.getByText('Not specified')).toBeInTheDocument();
  });

  it('allows cancelling a PENDING order with confirmation and cancellation note', async () => {
    const user = userEvent.setup();
    mockFetchBuyerOrderById.mockResolvedValue(mockOrderPending);
    mockUpdateBuyerOrderStatus.mockResolvedValue({
      ...mockOrderPending,
      status: 'CANCELLED',
      cancellationReason: 'Found another card',
    });

    renderOrderDetailPage('ord-101');

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Cancel Order$/i })).toBeInTheDocument();
    });

    // Click Cancel Order
    await user.click(screen.getByRole('button', { name: /^Cancel Order$/i }));

    // Modal appears
    expect(screen.getByText('Cancel Card Reservation')).toBeInTheDocument();
    const reasonInput = screen.getByPlaceholderText(/Changed my mind/i);
    await user.type(reasonInput, 'Found another card');

    // Confirm Cancellation
    const confirmBtn = screen.getByRole('button', { name: /^Confirm Cancellation$/i });
    await user.click(confirmBtn);

    expect(mockUpdateBuyerOrderStatus).toHaveBeenCalledWith('ord-101', 'CANCELLED', 'Found another card');
  });

  it('allows marking order as received for SENT order', async () => {
    const user = userEvent.setup();
    mockFetchBuyerOrderById.mockResolvedValue(mockOrderSent);
    mockUpdateBuyerOrderStatus.mockResolvedValue({
      ...mockOrderSent,
      status: 'FULFILLED',
    });

    renderOrderDetailPage('ord-102');

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Mark Received/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Mark Received/i }));

    // Confirm Received modal appears
    expect(screen.getByText('Confirm Card Receipt')).toBeInTheDocument();

    const yesBtn = screen.getByRole('button', { name: /Yes, Mark Received/i });
    await user.click(yesBtn);

    expect(mockUpdateBuyerOrderStatus).toHaveBeenCalledWith('ord-102', 'FULFILLED', undefined);
  });

  it('does not display action buttons for FULFILLED or CANCELLED orders', async () => {
    mockFetchBuyerOrderById.mockResolvedValue(mockOrderSpecial);

    renderOrderDetailPage('ord-103');

    await waitFor(() => {
      expect(screen.getByText('Order Completed')).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: /Cancel Order/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Mark Received/i })).not.toBeInTheDocument();
  });

  it('displays error state when order fetching fails', async () => {
    mockFetchBuyerOrderById.mockRejectedValue(new Error('Order #ord-999 was not found.'));

    renderOrderDetailPage('ord-999');

    await waitFor(() => {
      expect(screen.getByText('Unable to display order')).toBeInTheDocument();
      expect(screen.getByText('Order #ord-999 was not found.')).toBeInTheDocument();
    });
  });
});
