import { type SelectHTMLAttributes, forwardRef, useId } from 'react';
import { cn } from '@/shared/lib';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, id, 'aria-describedby': describedBy, 'aria-invalid': invalid, ...props }, ref) => {
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    const errorId = `${fieldId}-error`;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={fieldId} className="block text-sm font-medium text-gray-300 mb-1">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={fieldId}
            aria-invalid={error ? true : invalid}
            aria-describedby={[describedBy, error && errorId].filter(Boolean).join(' ') || undefined}
          className={cn(
            'block w-full h-11 rounded-xl border border-white/15 bg-bg-input px-3 text-sm leading-5 text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
            error && 'border-status-danger focus:border-status-danger focus:ring-status-danger',
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
        {error && <p id={errorId} className="mt-1 text-sm text-status-danger">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
