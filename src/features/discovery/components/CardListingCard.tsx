import { Link } from 'react-router-dom';
import type { CardListing } from '@/entities/card/model/types';
import { formatCondition } from '@/entities/card/model/condition';

export interface CardListingCardProps {
  listing: CardListing;
  sellerCount?: number;
}

export function CardListingCard({ listing, sellerCount = 1 }: CardListingCardProps) {
  const imageSrc = listing.image || '/assets/expensive_card_1.png';
  const marketPrice = listing.marketPrice ?? (listing.price * 0.9);
  const inStock = listing.stock > 0;
  const isLowStock = inStock && listing.stock <= 3;

  // Format description like the homepage (set + condition or subtitle)
  const subtitle = listing.subtitle || listing.set || '1998 P.M. Japanese Promo';
  const detail = (listing.condition ? formatCondition(listing.condition) : undefined) || 'Bronze 3rd-2nd Tournament';

  return (
    <Link 
      to={`/cards/${encodeURIComponent(listing.cardId || listing.id)}`}
      className={`w-full bg-bg-card rounded-[16px] p-4 flex gap-4 h-[180px] md:h-[200px] cursor-pointer hover:shadow-lg transition-all border-2 border-transparent hover:border-brand-blue focus-visible:border-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base group ${
        !inStock ? 'opacity-60' : ''
      }`}
    >
      {/* Left Image */}
      <div className="relative w-[110px] md:w-[130px] h-full shrink-0 flex items-center justify-center rounded-lg">
        {inStock ? (
          <span className={`absolute top-2 right-1 text-bg-base text-[10px] font-bold px-2 py-0.5 rounded-full z-10 tracking-wide ${
            isLowStock ? 'bg-status-warning' : 'bg-status-success'
          }`}>
            {isLowStock ? `ONLY ${listing.stock} LEFT` : 'IN STOCK'}
          </span>
        ) : (
          <span className="absolute top-2 right-1 bg-status-danger text-bg-base text-[10px] font-bold px-2 py-0.5 rounded-full z-10 tracking-wide">
            OUT OF STOCK
          </span>
        )}
        <img 
          src={imageSrc} 
          alt={listing.name} 
          className="w-full h-full object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300" 
        />
      </div>
      
      {/* Right Content */}
      <div className="flex flex-col flex-1 py-1 overflow-hidden">
        <h3 className="text-gray-100 font-bold text-[15px] md:text-[17px] leading-tight mb-1 line-clamp-1">
          {listing.name}
        </h3>
        <p className="text-gray-400 text-[11px] md:text-[12px] leading-tight line-clamp-1 mb-1">
          {subtitle}
        </p>
        <p className="text-gray-400 text-[11px] md:text-[12px] leading-tight line-clamp-1 mb-auto">
          {detail}
        </p>
        
        <div className="mt-2">
          <div className="text-gray-100 font-black text-[22px] md:text-[28px] leading-none mb-1 line-clamp-1">
            <span className="mr-1 text-[11px] font-bold text-gray-400">From</span>฿{listing.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-gray-400 text-[11px] md:text-[12px] font-medium whitespace-nowrap">
            {sellerCount} {sellerCount === 1 ? 'seller' : 'sellers'}
            <span className="mx-1.5">·</span>
            Market <span className="text-status-success font-bold">
              ฿{marketPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
