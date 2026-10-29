import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  ShoppingCart,
  LogOut,
  User as UserIcon,
  Package,
  Layers3,
  Library,
  ClipboardList,
  ReceiptText,
  UsersRound,
} from 'lucide-react';
import { MobileNavigation } from './MobileNavigation';
import { ButtonLink } from '@/shared/components/ButtonLink';
import { useAuthStore } from '@/features/auth/model/useAuthStore';
import { useNotificationStore } from '@/features/notifications/model/useNotificationStore';
import { useReservationCartStore } from '@/features/reservation-cart';
import { isSellerUser } from '@/entities/account/model/types';
import { listingDiscoveryApi } from '@/features/discovery/api/listings';
import type { CardListing } from '@/entities/card/model/types';

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const isHydrating = useAuthStore((s) => s.isHydrating);
  const logout = useAuthStore((s) => s.logout);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const refreshUnreadCount = useNotificationStore((s) => s.refresh);
  const resetNotifications = useNotificationStore((s) => s.reset);
  const totalItems = useReservationCartStore((s) => s.getTotalItems());
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<CardListing[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLFormElement>(null);
  const isSeller = isSellerUser(user);
  const userId = user?.id;
  const isCardDiscoveryPage = location.pathname === '/cards';

  useEffect(() => {
    if (isHydrating) return;
    if (!token || !userId) {
      resetNotifications();
      return;
    }
    void refreshUnreadCount(`${userId}:${token}`);
  }, [isHydrating, token, userId, refreshUnreadCount, resetNotifications]);

  useEffect(() => {
    const query = searchQuery.trim();
    if (isCardDiscoveryPage || !query) {
      setSearchSuggestions([]);
      setIsSearchLoading(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setIsSearchLoading(true);
      void listingDiscoveryApi.getListings({ search: query, page: 0, size: 5 })
        .then((result) => {
          if (!cancelled) setSearchSuggestions(result.items.slice(0, 5));
        })
        .catch(() => {
          if (!cancelled) setSearchSuggestions([]);
        })
        .finally(() => {
          if (!cancelled) setIsSearchLoading(false);
        });
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [isCardDiscoveryPage, searchQuery]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setMenuOpen(false); setSearchOpen(false); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  function handleLogout() {
    setMenuOpen(false);
    logout();
    navigate('/');
  }

  function handleSearchSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const query = searchQuery.trim();
    navigate(query ? `/cards?search=${encodeURIComponent(query)}` : '/cards');
  }

  return (
    <nav aria-label="Marketplace navigation" className="sticky top-0 z-40 w-full bg-[#1b2336] border-b border-[rgba(143,179,226,0.2)]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
        <div className="flex items-center justify-between h-16 overflow-visible">

          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <MobileNavigation />
            <Link to="/" aria-label="Mythix home" className="flex items-center gap-2 group size-[86px]">
              <img src="/assets/mythix_logo_white_v3.png" alt="Mythix" className="size-full object-cover pointer-events-none" />
            </Link>
          </div>

          {/* Search Bar (the Cards page owns its search and filters) */}
          {!isCardDiscoveryPage && (
            <form ref={searchRef} onSubmit={handleSearchSubmit} className="relative flex-1 min-w-0 max-w-lg mx-4 hidden lg:block">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="search"
                  placeholder="Search cards..."
                  aria-label="Search cards"
                  value={searchQuery}
                  onFocus={() => {
                    if (searchQuery.trim()) setSearchOpen(true);
                  }}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchOpen(Boolean(e.target.value.trim()));
                  }}
                  className="block w-full h-11 rounded-xl pl-10 pr-3 border border-white/15 leading-5 bg-bg-input text-gray-100 placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue text-sm transition-colors"
                />
                <AnimatePresence>
                  {searchOpen && searchQuery.trim() && (
                    <motion.div role="listbox" aria-label="Card search suggestions" initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.98 }} transition={{ duration: 0.16, ease: 'easeOut' }} className="absolute left-0 top-[calc(100%+8px)] z-50 w-[360px] origin-top overflow-hidden rounded-xl border border-white/10 bg-bg-elevated p-2 shadow-2xl">
                      {isSearchLoading ? (
                        <p className="px-3 py-3 text-sm text-text-secondary">Searching cards...</p>
                      ) : searchSuggestions.length > 0 ? (
                        searchSuggestions.map((card) => (
                          <Link
                            key={card.id}
                            to={`/cards/${card.id}`}
                            role="option"
                            onClick={() => setSearchOpen(false)}
                            className="flex items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-white/10"
                          >
                            <img src={card.image || '/assets/expensive_card_1.png'} alt="" className="size-12 shrink-0 rounded-md bg-bg-base object-contain p-1" />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-white">{card.name}</span>
                              <span className="block truncate text-xs text-text-secondary">{card.set || card.game || 'Card'} · ฿{card.price.toLocaleString()}</span>
                            </span>
                          </Link>
                        ))
                      ) : (
                        <p className="px-3 py-3 text-sm text-text-secondary">No matching cards</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </form>
          )}

          {/* Right Actions */}
          <div className="flex items-center gap-2 lg:gap-3 text-sm font-semibold text-gray-300">
            <NavLink to="/" className={({ isActive }) => `hidden md:inline-flex min-h-11 items-center transition-colors ${isActive ? 'text-brand-blue' : 'hover:text-white'}`}>
              Home
            </NavLink>
            <NavLink to="/cards" className={({ isActive }) => `hidden md:inline-flex min-h-11 items-center transition-colors ${isActive ? 'text-brand-blue' : 'hover:text-white'}`}>
              Cards
            </NavLink>

            {isSeller && (
              <Link
                to="/workspace/listings"
                className="hidden md:inline-flex min-h-11 items-center text-sm font-semibold text-brand-blue transition-colors hover:text-white"
              >
                Workspace
              </Link>
            )}

            <Link
              to="/cart"
              aria-label="Reservation cart"
              className="relative hidden md:flex min-h-11 min-w-11 items-center justify-center text-gray-300 hover:text-white transition-colors"
              title="Reservation cart"
            >
              <span className="relative inline-flex size-[22px] shrink-0 items-center justify-center">
              <ShoppingCart size={22} strokeWidth={1.75} className="shrink-0" />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-brand-blue text-bg-base text-[10px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center ring-2 ring-[#1b2336]">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
              </span>
            </Link>

            <Link
              to="/notifications"
              aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
              className="relative flex min-h-11 min-w-11 items-center justify-center text-gray-300 hover:text-white transition-colors"
              title="Notifications"
            >
              <span className="relative inline-flex size-[22px] shrink-0 items-center justify-center">
              <Bell size={22} strokeWidth={1.75} className="shrink-0" />
              {unreadCount > 0 && (
                <span aria-hidden="true" className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 bg-status-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-[#1b2336]">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
              </span>
            </Link>

            {user ? (
              <div className="relative hidden md:block" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label={menuOpen ? 'Close account menu' : 'Open account menu'}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  className={`flex h-11 shrink-0 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-bg-elevated py-1 pl-1.5 pr-3 shadow-[0_2px_6px_rgba(0,0,0,0.18)] transition-[transform,border-color] active:translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue ${menuOpen ? 'border-brand-blue text-white' : 'hover:border-brand-blue/50'}`}
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt=""
                      className="size-8 rounded-full object-cover ring-1 ring-white/10"
                    />
                  ) : (
                    <span className="flex size-8 items-center justify-center rounded-full bg-brand-blue/20 text-xs font-bold text-brand-blue ring-1 ring-brand-blue/40">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="whitespace-nowrap text-[10px] font-semibold leading-none tracking-wide text-text-secondary">{user.role === 'ADMIN' ? 'ADMIN' : isSeller ? 'SELLER' : 'COLLECTOR'}</span>
                </button>

                <AnimatePresence>
                  {menuOpen && (
                  <motion.div
                    role="menu"
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    className="absolute right-0 top-[calc(100%+8px)] z-50 w-60 origin-top-right rounded-xl border border-white/10 bg-bg-elevated py-1.5 shadow-xl"
                  >
                    {user.role === 'ADMIN' && <>
                      <p className="px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">Administration</p>
                      <Link to="/admin" role="menuitem" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"><Layers3 size={16} />Admin dashboard</Link>
                      <Link to="/admin/seller-applications" role="menuitem" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"><UserIcon size={16} />Seller approvals</Link>
                      <Link to="/admin/orders" role="menuitem" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"><ReceiptText size={16} />Order monitoring</Link>
                      <Link to="/admin/users" role="menuitem" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"><UsersRound size={16} />Admin management</Link>
                      <Link to="/admin/audit-logs" role="menuitem" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"><ClipboardList size={16} />Audit trail</Link>
                      <div className="my-1.5 border-t border-white/10" />
                    </>}
                    {isSeller && (
                      <Link
                        to="/workspace/listings"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                      >
                        <Layers3 size={16} />
                        Card Listings
                      </Link>
                    )}
                    <Link
                      to="/profile"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                    >
                      <UserIcon size={16} />
                      Profile
                    </Link>
                    <Link
                      to="/orders"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                    >
                      <Package size={16} />
                      My Orders
                    </Link>
                    <Link
                      to="/collection"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                    >
                      <Library size={16} />
                      My Collection
                    </Link>
                    {isSeller && (
                      <Link
                        to="/workspace/orders"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                      >
                        <Package size={16} />
                        Seller Orders
                      </Link>
                    )}
                    <div className="my-1.5 border-t border-white/10" />
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-status-danger hover:bg-white/5 transition-colors"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <ButtonLink to="/login" size="sm" className="hidden md:inline-flex px-6">Login</ButtonLink>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
