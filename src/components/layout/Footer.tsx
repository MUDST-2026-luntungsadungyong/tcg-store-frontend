import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-[#0B111A] border-t border-white/5 pt-16 pb-8">
      <div className="max-w-[1440px] mx-auto px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Logo Section */}
          <div className="col-span-1">
            <Link to="/" className="inline-block mb-2">
              <img src="/assets/logo_76_30.png" alt="Mythic TCG" className="h-16 object-contain" />
            </Link>
            <p className="text-[#EAB308] text-sm font-semibold mt-2">
              Mythic TCG website
            </p>
          </div>

          {/* Policy & Legal */}
          <div className="col-span-1">
            <h3 className="text-[#EAB308] font-bold text-lg mb-6">Policy & Legal</h3>
            <ul className="space-y-4">
              <li><Link to="/terms" className="text-sm text-gray-400 hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link to="/privacy" className="text-sm text-gray-400 hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/seller-policy" className="text-sm text-gray-400 hover:text-white transition-colors">Seller and Buyer Policy</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="col-span-1">
            <h3 className="text-[#EAB308] font-bold text-lg mb-6">Customer Service</h3>
            <ul className="space-y-4">
              <li><Link to="/help" className="text-sm text-gray-400 hover:text-white transition-colors">Help Center</Link></li>
              <li><Link to="/shipping" className="text-sm text-gray-400 hover:text-white transition-colors">Shipping Information</Link></li>
              <li><Link to="/returns" className="text-sm text-gray-400 hover:text-white transition-colors">Return & Refund Policy</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div className="col-span-1">
            <h3 className="text-[#EAB308] font-bold text-lg mb-6">Company</h3>
            <ul className="space-y-4">
              <li><Link to="/about" className="text-sm text-gray-400 hover:text-white transition-colors">About TCG</Link></li>
            </ul>
          </div>
        </div>

        <div className="text-center text-xs text-gray-600 pt-8 border-t border-white/5">
          Copyright © 2026 MYTHIC INC. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}
