import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { CardDiscoveryPage } from './CardDiscoveryPage';
import { listingDiscoveryApi } from '@/features/discovery/api/listings';
import type { CardListing } from '@/entities/card/model/types';

vi.mock('@/features/discovery/api/listings', () => ({
  listingDiscoveryApi: {
    getListings: vi.fn(),
    getListingById: vi.fn(),
  },
}));

const mockItems: CardListing[] = [
  {
    id: 'prd-1',
    sellerId: 'sel-1',
    name: 'Pikachu Illustrator',
    game: 'Pokemon',
    image: '/assets/expensive_card_1.png',
    price: 2000,
    cost: 1500,
    stock: 5,
    status: 'SHOW',
    rarity: 'Rare Holo',
    stage: 'Basic',
    condition: 'Near Mint',
  },
  {
    id: 'prd-2',
    sellerId: 'sel-2',
    name: 'Charizard VMAX',
    game: 'Pokemon',
    image: '/assets/expensive_card_2.png',
    price: 350,
    cost: 200,
    stock: 0,
    status: 'SHOW',
    rarity: 'Ultra Rare',
    stage: 'VMAX',
    condition: 'Mint',
  },
];

describe('CardDiscoveryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders products and filters with search input', async () => {
    const user = userEvent.setup();
    vi.mocked(listingDiscoveryApi.getListings).mockResolvedValue({
      items: mockItems,
      pageNumber: 0,
      pageSize: 12,
      totalElements: 2,
      totalPages: 1,
      last: true,
    });

    render(
      <MemoryRouter>
        <CardDiscoveryPage />
      </MemoryRouter>
    );

    // Verify products render
    expect(await screen.findByText('Pikachu Illustrator')).toBeInTheDocument();
    expect(screen.getByText('Charizard VMAX')).toBeInTheDocument();

    // Verify out of stock badge
    expect(screen.getByText('OUT OF STOCK')).toBeInTheDocument();

    // Type in search input
    const searchInput = screen.getByTestId('search-input');
    await user.type(searchInput, 'Pikachu');

    // Only Pikachu should be visible
    expect(screen.getByText('Pikachu Illustrator')).toBeInTheDocument();
    expect(screen.queryByText('Charizard VMAX')).not.toBeInTheDocument();
  });

  it('initializes the page search from the Navbar query parameter', async () => {
    vi.mocked(listingDiscoveryApi.getListings).mockResolvedValue({
      items: mockItems,
      pageNumber: 0,
      pageSize: 12,
      totalElements: 2,
      totalPages: 1,
      last: true,
    });

    render(
      <MemoryRouter initialEntries={['/cards?search=Pikachu']}>
        <CardDiscoveryPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Pikachu Illustrator')).toBeInTheDocument();
    expect(screen.getByTestId('search-input')).toHaveValue('Pikachu');
    expect(listingDiscoveryApi.getListings).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'Pikachu' }),
    );
  });

  it('rejects invalid price ranges when Min > Max and displays inline error', async () => {
    const user = userEvent.setup();
    vi.mocked(listingDiscoveryApi.getListings).mockResolvedValue({
      items: mockItems,
      pageNumber: 0,
      pageSize: 12,
      totalElements: 2,
      totalPages: 1,
      last: true,
    });

    render(
      <MemoryRouter>
        <CardDiscoveryPage />
      </MemoryRouter>
    );

    await screen.findByText('Pikachu Illustrator');

    const minInput = screen.getByTestId('min-price-input');
    const maxInput = screen.getByTestId('max-price-input');

    await user.type(minInput, '500');
    await user.type(maxInput, '100');

    // Check inline error
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Min price cannot be greater than Max price');

    // Apply button should be disabled
    const applyButton = screen.getByRole('button', { name: 'Apply Filters' });
    expect(applyButton).toBeDisabled();
  });

  it('displays empty state when no cards match filters', async () => {
    vi.mocked(listingDiscoveryApi.getListings).mockResolvedValue({
      items: [],
      pageNumber: 0,
      pageSize: 12,
      totalElements: 0,
      totalPages: 1,
      last: true,
    });

    render(
      <MemoryRouter>
        <CardDiscoveryPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('No cards found')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear All Filters' })).toBeInTheDocument();
  });

  it('displays error state with retry button when API fails', async () => {
    const user = userEvent.setup();
    vi.mocked(listingDiscoveryApi.getListings).mockRejectedValueOnce(new Error('Network error'));

    render(
      <MemoryRouter>
        <CardDiscoveryPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Unable to Load Cards')).toBeInTheDocument();
    const retryButton = screen.getByRole('button', { name: /retry/i });
    expect(retryButton).toBeInTheDocument();

    // When clicking Retry, resolves with items
    vi.mocked(listingDiscoveryApi.getListings).mockResolvedValueOnce({
      items: mockItems,
      pageNumber: 0,
      pageSize: 12,
      totalElements: 2,
      totalPages: 1,
      last: true,
    });

    await user.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('Pikachu Illustrator')).toBeInTheDocument();
    });
  });
});
