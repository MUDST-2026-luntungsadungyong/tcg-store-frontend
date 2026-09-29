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
    condition: 'NM',
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
    condition: 'LP',
  },
];

describe('CardDiscoveryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders products and filters only after clicking search', async () => {
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

    // Verify products render and condition abbreviation 'NM' is displayed as 'Near Mint'
    expect(await screen.findByText('Pikachu Illustrator')).toBeInTheDocument();
    expect(screen.getByText('Near Mint')).toBeInTheDocument();
    expect(screen.getByText('Charizard VMAX')).toBeInTheDocument();
    expect(screen.getByText('Lightly Played')).toBeInTheDocument();

    // Verify out of stock badge
    expect(screen.getByText('OUT OF STOCK')).toBeInTheDocument();

    // Type in search input (should NOT filter immediately)
    const searchInput = screen.getByTestId('search-input');
    await user.type(searchInput, 'Pikachu');

    // Both cards should still be visible before clicking Search
    expect(screen.getByText('Pikachu Illustrator')).toBeInTheDocument();
    expect(screen.getByText('Charizard VMAX')).toBeInTheDocument();

    // Click search button
    const searchButton = screen.getByTestId('search-button');
    await user.click(searchButton);

    // Only Pikachu should be visible after searching
    expect(screen.getByText('Pikachu Illustrator')).toBeInTheDocument();
    expect(screen.queryByText('Charizard VMAX')).not.toBeInTheDocument();
  });

  it('applies search when user presses Enter in the search input', async () => {
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

    const searchInput = screen.getByTestId('search-input');
    await user.type(searchInput, 'Charizard{enter}');

    expect(screen.getByText('Charizard VMAX')).toBeInTheDocument();
    expect(screen.queryByText('Pikachu Illustrator')).not.toBeInTheDocument();
  });

  it('filters by condition abbreviation when user selects full name and clicks search', async () => {
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

    // Open Condition filter dropdown
    const conditionButton = screen.getByRole('button', { name: /Condition:/i });
    await user.click(conditionButton);

    // Click 'Near Mint' option
    const nearMintOption = screen.getByRole('button', { name: 'Near Mint' });
    await user.click(nearMintOption);

    // Before clicking Search, both items remain visible
    expect(screen.getByText('Pikachu Illustrator')).toBeInTheDocument();
    expect(screen.getByText('Charizard VMAX')).toBeInTheDocument();

    // Click Search / Apply Filters button
    const applyButton = screen.getByRole('button', { name: 'Apply Filters' });
    await user.click(applyButton);

    // API should be called with standard DB abbreviation 'NM'
    expect(listingDiscoveryApi.getListings).toHaveBeenCalledWith(
      expect.objectContaining({ condition: 'NM' })
    );

    // Client-side filter should show Pikachu (NM) and hide Charizard (LP)
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

  it('restricts min and max price inputs to at most 10 digits', async () => {
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

    expect(minInput).toHaveAttribute('maxLength', '10');
    expect(maxInput).toHaveAttribute('maxLength', '10');

    // Type 12 digits
    await user.type(minInput, '123456789012');
    expect(minInput).toHaveValue('1234567890');

    await user.type(maxInput, '987654321098');
    expect(maxInput).toHaveValue('9876543210');
  });

  it('renders in-stock toggle before the search button and filters only after search is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(listingDiscoveryApi.getListings).mockResolvedValue({
      items: [
        { ...mockItems[0], stock: 0 },
        { ...mockItems[1], stock: 5 },
      ],
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

    const inStockCheckbox = screen.getByRole('checkbox', { name: /in stock only/i });
    const applyButton = screen.getByRole('button', { name: 'Apply Filters' });

    // In Stock toggle should appear before the Search/Apply Filters button in DOM order
    expect(
      Boolean(inStockCheckbox.compareDocumentPosition(applyButton) & Node.DOCUMENT_POSITION_FOLLOWING)
    ).toBe(true);

    // Toggle In Stock Only
    await user.click(inStockCheckbox);

    // Both cards should still be visible before clicking Search
    expect(screen.getByText('Pikachu Illustrator')).toBeInTheDocument();
    expect(screen.getByText('Charizard VMAX')).toBeInTheDocument();

    // Click Search / Apply Filters
    await user.click(applyButton);

    // Out-of-stock card should now be filtered out
    expect(screen.queryByText('Pikachu Illustrator')).not.toBeInTheDocument();
    expect(screen.getByText('Charizard VMAX')).toBeInTheDocument();
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

  it('keeps hidden listings out of buyer discovery while showing out-of-stock cards', async () => {
    vi.mocked(listingDiscoveryApi.getListings).mockResolvedValue({
      items: [
        {
          ...mockItems[0],
          status: 'SHOW',
          stock: 0,
        },
        {
          ...mockItems[1],
          id: 'hidden-listing',
          name: 'Hidden Blastoise',
          status: 'HIDE',
          stock: 8,
        },
      ],
      pageNumber: 0,
      pageSize: 12,
      totalElements: 2,
      totalPages: 1,
      last: true,
    });

    render(
      <MemoryRouter>
        <CardDiscoveryPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Pikachu Illustrator')).toBeInTheDocument();
    expect(screen.getByText('OUT OF STOCK')).toBeInTheDocument();
    expect(screen.queryByText('Hidden Blastoise')).not.toBeInTheDocument();
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
