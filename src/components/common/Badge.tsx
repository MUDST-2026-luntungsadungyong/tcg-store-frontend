import { type HTMLAttributes } from 'react';
import { cn } from '@/utils';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'danger' | 'gold' | 'default';
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  const variants = {
    success: 'bg-status-success/10 text-status-success border-status-success/20',
    warning: 'bg-status-warning/10 text-status-warning border-status-warning/20',
    danger: 'bg-status-danger/10 text-status-danger border-status-danger/20',
    gold: 'bg-brand-gold/10 text-brand-gold border-brand-gold/20',
    default: 'bg-white/5 text-gray-300 border-white/10',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
