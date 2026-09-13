import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-[#0B111A] border-t border-white/5 pt-16 pb-8">
      <div className="max-w-[1440px] mx-auto px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Logo Section */}
          <div className="col-span-1">
            <Link to="/" className="mb-2 inline-flex h-24 w-24 items-center justify-center overflow-visible">
              <img src="/assets/component_293_629.png" alt="Mythic TCG" className="h-24 w-24 scale-[1.35] object-contain" />
            </Link>
            <p className="text-[#EAB308] text-sm font-semibold mt-2">
              Reserve, trade and collect TCG cards
            </p>
          </div>

          <div className="col-span-1">
            <h3 className="text-[#EAB308] font-bold text-lg mb-6">Trading flow</h3>
            <ul className="space-y-4">
              <li><Link to="/cards" className="text-sm text-gray-400 hover:text-white transition-colors">Discover cards</Link></li>
              <li><Link to="/orders" className="text-sm text-gray-400 hover:text-white transition-colors">Reservation orders</Link></li>
              <li><Link to="/collection" className="text-sm text-gray-400 hover:text-white transition-colors">My collection</Link></li>
            </ul>
          </div>

          <div className="col-span-1">
            <h3 className="text-[#EAB308] font-bold text-lg mb-6">Important</h3>
            <p className="text-sm leading-6 text-gray-400">
              Mythix records reservations and ownership changes. Buyer and seller
              arrange contact, payment and delivery outside the platform.
            </p>
          </div>
        </div>

        <div className="text-center text-xs text-gray-600 pt-8 border-t border-white/5">
          Copyright © 2026 MYTHIC INC. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}
