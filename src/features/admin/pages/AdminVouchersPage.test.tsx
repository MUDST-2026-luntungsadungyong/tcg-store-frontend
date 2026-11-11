import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AdminVoucher } from '@/features/vouchers/model/types';

const {
  listMock,
  createMock,
  updateMock,
  toggleMock,
  deleteMock,
  addToastMock,
} = vi.hoisted(() => ({
  listMock: vi.fn(),
  createMock: vi.fn(),
  updateMock: vi.fn(),
  toggleMock: vi.fn(),
  deleteMock: vi.fn(),
  addToastMock: vi.fn(),
}));

vi.mock('../api/adminVouchers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/adminVouchers')>();
  return {
    ...actual,
    listAdminVouchers: listMock,
    createAdminVoucher: createMock,
    updateAdminVoucher: updateMock,
    toggleAdminVoucherStatus: toggleMock,
    deleteAdminVoucher: deleteMock,
  };
});

vi.mock('@/shared/model/useToastStore', () => ({
  useToastStore: () => ({ addToast: addToastMock }),
}));

vi.mock('@/features/vouchers/model/useVoucherLiveUpdates', () => ({
  useVoucherLiveUpdates: vi.fn(),
}));

import { AdminVouchersPage } from './AdminVouchersPage';

const sampleVoucher: AdminVoucher = {
  id: 1,
  code: 'WELCOME10',
  title: 'ส่วนลด 10% สมาชิกใหม่',
  description: 'ลด 10% สูงสุด 100 บาท',
  discountType: 'PERCENTAGE',
  discountValue: 10,
  minSpend: 300,
  maxDiscountAmount: 100,
  totalQuota: 500,
  usedQuota: 45,
  remainingQuota: 455,
  quotaPercentage: 9,
  startTime: '2026-11-01T00:00:00Z',
  endTime: '2027-02-01T23:59:59Z',
  isActive: true,
  effectiveStatus: 'ACTIVE',
  claimedCount: 12,
  usedOrdersCount: 45,
  createdAt: '2026-11-01T00:00:00Z',
  updatedAt: '2026-11-01T00:00:00Z',
};

function renderPage() {
  return render(
    <MemoryRouter>
      <AdminVouchersPage />
    </MemoryRouter>
  );
}

describe('AdminVouchersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders summary metrics and loaded vouchers', async () => {
    listMock.mockResolvedValueOnce([sampleVoucher]);

    renderPage();

    expect(screen.getByRole('heading', { name: 'Discounts & Vouchers' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Public Voucher Center' })).toHaveAttribute('href', '/vouchers');
    await waitFor(() => expect(screen.getAllByText('WELCOME10')[0]).toBeInTheDocument());
    expect(screen.getAllByText('ส่วนลด 10% สมาชิกใหม่')[0]).toBeInTheDocument();
    expect(screen.getByText('45 / 500 used')).toBeInTheDocument();
  });

  it('creates a new voucher from modal with live ticket preview and handles duplicate code errors', async () => {
    listMock.mockResolvedValue([]);
    createMock
      .mockRejectedValueOnce({
        response: {
          data: {
            code: 'VOUCHER_CODE_EXISTS',
            message: "Voucher code 'MEGA20' already exists",
            fieldErrors: { code: "Voucher code 'MEGA20' already exists" },
          },
        },
      })
      .mockResolvedValueOnce({
        ...sampleVoucher,
        id: 2,
        code: 'MEGA20',
        title: 'Mega 20% Off',
        discountValue: 20,
        usedQuota: 0,
        remainingQuota: 200,
        totalQuota: 200,
        claimedCount: 0,
        usedOrdersCount: 0,
      });

    const user = userEvent.setup();
    renderPage();

    await waitFor(() => expect(listMock).toHaveBeenCalledTimes(1));

    await user.click(screen.getAllByRole('button', { name: /Create voucher/i })[0]);

    const modal = within(screen.getByRole('dialog'));
    await user.type(modal.getByLabelText(/Voucher code/i), 'mega20');
    await user.selectOptions(modal.getByLabelText(/Discount type/i), 'PERCENTAGE');
    await user.type(modal.getByLabelText(/^Title/i), 'Mega 20% Off');

    const discountInput = modal.getByLabelText(/Discount \(%\)/i);
    await user.clear(discountInput);
    await user.type(discountInput, '20');

    const quotaInput = modal.getByLabelText(/Total quota/i);
    await user.clear(quotaInput);
    await user.type(quotaInput, '200');

    // Live ticket preview updates immediately inside modal
    expect(modal.getByText('MEGA20')).toBeInTheDocument();
    expect(modal.getByText('Mega 20% Off')).toBeInTheDocument();

    // Submit first attempt -> hits 409 conflict
    await user.click(screen.getByRole('dialog').querySelector('button[type="submit"]')!);

    await waitFor(() =>
      expect(modal.getAllByText("Voucher code 'MEGA20' already exists")[0]).toBeInTheDocument()
    );

    // Submit second attempt -> succeeds
    await user.click(screen.getByRole('dialog').querySelector('button[type="submit"]')!);

    await waitFor(() => expect(createMock).toHaveBeenCalledTimes(2));
    expect(createMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        code: 'MEGA20',
        title: 'Mega 20% Off',
        discountType: 'PERCENTAGE',
        discountValue: 20,
        totalQuota: 200,
        isActive: true,
      })
    );
    expect(addToastMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'success', message: 'Voucher MEGA20 created and published.' })
    );
  });

  it('toggles voucher active status and deletes voucher via confirmation modal', async () => {
    listMock.mockResolvedValue([sampleVoucher]);
    toggleMock.mockResolvedValueOnce({
      ...sampleVoucher,
      isActive: false,
      effectiveStatus: 'INACTIVE',
    });
    deleteMock.mockResolvedValueOnce(undefined);

    const user = userEvent.setup();
    renderPage();

    await waitFor(() => expect(screen.getAllByText('WELCOME10')[0]).toBeInTheDocument());

    await user.click(screen.getAllByRole('button', { name: 'Disable WELCOME10' })[0]);
    await waitFor(() => expect(toggleMock).toHaveBeenCalledWith(1, false));
    expect(addToastMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'success', message: 'WELCOME10 is now paused.' })
    );

    await user.click(screen.getAllByRole('button', { name: 'Delete WELCOME10' })[0]);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText('12')).toBeInTheDocument();
    expect(within(dialog).getByText('45')).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete permanently' }));
    await waitFor(() => expect(deleteMock).toHaveBeenCalledWith(1));
    expect(addToastMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'success', message: 'Voucher WELCOME10 deleted.' })
    );
  });

  it('prevents editing totalQuota below already redeemed count', async () => {
    listMock.mockResolvedValueOnce([sampleVoucher]);

    const user = userEvent.setup();
    renderPage();

    await waitFor(() => expect(screen.getAllByText('WELCOME10')[0]).toBeInTheDocument());
    await user.click(screen.getAllByRole('button', { name: 'Edit WELCOME10' })[0]);

    const quotaInput = screen.getByLabelText(/Total quota/i);
    await user.clear(quotaInput);
    await user.type(quotaInput, '10'); // lower than usedQuota 45

    fireEvent.submit(screen.getByRole('dialog').querySelector('form')!);

    await waitFor(() =>
      expect(screen.getAllByText(/Total quota must be an integer >= 45/i)[0]).toBeInTheDocument()
    );
    expect(updateMock).not.toHaveBeenCalled();
  });
});
