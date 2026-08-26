import { type HTMLAttributes } from 'react';
import { cn } from '@/utils';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'rectangular' | 'circular' | 'text';
}

export function Skeleton({ className, variant = 'rectangular', ...props }: SkeletonProps) {
  const variants = {
    rectangular: 'rounded-md',
    circular: 'rounded-full',
    text: 'rounded-sm',
  };

  return (
    <div
      className={cn('animate-pulse bg-white/10', variants[variant], className)}
      {...props}
    />
  );
}
