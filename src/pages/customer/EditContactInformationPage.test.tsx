import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { EditContactInformationPage } from './EditContactInformationPage';
import { useAuthStore } from '@/store/useAuthStore';

const { updateContactInfo } = vi.hoisted(() => ({ updateContactInfo: vi.fn() }));

vi.mock('@/api/users', () => ({ usersApi: { updateContactInfo } }));

describe('EditContactInformationPage', () => {
  beforeEach(() => {
    updateContactInfo.mockReset();
    useAuthStore.setState({
      token: 'test-token',
      user: { id: '1', name: 'Naphat', email: 'naphat@example.com', role: 'CUSTOMER', phone: '0812345678' },
      isHydrating: false,
    });
  });

  afterEach(cleanup);

  it('saves phone, Line ID, and Facebook then returns to profile', async () => {
    updateContactInfo.mockResolvedValue({ id: '1', name: 'Naphat', email: 'naphat@example.com', role: 'CUSTOMER', phone: '081-234-5678', contactLine: '@cardvaultth', contactFacebook: 'fb.com/cardvaultth' });
    const user = userEvent.setup();
    render(<MemoryRouter><EditContactInformationPage /></MemoryRouter>);

    await user.clear(screen.getByLabelText('Phone Number'));
    await user.type(screen.getByLabelText('Phone Number'), '081-234-5678');
    await user.type(screen.getByLabelText('Line ID'), '@cardvaultth');
    await user.type(screen.getByLabelText('Facebook'), 'fb.com/cardvaultth');
    await user.click(screen.getByRole('button', { name: 'Save Contact Info' }));

    expect(updateContactInfo).toHaveBeenCalledWith(expect.objectContaining({ id: '1' }), {
      phone: '081-234-5678',
      contactLine: '@cardvaultth',
      contactFacebook: 'fb.com/cardvaultth',
    });
    expect(useAuthStore.getState().user).toMatchObject({ contactLine: '@cardvaultth', contactFacebook: 'fb.com/cardvaultth' });
  });
});
