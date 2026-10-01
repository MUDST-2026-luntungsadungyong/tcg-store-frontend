import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Search, UserCheck, X } from 'lucide-react';
import apiClient from '@/shared/api/client';
import { Modal } from '@/shared/components/Modal';
import { cn } from '@/shared/lib';

const ACTIONS = ['APPROVE_SELLER', 'REJECT_SELLER', 'UPDATE_STOCK', 'UPDATE_GLOBAL_CARD'] as const;
type ActionType = typeof ACTIONS[number] | string;
type SearchBy = 'ALL' | 'ACTOR' | 'TARGET' | 'DETAILS';

type AuditLog = {
  id: string;
  action: ActionType;
  targetType: string;
  targetId: string;
  actorId?: string | null;
  actorName: string;
  actorEmail?: string | null;
  actorRole: string;
  actorSellerStatus?: string | null;
  details: string;
  createdAt: string;
};

type Page = {
  content: AuditLog[];
  number: number;
  totalPages: number;
  totalElements: number;
};

const actionTone: Record<string, string> = {
  APPROVE_SELLER: 'border-status-success/30 bg-status-success/10 text-status-success',
  REJECT_SELLER: 'border-status-danger/30 bg-status-danger/10 text-status-danger',
  UPDATE_STOCK: 'border-brand-blue/30 bg-brand-blue/10 text-brand-blue',
  UPDATE_GLOBAL_CARD: 'border-brand-gold/30 bg-brand-gold/10 text-brand-gold',
};

const roleTone: Record<string, string> = {
  ADMIN: 'border-brand-blue/30 bg-brand-blue/10 text-brand-blue',
  SELLER: 'border-brand-gold/30 bg-brand-gold/10 text-brand-gold',
  SYSTEM: 'border-gray-500/30 bg-gray-500/10 text-gray-300',
  USER: 'border-gray-400/30 bg-gray-400/10 text-gray-300',
};

const toIso = (d: Date) => d.toISOString().slice(0, 10);
const fmt = (value: string) =>
  new Date(`${value}T00:00:00`).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

const fmtDateTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return '—';
  }
};

function ActionBadge({ action }: { action: string }) {
  const tone = actionTone[action] || 'border-white/20 bg-white/5 text-gray-300';
  return <span className={cn('inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold', tone)}>{action}</span>;
}

function resolveRole(role?: string | null, actorName?: string | null): string {
  if (role && role.trim()) return role.toUpperCase();
  if (!actorName) return 'USER';
  const name = actorName.toLowerCase();
  if (name.includes('system')) return 'SYSTEM';
  if (name.includes('admin')) return 'ADMIN';
  return 'USER';
}

function RoleBadge({ role, actorName }: { role?: string | null; actorName?: string | null }) {
  const resolved = resolveRole(role, actorName);
  const tone = roleTone[resolved] || 'border-white/20 bg-white/5 text-gray-300';
  return <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase', tone)}>{resolved}</span>;
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between py-1.5 text-sm">
      <span className="text-gray-400">{label}</span>
      <span className="text-right text-white font-medium">{children}</span>
    </div>
  );
}

function parseJsonDetails(details: string): string | null {
  try {
    const parsed = JSON.parse(details);
    if (typeof parsed === 'object' && parsed !== null) {
      return JSON.stringify(parsed, null, 2);
    }
  } catch {
    // not JSON
  }
  return null;
}

function DetailsRenderer({ details }: { details: string }) {
  const formattedJson = parseJsonDetails(details);
  if (formattedJson !== null) {
    return (
      <pre className="max-h-48 overflow-auto rounded-lg border border-white/10 bg-black/40 p-3 text-xs font-mono text-gray-200">
        {formattedJson}
      </pre>
    );
  }
  return <p className="text-sm text-gray-200">{details}</p>;
}

function DateRangePicker({ from, to, onChange }: { from: string; to: string; onChange: (from: string, to: string) => void }) {
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(() => new Date());
  const [draftFrom, setDraftFrom] = useState(from);
  const [draftTo, setDraftTo] = useState(to);
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

  const days = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const offset = first.getDay();
    const start = new Date(first);
    start.setDate(1 - offset);
    return Array.from({ length: 42 }, (_, i) => {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      return day;
    });
  }, [cursor]);

  const label = from ? `${fmt(from)}${to ? ` – ${fmt(to)}` : ' – Select end date'}` : 'Date range';

  function choose(day: Date) {
    const value = toIso(day);
    if (!draftFrom || draftTo || value < draftFrom) {
      setDraftFrom(value);
      setDraftTo('');
    } else {
      setDraftTo(value);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-label="Select audit log date range"
        onClick={() => {
          setDraftFrom(from);
          setDraftTo(to);
          setOpen(!open);
        }}
        className="flex h-10 min-w-56 items-center gap-2 rounded-lg border border-white/10 bg-bg-input px-3 text-left text-sm text-white hover:bg-white/[.04] focus:outline-none focus:ring-2 focus:ring-brand-blue"
      >
        <CalendarDays size={16} className="text-gray-400" />
        <span className={from ? '' : 'text-gray-400'}>{label}</span>
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-[20rem] rounded-xl border border-white/10 bg-bg-elevated p-3 shadow-2xl">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
              className="flex size-9 items-center justify-center rounded-lg hover:bg-white/10"
            >
              <ChevronLeft size={16} />
            </button>
            <strong className="text-sm text-white">
              {cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </strong>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
              className="flex size-9 items-center justify-center rounded-lg hover:bg-white/10"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid text-center text-[11px] text-gray-400" style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <span key={`${d}${i}`} className="py-1">
                {d}
              </span>
            ))}
          </div>

          <div className="grid gap-0.5" style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
            {days.map((day) => {
              const value = toIso(day);
              const selected = value === draftFrom || value === draftTo;
              const between = draftFrom && draftTo && value > draftFrom && value < draftTo;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => choose(day)}
                  className={cn(
                    'flex h-9 items-center justify-center rounded-lg text-sm transition',
                    day.getMonth() !== cursor.getMonth() && 'text-gray-600',
                    selected && 'bg-brand-blue text-bg-base font-bold',
                    between && 'bg-brand-blue/20 text-white',
                    !selected && !between && 'hover:bg-white/10'
                  )}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex justify-between border-t border-white/10 pt-3">
            <button
              type="button"
              onClick={() => {
                setDraftFrom('');
                setDraftTo('');
                onChange('', '');
                setOpen(false);
              }}
              className="min-h-10 px-2 text-sm text-gray-300 hover:text-white"
            >
              Clear
            </button>
            <button
              type="button"
              disabled={!draftFrom || !draftTo}
              onClick={() => {
                onChange(draftFrom, draftTo);
                setOpen(false);
              }}
              className="min-h-10 rounded-lg bg-brand-blue px-3 text-sm font-semibold text-bg-base disabled:opacity-40"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Mobile card for a single audit log row ── */
function AuditLogCard({ log, onClick }: { log: AuditLog; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-white/10 bg-bg-elevated p-4 text-left transition hover:bg-white/[.03]"
    >
      <div className="flex items-center justify-between gap-2">
        <ActionBadge action={log.action} />
        <span className="text-xs text-gray-400">{fmtDateTime(log.createdAt)}</span>
      </div>
      <div className="mt-2.5 flex items-center justify-between text-sm">
        <span className="font-medium text-white">{log.actorName}</span>
        <RoleBadge role={log.actorRole} actorName={log.actorName} />
      </div>
      <div className="mt-2 line-clamp-2 text-xs text-gray-400">
        {log.details}
      </div>
    </button>
  );
}

export function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [query, setQuery] = useState('');
  const [searchBy, setSearchBy] = useState<SearchBy>('ALL');
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(0);
  const [info, setInfo] = useState<Page>({ content: [], number: 0, totalPages: 0, totalElements: 0 });
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<AuditLog | null>(null);

  useEffect(() => setPage(0), [query, searchBy, selectedActions, from, to]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void apiClient
      .get<Page>('/admin/audit-logs', {
        params: {
          query: query || undefined,
          searchBy,
          actions: selectedActions.length ? selectedActions : undefined,
          fromDate: from || undefined,
          toDate: to || undefined,
          page,
          size: 20,
        },
        paramsSerializer: { indexes: null },
      })
      .then(({ data }) => {
        if (active) {
          setLogs(data.content || []);
          setInfo(data);
        }
      })
      .catch(() => {
        if (active) setLogs([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page, query, searchBy, selectedActions, from, to]);

  const toggleAction = (action: string) =>
    setSelectedActions((all) => (all.includes(action) ? all.filter((x) => x !== action) : [...all, action]));

  const placeholder =
    searchBy === 'ACTOR'
      ? 'Search actor name or email'
      : searchBy === 'TARGET'
      ? 'Search target type or ID'
      : searchBy === 'DETAILS'
      ? 'Search in details'
      : 'Search all fields (actor, email, details, target)';

  return (
    <main id="main-content" className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <header className="border-b border-white/10 pb-5">
        <p className="text-xs font-semibold uppercase tracking-[.16em] text-brand-gold">Platform administration</p>
        <h1 className="mt-1 text-3xl font-bold text-white">Audit trail</h1>
      </header>

      {/* Filters */}
      <section className="mt-4 rounded-xl border border-white/10 bg-bg-elevated p-3.5">
        <div className="flex flex-col gap-3 xl:flex-row">
          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row">
            <select
              aria-label="Search by"
              value={searchBy}
              onChange={(e) => setSearchBy(e.target.value as SearchBy)}
              className="h-10 rounded-lg border border-white/10 bg-bg-input px-3 text-sm text-white"
            >
              <option value="ALL">All fields</option>
              <option value="ACTOR">Actor (Name/Email)</option>
              <option value="TARGET">Target</option>
              <option value="DETAILS">Details</option>
            </select>
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Search audit logs</span>
              <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className="h-10 w-full rounded-lg border border-white/10 bg-bg-input pl-10 pr-9 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              )}
            </label>
            <DateRangePicker from={from} to={to} onChange={(start, end) => { setFrom(start); setTo(end); }} />
          </div>

          {/* Action Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {ACTIONS.map((act) => (
              <button
                key={act}
                type="button"
                aria-pressed={selectedActions.includes(act)}
                onClick={() => toggleAction(act)}
                className={cn(
                  'min-h-8 rounded-full border px-3 text-xs font-semibold transition',
                  selectedActions.includes(act)
                    ? actionTone[act] || 'border-brand-blue bg-brand-blue/20 text-white'
                    : 'border-white/10 text-gray-400 hover:border-white/25 hover:text-white'
                )}
              >
                {act}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Logs List */}
      <section className="mt-4">
        <p className="mb-3 text-sm text-gray-400">{loading ? 'Loading audit logs…' : `${info.totalElements} records found`}</p>

        {loading ? (
          <div role="status" className="h-28 animate-pulse rounded-xl bg-bg-elevated" />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-hidden rounded-xl border border-white/10 bg-bg-elevated">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 text-xs uppercase text-gray-400">
                  <tr>
                    <th className="py-3.5 px-4">Time</th>
                    <th className="py-3.5 px-4">Action</th>
                    <th className="py-3.5 px-4">Actor</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400">
                        No audit logs found matching the filter criteria.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr
                        key={log.id}
                        onClick={() => setViewing(log)}
                        className="cursor-pointer border-b border-white/10 last:border-0 hover:bg-white/[.04] transition-colors"
                      >
                        <td className="py-3.5 px-4 text-gray-300 whitespace-nowrap">{fmtDateTime(log.createdAt)}</td>
                        <td className="py-3.5 px-4 font-medium text-white">
                          <ActionBadge action={log.action} />
                        </td>
                        <td className="py-3.5 px-4 text-white font-medium">
                          {log.actorName}
                          {log.actorEmail && <span className="block text-xs text-gray-400 font-normal">{log.actorEmail}</span>}
                        </td>
                        <td className="py-3.5 px-4">
                          <RoleBadge role={log.actorRole} actorName={log.actorName} />
                        </td>
                        <td className="py-3.5 px-4 text-gray-300 max-w-md truncate">{log.details}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="flex flex-col gap-3 md:hidden">
              {logs.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-bg-elevated p-6 text-center text-gray-400">
                  No audit logs found matching the filter criteria.
                </div>
              ) : (
                logs.map((log) => <AuditLogCard key={log.id} log={log} onClick={() => setViewing(log)} />)
              )}
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

      {/* Audit Log Detail Modal */}
      <Modal isOpen={Boolean(viewing)} onClose={() => setViewing(null)} title="Audit log details" mobileSheet className="md:max-w-2xl">
        {viewing && (
          <div className="space-y-4">
            {/* Header: Action + Time */}
            <div className="flex items-center justify-between">
              <ActionBadge action={viewing.action} />
              <span className="text-xs text-gray-400">{fmtDateTime(viewing.createdAt)}</span>
            </div>

            {/* Log Info */}
            <div className="rounded-lg border border-white/10 bg-white/[.02] p-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Log Information</h3>
              <DetailRow label="Log ID">{viewing.id}</DetailRow>
              <DetailRow label="Action">{viewing.action}</DetailRow>
              <DetailRow label="Target Type">{viewing.targetType || '—'}</DetailRow>
              <DetailRow label="Target ID">{viewing.targetId || '—'}</DetailRow>
              <DetailRow label="Timestamp">{fmtDateTime(viewing.createdAt)}</DetailRow>
            </div>

            {/* Actor Info */}
            <div className="rounded-lg border border-white/10 bg-white/[.02] p-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <UserCheck size={14} /> Actor Information
              </h3>
              <DetailRow label="Name">{viewing.actorName}</DetailRow>
              {viewing.actorEmail && <DetailRow label="Email">{viewing.actorEmail}</DetailRow>}
              <DetailRow label="Role">
                <RoleBadge role={viewing.actorRole} actorName={viewing.actorName} />
              </DetailRow>
              {viewing.actorId && <DetailRow label="Actor ID">{viewing.actorId}</DetailRow>}
              {viewing.actorSellerStatus && <DetailRow label="Seller Status">{viewing.actorSellerStatus}</DetailRow>}
            </div>

            {/* Details Section */}
            <div className="rounded-lg border border-white/10 bg-white/[.02] p-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Action Details</h3>
              <DetailsRenderer details={viewing.details} />
            </div>
          </div>
        )}
      </Modal>
    </main>
  );
}
