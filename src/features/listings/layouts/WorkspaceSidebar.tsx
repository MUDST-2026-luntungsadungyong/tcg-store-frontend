import {
  Bell,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Layers3,
  Menu,
  Store,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
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

export function WorkspaceMobileNavigation() {
  const { pathname } = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);

  return (
    <div className="-mx-6 -mt-6 mb-6 border-b border-[#31405A] bg-[#192338] px-6 py-3 md:hidden">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Open workspace menu"
          aria-expanded={isOpen}
          aria-controls="mobile-workspace-menu"
          onClick={() => setIsOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-brand-blue transition-colors hover:bg-[#243350] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
        >
          <Menu size={22} />
        </button>
        <p className="text-sm font-semibold text-white">Workspace</p>
      </div>

      {isOpen && (
        <>
          <button
            type="button"
            aria-label="Dismiss workspace menu"
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40 bg-black/50"
          />
          <nav
            id="mobile-workspace-menu"
            aria-label="Mobile workspace navigation"
            className="fixed inset-y-0 left-0 z-50 flex w-[min(19rem,85vw)] flex-col bg-[#192338] p-5 shadow-2xl"
          >
            <div className="mb-7 flex items-center justify-between">
              <p className="text-base font-bold text-white">Seller workspace</p>
              <button
                type="button"
                aria-label="Close workspace menu"
                onClick={() => setIsOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-brand-blue transition-colors hover:bg-[#243350] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
              >
                <X size={22} />
              </button>
            </div>
            <div className="flex flex-col gap-2">
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
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      'flex h-12 items-center gap-3 rounded-[10px] px-4 text-sm text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue',
                      isActive ? 'bg-[#243350] font-bold' : 'hover:bg-[#243350]/60',
                    )}
                  >
                    <Icon size={19} className="text-brand-blue" />
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
