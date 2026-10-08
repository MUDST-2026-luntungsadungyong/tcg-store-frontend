import { create } from 'zustand';
import { notificationsApi } from '../api/notifications';

interface NotificationState {
  unreadCount: number;
  isLoading: boolean;
  sessionKey: string | null;
  refresh: (sessionKey: string) => Promise<void>;
  decrementUnread: (amount?: number) => void;
  adjustUnread: (delta: number) => void;
  reset: () => void;
}

let requestGeneration = 0;

export const useNotificationStore = create<NotificationState>((set, get) => ({
  unreadCount: 0,
  isLoading: false,
  sessionKey: null,

  refresh: async (sessionKey) => {
    const generation = ++requestGeneration;
    set((state) => ({
      sessionKey,
      isLoading: true,
      unreadCount: state.sessionKey === sessionKey ? state.unreadCount : 0,
    }));
    try {
      const unreadCount = await notificationsApi.getUnreadCount();
      if (generation === requestGeneration && get().sessionKey === sessionKey) {
        set({ unreadCount, isLoading: false });
      }
    } catch {
      if (generation === requestGeneration && get().sessionKey === sessionKey) {
        set({ isLoading: false });
      }
    }
  },

  decrementUnread: (amount = 1) => set((state) => ({
    unreadCount: Math.max(0, state.unreadCount - Math.max(0, amount)),
  })),

  adjustUnread: (delta) => set((state) => ({
    unreadCount: Math.max(0, state.unreadCount + delta),
  })),

  reset: () => {
    requestGeneration += 1;
    set({ unreadCount: 0, isLoading: false, sessionKey: null });
  },
}));
