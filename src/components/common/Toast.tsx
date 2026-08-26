import { useEffect } from 'react';
import { cn } from '@/utils';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { create } from 'zustand';

// --- Toast Store ---
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
}

interface ToastStore {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

let toastCount = 0;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => 
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id: `toast-${++toastCount}` }],
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

// --- Toast Item Component ---
interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

function Toast({ toast, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const icons = {
    success: <CheckCircle2 className="text-status-success" size={24} />,
    error: <XCircle className="text-status-danger" size={24} />,
    warning: <AlertTriangle className="text-status-warning" size={24} />,
    info: <Info className="text-brand-blue" size={24} />,
  };

  const bgs = {
    success: 'border-status-success/30 bg-status-success/10',
    error: 'border-status-danger/30 bg-status-danger/10',
    warning: 'border-status-warning/30 bg-status-warning/10',
    info: 'border-brand-blue/30 bg-brand-blue/10',
  };

  return (
    <div className={cn('glass-card flex items-start gap-3 p-4 rounded-lg min-w-[300px] border shadow-xl animate-in slide-in-from-right-full', bgs[toast.type])}>
      <div className="shrink-0">{icons[toast.type]}</div>
      <div className="flex-1">
        {toast.title && <h3 className="text-sm font-medium text-white">{toast.title}</h3>}
        <p className="text-sm text-gray-200 mt-1">{toast.message}</p>
      </div>
      <button onClick={() => onClose(toast.id)} className="shrink-0 text-gray-400 hover:text-white">
        <X size={16} />
      </button>
    </div>
  );
}

// --- Toast Provider (Put this in App.tsx) ---
export function ToastProvider() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={removeToast} />
      ))}
    </div>
  );
}
