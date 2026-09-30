import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, Bell, Boxes, CalendarDays, CheckCircle2, ClipboardCheck, Info, RefreshCw, ShoppingBag, Store } from 'lucide-react';
import { Link } from 'react-router-dom';
import apiClient from '@/shared/api/client';

type DailyTrend = {
  date: string;
  gmv: number;
  orders: number;
};

type Dashboard = {
  totalUsers: number;
  totalAdmins: number;
  regularBuyers?: number;
  pendingSellerApplications: number;
  approvedSellers: number;
  totalCards: number;
  listedCards: number;
  totalOrders: number;
  totalOrderAmount: number;
  trends?: DailyTrend[];
};

type AdminUser = { id: string; name: string; email: string; role: string; sellerStatus: string };
type AuditLog = { id: string; action: string; actorName: string; details: string; createdAt: string };
type AuditLogPage = { content: AuditLog[] };

const money = (v: number) => `฿${Number(v || 0).toLocaleString()}`;
const card = 'rounded-2xl border border-white/10 bg-bg-surface';

function formatShortDate(dateStr: string) {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    }
    return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  } catch {
    return dateStr;
  }
}

function GmvOrdersChart({ trends }: { trends?: DailyTrend[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const items: DailyTrend[] = useMemo(() => {
    if (trends && trends.length > 0) return trends;
    const now = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      return { date: d.toISOString().slice(0, 10), gmv: 0, orders: 0 };
    });
  }, [trends]);

  const maxGmv = useMemo(() => Math.max(...items.map((t) => Number(t.gmv || 0)), 100), [items]);
  const maxOrders = useMemo(() => Math.max(...items.map((t) => Number(t.orders || 0)), 1), [items]);

  const width = 560;
  const height = 170;
  const padTop = 15;
  const padBottom = 26;
  const padLeft = 8;
  const padRight = 8;
  const chartHeight = height - padTop - padBottom;
  const chartWidth = width - padLeft - padRight;
  const step = chartWidth / items.length;

  const points = items.map((item, idx) => {
    const x = padLeft + idx * step + step / 2;
    const gmvVal = Number(item.gmv || 0);
    const orderVal = Number(item.orders || 0);

    const gmvRatio = maxGmv > 0 ? gmvVal / maxGmv : 0;
    const barHeight = Math.max(gmvRatio * chartHeight, gmvVal > 0 ? 6 : 2);
    const yBar = padTop + chartHeight - barHeight;

    const orderRatio = maxOrders > 0 ? orderVal / maxOrders : 0;
    const yOrder = padTop + chartHeight - orderRatio * (chartHeight - 12);

    return { ...item, gmv: gmvVal, orders: orderVal, x, barHeight, yBar, yOrder };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yOrder}`)
    .join(' ');

  return (
    <div className="relative mt-3 w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-44 select-none"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="gmvBarGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d4af37" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#d4af37" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="gmvBarGradHover" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="1" />
            <stop offset="100%" stopColor="#d4af37" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Grid horizontal lines */}
        {[0, 0.5, 1].map((ratio) => {
          const y = padTop + chartHeight * (1 - ratio);
          return (
            <line
              key={ratio}
              x1={padLeft}
              y1={y}
              x2={width - padRight}
              y2={y}
              stroke="rgba(255,255,255,0.08)"
              strokeDasharray="3 3"
            />
          );
        })}

        {/* GMV Bars */}
        {points.map((p, i) => {
          const isHovered = hoveredIdx === i;
          const barW = Math.min(step * 0.42, 28);
          return (
            <g
              key={p.date}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <rect
                x={p.x - step / 2}
                y={padTop}
                width={step}
                height={chartHeight + padBottom}
                fill="transparent"
              />
              <rect
                x={p.x - barW / 2}
                y={p.yBar}
                width={barW}
                height={p.barHeight}
                rx={3}
                fill={isHovered ? 'url(#gmvBarGradHover)' : 'url(#gmvBarGrad)'}
                className="transition-all duration-150"
              />
            </g>
          );
        })}

        {/* Orders Line */}
        <path
          d={linePath}
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pointer-events-none"
        />

        {/* Orders Dots */}
        {points.map((p, i) => {
          const isHovered = hoveredIdx === i;
          return (
            <circle
              key={`dot-${p.date}`}
              cx={p.x}
              cy={p.yOrder}
              r={isHovered ? 5 : 3.5}
              fill="#0f172a"
              stroke="#38bdf8"
              strokeWidth={isHovered ? 2.5 : 2}
              className="pointer-events-none transition-all duration-150"
            />
          );
        })}

        {/* X-axis Day Labels */}
        {points.map((p) => (
          <text
            key={`lbl-${p.date}`}
            x={p.x}
            y={height - 6}
            textAnchor="middle"
            fill="rgba(148, 163, 184, 0.85)"
            fontSize="10"
            className="pointer-events-none font-medium"
          >
            {formatShortDate(p.date)}
          </text>
        ))}
      </svg>

      {/* Floating Tooltip */}
      {hoveredIdx !== null && points[hoveredIdx] && (
        <div
          className="pointer-events-none absolute top-2 z-20 -translate-x-1/2 rounded-lg border border-white/20 bg-bg-elevated/95 px-3 py-1.5 shadow-2xl text-xs backdrop-blur"
          style={{
            left: `${(points[hoveredIdx].x / width) * 100}%`,
          }}
        >
          <div className="font-semibold text-white">{formatShortDate(points[hoveredIdx].date)}</div>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="text-brand-gold font-medium">GMV: ฿{Number(points[hoveredIdx].gmv).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            <span className="text-gray-500">|</span>
            <span className="text-brand-blue font-medium">{points[hoveredIdx].orders} order{points[hoveredIdx].orders === 1 ? '' : 's'}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminDashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [sellers, setSellers] = useState<AdminUser[]>([]);
  const [activity, setActivity] = useState<AuditLog[]>([]);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      setError(false);
      const response = await apiClient.get<Dashboard>('/admin/dashboard');
      setData(response.data);
    } catch {
      setError(true);
    }

    try {
      const auditRes = await apiClient.get<AuditLogPage>('/admin/audit-logs', { params: { size: 5 } });
      setActivity(auditRes.data.content || []);
    } catch {
      // Non-critical
    }

    try {
      const usersRes = await apiClient.get<AdminUser[]>('/admin/users', { params: { sellerStatus: 'APPROVED' } });
      setSellers(usersRes.data || []);
    } catch {
      // Non-critical
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const metrics = data
    ? [
        {
          label: 'Listed cards',
          value: data.listedCards.toLocaleString(),
          note: 'Currently visible on the marketplace',
          icon: Boxes,
          color: 'text-violet-300',
        },
        {
          label: 'Marketplace GMV',
          value: money(data.totalOrderAmount),
          note: data.totalOrders ? `${data.totalOrders} completed order${data.totalOrders === 1 ? '' : 's'}` : 'No comparison data',
          icon: ShoppingBag,
          color: 'text-brand-gold',
        },
        {
          label: 'Pending approvals',
          value: String(data.pendingSellerApplications),
          note: data.pendingSellerApplications ? 'Needs a decision' : 'Approval queue is clear',
          icon: ClipboardCheck,
          color: data.pendingSellerApplications ? 'text-status-warning' : 'text-status-success',
        },
        {
          label: 'Approved sellers',
          value: String(data.approvedSellers),
          note: 'Seller workspace enabled',
          icon: Store,
          color: 'text-status-success',
        },
      ]
    : [];

  return (
    <main id="main-content" className="mx-auto max-w-[1440px] px-5 py-6 sm:px-8 lg:px-10">
      <header className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Overview</h1>
          <p className="mt-1 text-sm text-slate-400">Here&apos;s what&apos;s happening on your marketplace today.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled
            title="Historical date filters are not available from the current dashboard API"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 px-3 text-sm text-slate-400 disabled:cursor-not-allowed"
          >
            <CalendarDays size={16} />
            All-time snapshot
          </button>
          <button
            type="button"
            aria-label="Notifications"
            className="inline-flex size-11 items-center justify-center rounded-xl border border-white/10 text-slate-300 transition hover:bg-white/[.05] focus:outline-none focus:ring-2 focus:ring-brand-blue"
          >
            <Bell size={18} />
          </button>
          <button
            type="button"
            onClick={() => void load()}
            disabled={refreshing}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 px-3.5 text-sm font-medium text-slate-300 transition hover:bg-white/[.05] focus:outline-none focus:ring-2 focus:ring-brand-blue disabled:opacity-60"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </header>

      {error && (
        <p role="alert" className="mt-5 rounded-xl border border-status-danger/30 bg-status-danger/10 px-4 py-3 text-sm text-red-100">
          Could not load dashboard data. Refresh to try again.
        </p>
      )}

      {data ? (
        <>
          <section aria-label="Platform metrics" className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map(({ label, value, note, icon: Icon, color }) => (
              <article key={label} className={`${card} p-5`}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-400">{label}</p>
                  <Icon size={18} className={color} />
                </div>
                <p className="mt-4 text-3xl font-semibold tracking-tight text-white tabular-nums">{value}</p>
                <p className="mt-2 text-sm text-slate-400">{note}</p>
              </article>
            ))}
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(19rem,.85fr)]">
            {/* GMV & Orders Chart Card */}
            <article className={`${card} min-h-[330px] p-5 sm:p-6 flex flex-col justify-between`}>
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-white">GMV &amp; Orders</h2>
                    <p className="mt-1 text-sm text-slate-400">Marketplace performance over the last 7 days</p>
                  </div>
                  <span className="rounded-lg border border-white/10 bg-white/[.04] px-2.5 py-1 text-xs font-medium text-slate-300">
                    Last 7 days
                  </span>
                </div>

                {/* Interactive SVG Chart */}
                <GmvOrdersChart trends={data.trends} />
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-slate-400">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-brand-gold inline-block" />
                    GMV (฿)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-brand-blue inline-block" />
                    Orders
                  </span>
                </div>
                <span className="text-slate-500">
                  Total {money(data.totalOrderAmount)} across {data.totalOrders} order{data.totalOrders === 1 ? '' : 's'}
                </span>
              </div>
            </article>

            {/* Recent Activity */}
            <article className={`${card} p-5 sm:p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-white">Recent activity</h2>
                  <p className="mt-1 text-sm text-slate-400">Latest administrator events</p>
                </div>
                <Link
                  to="/admin/audit-logs"
                  className="text-sm font-medium text-brand-gold hover:text-amber-200 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                >
                  View all
                </Link>
              </div>
              {activity.length ? (
                <ol className="mt-5 divide-y divide-white/10">
                  {activity.map((entry) => (
                    <li key={entry.id} className="flex gap-3 py-3 first:pt-0">
                      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/[.04]">
                        <ClipboardCheck size={18} className="text-brand-blue" />
                      </span>
                      <span className="min-w-0">
                        <strong className="block text-sm text-white">{entry.action.replaceAll('_', ' ')}</strong>
                        <span className="mt-0.5 block truncate text-sm text-slate-400">{entry.details || `By ${entry.actorName}`}</span>
                        <time className="mt-1 block text-xs text-slate-500">{new Date(entry.createdAt).toLocaleString()}</time>
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="mt-8 rounded-xl border border-dashed border-white/10 p-5 text-center">
                  <Info size={20} className="mx-auto text-slate-500" />
                  <p className="mt-2 text-sm font-medium text-white">No recent events</p>
                  <p className="mt-1 text-sm text-slate-400">Administrator activity will be recorded here.</p>
                </div>
              )}
            </article>
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-3">
            {/* Pending Seller Approvals */}
            <article className={`${card} p-5`}>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-white">Pending seller approvals</h2>
                <ClipboardCheck size={18} className="text-brand-gold" />
              </div>
              {data.pendingSellerApplications === 0 ? (
                <div className="mt-6 rounded-xl border border-dashed border-white/10 px-4 py-6 text-center">
                  <CheckCircle2 size={22} className="mx-auto text-status-success" />
                  <p className="mt-3 text-sm font-medium text-white">No pending applications</p>
                  <p className="mt-1 text-sm text-slate-400">All seller applications have been reviewed.</p>
                  <p className="sr-only">No seller applications are waiting for review.</p>
                </div>
              ) : (
                <div className="mt-6">
                  <p className="text-3xl font-semibold text-white">{data.pendingSellerApplications}</p>
                  <p className="mt-1 text-sm text-slate-400">{data.pendingSellerApplications} seller applications await review.</p>
                </div>
              )}
              <Link
                to="/admin/seller-applications"
                className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-brand-gold hover:text-amber-200 focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                Review applications <ArrowRight size={16} />
              </Link>
            </article>

            {/* Approved Sellers */}
            <article className={`${card} p-5`}>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-white">Approved sellers</h2>
                <Store size={18} className="text-status-success" />
              </div>
              {sellers.length ? (
                <div className="mt-4 divide-y divide-white/10">
                  {sellers.map((seller) => (
                    <div key={seller.id} className="flex items-center justify-between gap-3 py-3">
                      <span className="min-w-0">
                        <strong className="block truncate text-sm text-white">{seller.name}</strong>
                        <span className="mt-1 block text-xs text-slate-500">{seller.email}</span>
                      </span>
                      <span className="rounded-full border border-status-success/30 bg-status-success/10 px-2 py-1 text-xs text-status-success">
                        Active
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-6 text-sm text-slate-400">
                  {data.approvedSellers > 0 ? `${data.approvedSellers} approved sellers active on platform.` : 'No approved seller details are available.'}
                </p>
              )}
            </article>

            {/* Catalog Summary */}
            <article className={`${card} p-5`}>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-white">Catalog summary</h2>
                <Boxes size={18} className="text-violet-300" />
              </div>
              <dl className="mt-5 space-y-4">
                <div className="flex justify-between">
                  <dt className="text-sm text-slate-400">Products (Total Cards)</dt>
                  <dd className="font-semibold tabular-nums text-white">{data.totalCards.toLocaleString()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-slate-400">Active Listings</dt>
                  <dd className="font-semibold tabular-nums text-brand-gold">{data.listedCards.toLocaleString()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-slate-400">Categories</dt>
                  <dd className="text-sm text-white font-medium">Pokémon, Trainer, Energy</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-slate-400">Brand</dt>
                  <dd className="text-sm text-white font-medium">Pokémon TCG</dd>
                </div>
              </dl>
              <Link
                to="/cards"
                className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-brand-gold hover:text-amber-200 focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                Browse catalog <ArrowRight size={16} />
              </Link>
            </article>
          </section>
        </>
      ) : (
        <section aria-label="Loading dashboard" className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl border border-white/10 bg-bg-elevated" />
          ))}
        </section>
      )}
    </main>
  );
}
