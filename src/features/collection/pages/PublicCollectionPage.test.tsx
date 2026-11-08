import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { collectionApi } from '../api/collection';
import { PublicCollectionPage } from './PublicCollectionPage';
import type { CollectionEntry } from '@/entities/card/model/types';

vi.mock('../api/collection', () => ({
  collectionApi: {
    getPublicCollection: vi.fn(),
  },
}));

const mockEntry: CollectionEntry = {
  id: 'col-1',
  ownerId: 'usr-100',
  listing: {
    id: 'card-charizard',
    sellerId: 'usr-100',
    name: 'Charizard Base Set',
    game: 'Pokemon',
    image: '/charizard.png',
    price: 5000,
    cost: 5000,
    stock: 1,
    status: 'SHOW',
    rarity: 'Rare Holo',
    condition: 'NM',
    set: 'Base Set',
  },
  quantity: 2,
  sourceOrderId: '',
  acquiredAt: '2026-09-26T00:00:00.000Z',
};

const mockOwner = {
  userId: 'usr-100',
  displayName: 'Master Collector',
  avatarUrl: null,
  rareCardCount: 15,
  distinctRareCardCount: 8,
  collectionPrivacy: 'PUBLIC' as const,
  isSeller: true,
};

describe('PublicCollectionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders storefront-style showcase for a public collection', async () => {
    vi.mocked(collectionApi.getPublicCollection).mockResolvedValue({
      owner: mockOwner,
      items: [mockEntry],
    });

    render(
      <MemoryRouter initialEntries={['/collections/usr-100']}>
        <Routes>
          <Route path="/collections/:userId" element={<PublicCollectionPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'Master Collector' })).toBeInTheDocument();
    expect(screen.getByText('Collector Showcase')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('rare cards')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('unique rare cards')).toBeInTheDocument();
    expect(screen.getByText('Charizard Base Set')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Visit Seller's Store/ })).toHaveAttribute(
      'href',
      '/stores/usr-100',
    );
  });

  it('renders 403 error page when collection is private', async () => {
    const forbiddenError = new Error('This collection is private.');
    (forbiddenError as any).status = 403;
    (forbiddenError as any).code = 'COLLECTION_PRIVATE';
    vi.mocked(collectionApi.getPublicCollection).mockRejectedValue(forbiddenError);

    render(
      <MemoryRouter initialEntries={['/collections/usr-private']}>
        <Routes>
          <Route path="/collections/:userId" element={<PublicCollectionPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('403 — Private Collection')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'This collection is private' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to homepage' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Explore marketplace' })).toHaveAttribute('href', '/cards');
  });

  it('renders 404 error page when collection owner is not found', async () => {
    const notFoundError = new Error('Public collection not found.');
    (notFoundError as any).status = 404;
    (notFoundError as any).code = 'PUBLIC_COLLECTION_NOT_FOUND';
    vi.mocked(collectionApi.getPublicCollection).mockRejectedValue(notFoundError);

    render(
      <MemoryRouter initialEntries={['/collections/usr-999']}>
        <Routes>
          <Route path="/collections/:userId" element={<PublicCollectionPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('404 — Collector Not Found')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: "This collector doesn't exist" })).toBeInTheDocument();
  });

  it('filters cards by search query in the showcase gallery', async () => {
    const user = userEvent.setup();
    const secondEntry: CollectionEntry = {
      ...mockEntry,
      id: 'col-2',
      listing: {
        ...mockEntry.listing,
        id: 'card-blastoise',
        name: 'Blastoise Base Set',
      },
    };

    vi.mocked(collectionApi.getPublicCollection).mockResolvedValue({
      owner: mockOwner,
      items: [mockEntry, secondEntry],
    });

    render(
      <MemoryRouter initialEntries={['/collections/usr-100']}>
        <Routes>
          <Route path="/collections/:userId" element={<PublicCollectionPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Charizard Base Set')).toBeInTheDocument();
    expect(screen.getByText('Blastoise Base Set')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText('Search cards in this collection...');
    await user.type(searchInput, 'Charizard');

    expect(screen.getByText('Charizard Base Set')).toBeInTheDocument();
    expect(screen.queryByText('Blastoise Base Set')).not.toBeInTheDocument();
  });
});
