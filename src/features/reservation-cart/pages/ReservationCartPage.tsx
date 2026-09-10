import { Link } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';

import { useReservationCartStore } from '../model/useReservationCartStore';

const money = (value: number) => `฿${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export function ReservationCartPage() {
  const items = useReservationCartStore((state) => state.items);
  const updateQuantity = useReservationCartStore((state) => state.updateQuantity);
  const removeItem = useReservationCartStore((state) => state.removeItem);
  const total = items.reduce((sum, item) => sum + item.listing.price * item.quantity, 0);

  if (items.length === 0) {
    return (
      <main className="min-h-[calc(100vh-64px)] bg-[#0B141F] px-4 py-16 text-white md:px-8">
        <div className="mx-auto flex max-w-3xl flex-col items-center rounded-2xl border border-white/10 bg-[#192338] px-6 py-16 text-center">
          <ShoppingBag className="mb-4 text-brand-blue" size={48} />
          <h1 className="text-3xl font-bold">Your reservation cart is empty</h1>
          <p className="mt-3 max-w-md text-gray-400">
            Add cards from the marketplace before starting a reservation.
          </p>
          <Link to="/cards" className="mt-8 rounded-full bg-brand-blue px-6 py-3 font-semibold text-white hover:bg-[#4a85e0]">
            Browse cards
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-64px)] bg-[#0B141F] px-4 py-10 text-white md:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold md:text-4xl">Reservation Cart</h1>
          <p className="mt-2 text-sm text-gray-400">
            Review the cards you want to reserve. Stock is checked again at checkout.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <section className="space-y-3" aria-label="Cart items">
            {items.map((item) => {
              const lineTotal = item.listing.price * item.quantity;
              return (
                <article key={item.listing.id} className="flex gap-4 rounded-2xl border border-white/10 bg-[#192338] p-4">
                  <img src={item.listing.image} alt={item.listing.name} className="size-24 shrink-0 rounded-lg bg-[#0B141F] object-contain p-2" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="truncate font-semibold text-white">{item.listing.name}</h2>
                        <p className="mt-1 text-xs text-gray-400">Seller {item.listing.sellerId}</p>
                      </div>
                      <button type="button" aria-label={`Remove ${item.listing.name}`} onClick={() => removeItem(item.listing.id)} className="text-gray-400 hover:text-status-danger">
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-4">
                      <div className="flex items-center rounded-lg border border-white/15 bg-[#0B141F]">
                        <button type="button" aria-label={`Decrease ${item.listing.name}`} onClick={() => updateQuantity(item.listing.id, item.quantity - 1)} disabled={item.quantity <= 1} className="p-2 text-gray-300 hover:text-white disabled:opacity-40">
                          <Minus size={15} />
                        </button>
                        <span className="min-w-8 text-center text-sm font-semibold">{item.quantity}</span>
                        <button type="button" aria-label={`Increase ${item.listing.name}`} onClick={() => updateQuantity(item.listing.id, item.quantity + 1)} disabled={item.quantity >= item.listing.stock} className="p-2 text-gray-300 hover:text-white disabled:opacity-40">
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
            <p className="mt-4 text-xs leading-5 text-gray-400">
              This phase reserves inventory only. Payment and shipping details will be added when their backend contracts are approved.
            </p>
            <Link to="/checkout" className="mt-6 flex w-full items-center justify-center rounded-full bg-brand-blue px-5 py-3 font-semibold text-white hover:bg-[#4a85e0]">
              Review reservation
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}
