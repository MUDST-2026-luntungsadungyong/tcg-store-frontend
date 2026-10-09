import { type HTMLAttributes } from 'react';
import { formatCondition } from '@/entities/card/model/condition';
import { cn } from '@/shared/lib';

export interface ConditionLabelProps extends HTMLAttributes<HTMLSpanElement> {
  condition?: string | null;
  fallback?: string;
  variant?: 'badge' | 'text';
  size?: 'xs' | 'sm' | 'md';
}

export function ConditionLabel({
  condition,
  fallback = 'Not specified',
  variant = 'badge',
  size = 'xs',
  className,
  ...props
}: ConditionLabelProps) {
  const formatted = formatCondition(condition, fallback);
  const isFallback = formatted === fallback;

  // Determine color scheme based on formatted condition
  const getVariantClasses = () => {
    if (isFallback) {
      return 'bg-white/5 text-gray-400 border-white/10';
    }
    const lower = formatted.toLowerCase();
    if (lower.includes('near mint') || lower === 'mint') {
      return 'bg-status-success/10 text-emerald-400 border-status-success/25';
    }
    if (lower.includes('lightly played')) {
      return 'bg-sky-500/10 text-sky-400 border-sky-500/25';
    }
    if (lower.includes('moderately played')) {
      return 'bg-amber-500/10 text-amber-400 border-amber-500/25';
    }
    if (lower.includes('heavily played')) {
      return 'bg-orange-500/10 text-orange-400 border-orange-500/25';
    }
    if (lower.includes('damaged')) {
      return 'bg-status-danger/10 text-rose-400 border-status-danger/25';
    }
    // Graded or special custom conditions (e.g. PSA 10 Gem Mint)
    return 'bg-purple-500/10 text-purple-300 border-purple-500/25';
  };

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[11px] leading-tight',
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  if (variant === 'text') {
    return (
      <span
        className={cn(
          'font-medium',
          isFallback ? 'text-gray-400 italic' : 'text-gray-200',
          className
        )}
        title={formatted}
        {...props}
      >
        {formatted}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border font-medium transition-colors',
        sizeClasses[size],
        getVariantClasses(),
        className
      )}
      title={formatted}
      {...props}
    >
      {formatted}
    </span>
  );
}
