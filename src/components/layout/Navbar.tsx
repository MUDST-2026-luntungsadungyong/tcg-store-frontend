import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, User } from 'lucide-react';
import { Button } from '@/components/common/Button';

export function Navbar() {
  // Mock state for demonstrating both auth and non-auth states as requested.
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <nav className="sticky top-0 z-40 w-full bg-[#131B2A] h-[88px] flex items-center border-b border-white/5 shadow-md">
      <div className="max-w-[1600px] w-full mx-auto px-6 md:px-12 flex items-center justify-between">
        
        {/* Left: Logo */}
        <div className="flex-shrink-0 flex items-center h-full py-1">
          <Link to="/" className="flex items-center group">
            <img 
              src="/assets/Mythix_logo_white_version.png" 
              alt="Mythic Market" 
              className="h-16 md:h-20 w-auto max-h-[80px] object-contain transition-transform group-hover:scale-105 duration-300 scale-125 origin-left" 
            />
          </Link>
        </div>

        {/* Middle: Search Bar */}
        <div className="flex-1 max-w-[500px] mx-8 hidden md:block">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-[18px] w-[18px] text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search cards..."
              className="block w-full pl-12 pr-4 py-2.5 rounded-full bg-[#0B141F] border border-white/5 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#EAB308] text-[14px] transition-colors"
            />
          </div>
        </div>

        {/* Right: Links & Auth */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-8 text-[14px] font-bold text-white">
            <Link to="/" className="hover:text-[#EAB308] transition-colors">
              Home
            </Link>
            <Link to="/browse" className="hover:text-[#EAB308] transition-colors">
              Browse Cards
            </Link>
          </div>

          {/* Toggle for Dev: Double click the auth area to switch states */}
          <div onDoubleClick={() => setIsAuthenticated(!isAuthenticated)} className="cursor-pointer">
            {isAuthenticated ? (
              /* Auth User Pill */
              <div className="flex items-center gap-3 border border-white/10 rounded-full p-1.5 pr-5 hover:bg-white/5 transition-colors">
                <div className="w-9 h-9 rounded-full bg-[#72A8FF]/20 flex items-center justify-center text-[#72A8FF]">
                  <User className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold text-white leading-tight">Jeffrey</span>
                  <span className="text-[11px] font-medium text-gray-400 leading-tight">Amago Philips</span>
                </div>
              </div>
            ) : (
              /* Non-Auth Login Button */
              <Link to="/login">
                <Button 
                  variant="primary" 
                  className="bg-white hover:bg-gray-200 text-black rounded-full px-8 py-2.5 font-bold text-[14px] min-w-[100px]"
                >
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
