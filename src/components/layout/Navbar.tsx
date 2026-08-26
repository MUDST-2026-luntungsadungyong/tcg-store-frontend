import { Link } from 'react-router-dom';
import { Search, ShoppingCart, User, LogOut, Package } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Badge } from '@/components/common/Badge';

export function Navbar() {
  // TODO: Replace with Zustand auth state
  const isLoggedIn = false;
  // TODO: Replace with Zustand cart state
  const cartItemCount = 2;

  return (
    <nav className="sticky top-0 z-40 w-full glass-card border-b border-white/10 rounded-none bg-bg-surface/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <Package className="h-8 w-8 text-brand-blue group-hover:text-brand-gold transition-colors" />
              <span className="font-bold text-xl text-white tracking-tight">
                Mythix<span className="text-brand-blue">TCG</span>
              </span>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-lg mx-8 hidden md:block">
            <Input 
              icon={Search} 
              placeholder="Search for cards, sets, or games..." 
              className="bg-bg-input/50"
            />
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            
            {/* Cart Button */}
            <Link to="/cart" className="relative p-2 text-gray-300 hover:text-white transition-colors">
              <ShoppingCart className="h-6 w-6" />
              {cartItemCount > 0 && (
                <Badge variant="danger" className="absolute -top-1 -right-1 px-1.5 min-w-[20px] justify-center">
                  {cartItemCount}
                </Badge>
              )}
            </Link>

            {/* Auth/Profile */}
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <Link to="/profile">
                  <Button variant="ghost" size="sm" className="gap-2 hidden sm:flex">
                    <User size={18} />
                    <span>Profile</span>
                  </Button>
                </Link>
                <Button variant="secondary" size="sm" className="gap-2">
                  <LogOut size={18} />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">Login</Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">Sign Up</Button>
                </Link>
              </div>
            )}
            
          </div>
        </div>
        
        {/* Mobile Search */}
        <div className="pb-3 md:hidden">
          <Input 
            icon={Search} 
            placeholder="Search cards..." 
            className="bg-bg-input/50"
          />
        </div>
      </div>
    </nav>
  );
}
