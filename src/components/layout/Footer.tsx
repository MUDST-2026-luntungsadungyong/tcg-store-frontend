import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-[#0B111A] border-t border-white/5 pt-16 pb-8 font-sans">
      <div className="max-w-[1440px] mx-auto px-8 md:px-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Logo Section */}
          <div className="col-span-1 flex flex-col items-center md:items-start">
            <Link to="/" className="inline-block z-10">
              <img 
                src="/assets/Mythix_logo_white_version.png" 
                alt="Mythix TCG" 
                className="w-48 md:w-56 object-contain drop-shadow-lg"
              />
            </Link>
            <p className="text-[#FDE047] text-2xl font-bold -mt-8 md:-mt-12 tracking-wide text-center md:text-left w-full md:pl-2 z-20">
              Mythix TCG website
            </p>
          </div>

          {/* Policy & Legal */}
          <div className="col-span-1">
            <h3 className="text-[#FDE047] font-bold text-xl mb-6 tracking-wide">Policy & Legal</h3>
            <ul className="space-y-4">
              <li><Link to="/terms" className="text-[15px] font-medium text-[#FEF08A] hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link to="/privacy" className="text-[15px] font-medium text-[#FEF08A] hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/seller-policy" className="text-[15px] font-medium text-[#FEF08A] hover:text-white transition-colors">Seller and Buyer Policy</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="col-span-1">
            <h3 className="text-[#FDE047] font-bold text-xl mb-6 tracking-wide">Customer Service</h3>
            <ul className="space-y-4">
              <li><Link to="/help" className="text-[15px] font-medium text-[#FEF08A] hover:text-white transition-colors">Help Center</Link></li>
              <li><Link to="/shipping" className="text-[15px] font-medium text-[#FEF08A] hover:text-white transition-colors">Shipping & Tracking</Link></li>
              <li><Link to="/returns" className="text-[15px] font-medium text-[#FEF08A] hover:text-white transition-colors">Return & Refund Policy</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div className="col-span-1">
            <h3 className="text-[#FDE047] font-bold text-xl mb-6 tracking-wide">Company</h3>
            <ul className="space-y-4">
              <li><Link to="/about" className="text-[15px] font-medium text-[#FEF08A] hover:text-white transition-colors">About TCG</Link></li>
            </ul>
          </div>
        </div>

        <div className="text-center text-[13px] font-medium text-[#FEF08A] pt-8">
          Copyright © 2026 Mythix, Inc. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}
