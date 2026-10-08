import { beforeEach, describe, expect, it, vi } from 'vitest';
import { notificationsApi } from '../api/notifications';
import { useNotificationStore } from './useNotificationStore';

vi.mock('../api/notifications', () => ({
  notificationsApi: { getUnreadCount: vi.fn() },
}));

describe('useNotificationStore', () => {
  beforeEach(() => {
    useNotificationStore.getState().reset();
    vi.mocked(notificationsApi.getUnreadCount).mockReset();
  });

  it('refreshes, adjusts and resets the unread count', async () => {
    vi.mocked(notificationsApi.getUnreadCount).mockResolvedValue(3);
    await useNotificationStore.getState().refresh('user-a:token-a');
    expect(useNotificationStore.getState()).toMatchObject({ unreadCount: 3, isLoading: false });

    useNotificationStore.getState().decrementUnread();
    useNotificationStore.getState().adjustUnread(4);
    expect(useNotificationStore.getState().unreadCount).toBe(6);
    useNotificationStore.getState().decrementUnread(20);
    expect(useNotificationStore.getState().unreadCount).toBe(0);

    useNotificationStore.getState().reset();
    expect(useNotificationStore.getState()).toMatchObject({ unreadCount: 0, isLoading: false, sessionKey: null });
  });

  it('does not apply a response from a previous session', async () => {
    let resolveOld!: (count: number) => void;
    vi.mocked(notificationsApi.getUnreadCount)
      .mockImplementationOnce(() => new Promise((resolve) => { resolveOld = resolve; }))
      .mockResolvedValueOnce(8);

    const oldRequest = useNotificationStore.getState().refresh('user-a:token-a');
    await useNotificationStore.getState().refresh('user-b:token-b');
    resolveOld(2);
    await oldRequest;

    expect(useNotificationStore.getState()).toMatchObject({ unreadCount: 8, sessionKey: 'user-b:token-b' });
  });
});
