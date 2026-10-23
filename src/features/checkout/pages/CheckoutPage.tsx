import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ButtonLink } from '@/shared/components/ButtonLink';
import { AlertCircle, ArrowLeft, LockKeyhole } from 'lucide-react';

import { useAuthStore } from '@/features/auth/model/useAuthStore';
import { checkoutReservationCart } from '@/features/reservation-cart/api/reservationCart';
import { useReservationCartStore } from '@/features/reservation-cart/model/useReservationCartStore';
import { previewReservationOrders } from '@/features/reservations/api/reservationOrders';

const money = (value: number) => `฿${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export function CheckoutPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const items = useReservationCartStore((state) => state.items);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preview = useMemo(() => {
    try {
      return previewReservationOrders(items);
    } catch {
      return null;
    }
  }, [items]);

  if (!preview || items.length === 0) {
    return (
      <main className="min-h-[calc(100vh-64px)] bg-bg-base px-4 py-16 text-white md:px-8">
        <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-bg-card p-10 text-center">
          <h1 className="text-3xl font-bold">Nothing to review</h1>
          <p className="mt-3 text-gray-400">Add a card to your reservation cart first.</p>
          <ButtonLink to="/cards" className="mt-7" size="lg">Browse cards</ButtonLink>
        </div>
      </main>
    );
  }

  const submitReservation = async () => {
    if (!user) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await checkoutReservationCart(user.id);
      const orderIds = result.orders.map((order) => order.id).join(',');
      navigate(`/checkout/confirmation?orderIds=${encodeURIComponent(orderIds)}`);
    } catch (err: any) {
      const serverMessage = err?.response?.data?.message ?? err?.response?.data?.error;
      setError(serverMessage || (err instanceof Error ? err.message : 'Unable to reserve these cards. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-64px)] bg-bg-base px-4 py-10 text-white md:px-8">
      <div className="mx-auto max-w-5xl">
        <Link to="/cart" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white"><ArrowLeft size={16} /> Back to cart</Link>
        <div className="mt-6 mb-8">
          <h1 className="text-3xl font-bold md:text-4xl">Order Review</h1>
          <p className="mt-2 text-sm text-gray-400">Confirm the cards to reserve before creating the order.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <section className="space-y-4">
            {preview.groups.map((group) => (
              <div key={group.sellerId} className="rounded-2xl border border-white/10 bg-bg-card p-5">
                <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
                  <h2 className="font-semibold">Seller {group.sellerId}</h2>
                  <span className="text-sm text-gray-400">{group.items.length} item(s)</span>
                </div>
                <div className="space-y-3">
                  {group.items.map((item) => (
                    <div key={item.listing.id} className="flex items-center gap-3">
                      <img src={item.listing.image} alt="" className="size-14 rounded-lg bg-bg-base object-contain p-1" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{item.listing.name}</p>
                        <p className="text-xs text-gray-400">Qty {item.quantity} · {money(item.listing.price)} each</p>
                      </div>
                      <span className="text-sm font-semibold text-brand-blue">{money(item.listing.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>

          <aside className="h-fit rounded-2xl border border-white/10 bg-bg-card p-6">
            <h2 className="text-lg font-bold">Reservation total</h2>
            <div className="mt-5 flex items-center justify-between border-b border-white/10 pb-4 text-sm">
              <span className="text-gray-400">Cards</span>
              <span>{money(preview.totalAmount)}</span>
            </div>
            <div className="mt-4 flex items-start gap-3 rounded-full bg-brand-blue/10 p-3 text-xs leading-5 text-gray-300">
              <LockKeyhole size={16} className="mt-0.5 shrink-0 text-brand-blue" />
              <span>Stock is validated and reserved when you confirm. No payment or shipping address is collected in this phase.</span>
            </div>
            {error && (
              <div role="alert" className="mt-4 flex gap-2 rounded-xl border border-status-danger/30 bg-status-danger/10 p-3 text-sm text-red-200">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <button type="button" onClick={() => void submitReservation()} disabled={isSubmitting || !user} className="mt-6 flex w-full items-center justify-center rounded-xl bg-brand-blue px-5 py-3 font-semibold text-bg-base hover:bg-brand-blue/90 disabled:cursor-not-allowed disabled:opacity-50">
              {isSubmitting ? 'Reserving…' : 'Confirm reservation'}
            </button>
          </aside>
        </div>
      </div>
    </main>
  );
}
