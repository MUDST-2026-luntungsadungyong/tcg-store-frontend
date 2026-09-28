import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/features/auth/model/useAuthStore';
import type { CardListing, CollectionEntry } from '@/entities/card/model/types';
import { listingsApi } from '@/features/listings/api/listings';
import { collectionApi } from '../api/collection';

import { MyCollectionPage } from './MyCollectionPage';

vi.mock('../api/collection', () => ({
  collectionApi: {
    getMyCollection: vi.fn(),
    addCatalogCardToCollection: vi.fn(),
    removeFromCollection: vi.fn(),
  },
}));

vi.mock('@/features/listings/api/listings', () => ({
  listingsApi: {
    getListings: vi.fn(),
  },
}));

const seller = {
  id: 'seller-1',
  name: 'Seller Demo',
  email: 'seller@example.com',
  role: 'USER' as const,
  isSeller: true,
};

const buyer = {
  ...seller,
  id: 'buyer-1',
  email: 'buyer@example.com',
  isSeller: false,
};

const listing = (overrides: Partial<CardListing> = {}): CardListing => ({
  id: 'listing-1',
  cardId: 'card-1',
  sellerId: 'seller-1',
  sellerName: 'Seller Demo',
  name: 'Pikachu Illustrator',
  game: 'Pokemon',
  image: '/pikachu.png',
  price: 2000,
  cost: 1500,
  stock: 2,
  status: 'SHOW',
  condition: 'NM',
  ...overrides,
});

const collectionEntry: CollectionEntry = {
  id: 'collection-1',
  ownerId: 'buyer-1',
  listing: listing({ id: 'card-1', sellerId: '' }),
  quantity: 1,
  sourceOrderId: '',
  acquiredAt: '2026-09-26T00:00:00.000Z',
};

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}{location.search}</output>;
}

describe('MyCollectionPage seller collection/store toggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ token: 'test-token', user: seller, isHydrating: false });
    vi.mocked(collectionApi.getMyCollection).mockResolvedValue([]);
    vi.mocked(listingsApi.getListings).mockResolvedValue([]);
  });

  it('lets sellers switch to My Store through the query view state and loads available listings', async () => {
    const user = userEvent.setup();
    vi.mocked(listingsApi.getListings).mockResolvedValue([
      listing({ id: 'available', name: 'Available Card', stock: 3, status: 'SHOW' }),
      listing({ id: 'hidden', name: 'Hidden Card', stock: 3, status: 'HIDE' }),
      listing({ id: 'sold-out', name: 'Sold Out Card', stock: 0, status: 'SHOW' }),
    ]);

    render(
      <MemoryRouter initialEntries={['/collection']}>
        <MyCollectionPage />
        <LocationProbe />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'My Collection' })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /My Store/ }));

    expect(await screen.findByRole('heading', { name: 'My Store' })).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/collection?view=store');
    expect(listingsApi.getListings).toHaveBeenCalledWith({ status: 'SHOW', page: 0, size: 100 });
    expect(screen.getByText('Available Card')).toBeInTheDocument();
    expect(screen.queryByText('Hidden Card')).not.toBeInTheDocument();
    expect(screen.queryByText('Sold Out Card')).not.toBeInTheDocument();
  });

  it('returns a seller to My Collection and removes the store query parameter', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/collection?view=store']}>
        <MyCollectionPage />
        <LocationProbe />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'My Store' })).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: /My Collection/ }));

    expect(await screen.findByRole('heading', { name: 'My Collection' })).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/collection');
  });

  it('does not expose the seller store view to buyers even when requested by query', async () => {
    useAuthStore.setState({ token: 'buyer-token', user: buyer, isHydrating: false });
    vi.mocked(collectionApi.getMyCollection).mockResolvedValue([collectionEntry]);

    render(
      <MemoryRouter initialEntries={['/collection?view=store']}>
        <MyCollectionPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'My Collection' })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /My Store/ })).not.toBeInTheDocument();
    expect(listingsApi.getListings).not.toHaveBeenCalled();
    expect(screen.getByText('Pikachu Illustrator')).toBeInTheDocument();
  });

  it('shows separate empty states for an empty seller store and empty buyer collection', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/collection?view=store']}>
        <MyCollectionPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Your store is empty')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Manage Listings' })).toHaveAttribute(
      'href',
      '/workspace/listings',
    );

    await user.click(screen.getByRole('tab', { name: /My Collection/ }));

    await waitFor(() => {
      expect(screen.getByText('Your collection is empty')).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: 'Browse Cards' })).toHaveAttribute('href', '/cards');
  });
});
