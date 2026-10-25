import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/features/auth/model/useAuthStore';
import { useReservationCartStore } from '@/features/reservation-cart/model/useReservationCartStore';
import { Navbar } from './Navbar';
import { listingDiscoveryApi } from '@/features/discovery/api/listings';
import { notificationsApi } from '@/features/notifications/api/notifications';
import { useNotificationStore } from '@/features/notifications/model/useNotificationStore';

vi.mock('@/features/discovery/api/listings', () => ({
  listingDiscoveryApi: {
    getListings: vi.fn(),
  },
}));

vi.mock('@/features/notifications/api/notifications', () => ({
  notificationsApi: {
    getUnreadCount: vi.fn(),
  },
}));

vi.mock('motion/react', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
}));

const seller = {
  id: 'seller-1',
  name: 'Seller Demo',
  email: 'seller@mythix.com',
  role: 'USER' as const,
  isSeller: true,
};

describe('Navbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useNotificationStore.getState().reset();
    useAuthStore.setState({ token: 'seller-token', user: seller, isHydrating: false });
    useReservationCartStore.setState({ ownerId: seller.id, items: [] });
    vi.mocked(listingDiscoveryApi.getListings).mockResolvedValue({
      items: [],
      pageNumber: 0,
      pageSize: 5,
      totalElements: 0,
      totalPages: 1,
      last: true,
    });
    vi.mocked(notificationsApi.getUnreadCount).mockResolvedValue(0);
  });

  it('keeps buyer navigation available to sellers and adds seller workspace navigation', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/']}>
        <Navbar />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Reservation cart' })).toHaveAttribute('href', '/cart');
    expect(screen.getByRole('link', { name: 'Notifications' })).toHaveAttribute(
      'href',
      '/notifications',
    );
    expect(screen.getByRole('link', { name: 'Workspace' })).toHaveAttribute(
      'href',
      '/workspace/listings',
    );

    await user.click(screen.getByRole('button', { name: 'Open account menu' }));

    expect(screen.getByRole('menuitem', { name: 'Profile' })).toHaveAttribute('href', '/profile');
    expect(screen.getByRole('menuitem', { name: 'My Orders' })).toHaveAttribute('href', '/orders');
    expect(screen.getByRole('menuitem', { name: 'My Collection' })).toHaveAttribute(
      'href',
      '/collection',
    );
    expect(screen.getByRole('menuitem', { name: 'Card Listings' })).toHaveAttribute(
      'href',
      '/workspace/listings',
    );
    expect(screen.getByRole('menuitem', { name: 'Seller Orders' })).toHaveAttribute(
      'href',
      '/workspace/orders',
    );
  });

  it('dismisses the desktop account menu with Escape', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><Navbar /></MemoryRouter>);
    await user.click(screen.getByRole('button', { name: 'Open account menu' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('submits the global search to card discovery', async () => {
    const user = userEvent.setup();

    function LocationProbe() {
      const location = useLocation();
      return <output data-testid="location">{location.pathname}{location.search}</output>;
    }

    render(
      <MemoryRouter initialEntries={['/']}>
        <Navbar />
        <LocationProbe />
      </MemoryRouter>,
    );

    const search = screen.getByRole('searchbox', { name: 'Search cards' });
    await user.type(search, 'Pikachu Illustrator');
    await user.keyboard('{Enter}');

    expect(screen.getByTestId('location')).toHaveTextContent('/cards?search=Pikachu%20Illustrator');
  });

  it('shows matching card previews while typing', async () => {
    const user = userEvent.setup();
    vi.mocked(listingDiscoveryApi.getListings).mockResolvedValue({
      items: [{
        id: 'listing-1',
        sellerId: 'seller-1',
        name: 'Mew',
        game: 'Pokemon',
        image: '/mew.png',
        price: 1250,
        cost: 900,
        stock: 2,
        status: 'SHOW',
        set: 'POP Series 4',
      }],
      pageNumber: 0,
      pageSize: 5,
      totalElements: 1,
      totalPages: 1,
      last: true,
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Navbar />
      </MemoryRouter>,
    );

    await user.type(screen.getByRole('searchbox', { name: 'Search cards' }), 'Mew');

    expect(await screen.findByRole('option', { name: /Mew.*POP Series 4/ })).toBeInTheDocument();
    expect(listingDiscoveryApi.getListings).toHaveBeenCalledWith({ search: 'Mew', page: 0, size: 5 });
  });

  it('hides the global search on the card discovery page', () => {
    render(
      <MemoryRouter initialEntries={['/cards']}>
        <Navbar />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('searchbox', { name: 'Search cards' })).not.toBeInTheDocument();
  });

  it('keeps the notifications entry visible for guests so the protected route can request sign-in', () => {
    useAuthStore.setState({ token: null, user: null, isHydrating: false });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Navbar />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Notifications' })).toHaveAttribute(
      'href',
      '/notifications',
    );
    expect(notificationsApi.getUnreadCount).not.toHaveBeenCalled();
  });

  it('refreshes unread count for authenticated users and shows an accessible capped badge', async () => {
    vi.mocked(notificationsApi.getUnreadCount).mockResolvedValue(120);
    render(
      <MemoryRouter initialEntries={['/']}>
        <Navbar />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('link', { name: 'Notifications, 120 unread' })).toBeInTheDocument();
    expect(screen.getByText('99+')).toBeInTheDocument();
    expect(notificationsApi.getUnreadCount).toHaveBeenCalledTimes(1);
  });
});
