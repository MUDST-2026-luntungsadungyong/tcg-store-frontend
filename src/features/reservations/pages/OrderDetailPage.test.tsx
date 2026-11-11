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
  sellerEmail: 'seller@example.com',
  sellerPhone: '0812345678',
  sellerLine: '@pokemaster',
  sellerFacebook: 'PokeMasterTH',
  sellerOtherContact: 'Discord: pokemaster',
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
const mockReorderBuyerOrder = vi.fn();
const mockDownloadBuyerOrderInvoice = vi.fn();
const mockSetCartState = vi.fn();

vi.mock('../api/buyerOrders', () => ({
  fetchBuyerOrderById: (...args: unknown[]) => mockFetchBuyerOrderById(...args),
  updateBuyerOrderStatus: (...args: unknown[]) => mockUpdateBuyerOrderStatus(...args),
  reorderBuyerOrder: (...args: unknown[]) => mockReorderBuyerOrder(...args),
  downloadBuyerOrderInvoice: (...args: unknown[]) => mockDownloadBuyerOrderInvoice(...args),
}));

vi.mock('@/features/reservation-cart/model/useReservationCartStore', () => ({
  useReservationCartStore: { setState: (...args: unknown[]) => mockSetCartState(...args) },
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
  beforeEach(() => vi.clearAllMocks());

  it('shows private seller contact after an auction win and never exposes a proof form', async () => {
    mockFetchBuyerOrderById.mockResolvedValue({
      ...mockOrderPending,
      orderType: 'AUCTION',
      status: 'AWAITING_BUYER_CONTACT',
      totalAmount: 3001,
      items: [{
        ...mockOrderPending.items[0],
        quantity: 3,
        listing: { ...mockOrderPending.items[0].listing, price: 3001 },
      }],
    });

    renderOrderDetailPage('ord-101');

    expect(await screen.findByText('Contact the Seller to Arrange Payment')).toBeInTheDocument();
    expect(screen.getByText('seller@example.com')).toBeInTheDocument();
    expect(screen.getByText('0812345678')).toBeInTheDocument();
    expect(screen.queryByText(/หลักฐานการชำระเงิน/)).not.toBeInTheDocument();
    expect(screen.getByText('ราคาทั้งล็อต')).toBeInTheDocument();
    expect(screen.getByText('Qty: 3')).toBeInTheDocument();
    expect(screen.queryByText(/9,003/)).not.toBeInTheDocument();
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

    // Check private seller contact details returned by the order API.
    await waitFor(() => {
      expect(screen.getByText('PokeMaster Store')).toBeInTheDocument();
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

  it('reorders available cards, syncs the cart, and reports stock adjustments', async () => {
    const user = userEvent.setup();
    mockFetchBuyerOrderById.mockResolvedValue(mockOrderSpecial);
    mockReorderBuyerOrder.mockResolvedValue({
      totalAddedItems: 1,
      hasUnavailableItems: true,
      items: [
        {
          listingId: 'lst-3',
          productName: 'Pikachu Illustrator',
          requestedQuantity: 1,
          addedQuantity: 1,
          availableQuantity: 1,
          outcome: 'ADDED',
        },
        {
          listingId: 'lst-4',
          productName: 'Ancient Mew',
          requestedQuantity: 1,
          addedQuantity: 0,
          availableQuantity: 0,
          outcome: 'STOCK_LIMIT_REACHED',
        },
      ],
      cart: {
        totalItems: 1,
        totalAmount: 5000,
        items: [
          {
            listingId: 'lst-3',
            sellerId: 'usr-seller-3',
            name: 'Pikachu Illustrator',
            game: 'Pokemon',
            image: 'https://images.pokemontcg.io/promo/1.png',
            price: 5000,
            quantity: 1,
            available: true,
            availableQuantity: 1,
            subtotal: 5000,
          },
        ],
      },
    });

    renderOrderDetailPage('ord-103');
    await user.click(await screen.findByRole('button', { name: /1-Click Reorder/i }));

    expect(mockReorderBuyerOrder).toHaveBeenCalledWith('ord-103');
    expect(mockSetCartState).toHaveBeenCalledWith(expect.objectContaining({ error: null }));
    expect(await screen.findByText(/Some quantities were reduced to match current stock/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /View Cart/i })).toHaveAttribute('href', '/cart');
  });

  it('downloads the PDF invoice from order detail', async () => {
    const user = userEvent.setup();
    mockFetchBuyerOrderById.mockResolvedValue(mockOrderPending);
    mockDownloadBuyerOrderInvoice.mockResolvedValue('mythix-order-ORD-2026-101.pdf');

    renderOrderDetailPage('ord-101');
    await user.click(await screen.findByRole('button', { name: /Download PDF Invoice/i }));

    expect(mockDownloadBuyerOrderInvoice).toHaveBeenCalledWith('ord-101');
    expect(await screen.findByText('PDF order summary downloaded.')).toBeInTheDocument();
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
