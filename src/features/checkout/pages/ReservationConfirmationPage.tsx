import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Package } from 'lucide-react';

import type { ReservationOrder } from '@/entities/reservation/model/types';
import { getReservationOrder } from '@/features/reservations/api/reservationOrders';

const money = (value: number) => `฿${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export function ReservationConfirmationPage() {
  const [params] = useSearchParams();
  const [orders, setOrders] = useState<ReservationOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = (params.get('orderIds') ?? '').split(',').filter(Boolean);
    let cancelled = false;
    async function load() {
      const loaded = await Promise.all(ids.map((id) => getReservationOrder(id)));
      if (!cancelled) {
        setOrders(loaded.filter((order): order is ReservationOrder => Boolean(order)));
        setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [params]);

  const total = orders.reduce((sum, order) => sum + order.totalAmount, 0);

  return (
    <main className="min-h-[calc(100vh-64px)] bg-[#0B141F] px-4 py-16 text-white md:px-8">
      <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-[#192338] p-8 text-center md:p-12">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-status-success/15 text-status-success"><CheckCircle2 size={34} /></div>
        <h1 className="mt-5 text-3xl font-bold">Reservation placed</h1>
        <p className="mt-3 text-gray-400">The seller has been notified. Your cards will enter your collection after the seller confirms shipment.</p>

        {loading ? <p className="mt-8 text-sm text-gray-400">Loading reservation details…</p> : orders.length > 0 ? (
          <div className="mt-8 space-y-3 text-left">
            {orders.map((order) => (
              <div key={order.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0B141F]/50 p-4">
                <div className="flex items-center gap-3"><Package size={20} className="text-brand-blue" /><div><p className="font-semibold">{order.id}</p><p className="text-xs text-gray-400">Awaiting seller shipment confirmation</p></div></div>
                <span className="font-semibold text-brand-blue">{money(order.totalAmount)}</span>
              </div>
            ))}
            <p className="pt-2 text-right text-sm font-semibold">Total reserved: {money(total)}</p>
          </div>
        ) : <p className="mt-8 text-sm text-gray-400">Reservation details are not available yet. You can find the order in My Orders.</p>}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link to="/orders" className="rounded-full bg-brand-blue px-6 py-3 font-semibold hover:bg-[#4a85e0]">View my orders</Link>
          <Link to="/cards" className="rounded-full border border-white/15 px-6 py-3 font-semibold text-gray-300 hover:text-white">Continue browsing</Link>
        </div>
      </div>
    </main>
  );
}
