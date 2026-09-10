import { type HTMLAttributes, useEffect } from 'react';
import { cn } from '@/shared/lib';
import { X } from 'lucide-react';

export interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  footer?: React.ReactNode;
}

export function Modal({ className, isOpen, onClose, title, children, footer, ...props }: ModalProps) {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className={cn('glass-elevated w-full max-w-md rounded-xl flex flex-col max-h-[90vh] overflow-hidden', className)}
        {...props}
      >
        <div className="flex justify-between items-center p-4 border-b border-white/10">
          {title && <h2 className="text-lg font-semibold text-white">{title}</h2>}
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors focus:outline-none"
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
