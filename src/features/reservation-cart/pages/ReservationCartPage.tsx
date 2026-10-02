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
        <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-[#192338] px-6 py-16 text-center">
          <p className="text-gray-300">Loading your cart…</p>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="min-h-[calc(100vh-64px)] bg-[#0B141F] px-4 py-16 text-white md:px-8">
        <div className="mx-auto flex max-w-3xl flex-col items-center rounded-2xl border border-white/10 bg-[#192338] px-6 py-16 text-center">
          <ShoppingBag className="mb-4 text-brand-blue" size={48} />
          <h1 className="text-3xl font-bold">Your reservation cart is empty</h1>
          <p className="mt-3 max-w-md text-gray-400">Add cards from the marketplace before starting a reservation.</p>
          {error && <p role="alert" className="mt-4 text-sm text-red-200">{error}</p>}
          <Link to="/cards" className="mt-8 rounded-full bg-brand-blue px-6 py-3 font-semibold text-white hover:bg-[#4a85e0]">
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

        {error && <div role="alert" className="mb-6 rounded-xl border border-status-danger/30 bg-status-danger/10 p-3 text-sm text-red-200">{error}</div>}

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <section className="space-y-3" aria-label="Cart items">
            {items.map((item) => {
              const lineTotal = item.listing.price * item.quantity;
              const availableQuantity = item.availableQuantity ?? item.listing.stock;
              const isAvailable = item.available ?? true;
              const isPending = pendingListingId === item.listing.id;
              return (
                <article key={item.listing.id} className="flex gap-4 rounded-2xl border border-white/10 bg-[#192338] p-4">
                  <img src={item.listing.image} alt={item.listing.name} className="size-24 shrink-0 rounded-lg bg-[#0B141F] object-contain p-2" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="truncate font-semibold text-white">{item.listing.name}</h2>
                        <p className="mt-1 text-xs text-gray-400">Seller {item.listing.sellerId}</p>
                        {!isAvailable && <p className="mt-1 text-xs text-amber-300">Only {availableQuantity} available now</p>}
                      </div>
                      <button type="button" aria-label={`Remove ${item.listing.name}`} disabled={isPending} onClick={() => void handleRemove(item.listing.id)} className="text-gray-400 hover:text-status-danger disabled:opacity-40">
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-4">
                      <div className="flex items-center rounded-lg border border-white/15 bg-[#0B141F]">
                        <button type="button" aria-label={`Decrease ${item.listing.name}`} disabled={isPending || item.quantity <= 1} onClick={() => void handleUpdateQuantity(item.listing.id, item.quantity - 1)} className="p-2 text-gray-300 hover:text-white disabled:opacity-40">
                          <Minus size={15} />
                        </button>
                        <span className="min-w-8 text-center text-sm font-semibold">{item.quantity}</span>
                        <button type="button" aria-label={`Increase ${item.listing.name}`} disabled={isPending || !isAvailable || item.quantity >= availableQuantity} onClick={() => void handleUpdateQuantity(item.listing.id, item.quantity + 1)} className="p-2 text-gray-300 hover:text-white disabled:opacity-40">
                          <Plus size={15} />
                        </button>
                      </div>
                      <span className="font-semibold text-brand-blue">{money(lineTotal)}</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          <aside className="h-fit rounded-2xl border border-white/10 bg-[#192338] p-6">
            <h2 className="text-lg font-bold">Reservation summary</h2>
            <div className="mt-5 flex items-center justify-between border-b border-white/10 pb-4 text-sm text-gray-300">
              <span>{items.reduce((sum, item) => sum + item.quantity, 0)} card(s)</span>
              <span>{money(total)}</span>
            </div>
            <p className="mt-4 text-xs leading-5 text-gray-400">This phase reserves inventory only. Payment and shipping details will be added when their backend contracts are approved.</p>
            <Link to="/checkout" className="mt-6 flex w-full items-center justify-center rounded-full bg-brand-blue px-5 py-3 font-semibold text-white hover:bg-[#4a85e0]">Review reservation</Link>
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
