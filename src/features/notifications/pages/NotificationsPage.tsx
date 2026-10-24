import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Bell, Check, ChevronLeft, ChevronRight, LoaderCircle, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import type { Notification } from '@/entities/notification/model/types';
import { Button } from '@/shared/components/Button';
import { Skeleton } from '@/shared/components/Skeleton';
import { notificationsApi, type NotificationsPage } from '../api/notifications';
import { useNotificationStore } from '../model/useNotificationStore';

const PAGE_SIZE = 20;

function isUnauthorized(error: unknown) {
  if (typeof error !== 'object' || error === null || !('response' in error)) return false;
  const response = (error as { response?: { status?: number } }).response;
  return response?.status === 401;
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const adjustUnread = useNotificationStore((state) => state.adjustUnread);
  const [page, setPage] = useState(0);
  const [result, setResult] = useState<NotificationsPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUnauthorized(false);
    try {
      const next = await notificationsApi.list(page, PAGE_SIZE);
      setResult(next);
    } catch (loadError) {
      setResult(null);
      if (isUnauthorized(loadError)) {
        setUnauthorized(true);
        setError('Your session has expired. Sign in to view your notifications.');
      } else {
        setError('We could not load your notifications. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const markRead = async (notification: Notification) => {
    if (notification.readAt || busyId === notification.id) return false;
    setBusyId(notification.id);
    setActionError(null);
    try {
      const updated = await notificationsApi.markRead(notification.id);
      setResult((current) => current && ({
        ...current,
        content: current.content.map((item) => item.id === updated.id ? updated : item),
      }));
      if (updated.readAt) adjustUnread(-1);
      return Boolean(updated.readAt);
    } catch {
      setActionError('Unable to mark this notification as read. Please try again.');
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const deleteNotification = async (notification: Notification) => {
    if (busyId === notification.id) return;
    const notificationId = notification.id;
    setBusyId(notificationId);
    setActionError(null);
    try {
      await notificationsApi.delete(notificationId);
      if (!notification.readAt) adjustUnread(-1);
      if (result?.content.length === 1 && page > 0) {
        setPage((current) => current - 1);
      } else {
        await loadNotifications();
      }
    } catch {
      setActionError('Unable to delete this notification. Please try again.');
      setBusyId(null);
    }
  };

  const openNotification = async (notification: Notification, destination: string) => {
    await markRead(notification);
    navigate(destination);
  };

  const getAction = (notification: Notification): { label: string; destination: string } | null => {
    switch (notification.type) {
      case 'ORDER_RESERVED':
        return notification.orderId ? { label: 'View order', destination: '/workspace/orders' } : null;
      case 'ORDER_STATUS_CHANGED':
        return notification.orderId ? { label: 'View order', destination: '/orders' } : null;
      case 'SELLER_APPLICATION_SUBMITTED':
        return notification.sellerApplicationId ? { label: 'Review application', destination: `/admin/seller-applications?applicationId=${encodeURIComponent(notification.sellerApplicationId)}` } : null;
      case 'SELLER_APPLICATION_APPROVED':
      case 'SELLER_APPLICATION_REJECTED':
        return { label: 'View profile', destination: '/profile' };
    }
  };

  return (
    <section className="min-h-[calc(100vh-64px)] bg-bg-base px-4 py-10 text-white md:px-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <header>
          <div className="flex items-center gap-3">
            <Bell className="size-7 text-brand-blue" aria-hidden="true" />
            <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          </div>
          <p className="mt-2 text-sm text-gray-400">
            Updates about card orders and seller applications.
          </p>
        </header>

        {actionError && <p role="alert" className="rounded-lg border border-status-danger/30 bg-status-danger/10 p-3 text-sm text-red-200">{actionError}</p>}

        {loading && (
          <div role="status" aria-label="Loading notifications" className="space-y-3 rounded-2xl border border-white/10 bg-bg-card p-5 text-gray-100 shadow-[0_12px_28px_rgba(0,0,0,0.18)]">
            <span className="sr-only">Loading notifications</span>
            {[0, 1, 2].map((item) => <Skeleton key={item} className="h-20 w-full bg-white/10" />)}
          </div>
        )}

        {!loading && error && (
          <div role="alert" className="flex flex-col items-center gap-4 rounded-2xl border border-status-danger/40 bg-bg-card p-8 text-center text-gray-100 shadow-[0_12px_28px_rgba(0,0,0,0.18)]">
            <AlertCircle className="size-10 text-status-danger" aria-hidden="true" />
            <p className="text-gray-300">{error}</p>
            {unauthorized ? (
              <Button onClick={() => navigate('/login', { state: { from: '/notifications' } })}>Sign in</Button>
            ) : (
              <Button onClick={() => void loadNotifications()}>Try again</Button>
            )}
          </div>
        )}

        {!loading && !error && result?.content.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-bg-card px-6 py-16 text-center text-gray-100 shadow-[0_12px_28px_rgba(0,0,0,0.18)]">
            <Bell className="size-12 text-[#8A94A8]" aria-hidden="true" />
            <h2 className="text-xl font-semibold text-gray-100">You’re all caught up</h2>
            <p className="text-sm text-gray-400">New reservation and order updates will appear here.</p>
          </div>
        )}

        {!loading && !error && Boolean(result?.content.length) && (
          <>
            <ul aria-label="Notification list" className="space-y-3">
              {result?.content.map((notification) => (
                <li key={notification.id} className={`flex flex-col gap-4 rounded-2xl border bg-bg-card p-5 text-gray-100 shadow-[0_8px_24px_rgba(0,0,0,0.14)] transition-shadow hover:shadow-[0_12px_28px_rgba(0,0,0,0.18)] sm:flex-row sm:items-start sm:justify-between ${notification.readAt ? 'border-white/10' : 'border-brand-blue ring-1 ring-brand-blue/20'}`}>
                  <div className="flex min-w-0 gap-3">
                    <span className={`mt-1 size-2 shrink-0 rounded-full ${notification.readAt ? 'bg-transparent' : 'bg-brand-blue'}`} aria-label={notification.readAt ? 'Read' : 'Unread'} />
                    <div className="min-w-0">
                      <h2 className="font-semibold text-gray-100">{notification.title}</h2>
                      <p className="mt-1 text-sm text-gray-300">{notification.message}</p>
                      <p className="mt-2 text-xs text-gray-400">
                        {notification.orderId ? `Order #${notification.orderId} · ` : ''}
                        {notification.sellerApplicationId ? `Application #${notification.sellerApplicationId} · ` : ''}
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                      {getAction(notification) && <button type="button" onClick={() => void openNotification(notification, getAction(notification)!.destination)} className="mt-3 text-sm font-semibold text-brand-blue hover:text-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue">
                        {getAction(notification)!.label}
                      </button>}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 pl-5 sm:pl-0">
                    {!notification.readAt && (
                      <Button variant="secondary" size="sm" disabled={busyId === notification.id} onClick={() => void markRead(notification)} aria-label={`Mark ${notification.title} as read`}>
                        {busyId === notification.id ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}
                        <span className="sr-only sm:not-sr-only">Mark read</span>
                      </Button>
                    )}
                    <Button variant="secondary" size="sm" disabled={busyId === notification.id} onClick={() => void deleteNotification(notification)} aria-label={`Delete ${notification.title}`}>
                      <Trash2 className="size-4" />
                      <span className="sr-only sm:not-sr-only">Delete</span>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>

            <nav aria-label="Notifications pagination" className="flex items-center justify-between gap-4">
              <p className="text-sm text-gray-400">{result?.totalElements ?? 0} notifications</p>
              <div className="flex items-center gap-3">
                <Button variant="secondary" size="sm" disabled={page === 0 || loading} onClick={() => setPage((current) => Math.max(0, current - 1))}>
                  <ChevronLeft className="size-4" /> Previous
                </Button>
                <span className="text-sm text-gray-400">Page {page + 1} of {Math.max(result?.totalPages ?? 0, 1)}</span>
                <Button variant="secondary" size="sm" disabled={!result || result.last || loading} onClick={() => setPage((current) => current + 1)}>
                  Next <ChevronRight className="size-4" />
                </Button>
              </div>
            </nav>
          </>
        )}

      </div>
    </section>
  );
}
