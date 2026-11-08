import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  /** Milliseconds until dismissal; 0 keeps the notification until dismissed. */
  duration?: number;
}

interface ToastStore {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

let toastCount = 0;
export const MAX_TOASTS = 4;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) =>
    set((state) => {
      if (state.toasts.some((item) => item.type === toast.type && item.title === toast.title && item.message === toast.message)) {
        return state;
      }
      return { toasts: [...state.toasts, { ...toast, id: `toast-${++toastCount}` }].slice(-MAX_TOASTS) };
    }),
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}));
