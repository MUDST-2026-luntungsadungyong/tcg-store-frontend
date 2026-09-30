import { useState } from 'react';
import { ChevronDown, ShoppingCart } from 'lucide-react';
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
      <div
        className={`flex h-10 items-center rounded-lg border border-[#40475C] bg-[#242938] text-white text-sm transition-colors ${
          outOfStock ? 'opacity-50 cursor-not-allowed' : 'hover:border-[#6889D0] focus-within:border-brand-blue'
        }`}
      >
        <div className="relative flex items-center h-full">
          <select
            data-testid={`quantity-select-${offer.id}`}
            value={outOfStock ? 0 : quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            disabled={outOfStock || isLoading}
            aria-label={`Select quantity for ${offer.sellerName || 'seller offer'}`}
            className="h-full appearance-none bg-transparent pl-3 pr-7 text-sm font-medium text-white focus:outline-none cursor-pointer disabled:cursor-not-allowed"
          >
            {outOfStock ? (
              <option value={0} className="bg-[#1B2336] text-white">0</option>
            ) : (
              Array.from({ length: offer.stock }, (_, i) => i + 1).map((num) => (
                <option key={num} value={num} className="bg-[#1B2336] text-white">
                  {num}
                </option>
              ))
            )}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-2 text-[#A6ADC7]" aria-hidden="true" />
        </div>
        <div className="h-full w-px bg-[#40475C]" />
        <div className="flex items-center h-full px-3 text-sm font-medium text-[#A6ADC7] select-none whitespace-nowrap">
          of {Math.max(0, offer.stock)}
        </div>
      </div>
      <button
        type="button"
        onClick={() => void onAddToCart(offer, quantity)}
        disabled={outOfStock || isLoading}
        className="inline-flex h-10 items-center justify-center gap-2 rounded border border-[#6889D0] bg-[rgba(31,53,101,0.5)] px-3 text-xs font-bold text-white transition-colors hover:bg-[#1F3565] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ShoppingCart size={14} aria-hidden="true" /> Add to reservation cart
      </button>
      <button
        type="button"
        onClick={() => void onReserveNow(offer, quantity)}
        disabled={outOfStock || isLoading}
        className="h-10 rounded bg-[#2B53A9] px-4 text-xs font-bold text-white transition-colors hover:bg-[#244691] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? 'Adding…' : 'Reserve now'}
      </button>
    </div>
  );
}
