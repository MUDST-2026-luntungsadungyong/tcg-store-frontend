import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
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
});
