import { type InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils';
import type { LucideIcon } from 'lucide-react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon: Icon, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Icon size={18} />
            </div>
          )}
          <input
            ref={ref}
            id={id}
            className={cn(
              'block w-full rounded-md border-0 bg-bg-input text-white shadow-sm ring-1 ring-inset ring-white/10 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-brand-blue sm:text-sm sm:leading-6 transition-all duration-200',
              Icon && 'pl-10',
              error && 'ring-status-danger focus:ring-status-danger',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-sm text-status-danger">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
