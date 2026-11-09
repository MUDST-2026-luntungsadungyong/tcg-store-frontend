import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { buyerAuctionApi } from '../api/auctions';
import { AuctionPortfolioPage } from './AuctionPortfolioPage';

vi.mock('@/features/auth/model/useAuthStore', () => ({
  useAuthStore: (select: (state: { user: { id: string } }) => unknown) => select({ user: { id: 'buyer' } }),
}));

afterEach(() => vi.restoreAllMocks());

it('uploads proof for the winning lot and restores the review status after reloading', async () => {
  const user = userEvent.setup();
  let hasPaymentProof = false;
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
      orderStatus: 'PENDING',
      cardName: 'Pikachu',
      finalPrice: 3001,
      paymentDeadline: new Date(Date.now() + 60_000).toISOString(),
      isPaid: false,
      quantity: 3,
      hasPaymentProof,
    }],
  }));
  vi.spyOn(buyerAuctionApi, 'watchlist').mockResolvedValue([]);
  vi.spyOn(buyerAuctionApi, 'secondChanceOffers').mockResolvedValue([]);
  const submit = vi.spyOn(buyerAuctionApi, 'submitPaymentProof').mockImplementation(async () => {
    hasPaymentProof = true;
  });

  const page = <MemoryRouter><AuctionPortfolioPage /></MemoryRouter>;
  const { unmount } = render(page);
  const lot = within(await screen.findByRole('article'));
  const proof = new File([new Uint8Array(2 * 1024 * 1024)], 'proof.png', { type: 'image/png' });
  const input = lot.getByLabelText<HTMLInputElement>(/หลักฐานการชำระเงิน/);
  await user.upload(input, proof);
  expect(input.files?.[0]).toBe(proof);
  fireEvent.submit(input.form!);

  expect(submit).toHaveBeenCalledWith(42, proof);
  expect(await lot.findByText('ส่งหลักฐานแล้ว รอผู้ขายตรวจ')).toBeInTheDocument();
  unmount();

  render(page);
  expect(await screen.findByText('ส่งหลักฐานแล้ว รอผู้ขายตรวจ')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'ส่งหลักฐาน' })).not.toBeInTheDocument();
});
