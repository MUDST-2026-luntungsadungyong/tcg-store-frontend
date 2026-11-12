import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  getListings,
  getListingById,
  getCardById,
  getSubscription,
  subscribe,
  unsubscribe,
  isStockAlreadyAvailable,
} = vi.hoisted(() => ({
  getListings: vi.fn(),
  getListingById: vi.fn(),
  getCardById: vi.fn(),
  getSubscription: vi.fn(),
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
  isStockAlreadyAvailable: vi.fn((error: unknown) => (error as { code?: string })?.code === 'STOCK_ALREADY_AVAILABLE'),
}));

vi.mock('@/features/discovery/api/listings', () => ({
  listingDiscoveryApi: { getListings, getListingById },
}));
vi.mock('@/features/discovery/api/catalog', () => ({ catalogApi: { getCardById } }));
vi.mock('@/features/discovery/api/stockSubscriptions', () => ({
  stockSubscriptionsApi: { get: getSubscription, subscribe, unsubscribe },
  isStockAlreadyAvailable,
}));
vi.mock('@/features/discovery/components/CardPhotoMagnifierViewer', () => ({
  CardPhotoMagnifierViewer: () => <div aria-label="Card photo" />,
}));
vi.mock('@/features/discovery/components/CardCollectPanel', () => ({
  CardCollectPanel: () => null,
}));
vi.mock('@/features/discovery/components/SellerOffersSection', () => ({
  SellerOffersSection: ({ offers }: { offers: unknown[] }) => <div>Offers: {offers.length}</div>,
}));
vi.mock('@/features/discovery/components/SimilarCardsSection', () => ({
  SimilarCardsSection: () => null,
}));
vi.mock('@/features/auth', () => ({
  ContextualLoginModal: ({ isOpen, message }: { isOpen: boolean; message: string }) =>
    isOpen ? <div role="dialog">{message}</div> : null,
  useAuthStore: vi.fn(),
}));

import { useAuthStore } from '@/features/auth';
import { CardDetailPage } from './CardDetailPage';

const catalogCard = {
  id: 'global-charizard-id',
  name: 'Charizard',
  game: 'Pokemon',
  setName: 'Base Set',
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/cards/global-charizard-id']}>
      <Routes>
        <Route path="/cards/:id" element={<CardDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('CardDetailPage stock notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthStore).mockImplementation((selector) => selector({ token: null } as never));
    getListings.mockResolvedValue({ items: [] });
    getListingById.mockRejectedValue(new Error('Not found'));
    getCardById.mockResolvedValue(catalogCard);
    getSubscription.mockResolvedValue({ globalCardId: catalogCard.id, subscribed: false, subscribedAt: null });
    subscribe.mockResolvedValue({ globalCardId: catalogCard.id, subscribed: true, subscribedAt: null });
    unsubscribe.mockResolvedValue(undefined);
  });

  it('opens the existing login flow when a guest asks for a stock notification', async () => {
    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Notify Me When Available' }));

    expect(await screen.findByRole('dialog')).toHaveTextContent('Log in to follow cards for restock notifications');
    expect(subscribe).not.toHaveBeenCalled();
    expect(getSubscription).not.toHaveBeenCalled();
  });

  it('loads subscribed state and cancels the notification', async () => {
    vi.mocked(useAuthStore).mockImplementation((selector) => selector({ token: 'buyer-token' } as never));
    getSubscription.mockResolvedValue({ globalCardId: catalogCard.id, subscribed: true, subscribedAt: '2026-11-12T00:00:00Z' });
    renderPage();

    expect(await screen.findByRole('status')).toHaveTextContent('You’ll be notified');
    expect(getSubscription).toHaveBeenCalledWith(catalogCard.id);
    await userEvent.click(screen.getByRole('button', { name: 'Cancel notification' }));

    await waitFor(() => expect(unsubscribe).toHaveBeenCalledWith(catalogCard.id));
    expect(await screen.findByRole('button', { name: 'Notify Me When Available' })).toBeInTheDocument();
  });

  it('subscribes authenticated buyers and displays the notified state', async () => {
    vi.mocked(useAuthStore).mockImplementation((selector) => selector({ token: 'buyer-token' } as never));
    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Notify Me When Available' }));

    await waitFor(() => expect(subscribe).toHaveBeenCalledWith(catalogCard.id));
    expect(await screen.findByRole('status')).toHaveTextContent('You’ll be notified');
  });

  it('refreshes card offers and subscription state after STOCK_ALREADY_AVAILABLE', async () => {
    vi.mocked(useAuthStore).mockImplementation((selector) => selector({ token: 'buyer-token' } as never));
    getListings
      .mockResolvedValueOnce({ items: [] })
      .mockResolvedValue({ items: [{ id: 'listing-1', cardId: catalogCard.id, name: 'Charizard', price: 100, stock: 2, status: 'SHOW' }] });
    subscribe.mockRejectedValue({ code: 'STOCK_ALREADY_AVAILABLE' });
    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Notify Me When Available' }));

    await waitFor(() => expect(getListings).toHaveBeenCalledTimes(2));
    expect(getSubscription).toHaveBeenCalledTimes(2);
    expect(await screen.findByText('Offers: 1')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Notify Me When Available' })).not.toBeInTheDocument();
  });
});
