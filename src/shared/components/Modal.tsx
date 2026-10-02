import { type HTMLAttributes, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/shared/lib';
import { X } from 'lucide-react';

export interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  footer?: React.ReactNode;
  mobileSheet?: boolean;
  desktopFromRight?: boolean;
}

export function Modal({ className, isOpen, onClose, title, children, footer, mobileSheet = false, desktopFromRight = false, onClick: onContentClick, ...props }: ModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(min-width: 768px)').matches);

  useEffect(() => { onCloseRef.current = onClose; });
  useEffect(() => {
    const mediaQuery = window.matchMedia?.('(min-width: 768px)');
    if (!mediaQuery) return undefined;
    const update = () => setIsDesktop(mediaQuery.matches);
    update();
    mediaQuery.addEventListener?.('change', update);
    return () => mediaQuery.removeEventListener?.('change', update);
  }, []);
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    closeButtonRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onCloseRef.current(); };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          data-testid="modal-backdrop"
          onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
          className={cn('fixed inset-0 z-50 flex justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200', mobileSheet ? 'items-end p-0 md:items-center md:p-4' : 'items-center p-4')}
        >
          <motion.div
            initial={mobileSheet && !isDesktop ? { opacity: 0, y: 32 } : desktopFromRight ? { opacity: 0, x: 20, y: -12, scale: 0.96 } : { opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={mobileSheet && !isDesktop ? { opacity: 0, y: 32 } : desktopFromRight ? { opacity: 0, x: 20, y: -12, scale: 0.96 } : { opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className={cn('w-full max-w-md', desktopFromRight && 'md:origin-top-right')}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? 'modal-title' : undefined}
              className={cn('glass-elevated flex w-full flex-col overflow-hidden', mobileSheet ? 'max-h-[85vh] rounded-t-2xl md:max-h-[90vh] md:rounded-xl' : 'max-h-[90vh] rounded-xl', className)}
              onClick={(event) => { event.stopPropagation(); onContentClick?.(event); }}
              {...props}
            >
              {mobileSheet && <div aria-hidden="true" className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-white/25 md:hidden" />}
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6">
                {title && <h2 id="modal-title" className="text-lg font-semibold text-white">{title}</h2>}
                <button ref={closeButtonRef} onClick={onClose} aria-label="Close modal" className="-mr-2 flex h-11 w-11 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-brand-blue">
                  <X size={20} />
                </button>
              </div>
              <div className="overflow-y-auto p-4">{children}</div>
              {footer && <div className="flex justify-end gap-3 border-t border-white/10 bg-white/5 p-4">{footer}</div>}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
