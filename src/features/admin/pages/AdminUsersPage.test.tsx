import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';

const { get, post } = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));

vi.mock('@/shared/api/client', () => ({ default: { get, post } }));

import { AdminUsersPage } from './AdminUsersPage';

describe('AdminUsersPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows only administrator management controls and returned administrators', async () => {
    get.mockResolvedValueOnce({ data: [{ id: '1', name: 'Platform Admin', email: 'admin@mythix.com', role: 'ADMIN', sellerStatus: 'NONE' }] });

    render(<AdminUsersPage />);

    expect(screen.getByRole('heading', { name: 'Admin management' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Platform Admin')).toBeInTheDocument());
    expect(screen.queryByText('Seller status')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Promote' })).not.toBeInTheDocument();
  });

  it('creates an administrator from the add-admin form', async () => {
    get.mockResolvedValueOnce({ data: [] });
    post.mockResolvedValueOnce({ data: { id: '2', name: 'New Admin', email: 'new@mythix.com', role: 'ADMIN', sellerStatus: 'NONE' } });
    const user = userEvent.setup();

    render(<AdminUsersPage />);
    await user.click(screen.getByRole('button', { name: 'Add admin' }));
    await user.type(screen.getByLabelText('Name'), 'New Admin');
    await user.type(screen.getByLabelText('Email'), 'new@mythix.com');
    await user.type(screen.getByLabelText('Password'), 'AdminPass1');
    await user.click(screen.getByRole('button', { name: 'Add administrator' }));

    await waitFor(() => expect(post).toHaveBeenCalledWith('/admin/users', { name: 'New Admin', email: 'new@mythix.com', password: 'AdminPass1' }));
    expect(screen.getByText('New Admin')).toBeInTheDocument();
  });
});
