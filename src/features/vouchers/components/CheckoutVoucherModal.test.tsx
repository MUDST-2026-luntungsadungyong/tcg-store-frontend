import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { CheckoutVoucherModal } from './CheckoutVoucherModal';
import * as vouchersApi from '../api/vouchers';
import type { UserVoucher } from '../model/types';

vi.mock('../api/vouchers', () => ({
  fetchMyVouchers: vi.fn(),
  validateVoucherApi: vi.fn(),
}));

describe('CheckoutVoucherModal', () => {
  const mockClaimedVoucher: UserVoucher = {
    id: 101,
    voucherId: 1,
    code: 'WELCOME10',
    title: 'ส่วนลด 10% สมาชิกใหม่',
    description: 'ลด 10% สูงสุด 100 บาท เมื่อซื้อขั้นต่ำ 300 บาท',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    minSpend: 300,
    maxDiscountAmount: 100,
    status: 'CLAIMED',
    claimedAt: '2026-11-08T10:00:00Z',
    usedAt: null,
    endTime: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <CheckoutVoucherModal
        isOpen={false}
        onClose={vi.fn()}
        subtotal={500}
        selectedVoucher={null}
        onApplyVoucher={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('fetches only CLAIMED user vouchers and displays only collected vouchers', async () => {
    vi.mocked(vouchersApi.fetchMyVouchers).mockResolvedValue([mockClaimedVoucher]);

    render(
      <CheckoutVoucherModal
        isOpen={true}
        onClose={vi.fn()}
        subtotal={500}
        selectedVoucher={null}
        onApplyVoucher={vi.fn()}
      />
    );

    expect(vouchersApi.fetchMyVouchers).toHaveBeenCalledWith('CLAIMED');

    await waitFor(() => {
      expect(screen.getByText('WELCOME10')).toBeInTheDocument();
      expect(screen.getByText('ส่วนลด 10% สมาชิกใหม่')).toBeInTheDocument();
    });

    // Should NOT display vouchers that were not collected
    expect(screen.queryByText('MYTHIX50')).not.toBeInTheDocument();
    expect(screen.queryByText('FLASH100')).not.toBeInTheDocument();
    expect(screen.getByText(/โค้ดส่วนลดที่ใช้ได้ \(1\)/)).toBeInTheDocument();
  });

  it('displays claimed voucher in ineligible section when subtotal < minSpend', async () => {
    vi.mocked(vouchersApi.fetchMyVouchers).mockResolvedValue([mockClaimedVoucher]);

    render(
      <CheckoutVoucherModal
        isOpen={true}
        onClose={vi.fn()}
        subtotal={100}
        selectedVoucher={null}
        onApplyVoucher={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/โค้ดส่วนลดที่ยังไม่ถึงเกณฑ์ \(1\)/)).toBeInTheDocument();
      expect(screen.getByText('WELCOME10')).toBeInTheDocument();
    });

    expect(screen.getByText(/ไม่มีโค้ดส่วนลดที่ตรงตามยอดซื้อปัจจุบัน/)).toBeInTheDocument();
  });

  it('shows message when user has no claimed vouchers', async () => {
    vi.mocked(vouchersApi.fetchMyVouchers).mockResolvedValue([]);

    render(
      <CheckoutVoucherModal
        isOpen={true}
        onClose={vi.fn()}
        subtotal={500}
        selectedVoucher={null}
        onApplyVoucher={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/คุณยังไม่มีโค้ดส่วนลดที่เก็บไว้/)).toBeInTheDocument();
    });
  });

  it('allows selecting an eligible voucher and confirms selection', async () => {
    vi.mocked(vouchersApi.fetchMyVouchers).mockResolvedValue([mockClaimedVoucher]);
    const onApplyVoucher = vi.fn();
    const onClose = vi.fn();

    render(
      <CheckoutVoucherModal
        isOpen={true}
        onClose={onClose}
        subtotal={500}
        selectedVoucher={null}
        onApplyVoucher={onApplyVoucher}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('WELCOME10')).toBeInTheDocument();
    });

    // Target the "ใช้โค้ด" button inside the voucher ticket, not the custom code form
    const ticketElement = screen.getByText('WELCOME10').closest('.rounded-2xl');
    expect(ticketElement).not.toBeNull();
    const applyButton = within(ticketElement as HTMLElement).getByRole('button', { name: 'ใช้โค้ด' });
    fireEvent.click(applyButton);

    // Click "ตกลง" button
    fireEvent.click(screen.getByText('ตกลง'));

    expect(onApplyVoucher).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'WELCOME10',
        discountValue: 10,
        discountType: 'PERCENTAGE',
      })
    );
    expect(onClose).toHaveBeenCalled();
  });
});
