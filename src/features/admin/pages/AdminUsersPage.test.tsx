import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';

const { get, post, del } = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), del: vi.fn() }));

vi.mock('@/shared/api/client', () => ({ default: { get, post, delete: del } }));

import { AdminUsersPage } from './AdminUsersPage';

describe('AdminUsersPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows administrator management controls and returned administrators with Name, Email, and Action', async () => {
    get.mockResolvedValueOnce({ data: [{ id: '1', name: 'Platform Admin', email: 'admin@mythix.com', role: 'ADMIN', sellerStatus: 'NONE' }] });

    render(<AdminUsersPage />);

    expect(screen.getByRole('heading', { name: 'Admin management' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByText('Platform Admin')[0]).toBeInTheDocument());
    expect(screen.getAllByText('admin@mythix.com')[0]).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Delete Platform Admin/i })[0]).toBeInTheDocument();
    expect(screen.queryByText('Seller status')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Promote' })).not.toBeInTheDocument();
  });

  it('creates an administrator from the add-admin modal', async () => {
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
    expect(screen.getAllByText('New Admin')[0]).toBeInTheDocument();
  });

  it('deletes an administrator after confirmation in modal', async () => {
    get.mockResolvedValueOnce({ data: [{ id: '1', name: 'Platform Admin', email: 'admin@mythix.com', role: 'ADMIN', sellerStatus: 'NONE' }] });
    del.mockResolvedValueOnce({});
    const user = userEvent.setup();

    render(<AdminUsersPage />);
    await waitFor(() => expect(screen.getAllByText('Platform Admin')[0]).toBeInTheDocument());

    await user.click(screen.getAllByRole('button', { name: /Delete Platform Admin/i })[0]);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete administrator/i)).toBeInTheDocument();

    const deleteConfirmBtn = screen.getByRole('button', { name: /^Delete$/i });
    await user.click(deleteConfirmBtn);

    await waitFor(() => expect(del).toHaveBeenCalledWith('/admin/users/1'));
    await waitFor(() => expect(screen.queryByText('Platform Admin')).not.toBeInTheDocument());
  });

  it('refetches administrators when clicking Refresh button', async () => {
    get.mockResolvedValueOnce({ data: [{ id: '1', name: 'Platform Admin', email: 'admin@mythix.com', role: 'ADMIN', sellerStatus: 'NONE' }] });
    get.mockResolvedValueOnce({ data: [{ id: '1', name: 'Platform Admin', email: 'admin@mythix.com', role: 'ADMIN', sellerStatus: 'NONE' }] });
    const user = userEvent.setup();

    render(<AdminUsersPage />);
    await waitFor(() => expect(screen.getAllByText('Platform Admin')[0]).toBeInTheDocument());
    expect(get).toHaveBeenCalledTimes(1);

    const refreshBtn = screen.getByRole('button', { name: /Refresh/i });
    await user.click(refreshBtn);

    await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
  });
});
