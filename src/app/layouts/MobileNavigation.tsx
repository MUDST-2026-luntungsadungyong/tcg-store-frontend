import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, Library, ShoppingCart, Menu, X, LogOut, Package, Layers3, Store, ShieldCheck, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/features/auth/model/useAuthStore';
import { isSellerUser } from '@/entities/account/model/types';
import { useReservationCartStore } from '@/features/reservation-cart';

import './MobileNavigation.css';

import { acquireBodyScrollLock } from '@/shared/lib/bodyScrollLock';

const destinations = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/cards', label: 'Cards', icon: Search },
  { to: '/collection', label: 'Collection', icon: Library },
  { to: '/cart', label: 'Cart', icon: ShoppingCart },
];

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
        {user && <Link to="/profile" onClick={close} className="mb-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-bg-elevated p-3 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue">
          {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="size-12 shrink-0 rounded-full object-cover" /> : <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-blue/15 text-lg font-semibold text-brand-blue">{user.name.charAt(0).toUpperCase()}</span>}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-text-primary">{user.name}</span>
            <span className="mt-1 block text-[10px] font-semibold tracking-wide text-brand-blue">{user.role === 'ADMIN' ? 'ADMIN' : seller ? 'SELLER' : 'COLLECTOR'}</span>
            <span className="mt-1 block text-xs text-text-secondary">View Profile</span>
          </span>
          <ChevronRight size={16} className="shrink-0 text-text-muted" />
        </Link>}
        <nav aria-label="Account navigation" className="space-y-1">
          {[
            { to: '/cards', label: 'Explore cards', icon: Search },
            { to: '/collection', label: 'My Collection', icon: Library },
            { to: '/orders', label: 'My Orders', icon: Package },
          ].map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} onClick={close} className={({ isActive }) => `flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium ${isActive ? 'bg-brand-blue/10 text-brand-blue' : 'text-text-secondary hover:bg-white/5 hover:text-white'}`}><Icon size={20} strokeWidth={1.75} />{label}</NavLink>)}
          {(seller || user?.role === 'ADMIN') && <div className="!my-4 border-t border-white/10" />}
          {[
            ...(seller ? [{ to: '/workspace/listings', label: 'Workspace', icon: Layers3 }, { to: '/workspace/orders', label: 'Seller Orders', icon: Package }, { to: '/workspace/store-settings', label: 'Store Profile', icon: Store }] : []),
            ...(user?.role === 'ADMIN' ? [{ to: '/admin', label: 'Admin dashboard', icon: ShieldCheck }] : []),
          ].map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} onClick={close} className={({ isActive }) => `flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium ${isActive ? 'bg-brand-blue/10 text-brand-blue' : 'text-text-secondary hover:bg-white/5 hover:text-white'}`}><Icon size={20} strokeWidth={1.75} />{label}</NavLink>)}
        </nav>
        <div className="mt-4 border-t border-white/10 pt-3">
          {user ? <button type="button" onClick={() => { close(); logout(); navigate('/'); }} className="flex min-h-12 w-full items-center gap-3 rounded-xl px-4 text-sm text-status-danger hover:bg-white/5"><LogOut size={20} strokeWidth={1.75} />Logout</button> : <Link to="/login" onClick={close} className="flex min-h-12 items-center justify-center rounded-xl bg-brand-blue font-semibold text-bg-base">Login</Link>}
        </div>
      </div>
    </dialog>
    {!authRoute && <nav aria-label="Mobile primary navigation" className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 mx-auto grid max-w-[480px] grid-cols-4 rounded-[24px] border border-white/15 bg-bg-elevated p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.4)] md:hidden">
      {destinations.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue ${isActive ? 'bg-brand-blue/10 text-brand-blue' : 'text-text-secondary hover:text-white'}`}>
        <span className="relative"><Icon size={22} />{to === '/cart' && count > 0 && <span className="absolute -right-3 -top-2 rounded-full bg-brand-blue px-1 text-[9px] text-bg-base" aria-label={`${count} items`}>{count > 99 ? '99+' : count}</span>}</span>{label}
      </NavLink>)}
    </nav>}
  </>;
}
