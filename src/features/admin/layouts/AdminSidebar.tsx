import { ClipboardList, LayoutDashboard, Menu, ReceiptText, ShieldCheck, UsersRound, X } from 'lucide-react';
import { useState } from 'react';
import { Link, matchPath, useLocation } from 'react-router-dom';

import { cn } from '@/shared/lib';

const adminLinks = [
  { name: 'Overview', to: '/admin', icon: LayoutDashboard },
  { name: 'Seller approvals', to: '/admin/seller-applications', icon: ShieldCheck },
  { name: 'Order monitoring', to: '/admin/orders', icon: ReceiptText },
  { name: 'User management', to: '/admin/users', icon: UsersRound },
  { name: 'Audit trail', to: '/admin/audit-logs', icon: ClipboardList },
] as const;

function AdminLinks({ compact = false, onNavigate }: { compact?: boolean; onNavigate?: () => void }) {
  const { pathname } = useLocation();
  return <nav aria-label="Administration navigation" className={cn('space-y-1 p-3', compact && 'px-2')}>
    {adminLinks.map(({ name, to, icon: Icon }) => {
      const active = Boolean(matchPath({ path: to, end: true }, pathname));
      return <Link key={to} to={to} onClick={onNavigate} title={compact ? name : undefined} aria-label={compact ? name : undefined} aria-current={active ? 'page' : undefined} className={cn('flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-blue', compact && 'justify-center px-0', active ? 'bg-brand-blue/15 text-white ring-1 ring-brand-blue/30' : 'text-gray-300 hover:bg-white/[0.06] hover:text-white')}><Icon size={18} className={active ? 'text-brand-blue' : 'text-gray-400'} aria-hidden="true" /><span className={cn(compact && 'sr-only')}>{name}</span></Link>;
    })}
  </nav>;
}

export function AdminSidebar() {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" onClick={() => setOpen(true)} aria-label="Open administration navigation" aria-expanded={open} className="fixed bottom-5 right-5 z-30 flex min-h-11 items-center gap-2 rounded-full border border-brand-blue/40 bg-bg-elevated px-4 text-sm font-semibold text-white shadow-xl transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand-blue md:hidden"><Menu size={18} aria-hidden="true" />Admin menu</button>
    <aside aria-label="Platform administration" className="hidden w-20 shrink-0 border-r border-white/10 bg-bg-elevated md:block lg:w-64"><div className="border-b border-white/10 px-3 py-6 text-center lg:px-6 lg:text-left"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-gold lg:hidden">M</p><p className="hidden text-xs font-semibold uppercase tracking-[0.16em] text-brand-gold lg:block">Mythix TCG</p><p className="mt-1 hidden text-lg font-semibold text-white lg:block">Administration</p></div><div className="lg:hidden"><AdminLinks compact /></div><div className="hidden lg:block"><AdminLinks /></div><div className="mx-3 hidden border-t border-white/10 px-3 py-5 text-xs leading-5 text-gray-400 lg:block">Sensitive decisions are retained in the audit trail.</div></aside>
    {open && <div className="fixed inset-0 z-50 md:hidden"><button type="button" aria-label="Close administration navigation" className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} /><aside role="dialog" aria-modal="true" aria-label="Administration navigation" className="relative h-full w-[min(20rem,85vw)] border-r border-white/10 bg-bg-elevated shadow-2xl"><div className="flex items-start justify-between border-b border-white/10 px-6 py-6"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-gold">Mythix TCG</p><p className="mt-1 text-lg font-semibold text-white">Administration</p></div><button type="button" onClick={() => setOpen(false)} aria-label="Close administration navigation" className="flex size-11 items-center justify-center rounded-xl text-gray-300 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand-blue"><X size={20} aria-hidden="true" /></button></div><AdminLinks onNavigate={() => setOpen(false)} /></aside></div>}
  </>;
}
