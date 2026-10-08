import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Notification } from '@/entities/notification/model/types';
import { useNotificationStore } from '../model/useNotificationStore';

const { list, markRead, deleteNotification } = vi.hoisted(() => ({
  list: vi.fn(),
  markRead: vi.fn(),
  deleteNotification: vi.fn(),
}));

vi.mock('../api/notifications', () => ({
  notificationsApi: { list, markRead, delete: deleteNotification },
}));

import { NotificationsPage } from './NotificationsPage';

const notification: Notification = {
  id: '5',
  type: 'ORDER_RESERVED',
  title: 'New card reservation',
  message: 'A buyer reserved cards from your listings.',
  orderId: '19',
  readAt: null,
  createdAt: '2026-09-20T10:00:00',
};

function page(content: Notification[] = [notification], values: Partial<{
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

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => { resolve = res; });
  return { promise, resolve };
}

function DestinationProbe() {
  const location = useLocation();
  return <output data-testid="destination">{location.pathname}{location.search}</output>;
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/notifications']}>
      <Routes>
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="*" element={<DestinationProbe />} />
      </Routes>
    </MemoryRouter>,
  );
}

const routingCases: Array<{
  name: string;
  type: Notification['type'];
  title: string;
  message: string;
  destination: '/workspace/orders' | '/orders' | '/profile' | '/admin/seller-applications?applicationId=app%2F1';
}> = [
  {
    name: 'a seller reservation',
    type: 'ORDER_RESERVED',
    title: 'New card reservation',
    message: 'A buyer reserved cards from your listings.',
    destination: '/workspace/orders',
  },
  {
    name: 'a seller buying a card as a normal buyer',
    type: 'ORDER_STATUS_CHANGED',
    title: 'Your order status changed',
    message: 'Your card purchase is ready for pickup.',
    destination: '/orders',
  },
  { name: 'a submitted seller application', type: 'SELLER_APPLICATION_SUBMITTED', title: 'Application submitted', message: 'Review this application.', destination: '/admin/seller-applications?applicationId=app%2F1' },
  { name: 'an approved seller application', type: 'SELLER_APPLICATION_APPROVED', title: 'Application approved', message: 'You are approved.', destination: '/profile' },
  { name: 'a rejected seller application', type: 'SELLER_APPLICATION_REJECTED', title: 'Application rejected', message: 'Please review your profile.', destination: '/profile' },
];

describe('NotificationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useNotificationStore.setState({ unreadCount: 4 });
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

  it.each(routingCases)('marks $name as read before navigating by notification type', async ({ type, title, message, destination }) => {
    const currentNotification: Notification = {
      ...notification,
      type,
      title,
      message,
      orderId: type === 'ORDER_RESERVED' || type === 'ORDER_STATUS_CHANGED' ? '19' : null,
      sellerApplicationId: type === 'SELLER_APPLICATION_SUBMITTED' ? 'app/1' : null,
    };
    const readRequest = deferred<Notification>();
    list.mockResolvedValue(page([currentNotification]));
    markRead.mockReturnValue(readRequest.promise);
    renderPage();

    const user = userEvent.setup();
    const actionName = type === 'SELLER_APPLICATION_SUBMITTED' ? 'Review application'
      : type === 'SELLER_APPLICATION_APPROVED' || type === 'SELLER_APPLICATION_REJECTED' ? 'View profile'
        : 'View order';
    await user.click(await screen.findByRole('button', { name: actionName }));

    expect(markRead).toHaveBeenCalledWith(currentNotification.id);
    expect(screen.queryByTestId('destination')).not.toBeInTheDocument();

    readRequest.resolve({ ...currentNotification, readAt: '2026-09-20T11:00:00' });
    expect(await screen.findByTestId('destination')).toHaveTextContent(destination);
  });

  it.each([
    { type: 'ORDER_RESERVED', orderId: null, sellerApplicationId: null },
    { type: 'ORDER_STATUS_CHANGED', orderId: undefined, sellerApplicationId: null },
    { type: 'SELLER_APPLICATION_SUBMITTED', orderId: null, sellerApplicationId: null },
  ] as const)('renders $type without a CTA when its required reference is missing', async (values) => {
    list.mockResolvedValue(page([{ ...notification, ...values }]));
    renderPage();
    await screen.findByText('A buyer reserved cards from your listings.');
    expect(screen.queryByRole('button', { name: /View order|Review application/ })).not.toBeInTheDocument();
  });

  it('decrements unread count once after marking an unread item read', async () => {
    renderPage();
    await screen.findByText('A buyer reserved cards from your listings.');
    await userEvent.click(screen.getByRole('button', { name: 'Mark New card reservation as read' }));
    await waitFor(() => expect(useNotificationStore.getState().unreadCount).toBe(3));
  });

  it('decrements unread count after deleting an unread item and clamps at zero', async () => {
    useNotificationStore.setState({ unreadCount: 0 });
    renderPage();
    await screen.findByText('A buyer reserved cards from your listings.');
    await userEvent.click(screen.getByRole('button', { name: 'Delete New card reservation' }));
    await waitFor(() => expect(useNotificationStore.getState().unreadCount).toBe(0));
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
