import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/features/auth/model/useAuthStore';
import { auctionApi, type SellerAnalytics } from '../api/auctions';
import { AuctionAnalyticsPage } from './AuctionAnalyticsPage';

const mockAnalytics: SellerAnalytics = {
  grossAuctionVolume: 7500,
  totalCost: 4000,
  totalPlatformFee: 375,
  netRealizedProfit: 3125,
  profitMarginPercent: 78.1,
  totalCompletedAuctions: 2,
  items: [
    {
      auctionId: 101,
      cardName: 'Pikachu Illustrator Promo',
      startPrice: 1000,
      finalPrice: 5000,
      costBasis: 2500,
      platformFee: 250,
      netProfit: 2250,
      closedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    },
    {
      auctionId: 102,
      cardName: 'Charizard Base Set 1st Edition',
      startPrice: 1500,
      finalPrice: 2500,
      costBasis: 1500,
      platformFee: 125,
      netProfit: 875,
      closedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(), // 40 days ago
    },
  ],
};

describe('AuctionAnalyticsPage (US-18-1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: {
        id: 'seller-1',
        name: 'Ash Ketchum',
        email: 'ash@pokemon.com',
        role: 'USER',
        isSeller: true,
      },
      token: 'valid-token',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('blocks unverified users with an informative message and link to profile', () => {
    useAuthStore.setState({
      user: {
        id: 'buyer-1',
        name: 'Regular Buyer',
        email: 'buyer@gmail.com',
        role: 'USER',
        isSeller: false,
      },
    });

    render(
      <MemoryRouter>
        <AuctionAnalyticsPage />
      </MemoryRouter>
    );

    expect(
      screen.getByText('หน้านี้สำหรับผู้ขายที่ยืนยันตัวตนแล้วเท่านั้น')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /ไปที่หน้าโปรไฟล์เพื่อขอสิทธิ์ผู้ขาย/i })
    ).toHaveAttribute('href', '/profile');
  });

  it('shows skeleton loading while fetching data', () => {
    vi.spyOn(auctionApi, 'getSellerAnalytics').mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter>
        <AuctionAnalyticsPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('status', { name: /loading analytics/i })).toBeInTheDocument();
  });

  it('shows an error state with a retry button when the API fails', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(auctionApi, 'getSellerAnalytics').mockRejectedValueOnce(new Error('Network error'));

    render(
      <MemoryRouter>
        <AuctionAnalyticsPage />
      </MemoryRouter>
    );

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/เกิดข้อผิดพลาดในการดึงข้อมูลสถิติการเงิน/i)).toBeInTheDocument();

    fetchSpy.mockResolvedValueOnce(mockAnalytics);
    await user.click(screen.getByRole('button', { name: /ลองใหม่อีกครั้ง/i }));

    expect(await screen.findByText('Pikachu Illustrator Promo')).toBeInTheDocument();
  });

  it('displays empty state with a link to create an auction when seller has no completed auctions', async () => {
    vi.spyOn(auctionApi, 'getSellerAnalytics').mockResolvedValue({
      grossAuctionVolume: 0,
      totalCost: 0,
      totalPlatformFee: 0,
      netRealizedProfit: 0,
      profitMarginPercent: 0,
      totalCompletedAuctions: 0,
      items: [],
    });

    render(
      <MemoryRouter>
        <AuctionAnalyticsPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('ยังไม่มีประวัติการประมูลที่สำเร็จ')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /สร้างห้องประมูลใหม่/i })).toHaveAttribute(
      'href',
      '/workspace/auctions/new'
    );
  });

  it('renders KPI metrics and price comparison bars accurately', async () => {
    vi.spyOn(auctionApi, 'getSellerAnalytics').mockResolvedValue(mockAnalytics);

    render(
      <MemoryRouter>
        <AuctionAnalyticsPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Pikachu Illustrator Promo')).toBeInTheDocument();

    // Verify KPI metrics display (under 30d filter, item 1 is included)
    expect(screen.getByText('ยอดประมูลรวม (Gross)')).toBeInTheDocument();
    expect(screen.getByText('ต้นทุนสินค้ารวม (Cost)')).toBeInTheDocument();
    expect(screen.getByText('ค่าธรรมเนียมแพลตฟอร์ม')).toBeInTheDocument();
    expect(screen.getByText('กำไรสุทธิ (Net Profit)')).toBeInTheDocument();

    // Comparison labels
    expect(screen.getAllByText('ราคาเปิด:').length).toBeGreaterThan(0);
    expect(screen.getAllByText('ราคาจบจริง:').length).toBeGreaterThan(0);
  });

  it('filters data dynamically when changing period to 7d or all', async () => {
    const user = userEvent.setup();
    vi.spyOn(auctionApi, 'getSellerAnalytics').mockResolvedValue(mockAnalytics);

    render(
      <MemoryRouter>
        <AuctionAnalyticsPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Pikachu Illustrator Promo')).toBeInTheDocument();

    // Under 30d, Charizard (40 days ago) is not visible
    expect(screen.queryByText('Charizard Base Set 1st Edition')).not.toBeInTheDocument();

    // Click 'ทั้งหมด' (All)
    await user.click(screen.getByRole('button', { name: 'ทั้งหมด' }));

    // Now Charizard is visible
    expect(screen.getByText('Charizard Base Set 1st Edition')).toBeInTheDocument();
  });

  it('handles CSV export download trigger', async () => {
    const user = userEvent.setup();
    vi.spyOn(auctionApi, 'getSellerAnalytics').mockResolvedValue(mockAnalytics);

    // Mock URL.createObjectURL and URL.revokeObjectURL
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    render(
      <MemoryRouter>
        <AuctionAnalyticsPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Pikachu Illustrator Promo')).toBeInTheDocument();

    const exportBtn = screen.getByRole('button', { name: /Export CSV/i });
    expect(exportBtn).not.toBeDisabled();

    await user.click(exportBtn);

    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalled();
    expect(screen.getByText(/ส่งออกรายงานทางการเงิน \(CSV\) สำเร็จ/i)).toBeInTheDocument();
  });
});
