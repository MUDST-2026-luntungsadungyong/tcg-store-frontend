import { Bell, ChevronLeft, ChevronRight, ClipboardList, Layers3, Store } from 'lucide-react';
import { useState } from 'react';
import { Link, matchPath, useLocation } from 'react-router-dom';

import { cn } from '@/shared/lib';

const workspaceLinks = [
  {
    name: 'Card listings',
    to: '/workspace/listings',
    icon: Layers3,
  },
  {
    name: 'Reservation orders',
    to: '/workspace/orders',
    icon: ClipboardList,
  },
  { name: 'Store profile', to: '/workspace/store-settings', icon: Store },
  {
    name: 'Notifications',
    to: '/notifications',
    icon: Bell,
  },
] as const;

export function WorkspaceSidebar() {
  const { pathname } = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      aria-label="Seller workspace"
      className={cn(
        'hidden min-h-[calc(100vh-4rem)] shrink-0 flex-col bg-[#192338] shadow-[inset_0_0_0_1px_#31405A] transition-[width] duration-200 md:flex',
        isCollapsed ? 'w-[72px]' : 'w-[240px]',
      )}
    >
      <div
        className={cn(
          'flex items-center pt-6',
          isCollapsed ? 'justify-center px-3' : 'justify-between px-4',
        )}
      >
        {!isCollapsed && (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-blue">
            Trading workspace
          </p>
        )}
        <button
          type="button"
          aria-label={isCollapsed ? 'Expand workspace sidebar' : 'Collapse workspace sidebar'}
          aria-expanded={!isCollapsed}
          title={isCollapsed ? 'Expand workspace sidebar' : 'Collapse workspace sidebar'}
          onClick={() => setIsCollapsed((collapsed) => !collapsed)}
          className="flex h-8 w-8 items-center justify-center rounded-md text-brand-blue transition-colors hover:bg-[#243350] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
      <nav
        aria-label="Workspace navigation"
        className={cn('flex flex-col gap-1 py-6', isCollapsed ? 'px-2' : 'px-3')}
      >
        {workspaceLinks.map((link) => {
          const Icon = link.icon;
          const isActive = Boolean(
            matchPath({ path: `${link.to}/*`, end: false }, pathname) ||
              matchPath({ path: link.to, end: true }, pathname),
          );

          return (
            <Link
              key={link.to}
              to={link.to}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex h-11 items-center gap-3 rounded-[10px] text-sm text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue',
                isCollapsed ? 'justify-center px-2' : 'px-4',
                isActive ? 'bg-[#243350] font-bold' : 'hover:bg-[#243350]/60',
              )}
            >
              <Icon size={19} className="text-brand-blue" />
              <span className={cn(isCollapsed && 'sr-only')}>{link.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
