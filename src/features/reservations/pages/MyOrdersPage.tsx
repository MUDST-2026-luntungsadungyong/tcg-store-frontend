import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, Clock, Package, RefreshCw, Truck, XCircle } from 'lucide-react';

import type { ReservationOrder, ReservationStatus } from '@/entities/reservation/model/types';
import { useAuthStore } from '@/features/auth/model/useAuthStore';
import { Badge } from '@/shared/components/Badge';
import { Skeleton } from '@/shared/components/Skeleton';
import { fetchBuyerOrders, fetchBuyerOrderById, updateBuyerOrderStatus } from '../api/buyerOrders';
import { Modal } from '@/shared/components/Modal';
import { Button } from '@/shared/components/Button';
import { ConditionLabel } from '@/shared/components/ConditionLabel';

type FilterTab = 'ALL' | ReservationStatus;

interface StatusConfig {
  label: string;
  variant: 'warning' | 'gold' | 'success' | 'danger' | 'default';
  icon: typeof Clock;
}

const STATUS_CONFIGS: Record<ReservationStatus, StatusConfig> = {
  PENDING: { label: 'Pending', variant: 'warning', icon: Clock },
  CONFIRMED: { label: 'Confirmed', variant: 'warning', icon: Clock },
  RESERVED: { label: 'Pending', variant: 'warning', icon: Clock },
  SENT: { label: 'Sent', variant: 'success', icon: Truck },
  FULFILLED: { label: 'Received', variant: 'success', icon: Truck },
  CANCELLED: { label: 'Cancelled', variant: 'danger', icon: XCircle },
};

const FILTER_TABS: Array<{ key: FilterTab; label: string }> = [
  { key: 'ALL', label: 'All' },
  { key: 'PENDING', label: 'Pending / Confirmed' },
  { key: 'SENT', label: 'Sent' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

export function MyOrdersPage() {
  const user = useAuthStore((state) => state.user);
  const { orderId: routeOrderId } = useParams<{ orderId?: string }>();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<ReservationOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<ReservationOrder | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showCancelPopup, setShowCancelPopup] = useState(false);
  const [cancelNote, setCancelNote] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

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

  useEffect(() => {
    if (!routeOrderId) return;
    let isCancelled = false;
    const fetchDirect = async () => {
      setDetailsLoading(true);
      try {
        const directOrder = await fetchBuyerOrderById(routeOrderId);
        if (!isCancelled) {
          setSelectedOrder(directOrder);
          setIsDetailsModalOpen(true);
        }
      } catch (err) {
        console.error('Failed to load direct order by ID', err);
      } finally {
        if (!isCancelled) setDetailsLoading(false);
      }
    };
    void fetchDirect();
    return () => {
      isCancelled = true;
    };
  }, [routeOrderId]);

  const handleOpenDetails = async (order: ReservationOrder) => {
    setSelectedOrder(order);
    setIsDetailsModalOpen(true);
    setDetailsLoading(true);
    try {
      const detailed = await fetchBuyerOrderById(order.id);
      setSelectedOrder(detailed);
    } catch {
      // Keep existing order details if fetch fails
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCloseDetails = () => {
    setIsDetailsModalOpen(false);
    if (routeOrderId) {
      navigate('/orders', { replace: true });
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string, note?: string) => {
    setActionLoadingId(orderId);
    try {
      await updateBuyerOrderStatus(orderId, newStatus, note);
      await loadOrders();
    } catch (err) {
      console.error('Failed to update status:', err);
      setError(err instanceof Error ? err.message : 'Unable to update order status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredOrders = useMemo(
    () =>
      activeTab === 'ALL'
        ? orders
        : orders.filter((order) => {
            if (activeTab === 'PENDING') {
              return order.status === 'PENDING' || order.status === 'CONFIRMED' || order.status === 'RESERVED';
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
              <div className="col-span-2">Order ID & Date</div>
              <div className="col-span-2">Seller</div>
              <div className="col-span-3">Items</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-3 text-right">Actions</div>
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
                    <div className="flex items-center justify-between md:col-span-2 md:block">
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

                    <div className="flex items-center gap-2 md:col-span-2">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-blue/15 text-xs font-bold text-brand-blue ring-1 ring-brand-blue/30">
                        {order.sellerId.charAt(0).toUpperCase()}
                      </div>
                      <span className="line-clamp-1 text-sm font-medium text-gray-200">Seller {order.sellerId}</span>
                    </div>

                    <div className="flex items-center gap-3 md:col-span-3">
                      {primaryItem ? (
                        <>
                          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-[#0B141F] p-1">
                            <img src={primaryItem.listing.image} alt={primaryItem.listing.name} className="size-full object-contain" />
                          </div>
                          <div className="flex min-w-0 flex-col">
                            <span className="line-clamp-1 text-sm font-semibold text-white">{primaryItem.listing.name}</span>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              <ConditionLabel condition={primaryItem.listing.condition} fallback="Not specified" size="xs" />
                              <span className="text-xs text-gray-400">
                                {totalItemCount > 1
                                  ? `Qty: ${primaryItem.quantity} (+${totalItemCount - primaryItem.quantity} more)`
                                  : `Qty: ${primaryItem.quantity}`}{' '}
                                · <span className="font-semibold text-brand-blue">฿{order.totalAmount.toLocaleString()}</span>
                              </span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <span className="text-sm text-gray-400">No items listed</span>
                      )}
                    </div>

                    <div className="hidden md:col-span-2 md:flex md:items-center">
                      <Badge variant={status.variant} className="flex items-center gap-1.5 px-3 py-1 text-xs">
                        <StatusIcon size={13} />
                        {status.label}
                      </Badge>
                    </div>

                    <div className="mt-4 md:mt-0 md:col-span-3 flex flex-col md:items-end gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => void handleOpenDetails(order)}
                        className="w-full md:w-32 text-xs"
                      >
                        Order Details
                      </Button>
                      
                      {order.status === 'SENT' && (
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={actionLoadingId === order.id}
                          onClick={() => handleStatusUpdate(order.id, 'FULFILLED')}
                          className="w-full md:w-32 text-xs bg-status-success hover:bg-status-success/90"
                        >
                          Mark Received
                        </Button>
                      )}
                      
                      {(order.status === 'PENDING' || order.status === 'CONFIRMED' || order.status === 'RESERVED') && (
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={actionLoadingId === order.id}
                          onClick={() => { setSelectedOrder(order); setCancelNote(''); setShowCancelPopup(true); }}
                          className="w-full md:w-32 text-xs"
                        >
                          Cancel Order
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Cancel Order Popup with Note */}
      <Modal
        isOpen={showCancelPopup}
        onClose={() => { setShowCancelPopup(false); setSelectedOrder(null); }}
        title="Cancel Order"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-300">
            Please provide a reason for cancelling this order.
          </p>
          <textarea
            value={cancelNote}
            onChange={(e) => setCancelNote(e.target.value)}
            className="w-full h-24 p-3 rounded-lg border border-[#31405A] bg-[#192338] text-white text-sm"
            placeholder="Reason for cancellation..."
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => { setShowCancelPopup(false); setSelectedOrder(null); }}>
              Back
            </Button>
            <Button
              variant="danger"
              disabled={!cancelNote.trim()}
              onClick={async () => {
                if (selectedOrder) await handleStatusUpdate(selectedOrder.id, 'CANCELLED', cancelNote);
                setShowCancelPopup(false);
                setSelectedOrder(null);
              }}
            >
              Cancel Order
            </Button>
          </div>
        </div>
      </Modal>

      {/* Order Details & Timeline Modal */}
      {selectedOrder && (
        <Modal
          isOpen={isDetailsModalOpen}
          onClose={handleCloseDetails}
          title={`Order Details - #${selectedOrder.id.toUpperCase()}`}
          className="md:max-w-2xl"
        >
          <div className="space-y-5 text-sm text-gray-200">
            {/* Order Header / Metadata */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#111A29] p-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-400">Order Placed</p>
                <p className="font-semibold text-white">
                  {new Date(selectedOrder.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={STATUS_CONFIGS[selectedOrder.status].variant}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs"
                >
                  {STATUS_CONFIGS[selectedOrder.status].label}
                </Badge>
              </div>
            </div>

            {/* Seller Information */}
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-[#111A29]/70 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-blue/15 text-xs font-bold text-brand-blue ring-1 ring-brand-blue/30">
                  {selectedOrder.sellerId.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium text-white">Seller: {selectedOrder.sellerId}</span>
              </div>
            </div>

            {/* Reserved Items Section */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">
                  Reserved Items ({selectedOrder.items?.reduce((acc, it) => acc + it.quantity, 0) ?? 0})
                </h3>
                {detailsLoading && (
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <RefreshCw size={12} className="animate-spin" /> Updating...
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  selectedOrder.items.map((item, idx) => {
                    const lineTotal = item.listing.price * item.quantity;
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#111A29]/50 p-3.5 transition-colors hover:bg-white/[0.02]"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex size-14 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-[#0B141F] p-1">
                            <img
                              src={item.listing.image}
                              alt={item.listing.name}
                              className="size-full object-contain"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-white">{item.listing.name}</p>
                            <p className="text-xs text-gray-400">
                              {item.listing.set || item.listing.game || 'Card'}
                              {item.listing.cardNumber ? ` · #${item.listing.cardNumber}` : ''}
                            </p>
                            <div className="mt-1.5 flex flex-wrap items-center gap-2">
                              <span className="text-[11px] text-gray-400">Condition:</span>
                              <ConditionLabel
                                condition={item.listing.condition}
                                fallback="Not specified"
                                size="xs"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="font-semibold text-brand-blue">฿{lineTotal.toLocaleString()}</p>
                          <p className="text-xs text-gray-400">
                            {item.quantity} × ฿{item.listing.price.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs italic text-gray-400">No items available.</p>
                )}
              </div>

              {/* Financial Totals */}
              <div className="mt-3 flex items-center justify-between rounded-xl border border-white/10 bg-[#111A29] px-4 py-3">
                <span className="text-sm font-medium text-gray-300">Total Order Amount</span>
                <span className="text-lg font-bold text-[#EFA025]">
                  ฿{selectedOrder.totalAmount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Timeline */}
            <div className="rounded-xl border border-white/10 bg-[#111A29]/50 p-4">
              <h3 className="mb-3 text-sm font-bold text-white">Order Timeline</h3>
              {selectedOrder.logs && selectedOrder.logs.length > 0 ? (
                <div className="space-y-3">
                  {selectedOrder.logs.map((log, index) => (
                    <div key={index} className="flex gap-3 text-xs">
                      <div className="flex flex-col items-center">
                        <div className="mt-1.5 size-2 rounded-full bg-brand-blue" />
                        {index !== selectedOrder.logs!.length - 1 && <div className="my-1 h-full w-px bg-[#31405A]" />}
                      </div>
                      <div className="flex-1 pb-2">
                        <div className="flex items-start justify-between">
                          <p className="font-semibold text-white">
                            {log.toStatus} <span className="text-[10px] font-normal text-gray-400">by {log.changedByRole}</span>
                          </p>
                          <p className="text-[10px] text-gray-400">{new Date(log.createdAt).toLocaleString()}</p>
                        </div>
                        {log.note && (
                          <div className="mt-1 rounded border border-[#31405A] bg-[#192338] p-2 italic text-gray-300">
                            "{log.note}"
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs italic text-gray-500">No timeline logs available.</p>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              {selectedOrder.status === 'SENT' && (
                <Button
                  variant="primary"
                  size="sm"
                  disabled={actionLoadingId === selectedOrder.id}
                  onClick={() => {
                    void handleStatusUpdate(selectedOrder.id, 'FULFILLED');
                    handleCloseDetails();
                  }}
                  className="bg-status-success text-xs hover:bg-status-success/90"
                >
                  Mark Received
                </Button>
              )}

              {(selectedOrder.status === 'PENDING' || selectedOrder.status === 'CONFIRMED' || selectedOrder.status === 'RESERVED') && (
                <Button
                  variant="danger"
                  size="sm"
                  disabled={actionLoadingId === selectedOrder.id}
                  onClick={() => {
                    handleCloseDetails();
                    setCancelNote('');
                    setShowCancelPopup(true);
                  }}
                  className="text-xs"
                >
                  Cancel Order
                </Button>
              )}

              <Button variant="secondary" size="sm" onClick={handleCloseDetails}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}


