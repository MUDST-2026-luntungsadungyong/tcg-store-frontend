import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { collectionApi } from '../api/collection';
import { PublicCollectionPage } from './PublicCollectionPage';
import type { CollectionEntry } from '@/entities/card/model/types';
import { useAuthStore } from '@/features/auth/model/useAuthStore';

vi.mock('../api/collection', () => ({
  collectionApi: {
    getPublicCollection: vi.fn(),
    comparePublicCollection: vi.fn(),
    getMyCollection: vi.fn(),
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
    rarity: 'Secret Rare',
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
  secretRareCount: 2,
  badges: ['Master Collector', 'Secret Rare Hunter'],
  collectionPrivacy: 'PUBLIC' as const,
  isSeller: true,
};

describe('PublicCollectionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: null, isAuthenticated: false } as any);
  });

  it('renders storefront-style showcase for a public collection including Secret Rare and collector badges', async () => {
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
    expect(screen.getAllByText('Secret Rare').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Secret Rare Hunter')).toBeInTheDocument();
    expect(screen.getByText('Charizard Base Set')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Visit Seller's Store/ })).toHaveAttribute(
      'href',
      '/stores/usr-100',
    );
  });

  it('ignores a late response for the previous showcase', async () => {
    let resolveOld!: (value: { owner: typeof mockOwner; items: CollectionEntry[] }) => void;
    vi.mocked(collectionApi.getPublicCollection)
      .mockImplementationOnce(() => new Promise((resolve) => { resolveOld = resolve; }))
      .mockResolvedValueOnce({ owner: { ...mockOwner, userId: 'new', displayName: 'New Owner' }, items: [] });
    render(<MemoryRouter initialEntries={['/collections/usr-100']}><Link to="/collections/new">Next showcase</Link><Routes><Route path="/collections/:userId" element={<PublicCollectionPage />} /></Routes></MemoryRouter>);
    await userEvent.click(screen.getByRole('link', { name: 'Next showcase' }));
    expect(await screen.findByRole('heading', { name: 'New Owner' })).toBeInTheDocument();
    await act(async () => { resolveOld({ owner: mockOwner, items: [] }); });
    expect(screen.getByRole('heading', { name: 'New Owner' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Master Collector' })).not.toBeInTheDocument();
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
    expect(screen.getByText(/This collection is set to private by the owner/i)).toBeInTheDocument();
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

  it('filters cards by search query and card set in the showcase gallery', async () => {
    const user = userEvent.setup();
    const secondEntry: CollectionEntry = {
      ...mockEntry,
      id: 'col-2',
      listing: {
        ...mockEntry.listing,
        id: 'card-blastoise',
        name: 'Blastoise Jungle',
        set: 'Jungle',
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
    expect(screen.getByText('Blastoise Jungle')).toBeInTheDocument();

    const setFilter = screen.getByLabelText('Filter by card set');
    await user.selectOptions(setFilter, 'Jungle');

    expect(screen.queryByText('Charizard Base Set')).not.toBeInTheDocument();
    expect(screen.getByText('Blastoise Jungle')).toBeInTheDocument();

    await user.selectOptions(setFilter, 'ALL');
    const searchInput = screen.getByPlaceholderText('Search cards in this collection...');
    await user.type(searchInput, 'Charizard');

    expect(screen.getByText('Charizard Base Set')).toBeInTheDocument();
    expect(screen.queryByText('Blastoise Jungle')).not.toBeInTheDocument();
  });

  it('displays Card Comparison Helper badges and ownership filter when visitor is logged in (US-22-2)', async () => {
    const user = userEvent.setup();
    useAuthStore.setState({
      user: { id: 'usr-visitor', name: 'Visitor Buyer', email: 'v@example.com' } as any,
      isAuthenticated: true,
    } as any);

    const missingEntry: CollectionEntry = {
      ...mockEntry,
      id: 'col-2',
      listing: {
        ...mockEntry.listing,
        id: 'card-lugia',
        name: 'Lugia Neo Genesis',
        set: 'Neo Genesis',
      },
    };

    vi.mocked(collectionApi.getPublicCollection).mockResolvedValue({
      owner: mockOwner,
      items: [mockEntry, missingEntry],
      comparison: {
        targetUserId: 'usr-100',
        visitorUserId: 'usr-visitor',
        totalTargetDistinctCards: 2,
        sharedDistinctCards: 1,
        missingDistinctCards: 1,
        ownedQuantities: {
          'card-charizard': 3,
          'card-lugia': 0,
        },
        items: [],
      },
    });

    render(
      <MemoryRouter initialEntries={['/collections/usr-100']}>
        <Routes>
          <Route path="/collections/:userId" element={<PublicCollectionPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByTestId('collection-comparison-summary')).toBeInTheDocument();
    expect(screen.getByText('คุณครอบครองการ์ดใบนี้แล้ว 3 ใบ')).toBeInTheDocument();
    expect(screen.getByText('คุณยังไม่มีการ์ดใบนี้')).toBeInTheDocument();

    // Filter to only missing cards
    await user.click(screen.getByRole('button', { name: /ที่ยังไม่มี \(1\)/i }));
    expect(screen.queryByText('Charizard Base Set')).not.toBeInTheDocument();
    expect(screen.getByText('Lugia Neo Genesis')).toBeInTheDocument();
  });
});
