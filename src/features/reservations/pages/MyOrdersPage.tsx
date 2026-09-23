import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Clock, Package, RefreshCw, Truck, XCircle } from 'lucide-react';

import type { ReservationOrder, ReservationStatus } from '@/entities/reservation/model/types';
import { useAuthStore } from '@/features/auth/model/useAuthStore';
import { Badge } from '@/shared/components/Badge';
import { Skeleton } from '@/shared/components/Skeleton';
import { fetchBuyerOrders } from '../api/buyerOrders';

type FilterTab = 'ALL' | ReservationStatus;

interface StatusConfig {
  label: string;
  variant: 'warning' | 'gold' | 'success' | 'danger' | 'default';
  icon: typeof Clock;
}

const STATUS_CONFIGS: Record<ReservationStatus, StatusConfig> = {
  PENDING: { label: 'Pending', variant: 'warning', icon: Clock },
  RESERVED: { label: 'Pending', variant: 'warning', icon: Clock },
  SENT: { label: 'Sent', variant: 'success', icon: Truck },
  FULFILLED: { label: 'Sent', variant: 'success', icon: Truck },
  CANCELLED: { label: 'Cancelled', variant: 'danger', icon: XCircle },
};

const FILTER_TABS: Array<{ key: FilterTab; label: string }> = [
  { key: 'ALL', label: 'All' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'SENT', label: 'Sent' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

export function MyOrdersPage() {
  const user = useAuthStore((state) => state.user);
  const [orders, setOrders] = useState<ReservationOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');

  const loadOrders = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      setOrders(await fetchBuyerOrders(user.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const filteredOrders = useMemo(
    () =>
      activeTab === 'ALL'
        ? orders
        : orders.filter((order) => {
            if (activeTab === 'PENDING') {
              return order.status === 'PENDING' || order.status === 'RESERVED';
            }
            if (activeTab === 'SENT') {
              return order.status === 'SENT' || order.status === 'FULFILLED';
            }
            return order.status === activeTab;
          }),
    [activeTab, orders],
  );

  return (
    <div className="min-h-[calc(100vh-64px)] w-full bg-[#0B141F] px-4 py-10 text-white md:px-8">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">My Orders</h1>
            <p className="mt-1 text-sm text-gray-400">Track and manage your card reservations.</p>
          </div>
          <button
            type="button"
            onClick={() => void loadOrders()}
            disabled={loading}
            className="inline-flex self-start items-center gap-2 rounded-lg border border-white/10 bg-bg-surface px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-bg-elevated disabled:opacity-50 sm:self-auto"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap rounded-full border px-5 py-2 text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? 'border-[#EFA025] bg-[#EFA025] text-white shadow-[0_0_12px_rgba(239,160,37,0.35)]'
                  : 'border-white/15 bg-transparent text-[#C0C4D1] hover:border-white/30 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex flex-col gap-4 rounded-2xl border border-[rgba(143,179,226,0.15)] bg-[#192338] p-6">
            <Skeleton className="h-8 w-48 bg-white/5" />
            {[1, 2].map((item) => (
              <div key={item} className="flex items-center justify-between rounded-xl border border-white/5 bg-[#0B141F]/40 p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="size-14 rounded-lg bg-white/5" />
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-32 bg-white/5" />
                    <Skeleton className="h-3 w-48 bg-white/5" />
                  </div>
                </div>
                <Skeleton className="h-6 w-24 rounded-full bg-white/5" />
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-status-danger/30 bg-[#192338] p-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-status-danger/10 text-status-danger">
              <AlertCircle size={28} />
            </div>
            <div>
              <h2 className="text-lg font-bold">Unable to load orders</h2>
              <p className="mt-1 text-sm text-gray-400">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => void loadOrders()}
              className="rounded-lg bg-brand-blue px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-blue/90"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && filteredOrders.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-[rgba(143,179,226,0.15)] bg-[#192338] px-6 py-16 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-white/5 text-gray-400">
              <Package size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold">No orders found</h2>
              <p className="mt-1 text-sm text-gray-400">
                {activeTab === 'ALL'
                  ? "You haven't placed any orders yet. Start exploring the marketplace for rare cards!"
                  : `You don't have any orders with status "${FILTER_TABS.find((tab) => tab.key === activeTab)?.label}".`}
              </p>
            </div>
          </div>
        )}

        {!loading && !error && filteredOrders.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-[rgba(143,179,226,0.15)] bg-[#192338] shadow-xl">
            <div className="hidden grid-cols-12 gap-4 border-b border-white/10 bg-[#111A29] px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#99A6B8] md:grid">
              <div className="col-span-3">Order ID & Date</div>
              <div className="col-span-3">Seller</div>
              <div className="col-span-4">Items</div>
              <div className="col-span-2 text-right">Status</div>
            </div>

            <div className="divide-y divide-white/5">
              {filteredOrders.map((order) => {
                const status = STATUS_CONFIGS[order.status];
                const StatusIcon = status.icon;
                const primaryItem = order.items[0];
                const totalItemCount = order.items.reduce((total, item) => total + item.quantity, 0);
                const formattedDate = new Date(order.createdAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });

                return (
                  <div
                    key={order.id}
                    className="flex flex-col gap-4 p-5 transition-colors hover:bg-white/[0.02] md:grid md:grid-cols-12 md:items-center md:px-6 md:py-4"
                  >
                    <div className="flex items-center justify-between md:col-span-3 md:block">
                      <div className="flex flex-col">
                        <span className="text-base font-bold tracking-wide">#{order.id.toUpperCase()}</span>
                        <span className="mt-0.5 text-xs text-gray-400">{formattedDate}</span>
                      </div>
                      <div className="md:hidden">
                        <Badge variant={status.variant} className="flex items-center gap-1 px-2.5 py-1 text-xs">
                          <StatusIcon size={12} />
                          {status.label}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 md:col-span-3">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-blue/15 text-xs font-bold text-brand-blue ring-1 ring-brand-blue/30">
                        {order.sellerId.charAt(0).toUpperCase()}
                      </div>
                      <span className="line-clamp-1 text-sm font-medium text-gray-200">Seller {order.sellerId}</span>
                    </div>

                    <div className="flex items-center gap-3 md:col-span-4">
                      {primaryItem ? (
                        <>
                          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-[#0B141F] p-1">
                            <img src={primaryItem.listing.image} alt={primaryItem.listing.name} className="size-full object-contain" />
                          </div>
                          <div className="flex min-w-0 flex-col">
                            <span className="line-clamp-1 text-sm font-semibold text-white">{primaryItem.listing.name}</span>
                            <span className="text-xs text-gray-400">
                              {totalItemCount > 1
                                ? `Qty: ${primaryItem.quantity} (+${totalItemCount - primaryItem.quantity} more)`
                                : `Qty: ${primaryItem.quantity}`}{' '}
                              · <span className="font-semibold text-brand-blue">฿{order.totalAmount.toLocaleString()}</span>
                            </span>
                          </div>
                        </>
                      ) : (
                        <span className="text-sm text-gray-400">No items listed</span>
                      )}
                    </div>

                    <div className="hidden md:col-span-2 md:flex md:justify-end">
                      <Badge variant={status.variant} className="flex items-center gap-1.5 px-3 py-1 text-xs">
                        <StatusIcon size={13} />
                        {status.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
