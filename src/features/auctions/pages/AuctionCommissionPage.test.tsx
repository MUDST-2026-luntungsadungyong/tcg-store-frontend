import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { auctionCommissionApi, type AuctionCommissionPolicy } from '../api/auctions';
import { AuctionCommissionPage } from './AuctionCommissionPage';

const mockPolicy: AuctionCommissionPolicy = {
  rate: 0.05,
  minimumFee: 20.0,
};

describe('AuctionCommissionPage (US-18-2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading state initially while fetching commission policy', () => {
    vi.spyOn(auctionCommissionApi, 'get').mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter>
        <AuctionCommissionPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('status')).toHaveTextContent(/Loading policy/i);
  });

  it('displays commission rate, minimum fee, KPI summary cards, and live simulator once loaded', async () => {
    vi.spyOn(auctionCommissionApi, 'get').mockResolvedValue(mockPolicy);

    render(
      <MemoryRouter>
        <AuctionCommissionPage />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: /Auction Commission/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Commission rate \(%\)/i)).toHaveValue(5);
    expect(screen.getByLabelText(/Minimum fee \(THB\)/i)).toHaveValue(20);
    expect(screen.getByText(/Live Settlement Simulator/i)).toBeInTheDocument();
    expect(screen.getByText(/Seller net payout/i)).toBeInTheDocument();
  });

  it('updates policy on submit and displays confirmation message', async () => {
    const user = userEvent.setup();
    vi.spyOn(auctionCommissionApi, 'get').mockResolvedValue(mockPolicy);
    const updateSpy = vi.spyOn(auctionCommissionApi, 'update').mockResolvedValue({
      rate: 0.07,
      minimumFee: 30.0,
    });

    render(
      <MemoryRouter>
        <AuctionCommissionPage />
      </MemoryRouter>
    );

    const rateInput = await screen.findByLabelText(/Commission rate \(%\)/i);
    const minFeeInput = screen.getByLabelText(/Minimum fee \(THB\)/i);

    await user.clear(rateInput);
    await user.type(rateInput, '7');
    await user.clear(minFeeInput);
    await user.type(minFeeInput, '30');

    await user.click(screen.getByRole('button', { name: /Save policy/i }));

    expect(updateSpy).toHaveBeenCalledWith({
      rate: 0.07,
      minimumFee: 30,
    });
    expect(await screen.findByText('Commission policy saved.')).toBeInTheDocument();
  });

  it('supports quick rate presets and resets unsaved draft changes', async () => {
    const user = userEvent.setup();
    vi.spyOn(auctionCommissionApi, 'get').mockResolvedValue(mockPolicy);

    render(
      <MemoryRouter>
        <AuctionCommissionPage />
      </MemoryRouter>
    );

    const rateInput = await screen.findByLabelText(/Commission rate \(%\)/i);
    expect(rateInput).toHaveValue(5);

    await user.click(screen.getByRole('button', { name: /3%/i }));
    expect(rateInput).toHaveValue(3);

    await user.click(screen.getByRole('button', { name: /Reset/i }));
    expect(rateInput).toHaveValue(5);
  });

  it('shows error message when loading policy fails with a retry option', async () => {
    const user = userEvent.setup();
    const getSpy = vi.spyOn(auctionCommissionApi, 'get').mockRejectedValueOnce(new Error('Connection failure'));

    render(
      <MemoryRouter>
        <AuctionCommissionPage />
      </MemoryRouter>
    );

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Could not load the commission policy/i)).toBeInTheDocument();

    getSpy.mockResolvedValueOnce(mockPolicy);
    await user.click(screen.getByRole('button', { name: /Retry/i }));

    expect(await screen.findByLabelText(/Commission rate \(%\)/i)).toBeInTheDocument();
  });
});
