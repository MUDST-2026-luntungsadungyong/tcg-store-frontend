import { type SelectHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={cn(
            'block w-full rounded-md border-0 bg-bg-input text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-brand-blue sm:text-sm sm:leading-6 py-2 px-3 transition-all duration-200',
            error && 'ring-status-danger focus:ring-status-danger',
            className
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-bg-elevated">
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-sm text-status-danger">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
