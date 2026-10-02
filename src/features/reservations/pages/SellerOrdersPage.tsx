import { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  DollarSign,
  Package,
  Search,
  MessageSquare,
  Phone,
  User as UserIcon,
  AlertCircle,
} from 'lucide-react';

import {
  fetchSellerOrders,
  fetchProfitSummary,
  updateSellerOrderStatus,
  type SellerOrder,
  type SellerProfitSummary,
} from '../api/sellerOrders';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Modal } from '@/shared/components/Modal';
import { FeedbackPopup } from '@/shared/components/FeedbackPopup'; // CASE 10

export function SellerOrdersPage() {
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [summary, setSummary] = useState<SellerProfitSummary>({
    totalRevenue: 0,
    totalCost: 0,
    netProfit: 0,
    totalOrders: 0,
    pendingOrders: 0,
    fulfilledOrders: 0,
    cancelledOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<SellerOrder | null>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | number | null>(null);
  const [showPaymentConfirmPopup, setShowPaymentConfirmPopup] = useState(false); // CASE 10a
  const [showMarkSentPopup, setShowMarkSentPopup] = useState(false);             // CASE 10b
  const [pendingOrderAction, setPendingOrderAction] = useState<{ orderId: string | number; status: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [orderRes, profitRes] = await Promise.all([
        fetchSellerOrders(0, 50, statusFilter),
        fetchProfitSummary(),
      ]);
      setOrders(orderRes.orders);
      setSummary(profitRes);
    } catch (err) {
      console.error('Failed to load seller orders data:', err);
      setError(err instanceof Error ? err.message : 'Unable to load seller orders.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleStatusUpdate = async (orderId: string | number, newStatus: string) => {
    setActionLoadingId(orderId);
    try {
      await updateSellerOrderStatus(orderId, newStatus);
      await loadData();
    } catch (err) {
      console.error('Failed to update status:', err);
      setError(err instanceof Error ? err.message : 'Unable to update order status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const orderNum = order.orderNumber.toLowerCase();
    const buyerName = (order.buyerName ?? '').toLowerCase();
    const itemNames = order.items.map((i) => i.productName.toLowerCase()).join(' ');
    return orderNum.includes(query) || buyerName.includes(query) || itemNames.includes(query);
  });

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING':
      case 'RESERVED':
        return (
          <Badge variant="warning" className="flex items-center gap-1">
            <Clock size={12} /> Pending
          </Badge>
        );
      case 'SENT':
      case 'FULFILLED':
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle2 size={12} /> Sent
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge variant="danger" className="flex items-center gap-1">
            <XCircle size={12} /> Cancelled
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 max-w-7xl mx-auto text-white">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Package className="text-brand-blue" />
            Seller Order Management & Profit Dashboard
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Manage your card reservation orders, track fulfillment status, and monitor your net profit.
          </p>
        </div>
        <Button variant="secondary" onClick={loadData} disabled={loading} size="sm">
          Refresh Data
        </Button>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-status-danger/30 bg-status-danger/10 p-4 text-sm text-red-200">
          Unable to load or update seller orders: {error}
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-[#192338] border border-[#31405A] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 text-sm">
            <span>Total Sales (Revenue)</span>
            <DollarSign className="text-brand-blue" size={18} />
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            ฿{summary.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-gray-400 mt-1">From all active sent & pending sales</p>
        </div>

        {/* Total Cost */}
        <div className="bg-[#192338] border border-[#31405A] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 text-sm">
            <span>Total Cost</span>
            <DollarSign className="text-gray-400" size={18} />
          </div>
          <div className="text-2xl font-bold text-gray-300 mt-2">
            ฿{summary.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-gray-400 mt-1">Original acquisition cost of inventory</p>
        </div>

        {/* Net Profit */}
        <div className="bg-[#192338] border border-[#31405A] rounded-xl p-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-gold/5 rounded-full -mr-8 -mt-8 pointer-events-none" />
          <div className="flex items-center justify-between text-gray-400 text-sm">
            <span className="text-brand-gold font-medium">Net Profit (กำไรสุทธิ)</span>
            <TrendingUp className="text-brand-gold" size={18} />
          </div>
          <div className="text-2xl font-bold text-brand-gold mt-2">
            ฿{summary.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-brand-gold/70 mt-1">Revenue minus inventory cost</p>
        </div>

        {/* Orders Breakdown */}
        <div className="bg-[#192338] border border-[#31405A] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 text-sm">
            <span>Orders Overview</span>
            <Package className="text-gray-400" size={18} />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-white">{summary.totalOrders}</span>
            <span className="text-xs text-gray-400">Total</span>
          </div>
          <div className="flex items-center gap-3 text-xs mt-2">
            <span className="text-status-warning font-medium">{summary.pendingOrders} Pending</span>
            <span className="text-gray-600">|</span>
            <span className="text-status-success font-medium">{summary.fulfilledOrders} Sent</span>
            <span className="text-gray-600">|</span>
            <span className="text-gray-400 font-medium">{summary.cancelledOrders} Cancelled</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#192338] border border-[#31405A] rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          {['ALL', 'PENDING', 'SENT', 'CANCELLED'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                statusFilter === tab
                  ? 'bg-brand-blue text-white shadow'
                  : 'bg-[#243350] text-gray-300 hover:bg-[#2e4063]'
              }`}
            >
              {tab === 'ALL'
                ? 'All Orders'
                : tab === 'PENDING'
                  ? 'Pending'
                  : tab === 'SENT'
                    ? 'Sent'
                    : 'Cancelled'}
            </button>
          ))}
        </div>

        {/* Search Box */}
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search order #, customer, card..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-[#243350] border-[#31405A] text-sm text-white placeholder-gray-400"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-[#192338] border border-[#31405A] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#31405A] bg-[#243350]/60 text-xs font-semibold text-gray-300 uppercase tracking-wider">
                <th className="p-4">Order Details</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Items Reserved</th>
                <th className="p-4 text-right">Financials (Rev / Cost / Profit)</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#31405A]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    Loading seller orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle size={28} className="text-gray-500" />
                      <p className="font-medium">No orders found matching criteria</p>
                      <p className="text-xs text-gray-500">Check back later or try adjusting filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isActionLoading = actionLoadingId === order.id;

                  return (
                    <tr key={order.id} className="hover:bg-[#243350]/40 transition-colors">
                      {/* Order info */}
                      <td className="p-4 align-top">
                        <div className="font-semibold text-white">{order.orderNumber}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(order.createdAt).toLocaleString()}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="p-4 align-top">
                        <div className="font-medium text-white flex items-center gap-1.5">
                          <UserIcon size={14} className="text-gray-400" />
                          {order.buyerName || 'Buyer'}
                        </div>
                        {order.buyerEmail && (
                          <div className="text-xs text-gray-400 mt-0.5">{order.buyerEmail}</div>
                        )}
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsContactModalOpen(true);
                          }}
                          className="text-xs text-brand-blue hover:underline mt-1.5 flex items-center gap-1"
                        >
                          <Phone size={12} /> Contact Info
                        </button>
                      </td>

                      {/* Items */}
                      <td className="p-4 align-top">
                        <div className="space-y-1.5 max-w-sm">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="text-xs">
                              <span className="font-medium text-white">{item.productName}</span>
                              <div className="text-gray-400">
                                {item.quantity}x @ ฿{item.unitPrice.toLocaleString()} (Cost: ฿{item.unitCost.toLocaleString()})
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Financials */}
                      <td className="p-4 align-top text-right whitespace-nowrap">
                        <div className="text-sm font-bold text-white">
                          ฿{order.sellerRevenue.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          Cost: ฿{order.sellerCost.toLocaleString()}
                        </div>
                        <div className="text-xs font-semibold text-brand-gold mt-0.5">
                          Profit: +฿{order.sellerProfit.toLocaleString()}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-4 align-top text-center whitespace-nowrap">
                        {getStatusBadge(order.status)}
                      </td>

                      {/* Actions */}
                      <td className="p-4 align-top text-right whitespace-nowrap">
                        <div className="flex flex-col gap-1.5 items-end">
                          {(order.status === 'PENDING' || (order.status as string) === 'RESERVED') && (
                            <>
                              <Button
                                size="sm"
                                variant="primary"
                                disabled={isActionLoading}
                                onClick={() => { setPendingOrderAction({ orderId: order.id, status: 'PAID' }); setShowPaymentConfirmPopup(true); }}
                                className="w-28 text-xs bg-brand-blue hover:bg-brand-blue/90 mb-1"
                              >
                                Confirm Payment
                              </Button>
                              <Button
                                size="sm"
                                variant="primary"
                                disabled={isActionLoading}
                                onClick={() => { setPendingOrderAction({ orderId: order.id, status: 'SENT' }); setShowMarkSentPopup(true); }}
                                className="w-28 text-xs bg-status-success hover:bg-status-success/90"
                              >
                                Mark as Sent
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                disabled={isActionLoading}
                                onClick={() => handleStatusUpdate(order.id, 'CANCELLED')}
                                className="w-28 text-xs"
                              >
                                Cancel Order
                              </Button>
                            </>
                          )}
                          {(order.status === 'SENT' || (order.status as string) === 'FULFILLED') && (
                            <span className="text-xs text-status-success flex items-center gap-1">
                              <CheckCircle2 size={13} /> Sent
                            </span>
                          )}
                          {order.status === 'CANCELLED' && (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <XCircle size={13} /> Cancelled
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Contact Details Modal */}
      {selectedOrder && (
        <Modal
          isOpen={isContactModalOpen}
          onClose={() => setIsContactModalOpen(false)}
          title={`Buyer Contact Info - ${selectedOrder.orderNumber}`}
        >
          <div className="space-y-4 text-sm text-gray-200">
            <div className="p-3 bg-[#243350] rounded-lg border border-[#31405A]">
              <p className="text-xs font-semibold text-gray-400 uppercase">Customer Name</p>
              <p className="text-base font-bold text-white mt-1">{selectedOrder.buyerName || 'Not specified'}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-[#243350] rounded-lg border border-[#31405A]">
                <p className="text-xs font-semibold text-gray-400 uppercase flex items-center gap-1">
                  <Phone size={12} /> Phone Number
                </p>
                <p className="font-semibold text-white mt-1">{selectedOrder.buyerPhone || 'N/A'}</p>
              </div>

              <div className="p-3 bg-[#243350] rounded-lg border border-[#31405A]">
                <p className="text-xs font-semibold text-gray-400 uppercase flex items-center gap-1">
                  <MessageSquare size={12} /> Line ID
                </p>
                <p className="font-semibold text-white mt-1">{selectedOrder.buyerContactLine || 'N/A'}</p>
              </div>
            </div>

            {selectedOrder.buyerContactFacebook && (
              <div className="p-3 bg-[#243350] rounded-lg border border-[#31405A]">
                <p className="text-xs font-semibold text-gray-400 uppercase">Facebook</p>
                <p className="font-semibold text-white mt-1">{selectedOrder.buyerContactFacebook}</p>
              </div>
            )}

            <div className="p-3 bg-[#243350]/60 rounded-lg border border-[#31405A] text-xs text-gray-400">
              💡 <strong>P2P Direct Handover Note:</strong> Reach out to the buyer directly using Line or Phone to coordinate card delivery or physical meetup. Once the buyer confirms receipt, mark the order as <strong>Sent</strong>.
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" size="sm" onClick={() => setIsContactModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
      {/* CASE 10a: Confirm payment popup — Figma: Seller Orders → Payment */}
      <FeedbackPopup
        isOpen={showPaymentConfirmPopup}
        tone="confirm"
        title="Confirm payment received?"
        message="Only confirm after the buyer has paid you outside Mythix."
        meta={pendingOrderAction ? `Order ${String(pendingOrderAction.orderId)}` : undefined}
        primaryAction={{ label: "Confirm payment", onClick: async () => {
          if (pendingOrderAction) await handleStatusUpdate(pendingOrderAction.orderId, pendingOrderAction.status);
          setShowPaymentConfirmPopup(false);
          setPendingOrderAction(null);
        } }}
        secondaryAction={{ label: "Back", onClick: () => { setShowPaymentConfirmPopup(false); setPendingOrderAction(null); } }}
      />
      {/* CASE 10b: Mark sent popup — Figma: Seller Orders → Mark sent */}
      <FeedbackPopup
        isOpen={showMarkSentPopup}
        tone="confirm"
        title="Mark this order as sent?"
        message="This transfers card ownership to the buyer's collection."
        meta={pendingOrderAction ? `Order ${String(pendingOrderAction.orderId)} · This cannot be reversed here.` : undefined}
        primaryAction={{ label: "Mark as sent", onClick: async () => {
          if (pendingOrderAction) await handleStatusUpdate(pendingOrderAction.orderId, pendingOrderAction.status);
          setShowMarkSentPopup(false);
          setPendingOrderAction(null);
        } }}
        secondaryAction={{ label: "Back", onClick: () => { setShowMarkSentPopup(false); setPendingOrderAction(null); } }}
      />
    </div>
  );
}

export default SellerOrdersPage;
