import type { CardListing } from '@/entities/card/model/types';
import { SellerOfferRow } from './SellerOfferRow';

interface SellerOffersSectionProps {
  offers: CardListing[];
  loadingOfferId: string | null;
  onAddToCart: (offer: CardListing, quantity: number) => Promise<void>;
  onReserveNow: (offer: CardListing, quantity: number) => Promise<void>;
}

export function SellerOffersSection({ offers, loadingOfferId, onAddToCart, onReserveNow }: SellerOffersSectionProps) {
  return (
    <section className="mt-10 w-full" aria-labelledby="seller-offers-heading">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8FB3E2]">Compare listings</p>
          <h2 id="seller-offers-heading" className="mt-1 text-2xl font-bold">Seller offers</h2>
        </div>
        <span className="text-sm text-gray-400">{offers.length} {offers.length === 1 ? 'offer' : 'offers'}</span>
      </div>
      {offers.length > 0 ? (
        <div className="space-y-3">
          {offers.map(offer => <SellerOfferRow key={offer.id} offer={offer} isLoading={loadingOfferId === offer.id} onAddToCart={onAddToCart} onReserveNow={onReserveNow} />)}
        </div>
      ) : (
        <div role="status" className="rounded-2xl border border-dashed border-white/15 bg-bg-card p-8 text-center text-sm text-gray-400 shadow-[0_8px_24px_rgba(0,0,0,0.14)]">No seller has this card listed right now.</div>
      )}
    </section>
  );
}
