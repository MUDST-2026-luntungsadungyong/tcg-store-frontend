import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { collectionApi, type PublicCollectionSummary } from '../api/collection';
import { PublicCollectionsExplorePage } from './PublicCollectionsExplorePage';

vi.mock('../api/collection', () => ({
  collectionApi: {
    getPublicCollections: vi.fn(),
  },
}));

const mockSummary1: PublicCollectionSummary = {
  userId: 'usr-10',
  displayName: 'Champion Cynthia',
  avatarUrl: null,
  role: 'USER',
  sellerStatus: 'NONE',
  isSeller: false,
  totalCardsCount: 25,
  rareCardCount: 12,
  distinctRareCardCount: 8,
  highlights: [
    { cardId: 'c1', name: 'Garchomp V', imageUrl: '/garchomp.png', rarity: 'Ultra Rare', quantity: 2 },
    { cardId: 'c2', name: 'Lucario GX', imageUrl: '/lucario.png', rarity: 'Rare Holo', quantity: 1 },
  ],
};

const mockSummary2: PublicCollectionSummary = {
  userId: 'usr-20',
  displayName: 'Gym Leader Brock',
  avatarUrl: null,
  role: 'SELLER',
  sellerStatus: 'APPROVED',
  isSeller: true,
  totalCardsCount: 40,
  rareCardCount: 15,
  distinctRareCardCount: 10,
  highlights: [
    { cardId: 'c3', name: 'Onix GX', imageUrl: '/onix.png', rarity: 'Rare', quantity: 3 },
  ],
};

describe('PublicCollectionsExplorePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title, stats, and public collection cards', async () => {
    vi.mocked(collectionApi.getPublicCollections).mockResolvedValue({
      items: [mockSummary1, mockSummary2],
      page: {
        page: 0,
        size: 9,
        totalElements: 2,
        totalPages: 1,
      },
    });

    render(
      <MemoryRouter initialEntries={['/collections']}>
        <Routes>
          <Route path="/collections" element={<PublicCollectionsExplorePage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Collector Showcases')).toBeInTheDocument();
    expect(
      screen.getByText('Explore authentic public card collections from trainers and collectors across the community'),
    ).toBeInTheDocument();

    expect(await screen.findByText('Champion Cynthia')).toBeInTheDocument();
    expect(screen.getByText('Gym Leader Brock')).toBeInTheDocument();

    // Check stats and badges
    expect(screen.getByText('12')).toBeInTheDocument(); // Cynthia's rare cards
    expect(screen.getByText('25')).toBeInTheDocument(); // Cynthia's total cards
    expect(screen.getByText('Seller')).toBeInTheDocument(); // Brock's seller badge

    // Check links to individual showcase
    const cynthiaShowcaseLink = screen.getAllByRole('link', { name: /View Collection Showcase/i })[0];
    expect(cynthiaShowcaseLink).toHaveAttribute('href', '/collections/usr-10');
  });

  it('submits search query and triggers API with filter', async () => {
    const user = userEvent.setup();
    vi.mocked(collectionApi.getPublicCollections).mockResolvedValue({
      items: [mockSummary1],
      page: {
        page: 0,
        size: 9,
        totalElements: 1,
        totalPages: 1,
      },
    });

    render(
      <MemoryRouter initialEntries={['/collections']}>
        <Routes>
          <Route path="/collections" element={<PublicCollectionsExplorePage />} />
        </Routes>
      </MemoryRouter>,
    );

    const searchInput = screen.getByPlaceholderText('Search by collector name or card in collection...');
    await user.type(searchInput, 'Cynthia{enter}');

    await waitFor(() => {
      expect(collectionApi.getPublicCollections).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'Cynthia',
        }),
      );
    });
  });

  it('renders empty state when no collections match', async () => {
    vi.mocked(collectionApi.getPublicCollections).mockResolvedValue({
      items: [],
      page: {
        page: 0,
        size: 9,
        totalElements: 0,
        totalPages: 1,
      },
    });

    render(
      <MemoryRouter initialEntries={['/collections']}>
        <Routes>
          <Route path="/collections" element={<PublicCollectionsExplorePage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('No public collections found')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeInTheDocument();
  });
});
