import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, LogOut, User as UserIcon, Package, ChevronDown } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { useAuthStore } from '@/store/useAuthStore';

export function Navbar() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
            <Link to="/" className="flex items-center gap-2 group size-[86px]">
              <img src="/assets/mythix_logo_white_v3.png" alt="Mythic Market" className="size-full object-cover pointer-events-none" />
            </Link>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-lg mx-8 hidden md:block">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search cards..."
                className="block w-[320px] h-[44px] pl-10 pr-3 border border-[rgba(165,201,249,0.3)] rounded-[22px] leading-5 bg-[#0b141f] text-gray-300 placeholder-[#808ca6] focus:outline-none focus:ring-1 focus:ring-brand-gold focus:border-brand-gold text-sm transition-colors"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-6 text-sm font-semibold text-gray-300">
            <Link to="/" className="hover:text-white transition-colors">
              Home
            </Link>
            
            <button className="relative text-gray-300 hover:text-white transition-colors">
              <Bell className="h-5 w-5" />
            </button>

            {user ? (
              <div className="relative" ref={menuRef}>
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

                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-[calc(100%+8px)] w-48 rounded-xl bg-bg-elevated border border-white/10 shadow-xl py-1.5 z-50"
                  >
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
