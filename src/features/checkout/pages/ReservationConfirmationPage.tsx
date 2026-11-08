import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Package, ShieldCheck, Tag } from 'lucide-react';

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
    return () => {
      cancelled = true;
    };
  }, [params]);

  const subtotal = orders.reduce((sum, order) => sum + (order.subtotalAmount ?? order.totalAmount), 0);
  const totalDiscount = orders.reduce((sum, order) => sum + (order.discountAmount ?? 0), 0);
  const total = orders.reduce((sum, order) => sum + order.totalAmount, 0);

  return (
    <main className="min-h-[calc(100vh-64px)] bg-bg-base px-4 py-16 text-white md:px-8">
      <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-bg-card p-8 text-center md:p-12">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-status-success/15 text-status-success">
          <CheckCircle2 size={34} />
        </div>
        <h1 className="mt-5 text-3xl font-bold">Reservation placed!</h1>
        <p className="mt-3 text-gray-400">
          The seller has been notified. Your cards will enter your collection after the seller confirms shipment.
        </p>

        {loading ? (
          <p className="mt-8 text-sm text-gray-400">Loading reservation details…</p>
        ) : orders.length > 0 ? (
          <div className="mt-8 space-y-4 text-left">
            {orders.map((order) => {
              const orderSubtotal = order.subtotalAmount ?? order.totalAmount;
              const hasDiscount = Boolean(order.discountAmount && order.discountAmount > 0);

              return (
                <div key={order.id} className="rounded-xl border border-white/10 bg-bg-base/50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
                        <Package size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-white">{order.orderNumber || order.id}</p>
                          {order.voucherCode && (
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                              <Tag size={12} /> {order.voucherCode}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">Awaiting seller shipment confirmation</p>
                      </div>
                    </div>

                    <div className="text-right">
                      {hasDiscount ? (
                        <>
                          <div className="text-xs text-gray-400 line-through">{money(orderSubtotal)}</div>
                          <span className="font-bold text-brand-gold">{money(order.totalAmount)}</span>
                        </>
                      ) : (
                        <span className="font-bold text-brand-blue">{money(order.totalAmount)}</span>
                      )}
                    </div>
                  </div>

                  {order.items && order.items.length > 0 && (
                    <div className="mt-3 border-t border-white/5 pt-3">
                      <div className="space-y-1.5">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs text-gray-400">
                            <span className="truncate pr-2">
                              {item.listing.name} × {item.quantity}
                            </span>
                            <span className="shrink-0">{money(item.listing.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {hasDiscount && (
                    <div className="mt-3 flex items-center justify-between rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-400">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Tag size={12} /> Voucher discount ({order.voucherCode || 'Applied'})
                      </span>
                      <span className="font-bold">- {money(order.discountAmount ?? 0)}</span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Price breakdown summary */}
            <div className="rounded-xl border border-white/10 bg-bg-base/30 p-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal ({orders.reduce((sum, o) => sum + (o.items?.length || 0), 0)} items)</span>
                  <span className="text-gray-200">{money(subtotal)}</span>
                </div>

                {totalDiscount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Tag size={14} /> Total Discount
                    </span>
                    <span>- {money(totalDiscount)}</span>
                  </div>
                )}

                <div className="flex justify-between border-t border-white/10 pt-2 text-base font-bold text-white">
                  <span>Total paid</span>
                  <span className="text-xl text-brand-gold">{money(total)}</span>
                </div>
              </div>

              {totalDiscount > 0 && (
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-brand-blue/20 bg-brand-blue/10 px-3 py-2 text-xs text-brand-blue">
                  <ShieldCheck size={16} className="shrink-0 text-brand-blue" />
                  <span>
                    <strong>Platform Subsidy:</strong> ส่วนลดนี้ได้รับการสนับสนุนจากแพลตฟอร์มเต็มจำนวน ทางผู้ขายจะได้รับเงินเต็ม <strong>{money(subtotal)}</strong> ตามราคาตั้งขาย
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="mt-8 text-sm text-gray-400">Reservation details are not available yet. You can find the order in My Orders.</p>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link to="/orders" className="rounded-xl bg-brand-blue px-6 py-3 font-semibold text-bg-base hover:bg-brand-blue/90">
            View my orders
          </Link>
          <Link to="/cards" className="rounded-full border border-white/15 px-6 py-3 font-semibold text-gray-300 hover:text-white">
            Continue browsing
          </Link>
        </div>
      </div>
    </main>
  );
}
