import { Link } from 'react-router-dom';
import { Package, Globe, Mail, MessageCircle } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-bg-surface border-t border-white/5 pt-12 pb-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Package className="h-6 w-6 text-brand-blue" />
              <span className="font-bold text-lg text-white">
                Mythix<span className="text-brand-blue">TCG</span>
              </span>
            </Link>
            <p className="text-sm text-gray-400 mb-4">
              Your premium destination for trading card games. Buy, collect, and play with confidence.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-brand-blue transition-colors"><Mail size={20} /></a>
              <a href="#" className="text-gray-400 hover:text-brand-blue transition-colors"><MessageCircle size={20} /></a>
              <a href="#" className="text-gray-400 hover:text-brand-blue transition-colors"><Globe size={20} /></a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Games</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/browse?game=Pokemon" className="hover:text-white transition-colors">Pokémon TCG</Link></li>
              <li><Link to="/browse?game=YGO" className="hover:text-white transition-colors">Yu-Gi-Oh!</Link></li>
              <li><Link to="/browse?game=MTG" className="hover:text-white transition-colors">Magic: The Gathering</Link></li>
              <li><Link to="/browse?game=OnePiece" className="hover:text-white transition-colors">One Piece TCG</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Support</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
              <li><Link to="/shipping" className="hover:text-white transition-colors">Shipping Policy</Link></li>
              <li><Link to="/returns" className="hover:text-white transition-colors">Returns</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Account</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/login" className="hover:text-white transition-colors">Login</Link></li>
              <li><Link to="/register" className="hover:text-white transition-colors">Register</Link></li>
              <li><Link to="/profile" className="hover:text-white transition-colors">My Profile</Link></li>
              <li><Link to="/orders" className="hover:text-white transition-colors">Order History</Link></li>
            </ul>
          </div>

        </div>
        
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Mythix TCG Store. All rights reserved.
          </p>
          <div className="flex gap-4 mt-4 md:mt-0 text-sm text-gray-500">
            <Link to="/privacy" className="hover:text-gray-300">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-gray-300">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
