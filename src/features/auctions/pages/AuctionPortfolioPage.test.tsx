import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { buyerAuctionApi } from '../api/auctions';
import { AuctionPortfolioPage } from './AuctionPortfolioPage';

vi.mock('@/features/auth/model/useAuthStore', () => ({
  useAuthStore: (select: (state: { user: { id: string } }) => unknown) => select({ user: { id: 'buyer' } }),
}));

afterEach(() => vi.restoreAllMocks());

it('directs a winning buyer to contact the seller and does not expose a payment-proof upload', async () => {
  vi.spyOn(buyerAuctionApi, 'portfolio').mockImplementation(async () => ({
    bidsPlaced: 1,
    auctionsWon: 1,
    winRatePercent: 100,
    totalInvested: 0,
    badges: [],
    wonItems: [{
      auctionId: 12,
      orderId: 42,
      orderNumber: 'AUC-42',
      orderStatus: 'AWAITING_BUYER_CONTACT',
      cardName: 'Pikachu',
      finalPrice: 3001,
      isPaid: false,
      quantity: 3,
    }],
  }));
  vi.spyOn(buyerAuctionApi, 'watchlist').mockResolvedValue([]);
  vi.spyOn(buyerAuctionApi, 'secondChanceOffers').mockResolvedValue([]);
  render(<MemoryRouter><AuctionPortfolioPage /></MemoryRouter>);
  const lot = within(await screen.findByRole('article'));
  expect(await lot.findByText('กรุณาติดต่อร้านค้าเพื่อดำเนินการชำระเงินและจัดส่ง')).toBeInTheDocument();
  expect(lot.getByRole('link', { name: 'AUC-42' })).toHaveAttribute('href', '/orders/42');
  expect(screen.queryByText(/หลักฐานการชำระเงิน/)).not.toBeInTheDocument();
});
