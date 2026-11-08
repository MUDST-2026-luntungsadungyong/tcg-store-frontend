import { Link } from 'react-router-dom';
import { Store } from 'lucide-react';
import type { CardListing } from '@/entities/card/model/types';
import { formatCondition } from '@/entities/card/model/condition';
import { ListingActionButtons } from './ListingActionButtons';

interface SellerOfferRowProps {
  offer: CardListing;
  isLoading: boolean;
  onAddToCart: (offer: CardListing, quantity: number) => Promise<void>;
  onReserveNow: (offer: CardListing, quantity: number) => Promise<void>;
}

export function SellerOfferRow({ offer, isLoading, onAddToCart, onReserveNow }: SellerOfferRowProps) {
  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-bg-card p-4 text-gray-100 shadow-[0_8px_24px_rgba(0,0,0,0.14)] transition-shadow hover:shadow-[0_12px_28px_rgba(0,0,0,0.18)] lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0 lg:w-56">
        <div className="flex items-center gap-2">
          <Store size={15} className="shrink-0 text-brand-blue" aria-hidden="true" />
          <Link to={`/stores/${encodeURIComponent(offer.sellerId)}`} className="truncate font-semibold text-gray-100 hover:text-brand-blue hover:underline">
            {offer.sellerName || `Seller ${offer.sellerId}`}
          </Link>
        </div>
        <p className="mt-1 text-sm text-gray-400">{[offer.condition ? formatCondition(offer.condition) : undefined, offer.language].filter(Boolean).join(' · ') || 'Card listing'}</p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 lg:justify-end">
        <div className="min-w-28">
          <p className="text-lg font-bold text-gray-100">฿{offer.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          {offer.stock <= 0 && <p className="text-xs text-status-danger">Out of stock</p>}
        </div>
        <ListingActionButtons offer={offer} isLoading={isLoading} onAddToCart={onAddToCart} onReserveNow={onReserveNow} />
      </div>
    </article>
  );
}
