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
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
              <Icon size={18} />
            </div>
          )}
          <input
            ref={ref}
            id={id}
            className={cn(
              'block w-full h-[44px] px-3 border border-[rgba(165,201,249,0.3)] rounded-[22px] leading-5 bg-[#0b141f] text-gray-300 placeholder-[#808ca6] focus:outline-none focus:ring-1 focus:ring-brand-gold focus:border-brand-gold text-sm transition-colors',
              Icon && 'pl-11',
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
