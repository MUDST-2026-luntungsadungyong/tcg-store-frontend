import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu, X, LogOut, ShieldCheck, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/features/auth/model/useAuthStore';
import { isSellerUser } from '@/entities/account/model/types';
import { useReservationCartStore } from '@/features/reservation-cart';
import { accountLinks, isMarketplaceLinkActive, marketplaceLinks, sellerLinks, workspaceLink } from './marketplaceNavigation';

import './MobileNavigation.css';

import { acquireBodyScrollLock } from '@/shared/lib/bodyScrollLock';

const cartLink = { to: '/cart', label: 'Reservation cart', icon: ShoppingCart };

export function MobileNavigation() {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const authRoute = /^\/(login|register|forgot-password|reset-password)\/?$/.test(location.pathname);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const count = useReservationCartStore((s) => s.getTotalItems());
  const seller = isSellerUser(user);
  const close = () => dialog.current?.close();

  useEffect(() => { if (dialog.current?.open) dialog.current.close(); }, [location.pathname, location.search]);
  useEffect(() => {
    const media = window.matchMedia?.('(min-width: 768px)');
    const onResize = () => { if (media?.matches) dialog.current?.close(); };
    if (!media) return;
    media.addEventListener('change', onResize);
    return () => media.removeEventListener('change', onResize);
  }, []);

  useEffect(() => { if (open) return acquireBodyScrollLock(); }, [open]);

  return <>
    <button ref={trigger} type="button" aria-label="Open navigation menu" aria-haspopup="dialog" aria-expanded={open} aria-controls="mobile-navigation-dialog" onClick={() => { dialog.current?.showModal(); setOpen(true); }} className="mr-2 flex size-11 items-center justify-center rounded-xl border border-white/10 bg-bg-elevated text-white focus-visible:ring-2 focus-visible:ring-brand-blue md:hidden"><Menu size={22} /></button>
    <dialog id="mobile-navigation-dialog" ref={dialog} aria-label="Navigation menu" onClose={() => { setOpen(false); trigger.current?.focus(); }} onClick={(event) => { if (event.target === event.currentTarget) close(); }} className="mobile-navigation-drawer fixed inset-y-0 left-0 right-auto m-0 h-dvh max-h-none w-[min(352px,90vw)] rounded-r-[28px] max-w-none border-r border-white/10 bg-bg-surface p-0 text-text-primary shadow-2xl backdrop:bg-black/60">
      <div className="flex h-full flex-col overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="mb-4 flex items-center justify-between">
          <Link to="/" onClick={close} aria-label="Mythix home" className="flex items-center gap-2">
            <span className="flex size-11 items-center justify-center overflow-hidden"><img src="/assets/mythix_logo_white_v3.png" alt="" className="size-20 max-w-none shrink-0 object-contain" /></span>
            <span className="text-lg font-semibold tracking-tight">Mythix</span>
          </Link>
          <button autoFocus type="button" aria-label="Close navigation menu" onClick={close} className="flex size-11 items-center justify-center rounded-xl text-text-secondary hover:bg-white/5 hover:text-white focus-visible:ring-2 focus-visible:ring-brand-blue"><X size={20} /></button>
        </div>
        {user && <NavLink to="/profile" end onClick={close} className="mb-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-bg-elevated p-3 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue">
          {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="size-12 shrink-0 rounded-full object-cover" /> : <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-blue/15 text-lg font-semibold text-brand-blue">{user.name.charAt(0).toUpperCase()}</span>}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-text-primary">{user.name}</span>
            <span className="mt-1 block text-[10px] font-semibold tracking-wide text-brand-blue">{user.role === 'ADMIN' ? 'ADMIN' : seller ? 'SELLER' : 'COLLECTOR'}</span>
            <span className="mt-1 block text-xs text-text-secondary">View Profile</span>
          </span>
          <ChevronRight size={18} className="text-text-muted" />
        </NavLink>}
        <nav aria-label="Primary mobile" className="flex flex-col gap-1">
          {[...marketplaceLinks, ...(seller ? [workspaceLink] : []), cartLink].map(({ to, label, icon: Icon }) => {
            const active = isMarketplaceLinkActive(to, location.pathname);
            return (
              <Link key={to} to={to} onClick={close} aria-current={active ? 'page' : undefined}
                className={`flex items-center justify-between rounded-xl px-3.5 py-3 text-sm font-semibold transition-colors ${active ? 'bg-brand-blue/10 text-brand-blue' : 'text-text-secondary hover:bg-white/5 hover:text-white'}`}>
                <span className="flex items-center gap-3">
                  <Icon size={20} className={to === '/vouchers' ? 'text-amber-400' : undefined} aria-hidden />
                  <span>{label}</span>
                </span>
                {to === '/cart' && count > 0 && <span className="rounded-full bg-brand-blue px-2 py-0.5 text-xs font-bold text-bg-base">{count > 99 ? '99+' : count}</span>}
              </Link>
            );
          })}
        </nav>
        {user && <nav aria-label="Account mobile" className="mt-6 border-t border-white/10 pt-4">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">Account</p>
          <div className="flex flex-col gap-1">
            {(seller ? [...accountLinks, ...sellerLinks] : accountLinks).map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} onClick={close}
                className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${isActive ? 'bg-brand-blue/10 text-brand-blue' : 'text-text-secondary hover:bg-white/5 hover:text-white'}`}>
                <Icon size={18} className={to === '/profile/vouchers' ? 'text-amber-400' : undefined} aria-hidden />
                <span>{label}</span>
              </NavLink>
            ))}
            {user.role === 'ADMIN' && <NavLink to="/admin" onClick={close} className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-brand-blue hover:bg-white/5"><ShieldCheck size={18} /><span>Admin Area</span></NavLink>}
          </div>
        </nav>}
        <div className="mt-auto border-t border-white/10 pt-4">
          {user ? (
            <button type="button" onClick={() => { logout(); close(); navigate('/'); }} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold text-status-danger hover:bg-white/5"><LogOut size={18} /><span>Logout</span></button>
          ) : !authRoute ? (
            <div className="flex flex-col gap-2">
              <Link to="/login" onClick={close} className="flex h-11 items-center justify-center rounded-xl bg-brand-blue text-sm font-semibold text-bg-base hover:bg-brand-blue/90">Log In</Link>
              <Link to="/register" onClick={close} className="flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm font-semibold text-white hover:bg-white/10">Sign Up</Link>
            </div>
          ) : null}
        </div>
      </div>
    </dialog>
  </>;
}
