import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import apiClient from '@/shared/api/client';

type Dashboard = { totalUsers: number; totalAdmins: number; regularBuyers?: number; pendingSellerApplications: number; approvedSellers: number; totalCards: number; totalOrders: number; totalOrderAmount: number };

const formatCurrency = (value: number) => `฿${value.toLocaleString()}`;

export function AdminDashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async () => { setRefreshing(true); try { setError(false); setData((await apiClient.get<Dashboard>('/admin/dashboard')).data); } catch { setError(true); } finally { setRefreshing(false); } }, []);
  useEffect(() => { void load(); }, [load]);

  const metrics = data ? [
    { label: 'Marketplace GMV', value: formatCurrency(data.totalOrderAmount), note: `${data.totalOrders} completed order${data.totalOrders === 1 ? '' : 's'}` },
    { label: 'Pending approvals', value: data.pendingSellerApplications.toString(), note: data.pendingSellerApplications === 0 ? 'Queue is clear' : 'Needs a decision' },
    { label: 'Approved sellers', value: data.approvedSellers.toString(), note: 'Seller workspace enabled' },
    { label: 'Catalog records', value: data.totalCards.toLocaleString(), note: `${data.totalUsers} total account${data.totalUsers === 1 ? '' : 's'}` },
  ] : [];

  return <main id="main-content" className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
    <header className="flex items-center justify-between border-b border-white/10 pb-6"><div><p className="text-sm font-medium text-slate-400">Administration</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">Overview</h1></div><button type="button" onClick={() => void load()} disabled={refreshing} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 px-3.5 text-sm font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/[0.04] focus:outline-none focus:ring-2 focus:ring-brand-blue disabled:opacity-60"><RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} aria-hidden="true" />Refresh</button></header>
    {error && <p role="alert" className="mt-5 rounded-lg border border-status-danger/30 bg-status-danger/10 px-4 py-3 text-sm text-red-100">Could not load dashboard data. Refresh to try again.</p>}
    {data ? <>
      <section className="mt-6 flex flex-col gap-4 rounded-xl border border-amber-300/20 bg-amber-300/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-white">Seller approval queue</p><p className="mt-1 text-sm text-slate-300">{data.pendingSellerApplications === 0 ? 'No seller applications are waiting for review.' : `${data.pendingSellerApplications} seller application${data.pendingSellerApplications === 1 ? '' : 's'} await review.`}</p></div><Link to="/admin/seller-applications" className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-amber-300 px-3.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-300">Review applications <ArrowRight size={16} aria-hidden="true" /></Link></section>
      <section aria-label="Platform metrics" className="mt-7 grid gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">{metrics.map((metric) => <article key={metric.label} className="bg-bg-base px-5 py-5"><p className="text-sm font-medium text-slate-400">{metric.label}</p><p className="mt-3 text-3xl font-semibold tracking-tight text-white tabular-nums">{metric.value}</p><p className="mt-2 text-sm text-slate-400">{metric.note}</p></article>)}</section>
      <section className="mt-10 max-w-2xl"><p className="text-sm font-medium text-slate-400">Quick access</p><div className="mt-3 divide-y divide-white/10 rounded-xl border border-white/10"><Link to="/admin/orders" className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-white/[0.04] focus:outline-none focus:ring-2 focus:ring-brand-blue"><span><strong className="block text-sm font-semibold text-white">Order monitoring</strong><span className="mt-1 block text-sm text-slate-400">Inspect platform order activity</span></span><ArrowRight size={16} className="shrink-0 text-slate-400" aria-hidden="true" /></Link><Link to="/admin/audit-logs" className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-white/[0.04] focus:outline-none focus:ring-2 focus:ring-brand-blue"><span><strong className="block text-sm font-semibold text-white">Audit trail</strong><span className="mt-1 block text-sm text-slate-400">Review sensitive administrator actions</span></span><ArrowRight size={16} className="shrink-0 text-slate-400" aria-hidden="true" /></Link><Link to="/admin/users" className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-white/[0.04] focus:outline-none focus:ring-2 focus:ring-brand-blue"><span><strong className="block text-sm font-semibold text-white">User management</strong><span className="mt-1 block text-sm text-slate-400">Search and manage platform accounts</span></span><ArrowRight size={16} className="shrink-0 text-slate-400" aria-hidden="true" /></Link></div></section>
    </> : <section aria-label="Loading dashboard" className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-36 animate-pulse rounded-xl border border-white/10 bg-bg-elevated" />)}</section>}
  </main>;
}
