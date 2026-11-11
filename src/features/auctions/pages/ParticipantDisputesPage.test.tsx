import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { get } = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('@/shared/api/client', () => ({ default: { get, post: vi.fn() } }));

import { ParticipantDisputesPage } from './ParticipantDisputesPage';

const firstDispute = {
  id: 7,
  auctionId: 70,
  orderId: 700,
  reason: 'The item did not arrive.',
  status: 'PENDING',
  createdAt: '2026-09-20T10:00:00',
  decisionReason: null,
  evidenceUrls: [],
};
const secondDispute = { ...firstDispute, id: 42, auctionId: 420, orderId: 4200, reason: 'The item was damaged.' };
const listPage = { content: [firstDispute], totalPages: 2 };

function renderPage(path = '/auction-disputes') {
  return render(<MemoryRouter initialEntries={[path]}><Routes><Route path="/auction-disputes" element={<ParticipantDisputesPage />} /></Routes></MemoryRouter>);
}

describe('ParticipantDisputesPage deep links', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    get.mockImplementation((path: string) => {
      if (path === '/auction-disputes/me') return Promise.resolve({ data: listPage });
      if (path === '/auction-disputes/42') return Promise.resolve({ data: secondDispute });
      return Promise.reject(new Error('not found'));
    });
  });

  it('loads a dispute by ID across pagination and focuses and highlights it', async () => {
    renderPage('/auction-disputes?disputeId=42');

    const target = await screen.findByRole('region', { name: 'Dispute 42, opened from notification' });
    expect(target).toHaveTextContent('The item was damaged.');
    expect(target).toHaveClass('border-brand-blue');
    await waitFor(() => expect(document.activeElement).toBe(target));
    expect(get).toHaveBeenCalledWith('/auction-disputes/42');
    expect(screen.getByText('The item did not arrive.')).toBeInTheDocument();
  });

  it('does not render the same dispute twice when it is already on the current page', async () => {
    get.mockImplementation((path: string) => path === '/auction-disputes/me'
      ? Promise.resolve({ data: { content: [secondDispute], totalPages: 1 } })
      : Promise.resolve({ data: secondDispute }));
    renderPage('/auction-disputes?disputeId=42');

    await screen.findByRole('region', { name: 'Dispute 42, opened from notification' });
    expect(screen.getAllByText('Dispute #42 · Auction #420')).toHaveLength(1);
  });

  it('keeps the dispute list available for a malformed dispute ID', async () => {
    renderPage('/auction-disputes?disputeId=not-a-number');

    expect(await screen.findByRole('status')).toHaveTextContent('This dispute link is invalid');
    expect(await screen.findByText('The item did not arrive.')).toBeInTheDocument();
    expect(get).not.toHaveBeenCalledWith('/auction-disputes/NaN');
  });

  it('keeps the dispute list available when the linked case is missing or inaccessible', async () => {
    get.mockImplementation((path: string) => path === '/auction-disputes/me'
      ? Promise.resolve({ data: listPage })
      : Promise.reject(new Error('not found')));
    renderPage('/auction-disputes?disputeId=999');

    expect(await screen.findByText('Could not load dispute #999. Your other disputes are still available below.')).toBeInTheDocument();
    expect(await screen.findByText('The item did not arrive.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();
  });
});
