import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/shared/lib';

/** Content wrapper; the route layout owns the main landmark. */
export function PageContainer({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mythix-page', className)} {...props} />;
}

interface PageHeaderProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ title, description, eyebrow, actions, className, ...props }: PageHeaderProps) {
  return (
    <header className={cn('flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between', className)} {...props}>
      <div className="min-w-0">
        {eyebrow && <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-brand-blue">{eyebrow}</p>}
        <h1 className="text-3xl font-bold tracking-tight text-white">{title}</h1>
        {description && <p className="mt-2 text-sm leading-relaxed text-gray-400">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
    </header>
  );
}

export function Panel({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={cn('rounded-2xl border border-white/10 bg-bg-card p-4 sm:p-5', className)} {...props} />;
}

export function Toolbar({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-center', className)} {...props} />;
}
