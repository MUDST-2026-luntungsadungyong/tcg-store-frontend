import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BuyerAuctionDetail } from '../api/auctions';
import { buyerAuctionApi, defaultCaseApi } from '../api/auctions';
import { BuyerAuctionDetailPage } from './BuyerAuctionDetailPage';

let mockCurrentUser: { id: string; fullName: string } | null = null;

vi.mock('@/features/auth/model/useAuthStore', () => ({
  useAuthStore: (select: (state: { user: typeof mockCurrentUser }) => unknown) =>
    select({ user: mockCurrentUser }),
}));

const baseAuction: BuyerAuctionDetail = {
  id: 42,
  cardName: 'Charizard Base Set',
  setName: 'Base Set',
  imageUrl: 'https://example.com/charizard.png',
  frontImageUrl: null,
  backImageUrl: null,
  condition: 'NM',
  gradingCompany: null,
  grade: null,
  certNumber: null,
  certVerificationUrl: null,
  startPrice: 1000,
  currentPrice: 4000,
  buyItNowPrice: 4000,
  nextMinimumBid: 4100,
  bidCount: 5,
  status: 'AWAITING_BUYER_CONTACT',
  startAt: new Date(Date.now() - 3600000).toISOString(),
  endAt: new Date(Date.now() - 60000).toISOString(),
  isReserveMet: true,
  isWatching: false,
  serverTime: new Date().toISOString(),
  sellerName: 'ProSeller',
  sellerId: 10,
  sellerRating: 5,
  sellerCompletedAuctions: 20,
  winnerId: 99,
  winningBid: 4000,
  orderId: 101,
  quantity: 1,
};

function renderPage(auctionId = 42) {
  return render(
    <MemoryRouter initialEntries={[`/auctions/${auctionId}`]}>
      <Routes>
        <Route path="/auctions/:auctionId" element={<BuyerAuctionDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('BuyerAuctionDetailPage (Person 1: Auction Rules & Bid Flow)', () => {
  beforeEach(() => {
    vi.spyOn(defaultCaseApi, 'penalty').mockResolvedValue({ activeStrikes: 0, bannedUntil: null });
    vi.spyOn(buyerAuctionApi, 'bids').mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    mockCurrentUser = null;
  });

  it('blocks bidding and buyout when the buyer is banned', async () => {
    mockCurrentUser = { id: '99', fullName: 'Buyer' };
    vi.mocked(defaultCaseApi.penalty).mockResolvedValue({ activeStrikes: 2, bannedUntil: new Date(Date.now() + 86400000).toISOString() });
    vi.spyOn(buyerAuctionApi, 'detail').mockResolvedValue({ ...baseAuction, status: 'ACTIVE', currentPrice: 3000, endAt: new Date(Date.now() + 3600000).toISOString() });
    renderPage();
    expect(await screen.findByText(/Auction participation is suspended/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /ซื้อทันที/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'เสนอราคา' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'ตั้งราคาสูงสุด' })).not.toBeInTheDocument();
  });

  it('displays Buy It Now price clearly', async () => {
    mockCurrentUser = { id: '99', fullName: 'Winner Buyer' };
    vi.spyOn(buyerAuctionApi, 'detail').mockResolvedValue({
      ...baseAuction,
      status: 'ACTIVE',
      endAt: new Date(Date.now() + 3600000).toISOString(),
    });

    renderPage();

    expect(await screen.findByTestId('buy-it-now-display')).toBeInTheDocument();
    expect(screen.getByTestId('buy-it-now-display')).toHaveTextContent(/4,000/);
  });

  it('shows winning banner for the winner: "Auction ended — You won at ฿4,000" and hides bidding controls', async () => {
    mockCurrentUser = { id: '99', fullName: 'Winner Buyer' };
    vi.spyOn(buyerAuctionApi, 'detail').mockResolvedValue(baseAuction);

    renderPage();

    const banner = await screen.findByTestId('winning-result-banner');
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveTextContent(/Auction ended — You won at .*4,000/);

    // Bidding controls must be hidden
    expect(screen.queryByLabelText(/ราคาเสนอ/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/ราคาสูงสุด/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'เสนอราคา' })).not.toBeInTheDocument();
  });

  it('shows winning banner for non-winning buyers: "Auction ended — Won at ฿4,000"', async () => {
    mockCurrentUser = { id: '77', fullName: 'Other Buyer' };
    vi.spyOn(buyerAuctionApi, 'detail').mockResolvedValue(baseAuction);

    renderPage();

    const banner = await screen.findByTestId('winning-result-banner');
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveTextContent(/Auction ended — Won at .*4,000/);
    expect(banner).not.toHaveTextContent('You won');
  });

  it('renders Seller Order Management button ONLY for seller when auction has winner/order', async () => {
    // Current user is the seller (sellerId = 10)
    mockCurrentUser = { id: '10', fullName: 'ProSeller' };
    vi.spyOn(buyerAuctionApi, 'detail').mockResolvedValue(baseAuction);

    renderPage();

    const sellerBtn = await screen.findByRole('link', { name: 'Seller Order Management' });
    expect(sellerBtn).toBeInTheDocument();
    expect(sellerBtn).toHaveAttribute('href', '/workspace/orders?orderId=101');
  });

  it('NEVER shows Seller Order Management button to buyers or visitors', async () => {
    // 1. Buyer
    mockCurrentUser = { id: '99', fullName: 'Winner Buyer' };
    vi.spyOn(buyerAuctionApi, 'detail').mockResolvedValue(baseAuction);

    const { unmount } = renderPage();
    await screen.findByTestId('winning-result-banner');
    expect(screen.queryByRole('link', { name: 'Seller Order Management' })).not.toBeInTheDocument();
    unmount();

    // 2. Visitor (not logged in)
    mockCurrentUser = null;
    renderPage();
    await screen.findByTestId('winning-result-banner');
    expect(screen.queryByRole('link', { name: 'Seller Order Management' })).not.toBeInTheDocument();
  });

  it('does NOT show Seller Order Management button if seller visits an active auction with no winner/order', async () => {
    mockCurrentUser = { id: '10', fullName: 'ProSeller' };
    vi.spyOn(buyerAuctionApi, 'detail').mockResolvedValue({
      ...baseAuction,
      status: 'ACTIVE',
      endAt: new Date(Date.now() + 3600000).toISOString(),
      winnerId: null,
      winningBid: null,
      orderId: null,
    });

    renderPage();

    await screen.findByTestId('buy-it-now-display');
    expect(screen.queryByRole('link', { name: 'Seller Order Management' })).not.toBeInTheDocument();
  });
});
