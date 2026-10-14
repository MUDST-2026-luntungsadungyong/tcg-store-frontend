import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageCircle,
  Package,
  Phone,
  RefreshCw,
  ShieldCheck,
  Store,
  Truck,
  XCircle,
} from 'lucide-react';

import type { ReservationOrder, ReservationStatus } from '@/entities/reservation/model/types';
import { storesApi, type StoreProfile } from '@/features/stores/api/stores';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { ConditionLabel } from '@/shared/components/ConditionLabel';
import { Modal } from '@/shared/components/Modal';
import { Skeleton } from '@/shared/components/Skeleton';
import { fetchBuyerOrderById, updateBuyerOrderStatus } from '../api/buyerOrders';

interface StatusBannerConfig {
  title: string;
  description: string;
  badgeLabel: string;
  variant: 'warning' | 'gold' | 'success' | 'danger' | 'default';
  icon: typeof Clock;
  bgColor: string;
  borderColor: string;
}

const STATUS_BANNER_CONFIGS: Record<ReservationStatus, StatusBannerConfig> = {
  PENDING: {
    title: 'Order Placed & Awaiting Confirmation',
    description: 'Your reservation has been placed. Waiting for the seller to verify and prepare your shipment.',
    badgeLabel: 'Pending Confirmation',
    variant: 'warning',
    icon: Clock,
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
  },
  CONFIRMED: {
    title: 'Reservation Confirmed',
    description: 'The seller has confirmed your reservation and is packaging your cards for dispatch.',
    badgeLabel: 'Confirmed',
    variant: 'warning',
    icon: Clock,
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
  },
  RESERVED: {
    title: 'Order Placed & Awaiting Confirmation',
    description: 'Your reservation has been placed. Waiting for the seller to verify and prepare your shipment.',
    badgeLabel: 'Pending Confirmation',
    variant: 'warning',
    icon: Clock,
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
  },
  SENT: {
    title: 'Order Dispatched / In Transit',
    description: 'The seller has shipped your order. Please inspect your cards upon arrival and click "Mark Received".',
    badgeLabel: 'Dispatched',
    variant: 'success',
    icon: Truck,
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
  },
  FULFILLED: {
    title: 'Order Completed',
    description: 'Cards received and transaction complete! These cards are now part of your collection showcase.',
    badgeLabel: 'Completed',
    variant: 'success',
    icon: CheckCircle2,
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
  },
  CANCELLED: {
    title: 'Order Cancelled',
    description: 'This reservation has been cancelled. Any reserved cards have been released.',
    badgeLabel: 'Cancelled',
    variant: 'danger',
    icon: XCircle,
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30',
  },
};

export function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<ReservationOrder | null>(null);
  const [storeProfile, setStoreProfile] = useState<StoreProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cancellation state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Confirm Received state
  const [showConfirmReceivedModal, setShowConfirmReceivedModal] = useState(false);

  const loadOrderDetail = useCallback(async (isSilentRefresh = false) => {
    if (!orderId) return;

    if (isSilentRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const detailedOrder = await fetchBuyerOrderById(orderId);
      setOrder(detailedOrder);

      // Fetch seller store profile for contact information
      if (detailedOrder.sellerId) {
        try {
          const profile = await storesApi.public(detailedOrder.sellerId);
          setStoreProfile(profile);
        } catch {
          // Gracefully continue without store profile
          setStoreProfile(null);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load order details.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orderId]);

  useEffect(() => {
    void loadOrderDetail();
  }, [loadOrderDetail]);

  const handleUpdateStatus = async (newStatus: string, note?: string) => {
    if (!order || isSubmittingAction) return;

    setIsSubmittingAction(true);
    try {
      await updateBuyerOrderStatus(order.id, newStatus, note);
      await loadOrderDetail(true);
      setShowCancelModal(false);
      setShowConfirmReceivedModal(false);
      setCancelReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order status.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const formattedDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <main id="main-content" className="min-h-[calc(100vh-64px)] w-full bg-[#0B141F] px-4 py-8 text-white md:px-8">
        <div className="mx-auto flex max-w-4xl flex-col gap-6">
          <Skeleton className="h-6 w-36 bg-white/5" />
          <div className="rounded-2xl border border-white/10 bg-[#192338] p-6 space-y-4">
            <Skeleton className="h-8 w-64 bg-white/5" />
            <Skeleton className="h-20 w-full rounded-xl bg-white/5" />
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#192338] p-6 space-y-4">
            <Skeleton className="h-6 w-48 bg-white/5" />
            <Skeleton className="h-24 w-full rounded-xl bg-white/5" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main id="main-content" className="min-h-[calc(100vh-64px)] w-full bg-[#0B141F] px-4 py-12 text-white md:px-8">
        <div className="mx-auto flex max-w-xl flex-col items-center justify-center gap-4 rounded-2xl border border-status-danger/30 bg-[#192338] p-8 text-center shadow-xl">
          <div className="flex size-14 items-center justify-center rounded-full bg-status-danger/10 text-status-danger">
            <AlertCircle size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Unable to display order</h1>
            <p className="mt-2 text-sm text-gray-400">{error || 'Order was not found or access is restricted.'}</p>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <Button variant="secondary" onClick={() => navigate('/orders')}>
              <ArrowLeft size={16} /> Back to My Orders
            </Button>
            <Button variant="primary" onClick={() => void loadOrderDetail()}>
              <RefreshCw size={16} /> Try Again
            </Button>
          </div>
        </div>
      </main>
    );
  }

  const statusConfig = STATUS_BANNER_CONFIGS[order.status] ?? STATUS_BANNER_CONFIGS.PENDING;
  const StatusIcon = statusConfig.icon;
  const canCancel = order.status === 'PENDING' || order.status === 'CONFIRMED' || order.status === 'RESERVED';
  const canMarkReceived = order.status === 'SENT';

  const orderDisplayNumber = order.orderNumber || order.id;

  return (
    <main id="main-content" className="min-h-[calc(100vh-64px)] w-full bg-[#0B141F] px-4 py-8 text-white md:px-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        {/* Navigation Breadcrumb & Page Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 transition-colors hover:text-brand-blue focus:outline-none focus-visible:underline"
          >
            <ArrowLeft size={18} />
            Back to My Orders
          </Link>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void loadOrderDetail(true)}
              disabled={refreshing}
              className="gap-2 text-xs"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </Button>
          </div>
        </div>

        {/* E-Commerce Status Header Banner */}
        <section
          aria-label="Order Status"
          className={`flex flex-col gap-4 rounded-2xl border ${statusConfig.borderColor} ${statusConfig.bgColor} p-6 shadow-lg backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between`}
        >
          <div className="flex items-start gap-4">
            <div className="mt-1 flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white shadow-inner">
              <StatusIcon size={26} className="text-brand-gold" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                  {statusConfig.title}
                </h1>
                <Badge variant={statusConfig.variant} className="px-2.5 py-0.5 text-xs font-semibold">
                  {statusConfig.badgeLabel}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-gray-300">
                {statusConfig.description}
              </p>
              {order.cancellationReason && (
                <p className="mt-2 text-xs text-rose-300">
                  <span className="font-semibold">Cancellation note:</span> {order.cancellationReason}
                </p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 flex-col text-left sm:text-right border-t border-white/10 pt-3 sm:border-t-0 sm:pt-0">
            <span className="text-xs uppercase tracking-wider text-gray-400">Order Reference</span>
            <span className="font-mono text-base font-bold text-white">#{orderDisplayNumber.toUpperCase()}</span>
          </div>
        </section>

        {/* Explicit Off-Platform Delivery & Payment Notice */}
        <div className="flex items-start gap-3 rounded-xl border border-brand-blue/30 bg-brand-blue/10 p-4 text-xs text-blue-200">
          <ShieldCheck size={20} className="mt-0.5 shrink-0 text-brand-blue" />
          <div className="leading-relaxed">
            <span className="font-bold text-white">Mythix Marketplace Notice: </span>
            Payment and physical delivery are arranged directly between the buyer and seller outside the Mythix platform.
            Please coordinate fulfillment using the authorized seller contact information below.
          </div>
        </div>

        {/* Seller & Store Contact Information Card */}
        <section aria-label="Seller Information" className="rounded-2xl border border-[rgba(143,179,226,0.15)] bg-[#192338] p-6 shadow-md">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-full bg-brand-blue/20 text-brand-blue ring-1 ring-brand-blue/40">
                <Store size={22} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Seller / Store</p>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-white">
                    {storeProfile?.shopName || order.sellerName || `Seller ${order.sellerId}`}
                  </span>
                  <Link
                    to={`/stores/${order.sellerId}`}
                    title="Visit seller storefront"
                    className="inline-flex items-center gap-1 text-xs text-brand-blue hover:underline"
                  >
                    Visit Store <ExternalLink size={12} />
                  </Link>
                </div>
              </div>
            </div>

            {/* Seller Contact Badges */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {storeProfile?.phone && (
                <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#111A29] px-3 py-1.5 text-gray-300">
                  <Phone size={14} className="text-emerald-400" />
                  <span>{storeProfile.phone}</span>
                </div>
              )}
              {storeProfile?.line && (
                <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#111A29] px-3 py-1.5 text-gray-300">
                  <MessageCircle size={14} className="text-green-400" />
                  <span>Line: {storeProfile.line}</span>
                </div>
              )}
              {storeProfile?.facebook && (
                <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#111A29] px-3 py-1.5 text-gray-300">
                  <span className="font-semibold text-blue-400">f</span>
                  <span>{storeProfile.facebook}</span>
                </div>
              )}
              {!storeProfile?.phone && !storeProfile?.line && !storeProfile?.facebook && (
                <span className="text-xs text-gray-400 italic">
                  Seller ID: {order.sellerId}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Reserved Items (Product List) */}
        <section aria-label="Reserved Products" className="overflow-hidden rounded-2xl border border-[rgba(143,179,226,0.15)] bg-[#192338] shadow-md">
          <div className="border-b border-white/10 bg-[#111A29] px-6 py-4">
            <h2 className="text-base font-bold text-white flex items-center justify-between">
              <span>Reserved Items ({order.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0})</span>
              <span className="text-xs font-normal text-gray-400">Card verification & condition confirmed</span>
            </h2>
          </div>

          <div className="divide-y divide-white/5">
            {order.items && order.items.length > 0 ? (
              order.items.map((item, index) => {
                const lineTotal = item.listing.price * item.quantity;
                return (
                  <div
                    key={index}
                    className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between transition-colors hover:bg-white/[0.02]"
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <Link
                        to={`/cards/${item.listing.id}`}
                        className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[#0B141F] p-1 transition-transform hover:scale-105"
                        title={`View ${item.listing.name}`}
                      >
                        <img
                          src={item.listing.image || '/assets/expensive_card_1.png'}
                          alt={item.listing.name}
                          className="size-full object-contain"
                        />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/cards/${item.listing.id}`}
                          className="truncate block font-semibold text-white transition-colors hover:text-brand-blue"
                        >
                          {item.listing.name}
                        </Link>
                        <p className="mt-0.5 text-xs text-gray-400">
                          {item.listing.set || item.listing.game || 'Trading Card'}
                          {item.listing.cardNumber ? ` · #${item.listing.cardNumber}` : ''}
                          {item.listing.rarity ? ` · ${item.listing.rarity}` : ''}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-medium text-gray-400">Condition:</span>
                          <ConditionLabel
                            condition={item.listing.condition}
                            fallback="Not specified"
                            size="sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/5 pt-3 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
                      <div className="text-left sm:text-right">
                        <p className="text-xs text-gray-400">
                          ฿{item.listing.price.toLocaleString()} × {item.quantity}
                        </p>
                        <p className="text-base font-bold text-brand-blue">
                          ฿{lineTotal.toLocaleString()}
                        </p>
                      </div>
                      <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs font-semibold text-gray-300">
                        Qty: {item.quantity}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-sm text-gray-400 italic">
                No items listed in this order.
              </div>
            )}
          </div>

          {/* Financial Breakdown Table Footer */}
          <div className="border-t border-white/10 bg-[#111A29]/70 p-6">
            <div className="flex flex-col gap-2 sm:max-w-xs sm:ml-auto">
              <div className="flex justify-between text-sm text-gray-400">
                <span>Items Subtotal</span>
                <span className="text-gray-200">
                  ฿{order.items?.reduce((sum, it) => sum + it.listing.price * it.quantity, 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-400">
                <span>Platform Reservation Fee</span>
                <span className="text-emerald-400">Free</span>
              </div>
              <div className="my-1 border-t border-white/10" />
              <div className="flex items-baseline justify-between">
                <span className="text-base font-bold text-white">Total Order Amount</span>
                <span className="text-2xl font-bold text-brand-gold">
                  ฿{order.totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Order Timeline (Status History) */}
        <section aria-label="Order Timeline" className="rounded-2xl border border-[rgba(143,179,226,0.15)] bg-[#192338] p-6 shadow-md">
          <h2 className="mb-4 text-base font-bold text-white flex items-center gap-2">
            <Calendar size={18} className="text-brand-blue" />
            Order Timeline & Audit History
          </h2>

          {order.logs && order.logs.length > 0 ? (
            <div className="space-y-4 pl-2">
              {order.logs.map((log, index) => {
                const isLast = index === order.logs!.length - 1;
                return (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="size-3 rounded-full bg-brand-blue ring-4 ring-brand-blue/20" />
                      {!isLast && <div className="my-1.5 h-full w-0.5 bg-white/10" />}
                    </div>
                    <div className="flex-1 pb-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-white">
                          Status updated to <span className="text-brand-gold">{log.toStatus}</span>
                          {log.changedByRole && (
                            <span className="ml-1.5 text-xs font-normal text-gray-400">
                              by {log.changedByRole}
                            </span>
                          )}
                        </p>
                        <span className="text-xs text-gray-400">
                          {formattedDate(log.createdAt)}
                        </span>
                      </div>
                      {log.note && (
                        <div className="mt-1.5 rounded-lg border border-white/10 bg-[#111A29] p-3 text-xs italic text-gray-300">
                          "{log.note}"
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 p-8 text-center text-gray-400">
              <Package size={28} className="text-gray-500" />
              <p className="text-sm">No timeline logs recorded yet.</p>
              <p className="text-xs text-gray-500">Order placed on {formattedDate(order.createdAt)}.</p>
            </div>
          )}
        </section>

        {/* Order Metadata Details */}
        <section aria-label="Order Information" className="rounded-2xl border border-[rgba(143,179,226,0.15)] bg-[#192338] p-6 text-xs text-gray-400">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <p className="uppercase tracking-wider font-semibold text-gray-500">Order Reference</p>
              <p className="mt-1 font-mono font-medium text-white">#{orderDisplayNumber.toUpperCase()}</p>
            </div>
            <div>
              <p className="uppercase tracking-wider font-semibold text-gray-500">Created Date</p>
              <p className="mt-1 font-medium text-white">{formattedDate(order.createdAt)}</p>
            </div>
            <div>
              <p className="uppercase tracking-wider font-semibold text-gray-500">Last Updated</p>
              <p className="mt-1 font-medium text-white">{formattedDate(order.updatedAt || order.createdAt)}</p>
            </div>
            <div>
              <p className="uppercase tracking-wider font-semibold text-gray-500">Buyer Reference</p>
              <p className="mt-1 font-medium text-white">{order.buyerId}</p>
            </div>
          </div>
        </section>

        {/* Contextual Action Bar */}
        {(canCancel || canMarkReceived) && (
          <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-end gap-3 rounded-2xl border border-white/10 bg-[#111A29]/95 p-4 shadow-2xl backdrop-blur-md">
            {canCancel && (
              <Button
                variant="danger"
                size="sm"
                disabled={isSubmittingAction}
                onClick={() => {
                  setCancelReason('');
                  setShowCancelModal(true);
                }}
              >
                Cancel Order
              </Button>
            )}

            {canMarkReceived && (
              <Button
                variant="primary"
                size="sm"
                disabled={isSubmittingAction}
                onClick={() => setShowConfirmReceivedModal(true)}
                className="bg-status-success hover:bg-status-success/90"
              >
                <CheckCircle2 size={16} />
                Mark Received
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Cancel Order Confirmation Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Card Reservation"
      >
        <div className="space-y-4 text-sm text-gray-300">
          <p>
            Are you sure you want to cancel this reservation for order #{orderDisplayNumber.toUpperCase()}?
            Any reserved cards will be released back to the seller.
          </p>
          <div>
            <label htmlFor="cancel-reason" className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
              Cancellation Reason (Required)
            </label>
            <textarea
              id="cancel-reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Changed my mind, found another listing..."
              className="w-full h-24 rounded-lg border border-white/15 bg-[#111A29] p-3 text-sm text-white placeholder-gray-500 focus:border-brand-blue focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setShowCancelModal(false)}
              disabled={isSubmittingAction}
            >
              Keep Order
            </Button>
            <Button
              variant="danger"
              disabled={!cancelReason.trim() || isSubmittingAction}
              isLoading={isSubmittingAction}
              onClick={() => void handleUpdateStatus('CANCELLED', cancelReason.trim())}
            >
              Confirm Cancellation
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm Received Modal */}
      <Modal
        isOpen={showConfirmReceivedModal}
        onClose={() => setShowConfirmReceivedModal(false)}
        title="Confirm Card Receipt"
      >
        <div className="space-y-4 text-sm text-gray-300">
          <p>
            Have you received and inspected the card(s) for order #{orderDisplayNumber.toUpperCase()}?
          </p>
          <p className="text-xs text-gray-400">
            Confirming receipt will finalize the order and permanently add the cards to your personal collection.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setShowConfirmReceivedModal(false)}
              disabled={isSubmittingAction}
            >
              Not Yet
            </Button>
            <Button
              variant="primary"
              disabled={isSubmittingAction}
              isLoading={isSubmittingAction}
              className="bg-status-success hover:bg-status-success/90"
              onClick={() => void handleUpdateStatus('FULFILLED')}
            >
              Yes, Mark Received
            </Button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
