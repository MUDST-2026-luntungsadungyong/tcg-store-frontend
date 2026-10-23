import { cn } from '@/shared/lib';

export interface ButtonStyleProps {
  variant?: 'primary' | 'secondary' | 'gold' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const baseStyles = 'inline-flex items-center justify-center rounded-xl font-medium transition-colors duration-200 motion-safe:active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base disabled:opacity-50 disabled:cursor-not-allowed';

const variants = {
  primary: 'bg-brand-blue text-bg-base hover:bg-brand-blue/90 focus:ring-brand-blue',
  secondary: 'bg-bg-elevated text-white border border-white/10 hover:bg-bg-elevated/80 focus:ring-gray-500',
  gold: 'bg-brand-gold text-bg-base hover:bg-brand-gold/90 focus:ring-brand-gold',
  danger: 'bg-status-danger text-bg-base hover:bg-status-danger/80 focus:ring-status-danger',
  ghost: 'bg-transparent text-gray-300 hover:text-white hover:bg-white/10 focus:ring-gray-500',
};

const sizes = {
  sm: 'min-h-9 px-3 py-1.5 text-sm',
  md: 'min-h-11 px-4 py-2 text-sm',
  lg: 'min-h-12 px-6 py-3 text-base',
};

export function buttonClasses({ variant = 'primary', size = 'md', className }: ButtonStyleProps = {}) {
  return cn(baseStyles, variants[variant], sizes[size], className);
}
