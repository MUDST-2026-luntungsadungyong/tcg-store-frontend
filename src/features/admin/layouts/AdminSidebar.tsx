import {
  ChevronLeft,
  ClipboardList,
  LayoutDashboard,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ReceiptText,
  ShieldCheck,
  Store,
  UsersRound,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, matchPath, useLocation } from 'react-router-dom';

import { useAuthStore } from '@/features/auth/model/useAuthStore';
import { cn } from '@/shared/lib';

type NavItem = {
  name: string;
  to: string;
  icon: typeof LayoutDashboard;
  badge?: string | number;
};

const mainLinks: NavItem[] = [
  { name: 'Overview', to: '/admin', icon: LayoutDashboard },
  { name: 'Seller approvals', to: '/admin/seller-applications', icon: ShieldCheck },
  { name: 'Admin management', to: '/admin/users', icon: UsersRound },
];

const monitoringLinks: NavItem[] = [
  { name: 'Order monitoring', to: '/admin/orders', icon: ReceiptText },
  { name: 'Audit trail', to: '/admin/audit-logs', icon: ClipboardList },
];

const STORAGE_KEY = 'mythix_admin_sidebar_collapsed';

function NavigationItem({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const { pathname } = useLocation();
  const active = Boolean(
    matchPath({ path: item.to, end: true }, pathname) ||
      (item.to !== '/admin' && matchPath({ path: `${item.to}/*`, end: false }, pathname))
  );
  const Icon = item.icon;

  return (
    <div className="group relative">
      <Link
        to={item.to}
        onClick={onNavigate}
        aria-current={active ? 'page' : undefined}
        aria-label={collapsed ? item.name : undefined}
        className={cn(
          'relative flex h-11 items-center gap-3 rounded-xl text-sm font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-blue',
          collapsed ? 'justify-center px-0' : 'px-3',
          active
            ? 'bg-brand-gold/10 text-white font-semibold shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] before:absolute before:bottom-1.5 before:left-0 before:top-1.5 before:w-1 before:rounded-r-full before:bg-brand-gold'
            : 'text-slate-400 hover:bg-white/[0.05] hover:text-white'
        )}
      >
        <Icon
          size={19}
          strokeWidth={active ? 2.2 : 1.8}
          className={cn(
            'shrink-0 transition-transform duration-150 group-hover:scale-110',
            active ? 'text-brand-gold drop-shadow-[0_0_8px_rgba(212,175,55,0.3)]' : 'text-slate-400 group-hover:text-white'
          )}
          aria-hidden="true"
        />

        {/* Text Label with Smooth Collapse Transition */}
        <span
          className={cn(
            'truncate transition-all duration-200',
            collapsed ? 'sr-only w-0 opacity-0' : 'w-auto opacity-100'
          )}
        >
          {item.name}
        </span>

        {/* Badge if present */}
        {item.badge !== undefined && !collapsed && (
          <span className="ml-auto rounded-full bg-brand-blue/20 px-2 py-0.5 text-[10px] font-bold text-brand-blue">
            {item.badge}
          </span>
        )}
      </Link>

      {/* Floating Tooltip in Collapsed Mode */}
      {collapsed && (
        <div
          role="tooltip"
          className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 scale-95 rounded-lg border border-white/15 bg-bg-surface px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-2xl backdrop-blur transition-all duration-150 group-hover:scale-100 group-hover:opacity-100 whitespace-nowrap"
        >
          {item.name}
          {item.badge !== undefined && (
            <span className="ml-1.5 rounded-full bg-brand-blue px-1.5 py-0.2 text-[10px] text-bg-base">
              {item.badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function NavigationSection({
  label,
  items,
  collapsed,
  onNavigate,
}: {
  label: string;
  items: NavItem[];
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <section aria-label={label} className="mt-5 first:mt-0">
      <div className="px-3 mb-2">
        {collapsed ? (
          <div className="h-px w-full bg-white/10 my-2" />
        ) : (
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
            {label}
          </p>
        )}
      </div>
      <div className="space-y-1">
        {items.map((item) => (
          <NavigationItem
            key={item.to}
            item={item}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </section>
  );
}

function BrandHeader({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle?: () => void;
}) {
  return (
    <div
      className={cn(
        'flex items-center border-b border-white/10 transition-all duration-300',
        collapsed ? 'h-20 justify-center px-2' : 'h-20 justify-between px-4'
      )}
    >
      <Link
        to="/admin"
        className={cn(
          'flex min-w-0 items-center gap-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue',
          collapsed ? 'justify-center' : ''
        )}
      >
        <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/[0.04] p-1.5 ring-1 ring-white/10">
          <img
            src="/assets/mythix_logo_white_v3.png"
            alt="MYTHIX TCG"
            className="size-full object-contain"
          />
        </span>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-[10px] font-bold uppercase tracking-[0.18em] text-brand-gold">
              MYTHIX TCG
            </p>
            <p className="truncate text-base font-bold tracking-tight text-white">
              Administration
            </p>
          </div>
        )}
      </Link>

      {onToggle && !collapsed && (
        <button
          type="button"
          onClick={onToggle}
          aria-label="Collapse administration sidebar"
          aria-expanded={!collapsed}
          title="Collapse sidebar (Ctrl+B)"
          className="flex size-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-white/[0.08] hover:text-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
        >
          <PanelLeftClose size={18} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

function SidebarFooter({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle?: () => void;
}) {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="border-t border-white/10 p-3">
      {/* Marketplace link */}
      <div className="mb-2">
        <Link
          to="/cards"
          title={collapsed ? 'View Marketplace' : undefined}
          className={cn(
            'flex h-10 items-center gap-2.5 rounded-xl text-xs font-medium text-slate-400 transition hover:bg-white/[0.04] hover:text-white',
            collapsed ? 'justify-center px-0' : 'px-3'
          )}
        >
          <Store size={16} className="shrink-0 text-slate-400" />
          <span className={cn(collapsed && 'sr-only')}>Public Marketplace</span>
        </Link>
      </div>

      {collapsed ? (
        /* Collapsed Mode: Clean Centered Stack */
        <div className="flex flex-col items-center gap-2">
          {/* User Avatar with Floating Tooltip */}
          <div className="group relative flex justify-center py-0.5">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt=""
                className="size-9 shrink-0 rounded-full object-cover ring-1 ring-white/20"
              />
            ) : (
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-blue/20 text-xs font-bold text-brand-blue ring-1 ring-brand-blue/30">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </span>
            )}
            <div
              role="tooltip"
              className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 scale-95 rounded-lg border border-white/15 bg-bg-surface px-3 py-1.5 text-xs text-white opacity-0 shadow-2xl backdrop-blur transition-all duration-150 group-hover:scale-100 group-hover:opacity-100 whitespace-nowrap"
            >
              <p className="font-semibold">{user?.name || 'Administrator'}</p>
              <p className="text-[10px] text-slate-400">{user?.email || 'Platform Admin'}</p>
            </div>
          </div>

          {/* Expand Toggle Button */}
          {onToggle && (
            <button
              type="button"
              onClick={onToggle}
              aria-label="Expand administration sidebar"
              title="Expand sidebar (Ctrl+B)"
              className="flex size-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-400 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
            >
              <PanelLeftOpen size={16} />
            </button>
          )}
        </div>
      ) : (
        /* Expanded Mode: Full Card + Collapse Button */
        <>
          <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt=""
                className="size-9 shrink-0 rounded-full object-cover ring-1 ring-white/20"
              />
            ) : (
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-blue/20 text-xs font-bold text-brand-blue ring-1 ring-brand-blue/30">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </span>
            )}

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">
                {user?.name || 'Administrator'}
              </p>
              <p className="truncate text-[10px] text-slate-400">
                {user?.email || 'Platform Admin'}
              </p>
            </div>
          </div>

          {onToggle && (
            <button
              type="button"
              onClick={onToggle}
              className="mt-2.5 flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-white/5 bg-white/[0.02] text-[11px] font-medium text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
            >
              <ChevronLeft size={14} />
              <span>Collapse sidebar</span>
              <kbd className="ml-1.5 rounded border border-white/10 bg-black/30 px-1.5 py-0.5 text-[9px] font-mono text-slate-500">
                Ctrl+B
              </kbd>
            </button>
          )}
        </>
      )}
    </div>
  );
}

export function AdminSidebar() {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // Ignore localStorage errors
      }
      return next;
    });
  }, []);

  // Keyboard shortcut: Ctrl+B / Cmd+B to toggle collapse
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b') {
        const target = event.target as HTMLElement;
        if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
        event.preventDefault();
        toggleCollapsed();
      }
      if (event.key === 'Escape' && open) {
        setOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, toggleCollapsed]);

  return (
    <>
      {/* Mobile Floating Menu Button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open administration navigation"
        aria-expanded={open}
        className="fixed bottom-5 right-5 z-40 flex min-h-11 items-center gap-2 rounded-full border border-brand-blue/40 bg-bg-elevated/95 px-4 text-sm font-semibold text-white shadow-2xl backdrop-blur transition-all duration-200 hover:scale-105 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand-blue md:hidden"
      >
        <Menu size={18} aria-hidden="true" className="text-brand-blue" />
        <span>Admin menu</span>
      </button>

      {/* Desktop / Tablet Sidebar */}
      <aside
        aria-label="Platform administration"
        className={cn(
          'hidden h-full shrink-0 flex-col border-r border-white/10 bg-bg-elevated transition-[width] duration-300 ease-in-out md:flex',
          collapsed ? 'w-[72px]' : 'w-[270px]'
        )}
      >
        {/* Brand Header */}
        <BrandHeader collapsed={collapsed} onToggle={toggleCollapsed} />

        {/* Scrollable Navigation List */}
        <nav
          aria-label="Administration navigation"
          className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-4"
        >
          <NavigationSection
            label="Main"
            items={mainLinks}
            collapsed={collapsed}
          />
          <NavigationSection
            label="Monitoring & Logs"
            items={monitoringLinks}
            collapsed={collapsed}
          />
        </nav>

        {/* Sidebar Footer with Admin Profile and Toggle */}
        <SidebarFooter collapsed={collapsed} onToggle={toggleCollapsed} />
      </aside>

      {/* Mobile Navigation Drawer (Slide-out Sheet) */}
      <div
        className={cn(
          'fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 md:hidden',
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        )}
      >
        {/* Backdrop overlay */}
        <button
          type="button"
          aria-label="Close administration navigation"
          onClick={() => setOpen(false)}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        />

        {/* Drawer container */}
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Administration navigation"
          className={cn(
            'relative flex h-full w-[min(18.5rem,85vw)] flex-col border-r border-white/10 bg-bg-elevated shadow-2xl transition-transform duration-300 ease-out',
            open ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          {/* Drawer Header */}
          <div className="flex h-20 items-center justify-between border-b border-white/10 px-5">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] p-1.5 ring-1 ring-white/10">
                <img
                  src="/assets/mythix_logo_white_v3.png"
                  alt="MYTHIX TCG"
                  className="size-full object-contain"
                />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-gold">
                  MYTHIX TCG
                </p>
                <p className="text-base font-bold text-white">Administration</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close administration navigation"
              className="flex size-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/[0.08] hover:text-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          {/* Drawer Navigation */}
          <nav
            aria-label="Mobile administration navigation"
            className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
          >
            <NavigationSection
              label="Main"
              items={mainLinks}
              collapsed={false}
              onNavigate={() => setOpen(false)}
            />
            <NavigationSection
              label="Monitoring & Logs"
              items={monitoringLinks}
              collapsed={false}
              onNavigate={() => setOpen(false)}
            />
          </nav>

          {/* Drawer Footer */}
          <SidebarFooter collapsed={false} />
        </aside>
      </div>
    </>
  );
}
