import { create } from 'zustand';
import type { User } from '@/entities/account/model/types';

interface AuthStore {
  token: string | null;
  user: User | null;
  isHydrating: boolean;
  login: (token: string, user: User) => void;
  completeHydration: (user: User) => void;
  logout: () => void;
}

function getInitialAuth(): { token: string | null; user: User | null } {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('tcg_auth_storage') : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.state?.token && parsed?.state?.user) {
        return { token: parsed.state.token, user: parsed.state.user };
      }
    }
  } catch {
    // ignore
  }
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return { token, user: null };
}

const initialAuth = getInitialAuth();

export const useAuthStore = create<AuthStore>((set) => ({
  token: initialAuth.token,
  user: initialAuth.user,
  isHydrating: Boolean(initialAuth.token && !initialAuth.user),

  login: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem(
      'tcg_auth_storage',
      JSON.stringify({ state: { token, user, isAuthenticated: true }, version: 0 })
    );
    set({ token, user, isHydrating: false });
  },

  completeHydration: (user) => {
    const token = localStorage.getItem('token');
    if (token) {
      localStorage.setItem(
        'tcg_auth_storage',
        JSON.stringify({ state: { token, user, isAuthenticated: true }, version: 0 })
      );
    }
    set({ user, isHydrating: false });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('tcg_auth_storage');
    set({ token: null, user: null, isHydrating: false });
  },
}));

