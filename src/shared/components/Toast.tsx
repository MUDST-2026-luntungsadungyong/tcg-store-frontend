import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/shared/lib';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToastStore, type ToastMessage } from '@/shared/model/useToastStore';

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
    <motion.div
      layout
      initial={{ opacity: 0, x: 32, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 32, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
      className={cn('glass-card flex min-w-[300px] items-start gap-3 rounded-lg border p-4 shadow-xl', bgs[toast.type])}
    >
      <div className="shrink-0">{icons[toast.type]}</div>
      <div className="flex-1">
        {toast.title && <h3 className="text-sm font-medium text-white">{toast.title}</h3>}
        <p className="text-sm text-gray-200 mt-1">{toast.message}</p>
      </div>
      <button onClick={() => onClose(toast.id)} className="shrink-0 text-gray-400 hover:text-white">
        <X size={16} />
      </button>
    </motion.div>
  );
}

export function ToastProvider() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
}
