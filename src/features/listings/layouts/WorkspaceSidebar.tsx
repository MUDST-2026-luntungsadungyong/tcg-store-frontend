import { Bell, ClipboardList, Layers3, Store } from 'lucide-react';
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

  return (
    <aside
      aria-label="Seller workspace"
      className="hidden min-h-[calc(100vh-4rem)] w-[240px] shrink-0 flex-col bg-[#192338] shadow-[inset_0_0_0_1px_#31405A] md:flex"
    >
      <div className="px-6 pt-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-blue">
          Trading workspace
        </p>
      </div>
      <nav aria-label="Workspace navigation" className="flex flex-col gap-1 px-3 py-6">
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
                'flex h-11 items-center gap-3 rounded-[10px] px-4 text-sm text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue',
                isActive ? 'bg-[#243350] font-bold' : 'hover:bg-[#243350]/60',
              )}
            >
              <Icon size={19} className="text-brand-blue" />
              {link.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
