import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VoucherTicket } from './VoucherTicket';
import type { Voucher } from '../model/types';

describe('VoucherTicket', () => {
  const mockVoucher: Voucher = {
    id: 1,
    code: 'MYTHIX50',
    title: 'ส่วนลด ฿50',
    description: 'ลด 50 บาท เมื่อช้อปครบ 500 บาท',
    discountType: 'FIXED_AMOUNT',
    discountValue: 50,
    minSpend: 500,
    maxDiscountAmount: null,
    totalQuota: 100,
    usedQuota: 10,
    remainingQuota: 90,
    quotaPercentage: 10,
    startTime: null,
    endTime: null,
    isActive: true,
    isClaimed: false,
    canClaim: true,
  };

  it('renders voucher code, title and discount value', () => {
    render(<VoucherTicket voucher={mockVoucher} mode="center" />);
    expect(screen.getByText('MYTHIX50')).toBeInTheDocument();
    expect(screen.getByText('ส่วนลด ฿50')).toBeInTheDocument();
    expect(screen.getByText('฿50')).toBeInTheDocument();
    expect(screen.getByText('เก็บโค้ด')).toBeInTheDocument();
  });

  it('calls onClaim when claim button is clicked', () => {
    const onClaim = vi.fn();
    render(<VoucherTicket voucher={mockVoucher} mode="center" onClaim={onClaim} />);
    fireEvent.click(screen.getByText('เก็บโค้ด'));
    expect(onClaim).toHaveBeenCalledWith(1);
  });

  it('shows claimed status when isClaimed is true', () => {
    render(<VoucherTicket voucher={{ ...mockVoucher, isClaimed: true }} mode="center" />);
    expect(screen.getByText('เก็บแล้ว')).toBeInTheDocument();
  });

  it('in checkout mode: disables selection if subtotal < minSpend', () => {
    render(<VoucherTicket voucher={mockVoucher} mode="checkout" subtotal={300} />);
    expect(screen.getByText('ใช้โค้ด')).toBeDisabled();
    expect(screen.getByText(/ซื้อเพิ่มอีก ฿200/)).toBeInTheDocument();
  });

  it('in checkout mode: enables selection if subtotal >= minSpend', () => {
    const onSelect = vi.fn();
    render(<VoucherTicket voucher={mockVoucher} mode="checkout" subtotal={600} onSelect={onSelect} />);
    const button = screen.getByText('ใช้โค้ด');
    expect(button).not.toBeDisabled();
    fireEvent.click(button);
    expect(onSelect).toHaveBeenCalledWith(mockVoucher);
  });
});
