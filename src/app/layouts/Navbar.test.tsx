import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/features/auth/model/useAuthStore';
import { useReservationCartStore } from '@/features/reservation-cart/model/useReservationCartStore';
import { Navbar } from './Navbar';
import { listingDiscoveryApi } from '@/features/discovery/api/listings';

vi.mock('@/features/discovery/api/listings', () => ({
  listingDiscoveryApi: {
    getListings: vi.fn(),
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
});
