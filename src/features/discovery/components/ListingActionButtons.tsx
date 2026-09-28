import { useState } from 'react';
import { Minus, Plus, ShoppingCart } from 'lucide-react';
import type { CardListing } from '@/entities/card/model/types';

interface ListingActionButtonsProps {
  offer: CardListing;
  isLoading: boolean;
  onAddToCart: (offer: CardListing, quantity: number) => Promise<void>;
  onReserveNow: (offer: CardListing, quantity: number) => Promise<void>;
}

export function ListingActionButtons({ offer, isLoading, onAddToCart, onReserveNow }: ListingActionButtonsProps) {
  const [quantity, setQuantity] = useState(1);
  const outOfStock = offer.stock <= 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex h-10 items-center overflow-hidden rounded border border-[#6889D0]/50 bg-[#D9E1F1] text-[#31487A]">
        <button type="button" aria-label={`Decrease quantity for ${offer.sellerName || 'seller offer'}`} onClick={() => setQuantity(value => Math.max(1, value - 1))} disabled={quantity <= 1 || outOfStock} className="flex h-full w-9 items-center justify-center disabled:opacity-40"><Minus size={14} /></button>
        <span aria-live="polite" className="flex h-full min-w-9 items-center justify-center border-x border-[#31487A]/20 text-sm">{quantity}</span>
        <button type="button" aria-label={`Increase quantity for ${offer.sellerName || 'seller offer'}`} onClick={() => setQuantity(value => Math.min(offer.stock, value + 1))} disabled={quantity >= offer.stock || outOfStock} className="flex h-full w-9 items-center justify-center disabled:opacity-40"><Plus size={14} /></button>
      </div>
      <button type="button" onClick={() => void onAddToCart(offer, quantity)} disabled={outOfStock || isLoading} className="inline-flex h-10 items-center justify-center gap-2 rounded border border-[#6889D0] bg-[rgba(31,53,101,0.5)] px-3 text-xs font-bold text-white transition-colors hover:bg-[#1F3565] disabled:cursor-not-allowed disabled:opacity-50">
        <ShoppingCart size={14} aria-hidden="true" /> Add to reservation cart
      </button>
      <button type="button" onClick={() => void onReserveNow(offer, quantity)} disabled={outOfStock || isLoading} className="h-10 rounded bg-[#2B53A9] px-4 text-xs font-bold text-white transition-colors hover:bg-[#244691] disabled:cursor-not-allowed disabled:opacity-50">
        {isLoading ? 'Adding…' : 'Reserve now'}
      </button>
    </div>
  );
}
