import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { list, markRead, deleteNotification } = vi.hoisted(() => ({
  list: vi.fn(),
  markRead: vi.fn(),
  deleteNotification: vi.fn(),
}));

vi.mock('../api/notifications', () => ({
  notificationsApi: { list, markRead, delete: deleteNotification },
}));

import { NotificationsPage } from './NotificationsPage';

const notification = {
  id: '5',
  type: 'ORDER_RESERVED' as const,
  title: 'New card reservation',
  message: 'A buyer reserved cards from your listings.',
  orderId: '19',
  readAt: null,
  createdAt: '2026-09-20T10:00:00',
};

function page(content = [notification], values: Partial<{
  totalElements: number; totalPages: number; number: number; size: number; first: boolean; last: boolean;
}> = {}) {
  return {
    content,
    totalElements: values.totalElements ?? content.length,
    totalPages: values.totalPages ?? (content.length ? 1 : 0),
    number: values.number ?? 0,
    size: values.size ?? 20,
    first: values.first ?? true,
    last: values.last ?? true,
  };
}

function renderPage() {
  return render(<MemoryRouter><NotificationsPage /></MemoryRouter>);
}

describe('NotificationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    list.mockResolvedValue(page());
    markRead.mockResolvedValue({ ...notification, readAt: '2026-09-20T11:00:00' });
    deleteNotification.mockResolvedValue(undefined);
  });

  it('shows loading while the backend request is pending', async () => {
    let resolveRequest!: (value: ReturnType<typeof page>) => void;
    list.mockReturnValue(new Promise((resolve) => { resolveRequest = resolve; }));
    renderPage();

    expect(screen.getByRole('status', { name: 'Loading notifications' })).toBeInTheDocument();
    resolveRequest(page());
    expect(await screen.findByText('New card reservation')).toBeInTheDocument();
  });

  it('renders backend notifications and marks one read', async () => {
    renderPage();
    expect(await screen.findByText('A buyer reserved cards from your listings.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Mark New card reservation as read' }));

    await waitFor(() => expect(markRead).toHaveBeenCalledWith('5'));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Mark New card reservation as read' })).not.toBeInTheDocument());
    expect(screen.getByText(/Order #19/)).toBeInTheDocument();
  });

  it('shows the empty state when the backend returns no notifications', async () => {
    list.mockResolvedValue(page([]));
    renderPage();
    expect(await screen.findByText('You’re all caught up')).toBeInTheDocument();
  });

  it('shows an unauthorized state with a sign-in action', async () => {
    const error = { isAxiosError: true, response: { status: 401 } } as unknown as Error;
    list.mockRejectedValue(error);
    renderPage();
    expect(await screen.findByText(/session has expired/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('shows an API failure and retries the request', async () => {
    list.mockRejectedValueOnce(new Error('network failure'));
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('New card reservation')).toBeInTheDocument();
    expect(list).toHaveBeenCalledTimes(2);
  });

  it('paginates through the backend result', async () => {
    list.mockResolvedValueOnce(page([notification], { totalElements: 21, totalPages: 2, last: false }))
      .mockResolvedValueOnce(page([{ ...notification, id: '6', title: 'Order status changed' }], { totalElements: 21, totalPages: 2, number: 1, first: false, last: true }));
    renderPage();
    expect(await screen.findByText('New card reservation')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Next/ }));
    expect(await screen.findByText('Order status changed')).toBeInTheDocument();
    expect(list).toHaveBeenLastCalledWith(1, 20);
  });

  it('deletes a notification and refreshes the page from the backend', async () => {
    list.mockResolvedValueOnce(page()).mockResolvedValueOnce(page([]));
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Delete New card reservation' }));
    expect(await screen.findByText('You’re all caught up')).toBeInTheDocument();
    expect(deleteNotification).toHaveBeenCalledWith('5');
  });
});
