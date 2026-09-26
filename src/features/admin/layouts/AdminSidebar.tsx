import { ClipboardList, LayoutDashboard, Menu, PanelLeftClose, PanelLeftOpen, ReceiptText, Settings, ShieldCheck, UsersRound, X } from 'lucide-react';
import { useState } from 'react';
import { Link, matchPath, useLocation } from 'react-router-dom';

import { cn } from '@/shared/lib';

type NavItem = { name: string; to: string; icon: typeof LayoutDashboard };

const mainLinks: NavItem[] = [
  { name: 'Overview', to: '/admin', icon: LayoutDashboard },
  { name: 'Seller approvals', to: '/admin/seller-applications', icon: ShieldCheck },
  { name: 'Order monitoring', to: '/admin/orders', icon: ReceiptText },
  { name: 'User management', to: '/admin/users', icon: UsersRound },
];

const systemLinks: NavItem[] = [{ name: 'Audit trail', to: '/admin/audit-logs', icon: ClipboardList }];

function NavigationItem({ item, compact, onNavigate }: { item: NavItem; compact: boolean; onNavigate?: () => void }) {
  const { pathname } = useLocation();
  const active = Boolean(matchPath({ path: item.to, end: true }, pathname));
  const Icon = item.icon;
  return <Link to={item.to} onClick={onNavigate} title={compact ? item.name : undefined} aria-label={compact ? item.name : undefined} aria-current={active ? 'page' : undefined} className={cn('relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-blue', compact && 'justify-center px-0', active ? 'bg-brand-gold/10 text-white before:absolute before:bottom-2 before:left-0 before:top-2 before:w-0.5 before:rounded-r-full before:bg-brand-gold' : 'text-slate-300 hover:bg-white/[0.045] hover:text-white')}><Icon size={18} strokeWidth={1.8} className={cn('shrink-0', active ? 'text-brand-gold' : 'text-slate-400')} aria-hidden="true" /><span className={cn(compact && 'sr-only')}>{item.name}</span></Link>;
}

function NavigationSection({ label, items, compact, onNavigate }: { label: string; items: NavItem[]; compact: boolean; onNavigate?: () => void }) {
  return <section className="mt-6 first:mt-0" aria-label={label}><p className={cn('mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500', compact && 'sr-only')}>{label}</p><div className="space-y-1">{items.map((item) => <NavigationItem key={item.to} item={item} compact={compact} onNavigate={onNavigate} />)}</div></section>;
}

function SidebarNavigation({ compact = false, onNavigate }: { compact?: boolean; onNavigate?: () => void }) {
  return <nav aria-label="Administration navigation" className={cn('p-3', compact && 'px-2')}><NavigationSection label="Main" items={mainLinks} compact={compact} onNavigate={onNavigate} /><NavigationSection label="System" items={systemLinks} compact={compact} onNavigate={onNavigate} /><section className="mt-6" aria-label="Others"><p className={cn('mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500', compact && 'sr-only')}>Others</p><button type="button" disabled title="Administration settings are not available in the current application" aria-label={compact ? 'Settings unavailable' : undefined} className={cn('flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium text-slate-500 transition', compact && 'justify-center px-0')}><Settings size={18} strokeWidth={1.8} aria-hidden="true" /><span className={cn(compact && 'sr-only')}>Settings</span></button></section></nav>;
}

function BrandHeader({ collapsed, onToggle }: { collapsed: boolean; onToggle?: () => void }) {
  return <div className={cn('flex h-[84px] min-w-0 items-center border-b border-white/10', collapsed ? 'flex-col justify-center gap-1' : 'gap-2.5 px-4')}>
    <span className={cn('flex shrink-0 items-center justify-center overflow-hidden', collapsed ? 'h-9 w-9' : 'h-10 w-10')}>
      <img src="/assets/mythix_logo_white_v3.png" alt="MYTHIX TCG" className="h-full w-full scale-[2.1] object-contain" />
    </span>
    <div className={cn('min-w-0 flex-1', collapsed && 'sr-only')}>
      <p className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-gold">MYTHIX TCG</p>
      <p className="mt-0.5 truncate text-base font-semibold leading-tight text-white">Administration</p>
    </div>
    {onToggle && <button type="button" onClick={onToggle} aria-label={collapsed ? 'Expand administration sidebar' : 'Collapse administration sidebar'} aria-expanded={!collapsed} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/[0.06] hover:text-white focus:outline-none focus:ring-2 focus:ring-brand-blue">
      {collapsed ? <PanelLeftOpen size={18} aria-hidden="true" /> : <PanelLeftClose size={18} aria-hidden="true" />}
    </button>}
  </div>;
}

export function AdminSidebar() {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  return <>
    <button type="button" onClick={() => setOpen(true)} aria-label="Open administration navigation" aria-expanded={open} className="fixed bottom-5 right-5 z-30 flex min-h-11 items-center gap-2 rounded-full border border-brand-blue/40 bg-bg-elevated px-4 text-sm font-semibold text-white shadow-xl transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand-blue md:hidden"><Menu size={18} aria-hidden="true" />Admin menu</button>
    <aside aria-label="Platform administration" className={cn('sticky top-0 hidden h-[calc(100dvh-4rem)] min-w-0 shrink-0 overflow-hidden border-r border-white/10 bg-bg-elevated transition-[width] duration-200 ease-out md:block', collapsed ? 'w-20' : 'w-[280px] md:max-lg:w-20')}><div className="lg:hidden"><BrandHeader collapsed /></div><div className="hidden lg:block"><BrandHeader collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} /></div><div className="lg:hidden"><SidebarNavigation compact /></div><div className={cn('hidden lg:block', collapsed && '!block')}><SidebarNavigation compact={collapsed} /></div></aside>
    {open && <div className="fixed inset-0 z-50 md:hidden"><button type="button" aria-label="Close administration navigation" className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} /><aside role="dialog" aria-modal="true" aria-label="Administration navigation" className="relative h-full w-[min(17.5rem,85vw)] overflow-hidden border-r border-white/10 bg-bg-elevated shadow-2xl"><div className="flex h-[84px] items-center justify-between border-b border-white/10 px-5"><div className="flex min-w-0 items-center gap-3"><img src="/assets/mythix_logo_white_v3.png" alt="MYTHIX TCG" className="h-9 w-9 shrink-0 object-contain" /><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-gold">MYTHIX TCG</p><p className="mt-1 text-lg font-semibold text-white">Administration</p></div></div><button type="button" onClick={() => setOpen(false)} aria-label="Close administration navigation" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-300 transition hover:bg-white/[0.06] hover:text-white focus:outline-none focus:ring-2 focus:ring-brand-blue"><X size={20} aria-hidden="true" /></button></div><SidebarNavigation onNavigate={() => setOpen(false)} /></aside></div>}
  </>;
}
