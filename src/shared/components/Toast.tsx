import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { cn } from '@/shared/lib';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToastStore, type ToastMessage } from '@/shared/model/useToastStore';

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

function Toast({ toast, onClose }: ToastProps) {
  const reducedMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const duration = toast.duration ?? (toast.type === 'error' || toast.type === 'warning' ? 8000 : 4000);
  const remaining = useRef(duration);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const startedAt = useRef<number | null>(null);
  const paused = hovered || focused;
  const pauseTimer = useCallback(() => {
    if (timer.current === undefined) return;
    clearTimeout(timer.current);
    timer.current = undefined;
    if (startedAt.current !== null) {
      remaining.current = Math.max(0, remaining.current - (Date.now() - startedAt.current));
      startedAt.current = null;
    }
  }, []);

  useEffect(() => {
    if (paused || duration === 0) return;
    startedAt.current = Date.now();
    timer.current = setTimeout(() => onClose(toast.id), remaining.current);
    return pauseTimer;
  }, [paused, duration, toast.id, onClose, pauseTimer]);

  const icons = {
    success: <CheckCircle2 className="text-status-success" size={22} />,
    error: <XCircle className="text-status-danger" size={22} />,
    warning: <AlertTriangle className="text-status-warning" size={22} />,
    info: <Info className="text-brand-blue" size={22} />,
  };
  const borders = {
    success: 'border-status-success/40',
    error: 'border-status-danger/40',
    warning: 'border-status-warning/40',
    info: 'border-brand-blue/40',
  };

  return (
    <motion.div
      layout={!reducedMotion}
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
      transition={{ duration: reducedMotion ? 0 : 0.18 }}
      onMouseEnter={() => { pauseTimer(); setHovered(true); }}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => { pauseTimer(); setFocused(true); }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
      }}
      className={cn('pointer-events-auto flex w-full items-start gap-3 rounded-xl border bg-bg-card p-4 shadow-xl', borders[toast.type])}
    >
      <div className="shrink-0" aria-hidden="true">{icons[toast.type]}</div>
      <div className="min-w-0 flex-1 break-words" role={toast.type === 'error' ? 'alert' : 'status'} aria-atomic="true">
        {toast.title && <h3 className="text-sm font-semibold text-white">{toast.title}</h3>}
        <p className={cn('text-sm leading-relaxed text-gray-200', toast.title && 'mt-1')}>{toast.message}</p>
      </div>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => onClose(toast.id)}
        className="-m-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
      >
        <X size={18} aria-hidden="true" />
      </button>
    </motion.div>
  );
}

export function ToastProvider() {
  const { toasts, removeToast } = useToastStore();
  return (
    <section aria-label="Notifications" className="pointer-events-none fixed bottom-4 left-4 right-4 z-toast flex flex-col gap-2 sm:left-auto sm:w-96 sm:max-w-[calc(100vw-2rem)]">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => <Toast key={toast.id} toast={toast} onClose={removeToast} />)}
      </AnimatePresence>
    </section>
  );
}
