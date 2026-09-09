import { create } from 'zustand';
import type { User } from '@/types';

interface AuthStore {
  token: string | null;
  user: User | null;
  isHydrating: boolean;
  login: (token: string, user: User) => void;
  completeHydration: (user: User) => void;
  logout: () => void;
}

const storedToken = localStorage.getItem('token');

export const useAuthStore = create<AuthStore>((set) => ({
  token: storedToken,
  user: null,
  isHydrating: Boolean(storedToken),

  login: (token, user) => {
    localStorage.setItem('token', token);
    set({ token, user, isHydrating: false });
  },

  completeHydration: (user) => set({ user, isHydrating: false }),

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('mythix_mock_active_user_id');
    set({ token: null, user: null, isHydrating: false });
  },
}));
