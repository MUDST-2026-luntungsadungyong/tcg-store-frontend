import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';

import { useAuthStore } from '@/features/auth/model/useAuthStore';
import { useReservationCartStore } from '@/features/reservation-cart/model/useReservationCartStore';
import { Navbar } from './Navbar';

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

  it('hides the global search on the card discovery page', () => {
    render(
      <MemoryRouter initialEntries={['/cards']}>
        <Navbar />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('searchbox', { name: 'Search cards' })).not.toBeInTheDocument();
  });
});
