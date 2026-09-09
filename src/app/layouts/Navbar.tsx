import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  ShoppingCart,
  LogOut,
  User as UserIcon,
  Package,
  ChevronDown,
  Layers3,
  Library,
} from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { useAuthStore } from '@/features/auth/model/useAuthStore';
import { useReservationCartStore } from '@/features/reservation-cart';

export function Navbar() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const totalItems = useReservationCartStore((s) => s.getTotalItems());
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isSeller = user?.role === 'SELLER';

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleLogout() {
    setMenuOpen(false);
    logout();
    navigate('/');
  }

  return (
    <nav className="sticky top-0 z-40 w-full bg-[#1b2336] border-b border-[rgba(143,179,226,0.2)]">
      <div className="max-w-[1440px] mx-auto px-8">
        <div className="flex items-center justify-between h-16 overflow-visible">

          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            {isSeller ? (
              <Link
                to="/"
                aria-label="TCG home"
                className="font-['IBM_Plex_Sans_Thai'] text-2xl font-bold text-[#DBE3F3] transition-colors hover:text-white"
              >
                TCG
              </Link>
            ) : (
              <Link to="/" className="flex items-center gap-2 group size-[86px]">
                <img src="/assets/mythix_logo_white_v3.png" alt="Mythix" className="size-full object-cover pointer-events-none" />
              </Link>
            )}
          </div>

          {/* Search Bar */}
          <div className={`flex-1 max-w-lg mx-8 hidden ${isSeller ? 'lg:block' : 'md:block'}`}>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className={`h-4 w-4 ${isSeller ? 'text-[#A5C9F9]' : 'text-gray-400'}`} />
              </div>
              <input
                type="text"
                placeholder="Search cards..."
                aria-label="Search cards"
                className={`block w-[320px] pl-10 pr-3 border border-[rgba(165,201,249,0.3)] leading-5 bg-[#0b141f] text-gray-300 placeholder-[#808ca6] focus:outline-none focus:ring-1 focus:ring-brand-gold focus:border-brand-gold text-sm transition-colors ${isSeller ? 'h-10 rounded-[20px]' : 'h-[44px] rounded-[22px]'}`}
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className={`flex items-center text-sm font-semibold text-gray-300 ${isSeller ? 'gap-4 xl:gap-10' : 'gap-6'}`}>
            <Link to="/" className={`hover:text-white transition-colors ${isSeller ? 'text-base text-[#DBE3F3]' : ''}`}>
              Home
            </Link>
            <Link to="/cards" className={`hover:text-white transition-colors ${isSeller ? 'text-base text-[#DBE3F3]' : ''}`}>
              Cards
            </Link>

            {isSeller ? (
              <Link
                to="/workspace/listings"
                className="text-sm font-semibold text-[#A5C9F9] transition-colors hover:text-white"
              >
                Workspace
              </Link>
            ) : (
              <>
                <Link to="/cart" className="relative text-gray-300 hover:text-white transition-colors" title="Reservation cart">
                  <ShoppingCart className="h-5 w-5" />
                  {totalItems > 0 && (
                    <span className="absolute -top-2 -right-2 bg-brand-blue text-bg-base text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center shadow-md">
                      {totalItems > 99 ? '99+' : totalItems}
                    </span>
                  )}
                </Link>

                <Link to="/notifications" aria-label="Notifications" className="relative text-gray-300 hover:text-white transition-colors">
                  <Bell className="h-5 w-5" />
                </Link>
              </>
            )}

            {user ? (
              <div className="relative" ref={menuRef}>
                {isSeller ? (
                  <button
                    type="button"
                    onClick={() => setMenuOpen((v) => !v)}
                    aria-label="Open seller account menu"
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    className={`flex h-[52px] w-[190px] items-center gap-2 rounded-[25px] border border-[rgba(165,201,249,0.4)] px-2 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A5C9F9] ${menuOpen ? 'bg-white/5' : 'hover:bg-white/5'}`}
                  >
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt=""
                        className="size-[41px] shrink-0 rounded-full object-cover ring-2 ring-[#96B3DF]"
                      />
                    ) : (
                      <span className="flex size-[41px] shrink-0 items-center justify-center rounded-full bg-[#96B3DF] text-[#1C1B1F] ring-1 ring-[#D9E6F8]">
                        <UserIcon size={27} strokeWidth={1.5} />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span className="min-w-0 truncate text-base font-semibold leading-[19px] text-[#DBE3F3]">
                          {user.name}
                        </span>
                        <span className="shrink-0 rounded-[10px] bg-[#4D5973] px-2 py-0.5 text-[10px] font-semibold leading-3 text-[#DBE3F3]">
                          SELLER
                        </span>
                      </span>
                      <span className="block truncate text-[11px] font-light leading-4 text-[#DBE3F3]">
                        {user.email}
                      </span>
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setMenuOpen((v) => !v)}
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    className={`flex items-center gap-2 rounded-full transition-colors focus:outline-none ${menuOpen ? 'text-white' : 'hover:text-white'}`}
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
                    <span className="hidden lg:inline">{user.name}</span>
                    <ChevronDown size={16} className={`transition-transform ${menuOpen ? 'rotate-180 text-white' : ''}`} />
                  </button>
                )}

                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-[calc(100%+8px)] w-48 rounded-xl bg-bg-elevated border border-white/10 shadow-xl py-1.5 z-50"
                  >
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
                      to={isSeller ? '/workspace/listings' : '/profile'}
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                    >
                      {isSeller ? <Package size={16} /> : <UserIcon size={16} />}
                      {isSeller ? 'Listings' : 'Profile'}
                    </Link>
                    <Link
                      to={isSeller ? '/workspace/orders' : '/orders'}
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                    >
                      <Package size={16} />
                      {isSeller ? 'Seller Orders' : 'My Orders'}
                    </Link>
                    {!isSeller && (
                      <Link
                        to="/collection"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                      >
                        <Library size={16} />
                        My Collection
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
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login">
                <Button variant="primary" size="sm" className="bg-white hover:bg-gray-100 text-[#151B2B] rounded-full px-6 py-1.5 font-bold">
                  Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
