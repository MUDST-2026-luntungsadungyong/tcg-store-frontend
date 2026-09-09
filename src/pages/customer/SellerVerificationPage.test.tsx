import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { SellerVerificationPage } from './SellerVerificationPage';
import { useAuthStore } from '@/store/useAuthStore';

const { submit } = vi.hoisted(() => ({ submit: vi.fn() }));

vi.mock('@/api/sellerVerification', () => ({
  SellerVerificationError: class SellerVerificationError extends Error {},
  sellerVerificationApi: { submit },
}));

describe('SellerVerificationPage', () => {
  afterEach(cleanup);

  beforeEach(() => {
    submit.mockReset();
    localStorage.clear();
    useAuthStore.setState({
      token: 'test-token',
      user: { id: '1', name: 'Naphat', email: 'naphat@example.com', role: 'CUSTOMER' },
      isHydrating: false,
    });
  });

  it('keeps the submit flow on the form until a store name is provided', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><SellerVerificationPage /></MemoryRouter>);

    await user.click(screen.getByRole('button', { name: /submit seller application/i }));

    expect(await screen.findByText('Store name is required.')).toBeInTheDocument();
    expect(submit).not.toHaveBeenCalled();
  });

  it('upgrades the current user and shows the verified completion state', async () => {
    submit.mockResolvedValue({ id: 'verification-1', shopName: 'Mythix Vault', sellerStatus: 'VERIFIED', verifiedAt: '2026-09-09T00:00:00Z' });
    const user = userEvent.setup();
    render(<MemoryRouter><SellerVerificationPage /></MemoryRouter>);

    await user.type(screen.getByLabelText('Store name *'), 'Mythix Vault');
    await user.click(screen.getByRole('button', { name: /submit seller application/i }));

    expect(await screen.findByText('Seller verification complete')).toBeInTheDocument();
    expect(useAuthStore.getState().user).toMatchObject({ role: 'SELLER', sellerStatus: 'VERIFIED' });
  });
});
