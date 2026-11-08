import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, RefreshCw, X } from 'lucide-react';
import apiClient from '@/shared/api/client';
import { Button } from '@/shared/components/Button';
import { Modal } from '@/shared/components/Modal';
import { SearchField } from '@/shared/components/SearchField';
import { cn } from '@/shared/lib';

const STATUSES = ['PENDING', 'PAID', 'FULFILLED', 'CANCELLED'] as const;
type Status = typeof STATUSES[number]; type SearchBy = 'ORDER_NUMBER' | 'BUYER' | 'SELLER';
type Item = { id: string; productName: string; cardId: string; sellerName: string; sellerEmail: string; shopName: string; price: number; quantity: number };
type Order = { id: string; orderNumber: string; buyerName: string; buyerEmail: string; status: Status; totalAmount: number; createdAt: string; platformFee: number; sellerNetAmount: number; items?: Item[] };
type Page = { content: Order[]; number: number; totalPages: number; totalElements: number };
const tone: Record<Status, string> = { PENDING: 'border-status-warning/30 bg-status-warning/10 text-status-warning', PAID: 'border-brand-blue/30 bg-brand-blue/10 text-brand-blue', FULFILLED: 'border-status-success/30 bg-status-success/10 text-status-success', CANCELLED: 'border-status-danger/30 bg-status-danger/10 text-status-danger' };
const money = (n: number) => `฿${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
const toIso = (d: Date) => d.toISOString().slice(0, 10);
const fmt = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
const sellers = (order: Order) => [...new Map((order.items ?? []).map((item) => [item.sellerEmail, item])).values()];
const fmtDate = (iso: string) => { try { return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return '—'; } };
const fmtDateTime = (iso: string) => { try { return new Date(iso).toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return '—'; } };
function Badge({ status }: { status: Status }) { return <span className={cn('rounded-full border px-2.5 py-1 text-xs font-semibold', tone[status])}>{status}</span>; }
function DetailRow({ label, children }: { label: string; children: React.ReactNode }) { return <div className="flex justify-between py-1.5"><span className="text-gray-400">{label}</span><span className="text-right text-white">{children}</span></div>; }

function DateRangePicker({ from, to, onChange }: { from: string; to: string; onChange: (from: string, to: string) => void }) {
 const [open, setOpen] = useState(false); const [cursor, setCursor] = useState(() => new Date()); const [draftFrom, setDraftFrom] = useState(from); const [draftTo, setDraftTo] = useState(to);
 const containerRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
  if (!open) return;
  function handleClickOutside(event: MouseEvent) {
   if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
    setOpen(false);
   }
  }
  document.addEventListener('mousedown', handleClickOutside);
  return () => {
   document.removeEventListener('mousedown', handleClickOutside);
  };
 }, [open]);

 const days = useMemo(() => { const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1); const offset = first.getDay(); const start = new Date(first); start.setDate(1 - offset); return Array.from({ length: 42 }, (_, i) => { const day = new Date(start); day.setDate(start.getDate() + i); return day; }); }, [cursor]);
 const label = from ? `${fmt(from)}${to ? ` – ${fmt(to)}` : ' – Select end date'}` : 'Order date range';
 function choose(day: Date) { const value = toIso(day); if (!draftFrom || draftTo || value < draftFrom) { setDraftFrom(value); setDraftTo(''); } else setDraftTo(value); }
 return <div ref={containerRef} className="relative"><button type="button" aria-expanded={open} aria-label="Select order date range" onClick={() => { setDraftFrom(from); setDraftTo(to); setOpen(!open); }} className="flex h-10 min-w-56 items-center gap-2 rounded-lg border border-white/10 bg-bg-input px-3 text-left text-sm text-white hover:bg-white/[.04] focus:outline-none focus:ring-2 focus:ring-brand-blue"><CalendarDays size={16} className="text-gray-400" /><span className={from ? '' : 'text-gray-400'}>{label}</span></button>{open && <div className="absolute right-0 z-30 mt-2 w-[20rem] rounded-xl border border-white/10 bg-bg-elevated p-3 shadow-2xl"><div className="mb-3 flex items-center justify-between"><button type="button" aria-label="Previous month" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="flex size-9 items-center justify-center rounded-lg hover:bg-white/10"><ChevronLeft size={16} /></button><strong className="text-sm text-white">{cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</strong><button type="button" aria-label="Next month" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="flex size-9 items-center justify-center rounded-lg hover:bg-white/10"><ChevronRight size={16} /></button></div><div className="grid text-center text-[11px] text-gray-400" style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>{['S','M','T','W','T','F','S'].map((d, i) => <span key={`${d}${i}`} className="py-1">{d}</span>)}</div><div className="grid gap-0.5" style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>{days.map((day) => { const value = toIso(day); const selected = value === draftFrom || value === draftTo; const between = draftFrom && draftTo && value > draftFrom && value < draftTo; return <button key={value} type="button" onClick={() => choose(day)} className={cn('flex h-9 items-center justify-center rounded-lg text-sm transition', day.getMonth() !== cursor.getMonth() && 'text-gray-600', selected && 'bg-brand-blue text-bg-base font-bold', between && 'bg-brand-blue/20 text-white', !selected && !between && 'hover:bg-white/10')}>{day.getDate()}</button>; })}</div><div className="mt-3 flex justify-between border-t border-white/10 pt-3"><button type="button" onClick={() => { setDraftFrom(''); setDraftTo(''); onChange('', ''); setOpen(false); }} className="min-h-10 px-2 text-sm text-gray-300 hover:text-white">Clear</button><button type="button" disabled={!draftFrom || !draftTo} onClick={() => { onChange(draftFrom, draftTo); setOpen(false); }} className="min-h-10 rounded-xl bg-brand-blue px-3 text-sm font-semibold text-bg-base disabled:opacity-40">Apply</button></div></div>}</div>;
}

/* ── Mobile card for a single order row ── */
function OrderCard({ order, onClick }: { order: Order; onClick: () => void }) {
 return (
  <button type="button" onClick={onClick} className="w-full rounded-xl border border-white/10 bg-bg-elevated p-4 text-left transition hover:bg-white/[.03]">
   <div className="flex items-center justify-between gap-2">
    <span className="font-medium text-white">{order.orderNumber}</span>
    <Badge status={order.status} />
   </div>
   <div className="mt-2 flex items-center justify-between text-sm">
    <span className="text-gray-300">{order.buyerName}</span>
    <span className="font-medium text-white">{money(order.totalAmount)}</span>
   </div>
   <div className="mt-1.5 flex items-center justify-between text-xs text-gray-400">
    <span>{sellers(order).map((s) => s.shopName || s.sellerName).join(', ') || '—'}</span>
    <span>{order.createdAt ? fmtDate(order.createdAt) : '—'}</span>
   </div>
  </button>
 );
}

export function AdminOrderLogsPage() {
 const [orders, setOrders] = useState<Order[]>([]); const [query, setQuery] = useState(''); const [searchBy, setSearchBy] = useState<SearchBy>('ORDER_NUMBER'); const [statuses, setStatuses] = useState<Status[]>([]); const [from, setFrom] = useState(''); const [to, setTo] = useState(''); const [page, setPage] = useState(0); const [info, setInfo] = useState<Page>({ content: [], number: 0, totalPages: 0, totalElements: 0 }); const [loading, setLoading] = useState(true); const [viewing, setViewing] = useState<Order | null>(null);
 useEffect(() => setPage(0), [query, searchBy, statuses, from, to]);

 const fetchOrders = useCallback(async () => {
  setLoading(true);
  try {
   const { data } = await apiClient.get<Page>('/admin/orders', {
    params: {
     query: query || undefined,
     searchBy,
     statuses: statuses.length ? statuses : undefined,
     fromDate: from || undefined,
     toDate: to || undefined,
     page,
     size: 20,
    },
    paramsSerializer: { indexes: null },
   });
   setOrders(data.content || []);
   setInfo(data);
  } catch {
   setOrders([]);
  } finally {
   setLoading(false);
  }
 }, [from, page, query, searchBy, statuses, to]);

 useEffect(() => {
  void fetchOrders();
 }, [fetchOrders]);

 const toggle = (status: Status) => setStatuses((all) => all.includes(status) ? all.filter((x) => x !== status) : [...all, status]); const placeholder = searchBy === 'SELLER' ? 'Search seller or store' : searchBy === 'BUYER' ? 'Search buyer name or email' : 'Search order number';

 return (
  <main id="main-content" className="mythix-page">
   <header className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
    <div>
     <p className="text-xs font-semibold uppercase tracking-[.16em] text-brand-gold">Platform administration</p>
     <h1 className="mt-1 text-3xl font-bold text-white">Order logs</h1>
    </div>
    <Button
     variant="secondary"
     onClick={() => void fetchOrders()}
     isLoading={loading}
     className="gap-2 shrink-0 h-fit"
    >
     <RefreshCw size={16} aria-hidden="true" />
     Refresh
    </Button>
   </header>

   {/* Filters */}
   <section className="mt-4 rounded-xl border border-white/10 bg-bg-elevated p-3.5">
    <div className="flex flex-col gap-3 xl:flex-row">
     <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row">
      <select aria-label="Search by" value={searchBy} onChange={(e) => setSearchBy(e.target.value as SearchBy)} className="h-11 rounded-xl border border-white/15 bg-bg-input px-3 text-sm text-gray-100 focus-visible:ring-2 focus-visible:ring-brand-blue">
       <option value="ORDER_NUMBER">Order number</option><option value="BUYER">Buyer</option><option value="SELLER">Seller</option>
      </select>
      <div className="relative min-w-0 flex-1">
       <SearchField aria-label="Search logs" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={placeholder} className="pr-9" />
       {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-gray-400"><X size={16} /></button>}
      </div>
      <DateRangePicker from={from} to={to} onChange={(start, end) => { setFrom(start); setTo(end); }} />
     </div>
     <div className="flex flex-wrap gap-2">{STATUSES.map((status) => <button key={status} type="button" aria-pressed={statuses.includes(status)} onClick={() => toggle(status)} className={cn('min-h-8 rounded-full border px-3 text-xs font-semibold', statuses.includes(status) ? tone[status] : 'border-white/10 text-gray-400')}>{status}</button>)}</div>
    </div>
   </section>

   {/* Orders list */}
   <section className="mt-4">
    <p className="mb-3 text-sm text-gray-400">{loading ? 'Loading orders…' : `${info.totalElements} orders found`}</p>

    {loading ? <div role="status" className="h-28 animate-pulse rounded-xl bg-bg-elevated" /> : (
     <>
      {/* Desktop table – hidden on mobile */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-white/10 bg-bg-elevated">
       <table className="mythix-table w-full text-left text-sm">
        <thead className="border-b border-white/10 text-xs uppercase text-gray-400">
         <tr><th className="p-3">Order</th><th className="p-3">Buyer</th><th className="p-3">Seller</th><th className="p-3">Status</th><th className="p-3">Date</th><th className="p-3 text-right">Amount</th></tr>
        </thead>
        <tbody>
         {orders.map((order) => (
          <tr key={order.id} onClick={() => setViewing(order)} className="cursor-pointer border-b border-white/10 last:border-0 hover:bg-white/[.03]">
           <td className="p-3 font-medium text-white">{order.orderNumber}</td>
           <td className="p-3 text-white">{order.buyerName}</td>
           <td className="p-3 text-gray-300">{sellers(order).map((s) => s.shopName || s.sellerName).join(', ') || '—'}</td>
           <td className="p-3"><Badge status={order.status} /></td>
           <td className="p-3 text-gray-300">{order.createdAt ? fmtDate(order.createdAt) : '—'}</td>
           <td className="p-3 text-right font-medium text-white">{money(order.totalAmount)}</td>
          </tr>
         ))}
        </tbody>
       </table>
      </div>

      {/* Mobile card list – hidden on desktop */}
      <div className="flex flex-col gap-3 md:hidden">
       {orders.map((order) => <OrderCard key={order.id} order={order} onClick={() => setViewing(order)} />)}
      </div>

      {/* Pagination */}
      {info.totalPages > 1 && (
       <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-bg-elevated px-4 py-3 text-sm">
        <span className="text-gray-400">
         Page <strong className="text-white">{info.number + 1}</strong> of <strong className="text-white">{info.totalPages}</strong>
        </span>
        <div className="flex gap-2">
         <button
          type="button"
          disabled={page === 0}
          onClick={() => setPage((p) => Math.max(p - 1, 0))}
          className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-white/10 px-3 text-xs font-semibold text-gray-300 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-transparent"
         >
          <ChevronLeft size={14} /> Previous
         </button>
         <button
          type="button"
          disabled={page + 1 >= info.totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-white/10 px-3 text-xs font-semibold text-gray-300 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-transparent"
         >
          Next <ChevronRight size={14} />
         </button>
        </div>
       </div>
      )}
     </>
    )}
   </section>

   {/* Order detail modal – wider on desktop via className override */}
   <Modal isOpen={Boolean(viewing)} onClose={() => setViewing(null)} title="Order details" mobileSheet className="md:max-w-3xl">
    {viewing && (
     <div className="space-y-5 md:space-y-0 md:grid md:grid-cols-2 md:gap-5">

      {/* Left column */}
      <div className="space-y-4">
       {/* Header */}
       <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">{viewing.orderNumber}</h2>
        <Badge status={viewing.status} />
       </div>

       {/* Order Info */}
       <div className="rounded-lg border border-white/10 bg-white/[.02] p-4 text-sm">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Order information</h3>
        <DetailRow label="Order ID">{viewing.id}</DetailRow>
        <DetailRow label="Date">{viewing.createdAt ? fmtDateTime(viewing.createdAt) : '—'}</DetailRow>
       </div>

       {/* Buyer Info */}
       <div className="rounded-lg border border-white/10 bg-white/[.02] p-4 text-sm">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Buyer</h3>
        <DetailRow label="Name">{viewing.buyerName}</DetailRow>
        <DetailRow label="Email">{viewing.buyerEmail}</DetailRow>
       </div>

       {/* Financial Summary */}
       <div className="rounded-lg border border-white/10 bg-white/[.02] p-4 text-sm">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Financial summary</h3>
        <DetailRow label="Total amount"><span className="font-semibold">{money(viewing.totalAmount)}</span></DetailRow>
        <DetailRow label="Platform fee">{money(viewing.platformFee)}</DetailRow>
        <DetailRow label="Seller net amount">{money(viewing.sellerNetAmount)}</DetailRow>
       </div>
      </div>

      {/* Right column – Items */}
      <div className="space-y-4">
       <div className="rounded-lg border border-white/10 bg-white/[.02] p-4 text-sm">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Items ({(viewing.items ?? []).length})</h3>
        {!viewing.items || viewing.items.length === 0 ? (
          <p className="text-sm text-gray-400">Item details will appear after the order-log API is updated.</p>
        ) : (
          <div className="space-y-3">
           {viewing.items.map((item) => (
            <div key={item.id} className="rounded-lg border border-white/10 bg-white/[.03] p-3">
             <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
               <p className="font-medium text-white">{item.productName}</p>
               {item.cardId && <p className="mt-0.5 text-xs text-gray-400">Card ID: {item.cardId}</p>}
              </div>
              <span className="shrink-0 font-medium text-white">{money(item.price)}</span>
             </div>
             <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
              <span>Seller: <span className="text-gray-300">{item.sellerName}</span></span>
              <span>Email: <span className="text-gray-300">{item.sellerEmail}</span></span>
              {item.shopName && <span>Shop: <span className="text-gray-300">{item.shopName}</span></span>}
              <span>Qty: <span className="text-gray-300">{item.quantity}</span></span>
              <span>Subtotal: <span className="text-white font-medium">{money(item.price * item.quantity)}</span></span>
             </div>
            </div>
           ))}
          </div>
        )}
       </div>
      </div>

     </div>
    )}
   </Modal>
  </main>
 );
}
