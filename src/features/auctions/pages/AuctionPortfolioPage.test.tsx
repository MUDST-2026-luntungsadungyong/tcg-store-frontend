import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buyerAuctionApi } from '../api/auctions';
import { AuctionPortfolioPage } from './AuctionPortfolioPage';

let mockUser: { id: string } | null = { id: 'buyer' };

vi.mock('@/features/auth/model/useAuthStore', () => ({
  useAuthStore: (select: (state: { user: { id: string } | null }) => unknown) => select({ user: mockUser }),
}));

describe('AuctionPortfolioPage (US-18-3)', () => {
  beforeEach(() => {
    mockUser = { id: 'buyer' };
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prompts user to log in when not authenticated', () => {
    mockUser = null;
    render(
      <MemoryRouter>
        <AuctionPortfolioPage />
      </MemoryRouter>
    );

    expect(screen.getByText('พอร์ตการประมูลของฉัน')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'เข้าสู่ระบบเพื่อดูพอร์ตและ Watchlist' })).toHaveAttribute('href', '/login');
  });

  it('directs a winning buyer to contact the seller and does not expose a payment-proof upload', async () => {
    vi.spyOn(buyerAuctionApi, 'portfolio').mockImplementation(async () => ({
      bidsPlaced: 1,
      auctionsWon: 1,
      winRatePercent: 100,
      totalInvested: 3001,
      badges: ['Master Bidder'],
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

    render(
      <MemoryRouter>
        <AuctionPortfolioPage />
      </MemoryRouter>
    );

    const lot = within(await screen.findByRole('article'));
    expect(await lot.findByText('กรุณาติดต่อร้านค้าเพื่อดำเนินการชำระเงินและจัดส่ง')).toBeInTheDocument();
    expect(lot.getByRole('link', { name: 'AUC-42' })).toHaveAttribute('href', '/orders/42');
    expect(screen.queryByText(/หลักฐานการชำระเงิน/)).not.toBeInTheDocument();
    expect(screen.getByText('🏆 Master Bidder')).toBeInTheDocument();
  });

  it('renders portfolio stats cards and badge progress when user has no badges', async () => {
    vi.spyOn(buyerAuctionApi, 'portfolio').mockResolvedValue({
      bidsPlaced: 5,
      auctionsWon: 1,
      winRatePercent: 20,
      totalInvested: 1500,
      badges: [],
      wonItems: [],
    });
    vi.spyOn(buyerAuctionApi, 'watchlist').mockResolvedValue([]);
    vi.spyOn(buyerAuctionApi, 'secondChanceOffers').mockResolvedValue([]);

    render(
      <MemoryRouter>
        <AuctionPortfolioPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('การเสนอราคา')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('ชนะประมูล')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('อัตราชนะ')).toBeInTheDocument();
    expect(screen.getByText('20%')).toBeInTheDocument();
    expect(screen.getByText(/เป้าหมายตราเกียรติยศ: ชนะประมูลอีก 2 ครั้งเพื่อปลดล็อกตรา Master Bidder/i)).toBeInTheDocument();
  });

  it('displays empty state with exploration CTA when bidsPlaced is 0', async () => {
    vi.spyOn(buyerAuctionApi, 'portfolio').mockResolvedValue({
      bidsPlaced: 0,
      auctionsWon: 0,
      winRatePercent: 0,
      totalInvested: 0,
      badges: [],
      wonItems: [],
    });
    vi.spyOn(buyerAuctionApi, 'watchlist').mockResolvedValue([]);
    vi.spyOn(buyerAuctionApi, 'secondChanceOffers').mockResolvedValue([]);

    render(
      <MemoryRouter>
        <AuctionPortfolioPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('คุณยังไม่เคยเข้าร่วมการประมูลการ์ดในระบบ')).toBeInTheDocument();
    const exploreBtn = screen.getByRole('link', { name: 'สำรวจห้องประมูลการ์ด' });
    expect(exploreBtn).toHaveAttribute('href', '/auctions');
  });

  it('allows interacting with watchlist items (unfollowing)', async () => {
    const user = userEvent.setup();
    vi.spyOn(buyerAuctionApi, 'portfolio').mockResolvedValue({
      bidsPlaced: 1,
      auctionsWon: 0,
      winRatePercent: 0,
      totalInvested: 0,
      badges: [],
      wonItems: [],
    });
    vi.spyOn(buyerAuctionApi, 'watchlist').mockResolvedValue([
      {
        id: 99,
        cardName: 'Charizard VMAX',
        currentPrice: 8500,
        endTime: new Date().toISOString(),
      } as any,
    ]);
    vi.spyOn(buyerAuctionApi, 'secondChanceOffers').mockResolvedValue([]);
    const toggleSpy = vi.spyOn(buyerAuctionApi, 'toggleWatch').mockResolvedValue({ watching: false } as any);

    render(
      <MemoryRouter>
        <AuctionPortfolioPage />
      </MemoryRouter>
    );

    expect(await screen.findByText(/Charizard VMAX/)).toBeInTheDocument();
    const unfollowBtn = screen.getByRole('button', { name: 'เลิกติดตาม' });
    await user.click(unfollowBtn);

    expect(toggleSpy).toHaveBeenCalledWith(99);
  });
});
