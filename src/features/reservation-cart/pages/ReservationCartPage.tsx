import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';

import { useReservationCartStore } from '../model/useReservationCartStore';
import { FeedbackPopup } from '@/shared/components/FeedbackPopup'; // CASE 8: warning popup

const money = (value: number) => `฿${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export function ReservationCartPage() {
  const items = useReservationCartStore((state) => state.items);
  const ownerId = useReservationCartStore((state) => state.ownerId);
  const isLoading = useReservationCartStore((state) => state.isLoading);
  const error = useReservationCartStore((state) => state.error);
  const loadCart = useReservationCartStore((state) => state.loadCart);
  const updateQuantity = useReservationCartStore((state) => state.updateQuantity);
  const removeItem = useReservationCartStore((state) => state.removeItem);
  const [pendingListingId, setPendingListingId] = useState<string | null>(null);
  const [showStockWarningPopup, setShowStockWarningPopup] = useState(false); // CASE 8


  useEffect(() => {
    if (ownerId) void loadCart();
  }, [loadCart, ownerId]);

  const handleUpdateQuantity = async (listingId: string, quantity: number) => {
    setPendingListingId(listingId);
    try {
      await updateQuantity(listingId, quantity);
    } catch (err) {
      if (err instanceof Error && err.message === 'STOCK_CHANGED') {
        setShowStockWarningPopup(true); // CASE 8: Realistically triggered
      }
    } finally {
      setPendingListingId(null);
    }
  };

  const handleRemove = async (listingId: string) => {
    setPendingListingId(listingId);
    await removeItem(listingId);
    setPendingListingId(null);
  };

  const total = items.reduce((sum, item) => sum + item.listing.price * item.quantity, 0);

  if (isLoading && items.length === 0) {
    return (
      <main className="min-h-[calc(100vh-64px)] bg-[#0B141F] px-4 py-16 text-white md:px-8">
        <div role="status" aria-label="Loading reservation cart" className="mx-auto max-w-5xl">
          <span className="sr-only">Loading your cart…</span>
          <div className="mb-8 space-y-3">
            <div className="h-9 w-64 animate-pulse rounded-lg bg-white/20" />
            <div className="h-4 w-full max-w-xl animate-pulse rounded bg-white/10" />
          </div>
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <section aria-label="Loading cart items" className="space-y-3">
              {[0, 1, 2].map((item) => (
                <div key={item} className="flex gap-4 rounded-2xl border border-[#D9E0EA] bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.14)]">
                  <div className="size-24 shrink-0 animate-pulse rounded-lg bg-[#E5EAF2]" />
                  <div className="flex min-w-0 flex-1 flex-col justify-between gap-5 py-1">
                    <div className="space-y-2">
                      <div className="h-4 w-2/3 animate-pulse rounded bg-[#E5EAF2]" />
                      <div className="h-3 w-1/3 animate-pulse rounded bg-[#E5EAF2]" />
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div className="h-9 w-24 animate-pulse rounded-lg bg-[#E5EAF2]" />
                      <div className="h-4 w-20 animate-pulse rounded bg-[#E5EAF2]" />
                    </div>
                  </div>
                </div>
              ))}
            </section>
            <aside aria-label="Loading reservation summary" className="h-fit rounded-2xl border border-[#D9E0EA] bg-white p-6 shadow-[0_8px_24px_rgba(0,0,0,0.14)]">
              <div className="h-5 w-40 animate-pulse rounded bg-[#E5EAF2]" />
              <div className="mt-5 flex justify-between border-b border-[#D9E0EA] pb-4">
                <div className="h-4 w-20 animate-pulse rounded bg-[#E5EAF2]" />
                <div className="h-4 w-24 animate-pulse rounded bg-[#E5EAF2]" />
              </div>
              <div className="mt-4 h-12 animate-pulse rounded bg-[#E5EAF2]" />
              <div className="mt-6 h-12 animate-pulse rounded-full bg-[#E5EAF2]" />
            </aside>
          </div>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="min-h-[calc(100vh-64px)] bg-[#0B141F] px-4 py-16 text-white md:px-8">
        <div className="mx-auto flex max-w-3xl flex-col items-center rounded-2xl border border-[#D9E0EA] bg-white px-6 py-16 text-center text-bg-card shadow-[0_12px_28px_rgba(0,0,0,0.18)]">
          <ShoppingBag className="mb-4 text-[#2B53A9]" size={48} aria-hidden="true" />
          <h1 className="text-3xl font-bold text-[#151B2B]">Your reservation cart is empty</h1>
          <p className="mt-3 max-w-md text-[#596173]">Add cards from the marketplace before starting a reservation.</p>
          {error && <p role="alert" className="mt-4 text-sm text-[#B42318]">{error}</p>}
          <Link to="/cards" className="mt-8 rounded-full bg-[#2B53A9] px-6 py-3 font-semibold text-white hover:bg-[#1F3565]">
            Browse cards
          </Link>
        </div>
      </main>
    );
  }

  return (
    <>
    <main className="min-h-[calc(100vh-64px)] bg-[#0B141F] px-4 py-10 text-white md:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold md:text-4xl">Reservation Cart</h1>
          <p className="mt-2 text-sm text-gray-400">Review the cards you want to reserve. Stock is checked again at checkout.</p>
        </div>

        {error && <div role="alert" className="mb-6 rounded-2xl border border-[#D9E0EA] bg-white p-4 text-sm text-[#B42318] shadow-[0_8px_24px_rgba(0,0,0,0.14)]">{error}</div>}

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <section className="space-y-3" aria-label="Cart items">
            {items.map((item) => {
              const lineTotal = item.listing.price * item.quantity;
              const availableQuantity = item.availableQuantity ?? item.listing.stock;
              const isAvailable = item.available ?? true;
              const isPending = pendingListingId === item.listing.id;
              return (
                <article key={item.listing.id} className="flex gap-4 rounded-2xl border border-[#D9E0EA] bg-white p-4 text-bg-card shadow-[0_8px_24px_rgba(0,0,0,0.14)] transition-shadow hover:shadow-[0_12px_28px_rgba(0,0,0,0.18)]">
                  <img src={item.listing.image} alt={item.listing.name} className="size-24 shrink-0 rounded-lg bg-[#0B141F] object-contain p-2" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="truncate font-semibold text-[#151B2B]">{item.listing.name}</h2>
                        <p className="mt-1 text-xs text-[#596173]">Seller {item.listing.sellerId}</p>
                        {!isAvailable && <p className="mt-1 text-xs text-amber-700">Only {availableQuantity} available now</p>}
                      </div>
                      <button type="button" aria-label={`Remove ${item.listing.name}`} disabled={isPending} onClick={() => void handleRemove(item.listing.id)} className="text-[#6B7280] hover:text-[#B42318] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue disabled:opacity-40">
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-4">
                      <div className="flex items-center rounded-lg border border-[#D9E0EA] bg-[#F6F8FB]">
                        <button type="button" aria-label={`Decrease ${item.listing.name}`} disabled={isPending || item.quantity <= 1} onClick={() => void handleUpdateQuantity(item.listing.id, item.quantity - 1)} className="p-2 text-[#596173] hover:text-[#151B2B] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue disabled:opacity-40">
                          <Minus size={15} />
                        </button>
                        <span className="min-w-8 text-center text-sm font-semibold text-[#151B2B]">{item.quantity}</span>
                        <button type="button" aria-label={`Increase ${item.listing.name}`} disabled={isPending || !isAvailable || item.quantity >= availableQuantity} onClick={() => void handleUpdateQuantity(item.listing.id, item.quantity + 1)} className="p-2 text-[#596173] hover:text-[#151B2B] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue disabled:opacity-40">
                          <Plus size={15} />
                        </button>
                      </div>
                      <span className="font-semibold text-[#2B53A9]">{money(lineTotal)}</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          <aside className="h-fit rounded-2xl border border-[#D9E0EA] bg-white p-6 text-bg-card shadow-[0_8px_24px_rgba(0,0,0,0.14)]">
            <h2 className="text-lg font-bold text-[#151B2B]">Reservation summary</h2>
            <div className="mt-5 flex items-center justify-between border-b border-[#D9E0EA] pb-4 text-sm text-[#4B5567]">
              <span>{items.reduce((sum, item) => sum + item.quantity, 0)} card(s)</span>
              <span>{money(total)}</span>
            </div>
            <p className="mt-4 text-xs leading-5 text-[#596173]">This phase reserves inventory only. Payment and shipping details will be added when their backend contracts are approved.</p>
            <Link to="/checkout" className="mt-6 flex w-full items-center justify-center rounded-full bg-[#2B53A9] px-5 py-3 font-semibold text-white hover:bg-[#1F3565]">Review reservation</Link>
          </aside>
        </div>
      </div>
    </main>
      {/* CASE 8: Stock warning popup — Figma: Reservation → Stock changed */}
      <FeedbackPopup
        isOpen={showStockWarningPopup}
        tone="warning"
        title="This card is no longer available"
        message="Stock changed while you were reserving it. No reservation was created."
        meta="Try another seller or refresh offers."
        primaryAction={{ label: "View other offers", onClick: () => setShowStockWarningPopup(false) }}
        secondaryAction={{ label: "Close", onClick: () => setShowStockWarningPopup(false) }}
      />
    </>
  );
}
