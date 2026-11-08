import {
  type ComponentType,
  type InputHTMLAttributes,
  forwardRef,
  useId,
} from "react";
import { cn } from "@/shared/lib";
import type { LucideProps } from "lucide-react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ComponentType<LucideProps>;
  iconUrl?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon: Icon, iconUrl, id, 'aria-describedby': describedBy, 'aria-invalid': invalid, ...props }, ref) => {
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    const errorId = `${fieldId}-error`;
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={fieldId}
            className="block text-sm font-medium text-gray-300 mb-1"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {(Icon || iconUrl) && (
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
              {iconUrl ? (
                <img src={iconUrl} alt="" className="h-[18px] w-[18px]" />
              ) : (
                Icon && <Icon size={18} />
              )}
            </div>
          )}
          <input
            ref={ref}
            id={fieldId}
            aria-invalid={error ? true : invalid}
            aria-describedby={[describedBy, error && errorId].filter(Boolean).join(' ') || undefined}
            className={cn(
              "block w-full h-11 rounded-xl border border-white/15 bg-bg-input px-3 text-sm leading-5 text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
              (Icon || iconUrl) && "pl-11",
              error && "border-status-danger focus:border-status-danger focus:ring-status-danger",
              className,
            )}
            {...props}
          />
        </div>
        {error && <p id={errorId} className="mt-1 text-sm text-status-danger">{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
