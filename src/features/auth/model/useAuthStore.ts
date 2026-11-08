import { create } from 'zustand';
import type { User } from '@/entities/account/model/types';
import { clearStoredAuth, getStoredAccessToken } from '@/shared/api/authStorage';

interface AuthStore {
  token: string | null;
  user: User | null;
  isHydrating: boolean;
  login: (token: string, user: User, rememberMe?: boolean) => void;
  completeHydration: (user: User) => void;
  logout: () => void;
}

function getInitialAuth(): { token: string | null; user: User | null } {
  try {
    const raw = typeof window !== 'undefined'
      ? sessionStorage.getItem('tcg_auth_storage') ?? localStorage.getItem('tcg_auth_storage') : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.state?.token && parsed?.state?.user) {
        return { token: parsed.state.token, user: parsed.state.user };
      }
    }
  } catch {
    // ignore
  }
  const token = typeof window !== 'undefined' ? getStoredAccessToken() : null;
  return { token, user: null };
}

const initialAuth = getInitialAuth();

export const useAuthStore = create<AuthStore>((set) => ({
  token: initialAuth.token,
  user: initialAuth.user,
  isHydrating: Boolean(initialAuth.token && !initialAuth.user),

  login: (token, user, rememberMe) => {
    // Profile saves reuse login with the current token; preserve that session's choice.
    const persist = rememberMe ?? sessionStorage.getItem('token') !== token;
    clearStoredAuth();
    const storage = persist ? localStorage : sessionStorage;
    storage.setItem('token', token);
    storage.setItem(
      'tcg_auth_storage',
      JSON.stringify({ state: { token, user, isAuthenticated: true }, version: 0 })
    );
    set({ token, user, isHydrating: false });
  },

  completeHydration: (user) => {
    const token = getStoredAccessToken();
    const storage = sessionStorage.getItem('token') ? sessionStorage : localStorage;
    if (token) {
      storage.setItem(
        'tcg_auth_storage',
        JSON.stringify({ state: { token, user, isAuthenticated: true }, version: 0 })
      );
    }
    set({ user, isHydrating: false });
  },

  logout: () => {
    clearStoredAuth();
    set({ token: null, user: null, isHydrating: false });
  },
}));

