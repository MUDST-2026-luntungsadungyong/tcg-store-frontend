import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HomePage } from './HomePage';
import { listingDiscoveryApi } from '@/features/discovery/api/listings';
import { getTopCollectors } from '@/features/collection/api/leaderboard';

vi.mock('@/features/discovery/api/listings', () => ({
  listingDiscoveryApi: {
    getListings: vi.fn(),
  },
}));

vi.mock('@/features/collection/api/leaderboard', () => ({
  getTopCollectors: vi.fn(),
}));

describe('HomePage banner carousel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(listingDiscoveryApi.getListings).mockResolvedValue({
      items: [],
      pageNumber: 0,
      pageSize: 100,
      totalElements: 0,
      totalPages: 0,
      last: true,
    });
    vi.mocked(getTopCollectors).mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('shows one story at a time and keeps the hero preview in sync every five seconds', async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    await act(async () => {
      await Promise.resolve();
    });
    const story = screen.getByTestId('editorial-banner');
    const preview = screen.getByTestId('hero-banner-preview');
    expect(story).toHaveAttribute('data-banner-id', 'pokemon-30th-celebration');
    expect(preview).toHaveAttribute('data-banner-id', 'pokemon-30th-celebration');

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByTestId('editorial-banner')).toHaveAttribute('data-banner-id', 'marketplace-highlights');
    expect(screen.getByTestId('hero-banner-preview')).toHaveAttribute('data-banner-id', 'marketplace-highlights');
  });

  it('supports manual next navigation while preserving the shared active index', async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );
    await act(async () => {
      await Promise.resolve();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Next story' }));

    expect(screen.getByTestId('editorial-banner')).toHaveAttribute('data-banner-id', 'marketplace-highlights');
    expect(screen.getByTestId('hero-banner-preview')).toHaveAttribute('data-banner-id', 'marketplace-highlights');
  });
});
