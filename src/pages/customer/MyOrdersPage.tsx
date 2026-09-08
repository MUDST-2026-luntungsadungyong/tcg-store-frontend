import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Clock, Truck, CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { ordersApi } from '@/api/orders';
import { Badge } from '@/components/common/Badge';
import { Skeleton } from '@/components/common/Skeleton';
import type { Order, OrderStatus } from '@/types';

type FilterTab = 'ALL' | 'AWAITING_SHIP' | 'SHIPPED' | 'FULFILLED' | 'CANCELLED';

interface StatusConfig {
  label: string;
  variant: 'warning' | 'gold' | 'success' | 'danger' | 'default';
  icon: typeof Clock;
  textColor: string;
}

const STATUS_CONFIGS: Record<OrderStatus, StatusConfig> = {
  PENDING: {
    label: 'Awaiting Ship',
    variant: 'warning',
    icon: Clock,
    textColor: 'text-[#EFA025]',
  },
  AWAITING_SHIP: {
    label: 'Awaiting Ship',
    variant: 'warning',
    icon: Clock,
    textColor: 'text-[#EFA025]',
  },
  SHIPPED: {
    label: 'Shipped',
    variant: 'gold',
    icon: Truck,
    textColor: 'text-brand-blue',
  },
  FULFILLED: {
    label: 'Fulfilled',
    variant: 'success',
    icon: CheckCircle2,
    textColor: 'text-[#4CC887]',
  },
  CANCELLED: {
    label: 'Cancelled',
    variant: 'danger',
    icon: XCircle,
    textColor: 'text-status-danger',
  },
};

export function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ordersApi.getMyOrders();
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = useMemo(() => {
    if (activeTab === 'ALL') return orders;
    return orders.filter((order) => {
      if (activeTab === 'AWAITING_SHIP') {
        return order.status === 'PENDING' || order.status === 'AWAITING_SHIP';
      }
      return order.status === activeTab;
    });
  }, [orders, activeTab]);

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'ALL', label: 'All' },
    { key: 'AWAITING_SHIP', label: 'Awaiting Ship' },
    { key: 'SHIPPED', label: 'Shipped' },
    { key: 'FULFILLED', label: 'Fulfilled' },
    { key: 'CANCELLED', label: 'Cancelled' },
  ];

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-[#0B141F] text-white font-['IBM_Plex_Sans_Thai',sans-serif] px-4 md:px-8 py-10">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-6">
        
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              My Orders
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Track and manage all your purchased cards and orders
            </p>
          </div>
          
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-surface hover:bg-bg-elevated border border-white/10 text-sm font-medium text-gray-300 transition-colors disabled:opacity-50"
            title="Refresh Orders"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Order Status Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 border ${
                  isActive
                    ? 'bg-[#EFA025] text-white border-[#EFA025] shadow-[0_0_12px_rgba(239,160,37,0.35)]'
                    : 'bg-transparent text-[#C0C4D1] hover:text-white border-white/15 hover:border-white/30'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-[#192338] border border-[rgba(143,179,226,0.15)] rounded-2xl p-6 flex flex-col gap-4">
            <Skeleton className="h-8 w-48 bg-white/5" />
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-[#0B141F]/40 rounded-xl border border-white/5">
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
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-[#192338] border border-status-danger/30 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-4">
            <div className="size-12 rounded-full bg-status-danger/10 text-status-danger flex items-center justify-center">
              <AlertCircle size={28} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Unable to load orders</h3>
              <p className="text-sm text-gray-400 mt-1">{error}</p>
            </div>
            <button
              onClick={fetchOrders}
              className="px-5 py-2 bg-brand-blue hover:bg-brand-blue/90 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredOrders.length === 0 && (
          <div className="bg-[#192338] border border-[rgba(143,179,226,0.15)] rounded-2xl py-16 px-6 flex flex-col items-center justify-center text-center gap-4">
            <div className="size-16 rounded-full bg-white/5 flex items-center justify-center text-gray-400">
              <Package size={32} />
            </div>
            <div className="max-w-md">
              <h3 className="text-xl font-bold text-white">No orders found</h3>
              <p className="text-sm text-gray-400 mt-1">
                {activeTab === 'ALL'
                  ? "You haven't placed any orders yet. Start exploring the marketplace for rare cards!"
                  : `You don't have any orders with status "${tabs.find((t) => t.key === activeTab)?.label}".`}
              </p>
            </div>
            <Link
              to="/browse"
              className="mt-2 bg-brand-blue hover:bg-brand-blue/90 text-white font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors shadow-lg shadow-brand-blue/20"
            >
              Explore Marketplace
            </Link>
          </div>
        )}

        {/* Orders Table & Cards List (Figma Frame Structure) */}
        {!loading && !error && filteredOrders.length > 0 && (
          <div className="bg-[#192338] border border-[rgba(143,179,226,0.15)] rounded-2xl overflow-hidden shadow-xl">
            {/* Desktop Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-[#111A29] border-b border-white/10 text-xs font-bold uppercase tracking-wider text-[#99A6B8]">
              <div className="col-span-3">ORDER ID & DATE</div>
              <div className="col-span-3">SELLER</div>
              <div className="col-span-4">ITEMS</div>
              <div className="col-span-2 text-right">STATUS</div>
            </div>

            {/* Orders Rows */}
            <div className="divide-y divide-white/5">
              {filteredOrders.map((order) => {
                const statusCfg = STATUS_CONFIGS[order.status] ?? {
                  label: order.status,
                  variant: 'default',
                  icon: Package,
                  textColor: 'text-gray-300',
                };
                const StatusIcon = statusCfg.icon;
                const formattedDate = order.createdAt
                  ? new Date(order.createdAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'N/A';
                const sellerName = order.sellerName ?? 'CardVault TH';
                const primaryItem = order.items?.[0];
                const totalItemCount = order.items?.reduce((acc, it) => acc + it.quantity, 0) ?? 0;

                return (
                  <div
                    key={order.id}
                    className="p-5 md:px-6 md:py-4 transition-colors hover:bg-white/[0.02] flex flex-col md:grid md:grid-cols-12 md:items-center gap-4"
                  >
                    {/* Column 1: Order ID & Date */}
                    <div className="md:col-span-3 flex items-center justify-between md:block">
                      <div className="flex flex-col">
                        <span className="font-bold text-white text-base tracking-wide">
                          #{order.id.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-400 mt-0.5">{formattedDate}</span>
                      </div>
                      {/* Status visible on mobile only */}
                      <div className="md:hidden">
                        <Badge variant={statusCfg.variant} className="gap-1 px-2.5 py-1 text-xs">
                          <StatusIcon size={12} />
                          {statusCfg.label}
                        </Badge>
                      </div>
                    </div>

                    {/* Column 2: Seller */}
                    <div className="md:col-span-3 flex items-center gap-2">
                      <div className="size-7 rounded-full bg-brand-blue/15 text-brand-blue flex items-center justify-center font-bold text-xs shrink-0 ring-1 ring-brand-blue/30">
                        {sellerName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-200 line-clamp-1">
                        {sellerName}
                      </span>
                    </div>

                    {/* Column 3: Items Details */}
                    <div className="md:col-span-4 flex items-center gap-3">
                      {primaryItem ? (
                        <>
                          <div className="size-12 rounded-lg bg-[#0B141F] border border-white/10 p-1 shrink-0 flex items-center justify-center">
                            <img
                              src={primaryItem.product.image || '/assets/expensive_card_1.png'}
                              alt={primaryItem.product.name}
                              className="size-full object-contain filter drop-shadow-sm"
                            />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold text-white line-clamp-1 hover:text-brand-blue transition-colors">
                              {primaryItem.product.name}
                            </span>
                            <span className="text-xs text-gray-400">
                              {totalItemCount > 1
                                ? `Qty: ${primaryItem.quantity} (+${totalItemCount - primaryItem.quantity} more)`
                                : `Qty: ${primaryItem.quantity}`}
                              {' · '}
                              <span className="text-brand-blue font-semibold">
                                ฿{order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </span>
                            </span>
                          </div>
                        </>
                      ) : (
                        <span className="text-sm text-gray-400">No items listed</span>
                      )}
                    </div>

                    {/* Column 4: Status (Desktop) */}
                    <div className="hidden md:col-span-2 md:flex flex-col items-end gap-1">
                      <Badge variant={statusCfg.variant} className="gap-1.5 px-3 py-1 text-xs">
                        <StatusIcon size={13} />
                        {statusCfg.label}
                      </Badge>
                      {order.trackingNumber && (
                        <span className="text-[11px] text-gray-400 font-mono">
                          Track: {order.trackingNumber}
                        </span>
                      )}
                    </div>

                    {/* Mobile Footer Total & Tracking */}
                    <div className="md:hidden flex items-center justify-between pt-2 border-t border-white/5 text-xs text-gray-400">
                      <span>Total: <strong className="text-brand-blue font-bold">฿{order.totalAmount.toLocaleString()}</strong></span>
                      {order.trackingNumber && (
                        <span className="font-mono">Track: {order.trackingNumber}</span>
                      )}
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
