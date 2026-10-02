import { type HTMLAttributes } from 'react';
import { cn } from '@/shared/lib';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'rectangular' | 'circular' | 'text';
  shimmer?: boolean;
}

export function Skeleton({ className, variant = 'rectangular', shimmer = true, ...props }: SkeletonProps) {
  const variants = {
    rectangular: 'rounded-md',
    circular: 'rounded-full',
    text: 'rounded-sm',
  };

  return (
    <div
      className={cn(
        shimmer
          ? 'bg-gradient-to-r from-white/[0.03] via-white/[0.10] to-white/[0.03] bg-[length:200%_100%] animate-shimmer'
          : 'animate-pulse bg-white/10',
        variants[variant],
        className,
      )}
      aria-hidden="true"
      {...props}
    />
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col gap-3 rounded-xl bg-bg-surface p-4', className)}>
      {/* Card image */}
      <Skeleton className="h-44 w-full rounded-lg" />
      {/* Badge */}
      <Skeleton variant="text" className="h-4 w-16" />
      {/* Title */}
      <Skeleton variant="text" className="h-5 w-3/4" />
      {/* Price */}
      <Skeleton variant="text" className="h-5 w-1/3" />
      {/* Action button */}
      <Skeleton className="mt-1 h-9 w-full rounded-full" />
    </div>
  );
}

export function CardGridSkeleton({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function CollectionRowSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-4 rounded-lg bg-bg-surface px-4 py-3', className)}>
      <Skeleton variant="circular" className="h-10 w-10 shrink-0" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton variant="text" className="h-4 w-1/2" />
        <Skeleton variant="text" className="h-3 w-1/3" />
      </div>
      <Skeleton variant="text" className="h-4 w-16" />
    </div>
  );
}
