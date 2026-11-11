import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminWeeklyReportsPage } from './AdminWeeklyReportsPage';
import { weeklyReports, type WeeklyReport } from '../api/weeklyReports';

vi.mock('../api/weeklyReports', () => ({ weeklyReports: { history: vi.fn(), get: vi.fn(), download: vi.fn() } }));
const report: WeeklyReport = {
  weekEndDate: '2026-11-08', periodStart: '2026-11-01T23:59:00', periodEnd: '2026-11-08T23:59:00', generatedAt: '2026-11-09T00:00:00',
  stockAdded: 20, stockRemoved: 2, unitsSold: 2, inventoryUnits: 18, totalInventoryValue: 1800, inventoryCost: 1000,
  revenue: 200, grossProfit: 80, totalFeesCollected: 10,
  topByRevenue: [{ cardId: 'test-card', name: 'Pikachu', unitsSold: 2, revenue: 200, grossProfit: 80 }],
  topByProfit: [{ cardId: 'test-card', name: 'Pikachu', unitsSold: 2, revenue: 200, grossProfit: 80 }],
  stagnantListings: 0, stagnantUnits: 0, stagnantValue: 0, stagnantInventory: [],
};
const history = { content: [{ weekEndDate: report.weekEndDate, generatedAt: report.generatedAt, totalInventoryValue: 1800, totalFeesCollected: 10 }], number: 0, size: 20, totalElements: 1, totalPages: 1, trackingSince: '2026-11-01T23:59:00' };

describe('AdminWeeklyReportsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(weeklyReports.history).mockResolvedValue(history);
    vi.mocked(weeklyReports.get).mockResolvedValue(report);
    vi.mocked(weeklyReports.download).mockResolvedValue(undefined);
  });

  it('shows loading and disables export until a real saved report is loaded', () => {
    vi.mocked(weeklyReports.history).mockReturnValue(new Promise(() => {}));
    render(<AdminWeeklyReportsPage />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading report history');
    expect(screen.getByRole('button', { name: 'Export CSV' })).toBeDisabled();
  });

  it('displays all four dimensions and exports the selected saved report', async () => {
    render(<AdminWeeklyReportsPage />);
    expect(await screen.findByText('Inventory retail value')).toBeInTheDocument();
    expect(screen.getByText('Recorded platform fees')).toBeInTheDocument();
    expect(screen.getAllByText('Pikachu')).toHaveLength(2);
    expect(screen.getByText('No stagnant inventory in this period.')).toBeInTheDocument();
    expect(weeklyReports.get).toHaveBeenCalledWith('2026-11-08', expect.any(AbortSignal));
    await userEvent.click(screen.getByRole('button', { name: 'Export CSV' }));
    expect(weeklyReports.download).toHaveBeenCalledWith('2026-11-08');
  });

  it('shows an explicit empty state without inventing results', async () => {
    vi.mocked(weeklyReports.history).mockResolvedValue({ ...history, content: [], totalElements: 0, totalPages: 0 });
    render(<AdminWeeklyReportsPage />);
    expect(await screen.findByText('No completed weekly reports yet')).toBeInTheDocument();
    expect(weeklyReports.get).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Export CSV' })).toBeDisabled();
  });

  it.each([401, 403, 500])('shows an actionable history error for HTTP %s', async status => {
    vi.mocked(weeklyReports.history).mockRejectedValueOnce({ response: { status } });
    render(<AdminWeeklyReportsPage />);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(status === 401 ? 'session has expired' : status === 403 ? 'Only administrators' : 'Could not load');
    expect(screen.queryByText('No completed weekly reports yet')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Inventory retail value')).toBeInTheDocument();
  });

  it('does not show success data when the selected report fails', async () => {
    vi.mocked(weeklyReports.get).mockRejectedValueOnce({ response: { status: 404 } });
    render(<AdminWeeklyReportsPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent('saved report is not available');
    expect(screen.queryByText('Inventory retail value')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export CSV' })).toBeDisabled();
  });

  it('loads older history pages and fetches the selected historical week', async () => {
    vi.mocked(weeklyReports.history).mockResolvedValueOnce({ ...history, totalPages: 2, totalElements: 21 });
    render(<AdminWeeklyReportsPage />);
    await screen.findByText('Inventory retail value');
    vi.mocked(weeklyReports.history).mockResolvedValueOnce({ ...history, number: 1, totalPages: 2, totalElements: 21, content: [{ ...history.content[0], weekEndDate: '2026-11-01' }] });
    vi.mocked(weeklyReports.get).mockResolvedValueOnce({ ...report, weekEndDate: '2026-11-01' });
    await userEvent.click(screen.getByRole('button', { name: 'Older reports' }));
    await waitFor(() => expect(weeklyReports.get).toHaveBeenLastCalledWith('2026-11-01', expect.any(AbortSignal)));
    expect(weeklyReports.history).toHaveBeenLastCalledWith(1, expect.any(AbortSignal));
  });

  it('reports export failure without losing the saved report', async () => {
    vi.mocked(weeklyReports.download).mockRejectedValueOnce(new Error('network'));
    render(<AdminWeeklyReportsPage />);
    await screen.findByText('Inventory retail value');
    await userEvent.click(screen.getByRole('button', { name: 'Export CSV' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Export failed');
    expect(screen.getByText('Inventory retail value')).toBeInTheDocument();
  });

  it('shows genuine zero-sales results separately from missing history', async () => {
    vi.mocked(weeklyReports.get).mockResolvedValue({ ...report, unitsSold: 0, topByRevenue: [], topByProfit: [] });
    render(<AdminWeeklyReportsPage />);
    expect(await screen.findAllByText('No fulfilled sales in this period.')).toHaveLength(2);
    expect(screen.queryByText('No completed weekly reports yet')).not.toBeInTheDocument();
  });

  it('ignores stale requests after navigating away', async () => {
    let resolve!: (value: WeeklyReport) => void;
    vi.mocked(weeklyReports.get).mockReturnValueOnce(new Promise(r => { resolve = r; }));
    const { unmount } = render(<AdminWeeklyReportsPage />);
    await screen.findByText('Loading saved report…');
    await waitFor(() => expect(weeklyReports.get).toHaveBeenCalled());
    const signal = vi.mocked(weeklyReports.get).mock.calls[0][1]!;
    unmount(); resolve(report);
    expect(signal.aborted).toBe(true);
  });
});
