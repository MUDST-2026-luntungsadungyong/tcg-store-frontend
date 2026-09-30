import { type HTMLAttributes, useEffect, useRef } from 'react';
import { cn } from '@/shared/lib';
import { X } from 'lucide-react';

export interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  footer?: React.ReactNode;
  mobileSheet?: boolean;
}

export function Modal({ className, isOpen, onClose, title, children, footer, mobileSheet = false, onClick: onContentClick, ...props }: ModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => { onCloseRef.current = onClose; });
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

  if (!isOpen) return null;

  return (
    <div data-testid="modal-backdrop" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }} className={cn('fixed inset-0 z-50 flex justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200', mobileSheet ? 'items-end p-0 md:items-center md:p-4' : 'items-center p-4')}>
      <div role="dialog" aria-modal="true" aria-labelledby={title ? 'modal-title' : undefined}
        className={cn('glass-elevated flex w-full max-w-md flex-col overflow-hidden', mobileSheet ? 'max-h-[85vh] rounded-t-2xl md:max-h-[90vh] md:rounded-xl' : 'max-h-[90vh] rounded-xl', className)}
        onClick={(event) => { event.stopPropagation(); onContentClick?.(event); }}
        {...props}
      >
        {mobileSheet && <div aria-hidden="true" className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-white/25 md:hidden" />}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6">
          {title && <h2 id="modal-title" className="text-lg font-semibold text-white">{title}</h2>}
          <button 
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close modal"
            className="-mr-2 flex h-11 w-11 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4 overflow-y-auto">
          {children}
        </div>
        {footer && (
          <div className="p-4 border-t border-white/10 flex justify-end gap-3 bg-white/5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
