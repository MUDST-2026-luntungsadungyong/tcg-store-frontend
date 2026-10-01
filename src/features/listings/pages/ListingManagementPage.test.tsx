import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ManagedListing } from '@/features/listings/api/listings';
import { listingsApi } from '@/features/listings/api/listings';
import { useListingStore } from '@/features/listings/model/useListingStore';

import { ListingManagementPage } from './ListingManagementPage';

vi.mock('@/features/listings/api/listings', async () => {
  const actual = await vi.importActual<typeof import('@/features/listings/api/listings')>(
    '@/features/listings/api/listings',
  );

  return {
    ...actual,
    listingsApi: {
      getListings: vi.fn(),
      createListing: vi.fn(),
      updateListing: vi.fn(),
      setVisibility: vi.fn(),
      deleteListing: vi.fn(),
    },
  };
});

const listings: ManagedListing[] = [
  {
    id: 'listing-show',
    sellerId: 'seller-1',
    name: 'Pikachu Illustrator',
    game: 'Pokemon',
    image: '/pikachu.png',
    price: 2000,
    cost: 1500,
    stock: 4,
    status: 'SHOW',
    condition: 'NM',
    set: 'Promo',
    cardId: 'base1-4',
    cardNumber: '4',
    rarity: 'Rare Holo',
    supertype: 'Pokémon',
    subtypes: 'Stage 2',
    hp: '120',
    types: 'Fire',
    artist: 'Mitsuhiro Arita',
    marketPrice: 31401.65,
  },
  {
    id: 'listing-hide',
    sellerId: 'seller-1',
    name: 'Charizard VMAX',
    game: 'Pokemon',
    image: '/charizard.png',
    price: 350,
    cost: 200,
    stock: 0,
    status: 'HIDE',
    condition: 'LP',
    set: 'Darkness Ablaze',
  },
];

function resetListingStore() {
  useListingStore.setState({
    listings: [],
    isLoading: false,
    isSaving: false,
    pendingIds: [],
    error: null,
    searchQuery: '',
    gameFilter: 'Pokemon',
    statusFilter: 'ALL',
    viewMode: 'table',
    currentPage: 1,
    pageSize: 8,
  });
}

describe('ListingManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetListingStore();
    vi.mocked(listingsApi.getListings).mockResolvedValue(listings);
    vi.mocked(listingsApi.setVisibility).mockResolvedValue();
  });

  it('shows seller-owned listings with SHOW/HIDE visibility and available stock', async () => {
    render(<ListingManagementPage />);

    const showRow = await screen.findByRole('row', { name: /Pikachu Illustrator/ });
    const hideRow = screen.getByRole('row', { name: /Charizard VMAX/ });

    expect(within(showRow).getByText('Show')).toBeInTheDocument();
    expect(within(showRow).getByText('4')).toBeInTheDocument();
    expect(within(showRow).getByRole('switch', { name: 'Pikachu Illustrator visibility' }))
      .toHaveAttribute('aria-checked', 'true');

    expect(within(hideRow).getByText('Hide')).toBeInTheDocument();
    expect(within(hideRow).getByText('0')).toBeInTheDocument();
    expect(within(hideRow).getByRole('switch', { name: 'Charizard VMAX visibility' }))
      .toHaveAttribute('aria-checked', 'false');
  });

  it('optimistically toggles a seller listing and persists the new visibility', async () => {
    const user = userEvent.setup();
    render(<ListingManagementPage />);

    const toggle = await screen.findByRole('switch', {
      name: 'Pikachu Illustrator visibility',
    });
    await user.click(toggle);

    await waitFor(() => {
      expect(listingsApi.setVisibility).toHaveBeenCalledWith('listing-show', 'HIDE');
      expect(toggle).toHaveAttribute('aria-checked', 'false');
    });
  });

  it('shows the same catalog details when editing a listing', async () => {
    const user = userEvent.setup();
    render(<ListingManagementPage />);

    await screen.findByRole('row', { name: /Pikachu Illustrator/ });
    await user.click(screen.getAllByRole('button', { name: 'Edit' })[0]);

    expect(screen.getByText('Card details')).toBeInTheDocument();
    expect(screen.getByText('Promo')).toBeInTheDocument();
    expect(screen.getByText('#4')).toBeInTheDocument();
    expect(screen.getByText('Stage 2')).toBeInTheDocument();
    expect(screen.getByText('HP 120')).toBeInTheDocument();
    expect(screen.getByText('Fire')).toBeInTheDocument();
    expect(screen.getByText('Mitsuhiro Arita')).toBeInTheDocument();
    expect(screen.getByText('Database market price ฿31,401.65')).toBeInTheDocument();
  });

  it('opens the existing delete confirmation for a visible listing', async () => {
    const user = userEvent.setup();
    render(<ListingManagementPage />);

    await screen.findByRole('row', { name: /Pikachu Illustrator/ });
    await user.click(screen.getAllByRole('button', { name: 'Delete' })[0]);

    expect(screen.getByRole('heading', { name: 'Delete listing?' })).toBeInTheDocument();
    expect(screen.getAllByText('Pikachu Illustrator')).toHaveLength(2);
  });

  it('applies seller query/status filters and switches between table and grid views', async () => {
    const user = userEvent.setup();
    render(<ListingManagementPage />);

    await screen.findByRole('row', { name: /Pikachu Illustrator/ });

    await user.type(screen.getByRole('textbox', { name: 'Search listings' }), 'Charizard');
    expect(screen.getByText('Charizard VMAX')).toBeInTheDocument();
    expect(screen.queryByText('Pikachu Illustrator')).not.toBeInTheDocument();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Filter by status' }), 'SHOW');
    expect(screen.getByText('No matching listings')).toBeInTheDocument();
    expect(screen.getByText('Try another search term or show all statuses.')).toBeInTheDocument();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Filter by status' }), 'ALL');
    await user.click(screen.getByRole('button', { name: 'Grid view' }));

    expect(screen.getByRole('button', { name: 'Grid view' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Charizard VMAX')).toBeInTheDocument();
  });

  it('shows the seller empty state and add-listing action when inventory is empty', async () => {
    vi.mocked(listingsApi.getListings).mockResolvedValue([]);

    render(<ListingManagementPage />);

    expect(await screen.findByText('No listings yet')).toBeInTheDocument();
    expect(screen.getByText('Add your first listing to start managing seller inventory.'))
      .toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /add listing/i })).toHaveLength(2);
  });
});
