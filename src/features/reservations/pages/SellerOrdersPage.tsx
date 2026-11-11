import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  DollarSign,
  Package,
  MessageSquare,
  Phone,
  RefreshCw,
  User as UserIcon,
  AlertCircle,
  BarChart3,
  Download,
} from 'lucide-react';

import {
  fetchSellerOrders,
  fetchProfitSummary,
  fetchMonthlyDashboard,
  updateSellerOrderStatus,
  type SellerOrder,
  type SellerMonthlyDashboard,
  type SellerProfitSummary,
} from '../api/sellerOrders';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { SearchField } from '@/shared/components/SearchField';
import { Modal } from '@/shared/components/Modal';
import { FeedbackPopup } from '@/shared/components/FeedbackPopup'; // CASE 10
import { ConditionLabel } from '@/shared/components/ConditionLabel';

const money = (amount: number) => `฿${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function emptyMonthlyDashboard(year: number, month: number): SellerMonthlyDashboard {
  const selectedMonth = { year, month, grossSales: 0, platformFee: 0, netRevenue: 0, totalCost: 0, netProfit: 0, orderCount: 0 };
  return { selectedMonth, lastTwelveMonths: [selectedMonth] };
}

export function SellerOrdersPage() {
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [summary, setSummary] = useState<SellerProfitSummary>({
    totalRevenue: 0,
    totalPlatformFee: 0,
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
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth() + 1);
  const [monthlyDashboard, setMonthlyDashboard] = useState<SellerMonthlyDashboard>(() => emptyMonthlyDashboard(new Date().getFullYear(), new Date().getMonth() + 1));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<SellerOrder | null>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | number | null>(null);
  const [showPaymentConfirmPopup, setShowPaymentConfirmPopup] = useState(false); // CASE 10a
  const [showMarkSentPopup, setShowMarkSentPopup] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrierNote, setCarrierNote] = useState('');
  const [showCancelPopup, setShowCancelPopup] = useState(false);
  const [cancelNote, setCancelNote] = useState('');
  const [noBuyerContact, setNoBuyerContact] = useState(false);
  const [pendingOrderAction, setPendingOrderAction] = useState<{ orderId: string | number; status: string } | null>(null);
  const pendingOrder = orders.find(order => order.id === pendingOrderAction?.orderId);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [orderRes, profitRes, monthlyRes] = await Promise.all([
        fetchSellerOrders(0, 50, statusFilter),
        fetchProfitSummary(),
        fetchMonthlyDashboard(selectedYear, selectedMonth),
      ]);
      setOrders(orderRes.orders);
      setSummary(profitRes);
      setMonthlyDashboard(monthlyRes);
    } catch (err) {
      console.error('Failed to load seller orders data:', err);
      setError(err instanceof Error ? err.message : 'Unable to load seller orders.');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, statusFilter]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const orderId = searchParams.get('orderId');
    if (!orderId) return;
    const order = orders.find(candidate => String(candidate.id) === orderId);
    if (order) {
      setSelectedOrder(order);
      setIsContactModalOpen(true);
    }
  }, [orders, searchParams]);

  const handleStatusUpdate = async (
    orderId: string | number,
    newStatus: string,
    note?: string,
    trackingNum?: string,
    cancelForNoContact?: boolean
  ) => {
    setActionLoadingId(orderId);
    try {
      await updateSellerOrderStatus(orderId, newStatus, note, trackingNum, cancelForNoContact);
      await loadData();
      return true;
    } catch (err) {
      console.error('Failed to update status:', err);
      setError(err instanceof Error ? err.message : 'Unable to update order status.');
      return false;
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

  const selectedPeriodLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' })
    .format(new Date(selectedYear, selectedMonth - 1, 1));
  const chartMaximum = Math.max(1, ...monthlyDashboard.lastTwelveMonths.map((point) => point.netRevenue));
  const availableYears = Array.from({ length: 5 }, (_, index) => new Date().getFullYear() - index);

  const exportMonthlyCsv = () => {
    const point = monthlyDashboard.selectedMonth;
    const rows = [
      ['Period', 'Gross sales', 'Platform fee', 'Seller net revenue', 'Inventory cost', 'Net profit', 'Orders'],
      [selectedPeriodLabel, point.grossSales, point.platformFee, point.netRevenue, point.totalCost, point.netProfit, point.orderCount],
    ];
    const csv = `\uFEFF${rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\r\n')}`;
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `seller-monthly-sales-${selectedYear}-${String(selectedMonth).padStart(2, '0')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING':
      case 'RESERVED':
        return (
          <Badge variant="warning" className="flex items-center gap-1">
            <Clock size={12} /> Pending
          </Badge>
        );
      case 'CONFIRMED':
        return (
          <Badge variant="warning" className="flex items-center gap-1">
            <Clock size={12} /> Confirmed
          </Badge>
        );
      case 'AWAITING_BUYER_CONTACT':
        return (
          <Badge variant="warning" className="flex items-center gap-1">
            <MessageSquare size={12} /> Awaiting buyer contact
          </Badge>
        );
      case 'PENDING_SELLER_ACTION':
        return (
          <Badge variant="warning" className="flex items-center gap-1">
            <Clock size={12} /> Ready to ship
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
    <div className="mythix-workspace-page w-full flex-1 space-y-6 text-white">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Package className="text-brand-blue" />
            Seller Order Management & Profit Dashboard
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Manage your card reservation orders, track fulfillment status, and monitor your net profit.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={loadData}
          isLoading={loading}
          size="sm"
          className="gap-2 shrink-0 h-fit"
        >
          <RefreshCw size={16} aria-hidden="true" />
          Refresh
        </Button>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-status-danger/30 bg-status-danger/10 p-4 text-sm text-red-200">
          Unable to load or update seller orders: {error}
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {/* Total Revenue */}
        <div className="bg-bg-card border border-white/10 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 text-sm">
            <span>Total Sales (Revenue)</span>
            <DollarSign className="text-brand-blue" size={18} />
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            ฿{summary.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-gray-400 mt-1">From all active sent & pending sales</p>
        </div>

        <div className="bg-bg-card border border-white/10 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 text-sm">
            <span>Platform Fee</span>
            <DollarSign className="text-brand-gold" size={18} />
          </div>
          <div className="text-2xl font-bold text-brand-gold mt-2">
            {money(summary.totalPlatformFee)}
          </div>
          <p className="text-xs text-gray-400 mt-1">Deducted from direct-sale settlement</p>
        </div>

        {/* Total Cost */}
        <div className="bg-bg-card border border-white/10 rounded-xl p-5 shadow-sm">
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
        <div className="bg-bg-card border border-white/10 rounded-xl p-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-gold/5 rounded-full -mr-8 -mt-8 pointer-events-none" />
          <div className="flex items-center justify-between text-gray-400 text-sm">
            <span className="text-brand-gold font-medium">Net Profit (กำไรสุทธิ)</span>
            <TrendingUp className="text-brand-gold" size={18} />
          </div>
          <div className="text-2xl font-bold text-brand-gold mt-2">
            ฿{summary.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-brand-gold/70 mt-1">After platform fee and inventory cost</p>
        </div>

        {/* Orders Breakdown */}
        <div className="bg-bg-card border border-white/10 rounded-xl p-5 shadow-sm">
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

      <section className="rounded-xl border border-white/10 bg-bg-card p-5 shadow-sm" aria-label="Monthly sales dashboard">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-lg font-bold text-white"><BarChart3 size={20} className="text-brand-blue" /> Monthly Sales Dashboard</div>
            <p className="mt-1 text-sm text-gray-400">Review your selected month and the latest 12 months of seller net revenue.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select aria-label="Select sales month" value={selectedMonth} onChange={(event) => setSelectedMonth(Number(event.target.value))} className="rounded-lg border border-white/10 bg-bg-elevated px-3 py-2 text-sm text-white">
              {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => <option key={month} value={month}>{new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(2026, month - 1, 1))}</option>)}
            </select>
            <select aria-label="Select sales year" value={selectedYear} onChange={(event) => setSelectedYear(Number(event.target.value))} className="rounded-lg border border-white/10 bg-bg-elevated px-3 py-2 text-sm text-white">
              {availableYears.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
            <Button size="sm" variant="secondary" className="gap-2" onClick={exportMonthlyCsv}><Download size={15} /> Export CSV</Button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-4">
          {[
            ['Gross sales', monthlyDashboard.selectedMonth.grossSales, 'text-white'],
            ['Platform fee', monthlyDashboard.selectedMonth.platformFee, 'text-brand-gold'],
            ['Seller net revenue', monthlyDashboard.selectedMonth.netRevenue, 'text-brand-blue'],
            ['Net profit', monthlyDashboard.selectedMonth.netProfit, 'text-status-success'],
          ].map(([label, value, colour]) => <div key={label as string} className="rounded-lg border border-white/10 bg-bg-elevated p-4"><p className="text-xs uppercase tracking-wide text-gray-400">{label}</p><p className={`mt-1 text-xl font-bold ${colour}`}>{money(value as number)}</p></div>)}
        </div>

        <div className="mt-5 rounded-lg border border-white/10 bg-bg-elevated p-4">
          <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold text-white">12-month seller net revenue</h2><span className="text-xs text-gray-400">Selected: {selectedPeriodLabel}</span></div>
          <div className="flex h-48 items-end gap-2" role="img" aria-label="12 month seller net revenue chart">
            {monthlyDashboard.lastTwelveMonths.map((point) => {
              const label = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(point.year, point.month - 1, 1));
              const height = Math.max(point.netRevenue > 0 ? 4 : 0, (point.netRevenue / chartMaximum) * 100);
              return <div key={`${point.year}-${point.month}`} className="flex h-full min-w-0 flex-1 flex-col justify-end text-center"><span className="mb-1 text-[10px] text-gray-400">{point.netRevenue > 0 ? `฿${Math.round(point.netRevenue).toLocaleString()}` : ''}</span><div title={`${label} ${point.year}: ${money(point.netRevenue)}`} className="rounded-t bg-brand-blue/80 transition-all" style={{ height: `${height}%` }} /><span className="mt-2 text-[10px] text-gray-400">{label}</span></div>;
            })}
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <div className="bg-bg-card border border-white/10 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          {['ALL', 'PENDING', 'AWAITING_BUYER_CONTACT', 'SENT', 'CANCELLED'].map((tab) => (
            <button
              key={tab}
              type="button"
              aria-pressed={statusFilter === tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                statusFilter === tab
                  ? 'bg-brand-blue text-bg-base shadow'
                  : 'border border-white/10 bg-bg-elevated text-gray-300 hover:bg-bg-surface'
              }`}
            >
              {tab === 'ALL'
                ? 'All Orders'
                : tab === 'PENDING'
                  ? 'Pending'
                  : tab === 'AWAITING_BUYER_CONTACT'
                    ? 'Awaiting Contact'
                  : tab === 'SENT'
                    ? 'Sent'
                    : 'Cancelled'}
            </button>
          ))}
        </div>

        {/* Search Box */}
        <div className="relative w-full md:w-80">
          <SearchField
            aria-label="Search orders"
            placeholder="Search order #, customer, card..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-bg-card border border-white/10 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="mythix-table w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-[#243350]/60 text-xs font-semibold text-gray-300 uppercase tracking-wider">
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
                          <CheckCircle2 size={12} /> Order Details
                        </button>
                      </td>

                      {/* Items */}
                      <td className="p-4 align-top">
                        <div className="space-y-1.5 max-w-sm">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="text-xs">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-medium text-white">{item.productName}</span>
                                {item.condition && (
                                  <ConditionLabel condition={item.condition} fallback="Not specified" size="xs" />
                                )}
                              </div>
                              <div className="text-gray-400">
                                {order.orderType === 'AUCTION' ? `${item.quantity} copies · whole lot ฿${item.itemTotal.toLocaleString()}` : `${item.quantity}x @ ฿${item.unitPrice.toLocaleString()} (Cost: ฿${item.unitCost.toLocaleString()})`}
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
                          {(order.status === 'PENDING' || order.status === 'CONFIRMED' || order.status === 'AWAITING_BUYER_CONTACT' || order.status === 'PENDING_SELLER_ACTION' || (order.status as string) === 'RESERVED' || (order.status as string) === 'PAID') && (
                            <>
                              {order.orderType === 'AUCTION' && order.status === 'AWAITING_BUYER_CONTACT' && (
                                <Button
                                  size="sm"
                                  variant="primary"
                                  disabled={isActionLoading}
                                  onClick={() => void handleStatusUpdate(order.id, 'PENDING_SELLER_ACTION', 'Buyer contact and payment arrangement confirmed')}
                                  className="w-32 text-xs bg-brand-blue hover:bg-brand-blue/90 mb-1"
                                >
                                  Contact arranged
                                </Button>
                              )}
                              {(order.status === 'PENDING' || (order.status as string) === 'RESERVED' || (order.status as string) === 'PAID') && (
                                <Button
                                  size="sm"
                                  variant="primary"
                                  disabled={isActionLoading}
                                  onClick={() => { setPendingOrderAction({ orderId: order.id, status: 'CONFIRMED' }); setShowPaymentConfirmPopup(true); }}
                                  className="w-28 text-xs bg-brand-blue hover:bg-brand-blue/90 mb-1"
                                >
                                  Confirm arrangement
                                </Button>
                              )}
                              {(order.status === 'CONFIRMED' || order.status === 'PENDING_SELLER_ACTION') && (
                                <Button
                                  size="sm"
                                  variant="primary"
                                  disabled={isActionLoading}
                                  onClick={() => {
                                    setPendingOrderAction({ orderId: order.id, status: 'SENT' });
                                    setTrackingNumber('');
                                    setCarrierNote('');
                                    setShowMarkSentPopup(true);
                                  }}
                                  className="w-28 text-xs bg-status-success hover:bg-status-success/90 mb-1"
                                >
                                  Mark as Sent
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="danger"
                                disabled={isActionLoading}
                                onClick={() => { setPendingOrderAction({ orderId: order.id, status: 'CANCELLED' }); setCancelNote(''); setNoBuyerContact(false); setShowCancelPopup(true); }}
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

      {/* Order Details & Contact Modal */}
      {selectedOrder && (
        <Modal
          isOpen={isContactModalOpen}
          onClose={() => setIsContactModalOpen(false)}
          title={`Order Details - ${selectedOrder.orderNumber}`}
        >
          <div className="space-y-4 text-sm text-gray-200">
            {/* Customer Info */}
            <div className="p-3 bg-[#243350] rounded-lg border border-white/10">
              <p className="text-xs font-semibold text-gray-400 uppercase">Customer Name</p>
              <p className="text-base font-bold text-white mt-1">{selectedOrder.buyerName || 'Not specified'}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-[#243350] rounded-lg border border-white/10">
                <p className="text-xs font-semibold text-gray-400 uppercase flex items-center gap-1">
                  <Phone size={12} /> Phone Number
                </p>
                <p className="font-semibold text-white mt-1">{selectedOrder.buyerPhone || 'N/A'}</p>
              </div>

              <div className="p-3 bg-[#243350] rounded-lg border border-white/10">
                <p className="text-xs font-semibold text-gray-400 uppercase flex items-center gap-1">
                  <MessageSquare size={12} /> Line ID
                </p>
                <p className="font-semibold text-white mt-1">{selectedOrder.buyerContactLine || 'N/A'}</p>
              </div>
            </div>

            {selectedOrder.buyerContactFacebook && (
              <div className="p-3 bg-[#243350] rounded-lg border border-white/10">
                <p className="text-xs font-semibold text-gray-400 uppercase">Facebook</p>
                <p className="font-semibold text-white mt-1">{selectedOrder.buyerContactFacebook}</p>
              </div>
            )}

            {/* Order Items Breakdown */}
            <div className="mt-4 border-t border-white/10 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white">
                  Reserved Items ({selectedOrder.items?.reduce((sum, item) => sum + item.quantity, 0) || 0})
                </h3>
                <span className="text-xs font-semibold text-brand-gold">
                  Revenue: ฿{selectedOrder.sellerRevenue.toLocaleString()}
                </span>
              </div>
              <div className="space-y-2.5">
                {selectedOrder.items?.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 p-3 bg-bg-card rounded-lg border border-white/10"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white">{item.productName}</span>
                        {item.condition && (
                          <ConditionLabel condition={item.condition} fallback="Not specified" size="xs" />
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {selectedOrder.orderType === 'AUCTION' ? `Qty: ${item.quantity} · Whole lot: ฿${item.itemTotal.toLocaleString()}` : `Qty: ${item.quantity} × ฿${item.unitPrice.toLocaleString()} · Subtotal: ฿${item.itemTotal.toLocaleString()}`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold text-brand-gold">+฿{item.itemProfit.toLocaleString()} profit</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div className="mt-4 border-t border-white/10 pt-4">
              <h3 className="text-sm font-bold text-white mb-3">Order Timeline</h3>
              {selectedOrder.logs && selectedOrder.logs.length > 0 ? (
                <div className="space-y-3">
                  {selectedOrder.logs.map((log, index) => (
                    <div key={index} className="flex gap-3 text-xs">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-brand-blue mt-1.5" />
                        {index !== selectedOrder.logs!.length - 1 && <div className="w-px h-full bg-[#31405A] my-1" />}
                      </div>
                      <div className="flex-1 pb-2">
                        <div className="flex justify-between items-start">
                          <p className="font-semibold text-white">
                            {log.toStatus} <span className="font-normal text-gray-400 text-[10px]">by {log.changedByRole}</span>
                          </p>
                          <p className="text-[10px] text-gray-400">{new Date(log.createdAt).toLocaleString()}</p>
                        </div>
                        {log.note && (
                          <div className="mt-1 p-2 bg-bg-card rounded text-gray-300 italic border border-white/10">
                            "{log.note}"
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic">No timeline logs available.</p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" size="sm" onClick={() => setIsContactModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
      <FeedbackPopup
        isOpen={showPaymentConfirmPopup}
        tone="confirm"
        title="Confirm payment arrangement?"
        message="Confirm only after you and the buyer have agreed on payment outside Mythix."
        meta={pendingOrderAction ? `Order ${String(pendingOrderAction.orderId)}` : undefined}
        primaryAction={{ label: "Confirm arrangement", onClick: async () => {
          if (pendingOrderAction) await handleStatusUpdate(pendingOrderAction.orderId, pendingOrderAction.status);
          setShowPaymentConfirmPopup(false);
          setPendingOrderAction(null);
        } }}
        secondaryAction={{ label: "Back", onClick: () => { setShowPaymentConfirmPopup(false); setPendingOrderAction(null); } }}
      />
      {/* CASE 10b: Mark sent & enter parcel tracking / TAX number modal */}
      <Modal
        isOpen={showMarkSentPopup}
        onClose={() => {
          setShowMarkSentPopup(false);
          setPendingOrderAction(null);
          setTrackingNumber('');
          setCarrierNote('');
        }}
        title="Mark this order as sent?"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-300">
            กรุณากรอกเลข TAX หรือเลขพัสดุ (Tax Invoice / Parcel Tracking No.) สำหรับการจัดส่งออเดอร์นี้ ผู้ซื้อยืนยันการรับการ์ดได้หลังอัปเดตสถานะเป็น Sent
          </p>

          <div>
            <label htmlFor="tracking-number-input" className="block text-xs font-semibold text-gray-300 uppercase mb-1">
              เลข TAX / เลขพัสดุ (Tax & Tracking No.) <span className="text-status-danger">*</span>
            </label>
            <input
              id="tracking-number-input"
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="เช่น TAX-994821, FLASH77261902, EMS-TH88291038"
              className="w-full p-2.5 rounded-lg border border-white/10 bg-bg-card text-white text-sm focus:outline-none focus:border-brand-blue"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="carrier-note-input" className="block text-xs font-semibold text-gray-300 uppercase mb-1">
              ผู้ให้บริการขนส่ง / หมายเหตุ (Carrier / Note) (Optional)
            </label>
            <input
              id="carrier-note-input"
              type="text"
              value={carrierNote}
              onChange={(e) => setCarrierNote(e.target.value)}
              placeholder="เช่น Flash Express, Kerry Express, ไปรษณีย์ไทย"
              className="w-full p-2.5 rounded-lg border border-white/10 bg-bg-card text-white text-sm focus:outline-none focus:border-brand-blue"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setShowMarkSentPopup(false);
                setPendingOrderAction(null);
                setTrackingNumber('');
                setCarrierNote('');
              }}
            >
              Back
            </Button>
            <Button
              variant="primary"
              disabled={!trackingNumber.trim() || actionLoadingId !== null}
              className="bg-status-success hover:bg-status-success/90"
              onClick={async () => {
                if (pendingOrderAction && trackingNumber.trim()) {
                  await handleStatusUpdate(
                    pendingOrderAction.orderId,
                    pendingOrderAction.status,
                    carrierNote.trim() || undefined,
                    trackingNumber.trim()
                  );
                }
                setShowMarkSentPopup(false);
                setPendingOrderAction(null);
                setTrackingNumber('');
                setCarrierNote('');
              }}
            >
              Mark as Sent
            </Button>
          </div>
        </div>
      </Modal>
      {/* Cancel Order Popup with Note */}
      <Modal
        isOpen={showCancelPopup}
        onClose={() => { setShowCancelPopup(false); setPendingOrderAction(null); }}
        title="Cancel Order"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-300">
            Please provide a reason for cancelling this order. This note will be recorded in the order timeline.
          </p>
          <textarea
            aria-label="Reason for cancellation"
            maxLength={2000}
            value={cancelNote}
            onChange={(e) => setCancelNote(e.target.value)}
            className="w-full h-24 p-3 rounded-lg border border-white/10 bg-bg-card text-white text-sm"
            placeholder="Reason for cancellation..."
          />
          {pendingOrder?.orderType === 'AUCTION' && pendingOrder.status === 'AWAITING_BUYER_CONTACT' && (
            <label className="flex items-start gap-2 text-sm text-gray-300">
              <input type="checkbox" checked={noBuyerContact} onChange={event => setNoBuyerContact(event.target.checked)} />
              The winner never contacted me and I received no payment. This creates a case for admin review and allows a second-chance offer. No penalty is applied until an admin approves the case.
            </label>
          )}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => { setShowCancelPopup(false); setPendingOrderAction(null); }}>
              Back
            </Button>
            <Button
              variant="danger"
              disabled={!cancelNote.trim() || actionLoadingId !== null}
              onClick={async () => {
                if (pendingOrderAction && await handleStatusUpdate(
                  pendingOrderAction.orderId, pendingOrderAction.status, cancelNote, undefined, noBuyerContact,
                )) {
                  setShowCancelPopup(false);
                  setPendingOrderAction(null);
                }
              }}
            >
              Cancel Order
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default SellerOrdersPage;
