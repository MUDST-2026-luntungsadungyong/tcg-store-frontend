import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  stockForecastApi,
  StockForecastError,
  type StockForecastResponse,
} from '@/features/listings/api/stockForecast';

import { StockForecastPage } from './StockForecastPage';

function ForecastSearchSwitcher() {
  const navigate = useNavigate();
  return <button type="button" onClick={() => navigate('/workspace/stock-forecast?search=Mewtwo')}>Search Mewtwo</button>;
}

vi.mock('@/features/listings/api/stockForecast', async () => {
  const actual = await vi.importActual<typeof import('@/features/listings/api/stockForecast')>(
    '@/features/listings/api/stockForecast',
  );

  return {
    ...actual,
    stockForecastApi: {
      getForecast: vi.fn(),
    },
  };
});

const sampleResponse: StockForecastResponse = {
  windowDays: 30,
  method: 'WEIGHTED',
  leadTimeDays: 7,
  safetyDays: 3,
  targetCoverDays: 30,
  includeHidden: false,
  generatedAt: '2026-11-12',
  summary: {
    totalSkus: 2,
    outOfStockCount: 0,
    criticalCount: 1,
    lowCount: 0,
    safeCount: 0,
    noRecentSalesCount: 1,
  },
  items: [
    {
      productId: '1',
      cardId: 'base1-4',
      name: 'Charizard',
      game: 'Pokemon',
      set: 'Base Set',
      rarity: 'Rare Holo',
      condition: 'NM',
      language: 'EN',
      image: '/charizard.png',
      status: 'SHOW',
      price: 1200,
      onHand: 5,
      reserved: 1,
      auctionReserved: 0,
      availableStock: 4,
      soldInWindow: 6,
      sold7Days: 6,
      sold14Days: 6,
      sold30Days: 6,
      dailySalesRate: 0.6,
      daysUntilStockout: 6,
      estimatedStockoutDate: '2026-11-18',
      reorderPoint: 6,
      suggestedRestockQty: 14,
      urgencyStatus: 'CRITICAL',
    },
    {
      productId: '2',
      cardId: 'base1-10',
      name: 'Mewtwo',
      game: 'Pokemon',
      set: 'Base Set',
      rarity: 'Rare Holo',
      condition: 'NM',
      language: 'EN',
      image: '/mewtwo.png',
      status: 'SHOW',
      price: 850,
      onHand: 3,
      reserved: 0,
      auctionReserved: 0,
      availableStock: 3,
      soldInWindow: 0,
      sold7Days: 0,
      sold14Days: 0,
      sold30Days: 0,
      dailySalesRate: 0,
      daysUntilStockout: null,
      estimatedStockoutDate: null,
      reorderPoint: 0,
      suggestedRestockQty: 0,
      urgencyStatus: 'NO_RECENT_SALES',
    },
  ],
};

describe('StockForecastPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders forecast summary, items, and formula breakdown modal', async () => {
    const user = userEvent.setup();
    vi.mocked(stockForecastApi.getForecast).mockResolvedValue(sampleResponse);

    render(
      <MemoryRouter>
        <StockForecastPage />
      </MemoryRouter>,
    );

    expect(await screen.findAllByText('Charizard')).not.toHaveLength(0);
    expect(screen.getAllByText('6 day(s)').length).toBeGreaterThan(0);
    expect(screen.getAllByText('No recent sales').length).toBeGreaterThan(0);
    expect(screen.getByText('On hand 5 (Hold 1)')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Explain calculation for Charizard' }));
    expect(screen.getByText('Forecast Formula: Charizard')).toBeInTheDocument();
    expect(screen.getByText(/On Hand \(5\)/)).toBeInTheDocument();
  });

  it('loads and syncs notification search terms and shows stock alert help', async () => {
    vi.mocked(stockForecastApi.getForecast).mockResolvedValue(sampleResponse);

    render(
      <MemoryRouter initialEntries={['/workspace/stock-forecast?search=Charizard'] }>
        <Routes>
          <Route path="/workspace/stock-forecast" element={<><ForecastSearchSwitcher /><StockForecastPage /></>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findAllByText('Charizard')).not.toHaveLength(0);
    expect(screen.getByLabelText('Search stock forecast')).toHaveValue('Charizard');
    expect(screen.getByRole('note')).toHaveTextContent('Automatic stock alerts');
    await waitFor(() => {
      expect(vi.mocked(stockForecastApi.getForecast).mock.calls.some(([query]) => query.search === 'Charizard')).toBe(true);
    });

    await userEvent.click(screen.getByRole('button', { name: 'Search Mewtwo' }));
    await waitFor(() => expect(screen.getByLabelText('Search stock forecast')).toHaveValue('Mewtwo'));
    await waitFor(() => {
      expect(vi.mocked(stockForecastApi.getForecast).mock.calls.some(([query]) => query.search === 'Mewtwo')).toBe(true);
    });
  });

  it('shows inline validation error and blocks API call when lead time is invalid', async () => {
    const user = userEvent.setup();
    vi.mocked(stockForecastApi.getForecast).mockResolvedValue(sampleResponse);

    render(
      <MemoryRouter>
        <StockForecastPage />
      </MemoryRouter>,
    );

    await screen.findAllByText('Charizard');
    const callsBefore = vi.mocked(stockForecastApi.getForecast).mock.calls.length;

    const leadTimeInput = screen.getByLabelText('Restock lead time (days)');
    await user.clear(leadTimeInput);
    await user.type(leadTimeInput, '999');

    expect(
      await screen.findByText('Lead time must be a whole number between 0 and 180 days.'),
    ).toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(vi.mocked(stockForecastApi.getForecast).mock.calls.length).toBe(callsBefore);
  });

  it('shows ErrorState on initial failure and retries cleanly', async () => {
    const user = userEvent.setup();
    vi.mocked(stockForecastApi.getForecast)
      .mockRejectedValueOnce(new StockForecastError('SERVER_ERROR', 'Service unavailable'))
      .mockResolvedValueOnce(sampleResponse);

    render(
      <MemoryRouter>
        <StockForecastPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('Service unavailable');

    await user.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => {
      expect(screen.getAllByText('Charizard').length).toBeGreaterThan(0);
    });
  });
});
