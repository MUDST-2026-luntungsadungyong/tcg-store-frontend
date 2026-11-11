import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarClock,
  CheckCircle2,
  PauseCircle,
  Pencil,
  PlayCircle,
  Plus,
  RefreshCw,
  Tag,
  Ticket,
  Trash2,
  Users,
} from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { Modal } from '@/shared/components/Modal';
import { PageContainer, PageHeader, Toolbar } from '@/shared/components/PageLayout';
import { SearchField } from '@/shared/components/SearchField';
import { cn } from '@/shared/lib';
import { useToastStore } from '@/shared/model/useToastStore';
import { VoucherTicket } from '@/features/vouchers/components/VoucherTicket';
import type {
  AdminVoucher,
  AdminVoucherPayload,
  DiscountType,
  Voucher,
  VoucherEffectiveStatus,
} from '@/features/vouchers/model/types';
import { useVoucherLiveUpdates } from '@/features/vouchers/model/useVoucherLiveUpdates';
import {
  localDateTimeInputToIso,
  toLocalDateTimeInputValue,
} from '@/features/vouchers/model/voucherUtils';
import {
  createAdminVoucher,
  deleteAdminVoucher,
  extractAdminVoucherError,
  listAdminVouchers,
  toggleAdminVoucherStatus,
  updateAdminVoucher,
} from '../api/adminVouchers';

type StatusFilter = 'ALL' | VoucherEffectiveStatus;
type TypeFilter = 'ALL' | DiscountType;

interface VoucherFormState {
  code: string;
  title: string;
  description: string;
  discountType: DiscountType;
  discountValue: string;
  minSpend: string;
  maxDiscountAmount: string;
  totalQuota: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'EXHAUSTED', label: 'Exhausted' },
  { value: 'EXPIRED', label: 'Expired' },
];

const statusTone: Record<VoucherEffectiveStatus, string> = {
  ACTIVE: 'border-status-success/30 bg-status-success/10 text-status-success',
  SCHEDULED: 'border-brand-blue/30 bg-brand-blue/10 text-brand-blue',
  INACTIVE: 'border-white/20 bg-white/10 text-gray-300',
  EXHAUSTED: 'border-status-warning/30 bg-status-warning/10 text-status-warning',
  EXPIRED: 'border-status-danger/30 bg-status-danger/10 text-status-danger',
};

const statusLabel: Record<VoucherEffectiveStatus, string> = {
  ACTIVE: 'Active',
  SCHEDULED: 'Scheduled',
  INACTIVE: 'Paused / Off',
  EXHAUSTED: 'Exhausted',
  EXPIRED: 'Expired',
};

function defaultFormState(): VoucherFormState {
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  return {
    code: '',
    title: '',
    description: '',
    discountType: 'FIXED_AMOUNT',
    discountValue: '50',
    minSpend: '300',
    maxDiscountAmount: '',
    totalQuota: '100',
    startTime: toLocalDateTimeInputValue(now.toISOString()),
    endTime: toLocalDateTimeInputValue(in30Days.toISOString()),
    isActive: true,
  };
}

function formFromVoucher(v: AdminVoucher): VoucherFormState {
  return {
    code: v.code,
    title: v.title,
    description: v.description || '',
    discountType: v.discountType,
    discountValue: String(v.discountValue),
    minSpend: String(v.minSpend ?? 0),
    maxDiscountAmount: v.maxDiscountAmount != null ? String(v.maxDiscountAmount) : '',
    totalQuota: String(v.totalQuota),
    startTime: toLocalDateTimeInputValue(v.startTime),
    endTime: toLocalDateTimeInputValue(v.endTime),
    isActive: v.isActive,
  };
}

function formatMoney(value: number): string {
  return `฿${Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function formatShortDateTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function EffectiveStatusBadge({ status }: { status: VoucherEffectiveStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
        statusTone[status]
      )}
    >
      {statusLabel[status]}
    </span>
  );
}

export function AdminVouchersPage() {
  const [vouchers, setVouchers] = useState<AdminVoucher[]>([]);
  const [summarySource, setSummarySource] = useState<AdminVoucher[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create / Edit Modal state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<AdminVoucher | null>(null);
  const [form, setForm] = useState<VoucherFormState>(defaultFormState);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Toggle & Delete state
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [voucherToDelete, setVoucherToDelete] = useState<AdminVoucher | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { addToast } = useToastStore();

  const isUnfiltered = search.trim() === '' && statusFilter === 'ALL' && typeFilter === 'ALL';

  const loadVouchers = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        if (!silent) setError('');
        const data = await listAdminVouchers({
          search: search.trim() || undefined,
          status: statusFilter,
          discountType: typeFilter,
        });
        setVouchers(data);
        if (isUnfiltered) {
          setSummarySource(data);
        }
      } catch {
        if (!silent) {
          setError('Unable to load discount vouchers.');
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [search, statusFilter, typeFilter, isUnfiltered]
  );

  useEffect(() => {
    void loadVouchers(false);
  }, [loadVouchers]);

  useVoucherLiveUpdates({
    onRefresh: () => loadVouchers(true),
  });

  const kpiMetrics = useMemo(() => {
    const source = summarySource.length > 0 || isUnfiltered ? summarySource : vouchers;
    const total = source.length;
    const active = source.filter((v) => v.effectiveStatus === 'ACTIVE').length;
    const claimed = source.reduce((acc, v) => acc + (Number(v.claimedCount) || 0), 0);
    const redeemed = source.reduce((acc, v) => acc + (Number(v.usedQuota) || 0), 0);
    return { total, active, claimed, redeemed };
  }, [summarySource, vouchers, isUnfiltered]);

  const previewVoucher: Voucher = useMemo(() => {
    const totalQuota = Math.max(1, Number(form.totalQuota) || 100);
    const usedQuota = editingVoucher ? Math.min(totalQuota, editingVoucher.usedQuota) : 0;
    const remainingQuota = Math.max(0, totalQuota - usedQuota);
    const quotaPercentage = totalQuota > 0 ? Math.min(100, Math.round((usedQuota / totalQuota) * 100)) : 0;

    return {
      id: editingVoucher?.id ?? 0,
      code: (form.code || 'PREVIEWCODE').toUpperCase(),
      title: form.title || 'ชื่อโปรโมชันส่วนลด',
      description: form.description || 'รายละเอียดเงื่อนไขโค้ดส่วนลดสำหรับผู้ซื้อ',
      discountType: form.discountType,
      discountValue: Math.max(0, Number(form.discountValue) || 0),
      minSpend: Math.max(0, Number(form.minSpend) || 0),
      maxDiscountAmount:
        form.discountType === 'PERCENTAGE' && Number(form.maxDiscountAmount) > 0
          ? Number(form.maxDiscountAmount)
          : null,
      totalQuota,
      usedQuota,
      remainingQuota,
      quotaPercentage,
      startTime: form.startTime ? localDateTimeInputToIso(form.startTime) : null,
      endTime: form.endTime ? localDateTimeInputToIso(form.endTime) : null,
      isActive: form.isActive,
      isClaimed: false,
      canClaim: true,
    };
  }, [form, editingVoucher]);

  const openCreateModal = () => {
    setEditingVoucher(null);
    setForm(defaultFormState());
    setFieldErrors({});
    setFormError('');
    setEditorOpen(true);
  };

  const openEditModal = (voucher: AdminVoucher) => {
    setEditingVoucher(voucher);
    setForm(formFromVoucher(voucher));
    setFieldErrors({});
    setFormError('');
    setEditorOpen(true);
  };

  const closeEditor = () => {
    if (submitting) return;
    setEditorOpen(false);
    setEditingVoucher(null);
    setFieldErrors({});
    setFormError('');
  };

  const validateClientForm = (): { payload: AdminVoucherPayload | null; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};
    const code = form.code.trim().toUpperCase();
    if (!code) {
      errors.code = 'Voucher code is required';
    } else if (!/^[A-Z0-9_-]{2,50}$/.test(code)) {
      errors.code = 'Use 2–50 characters (A-Z, 0-9, -, _) with no spaces';
    }

    const title = form.title.trim();
    if (!title) {
      errors.title = 'Voucher title is required';
    } else if (title.length > 255) {
      errors.title = 'Voucher title must not exceed 255 characters';
    }

    const discountValue = Number(form.discountValue);
    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      errors.discountValue = 'Discount value must be greater than 0';
    } else if (form.discountType === 'PERCENTAGE' && discountValue > 100) {
      errors.discountValue = 'Percentage discount cannot exceed 100%';
    }

    const minSpend = form.minSpend.trim() === '' ? 0 : Number(form.minSpend);
    if (!Number.isFinite(minSpend) || minSpend < 0) {
      errors.minSpend = 'Minimum spend cannot be negative';
    }

    let maxDiscountAmount: number | null = null;
    if (form.discountType === 'PERCENTAGE' && form.maxDiscountAmount.trim() !== '') {
      const parsedMax = Number(form.maxDiscountAmount);
      if (!Number.isFinite(parsedMax) || parsedMax < 0) {
        errors.maxDiscountAmount = 'Max discount cap must be 0 or positive';
      } else if (parsedMax > 0) {
        maxDiscountAmount = parsedMax;
      }
    }

    const totalQuota = Number(form.totalQuota);
    const minAllowedQuota = editingVoucher ? Math.max(1, editingVoucher.usedQuota) : 1;
    if (!Number.isInteger(totalQuota) || totalQuota < minAllowedQuota) {
      errors.totalQuota =
        editingVoucher && editingVoucher.usedQuota > 0
          ? `Total quota must be an integer >= ${editingVoucher.usedQuota} (already used)`
          : 'Total quota must be a whole number >= 1';
    }

    if (!form.startTime) {
      errors.startTime = 'Start date & time is required';
    }
    if (!form.endTime) {
      errors.endTime = 'End date & time is required';
    }

    const startIso = localDateTimeInputToIso(form.startTime);
    const endIso = localDateTimeInputToIso(form.endTime);
    if (form.startTime && form.endTime && Date.parse(endIso) <= Date.parse(startIso)) {
      errors.endTime = 'End date & time must be after start date & time';
    }

    if (Object.keys(errors).length > 0) {
      return { payload: null, errors };
    }

    return {
      payload: {
        code,
        title,
        description: form.description.trim(),
        discountType: form.discountType,
        discountValue,
        minSpend,
        maxDiscountAmount,
        totalQuota,
        startTime: startIso,
        endTime: endIso,
        isActive: form.isActive,
      },
      errors: {},
    };
  };

  const handleSubmitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const { payload, errors } = validateClientForm();
    if (!payload) {
      setFieldErrors(errors);
      setFormError(Object.values(errors)[0] || 'Please fix validation errors');
      return;
    }

    setSubmitting(true);
    setFieldErrors({});
    setFormError('');
    try {
      if (editingVoucher) {
        const updated = await updateAdminVoucher(editingVoucher.id, payload);
        setVouchers((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
        setSummarySource((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
        addToast({ type: 'success', message: `Voucher ${updated.code} updated and synced.` });
      } else {
        const created = await createAdminVoucher(payload);
        setVouchers((prev) => [created, ...prev]);
        setSummarySource((prev) => [created, ...prev]);
        addToast({ type: 'success', message: `Voucher ${created.code} created and published.` });
      }
      setEditorOpen(false);
      setEditingVoucher(null);
      void loadVouchers(true);
    } catch (err) {
      const parsed = extractAdminVoucherError(err, 'Unable to save voucher');
      setFieldErrors(parsed.fieldErrors);
      setFormError(parsed.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (voucher: AdminVoucher) => {
    setTogglingId(voucher.id);
    try {
      const updated = await toggleAdminVoucherStatus(voucher.id, !voucher.isActive);
      setVouchers((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
      setSummarySource((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
      addToast({
        type: 'success',
        message: `${updated.code} is now ${updated.isActive ? 'active' : 'paused'}.`,
      });
      void loadVouchers(true);
    } catch (err) {
      const parsed = extractAdminVoucherError(err, 'Failed to change voucher status');
      addToast({ type: 'error', message: parsed.message });
    } finally {
      setTogglingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!voucherToDelete) return;
    setDeleting(true);
    try {
      await deleteAdminVoucher(voucherToDelete.id);
      const deletedCode = voucherToDelete.code;
      const deletedId = voucherToDelete.id;
      setVouchers((prev) => prev.filter((v) => v.id !== deletedId));
      setSummarySource((prev) => prev.filter((v) => v.id !== deletedId));
      setVoucherToDelete(null);
      addToast({
        type: 'success',
        message: `Voucher ${deletedCode} deleted.`,
      });
      void loadVouchers(true);
    } catch (err) {
      const parsed = extractAdminVoucherError(err, 'Unable to delete voucher');
      addToast({ type: 'error', message: parsed.message });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Platform promotions"
        title="Discounts & Vouchers"
        description="Manage platform-funded discount vouchers, campaign schedules, and redemption quotas with real-time sync."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-status-success/30 bg-status-success/10 px-3 py-1.5 text-xs font-semibold text-status-success">
              <span className="size-2 rounded-full bg-status-success animate-pulse" />
              Live sync
            </span>
            <Link
              to="/vouchers"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-bg-elevated px-4 py-2 text-sm font-medium text-gray-200 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue shrink-0"
            >
              <Ticket size={16} className="text-brand-gold" aria-hidden="true" />
              Public Voucher Center
            </Link>
            <Button
              variant="secondary"
              onClick={() => void loadVouchers(false)}
              isLoading={loading}
              className="gap-2 shrink-0"
            >
              <RefreshCw size={16} aria-hidden="true" />
              Refresh
            </Button>
            <Button onClick={openCreateModal} className="gap-2 shrink-0">
              <Plus size={16} aria-hidden="true" />
              Create voucher
            </Button>
          </div>
        }
      />

      {/* Summary KPIs */}
      <section aria-label="Voucher summary metrics" className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-white/10 bg-bg-surface p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-400">Total vouchers</p>
            <Tag size={18} className="text-brand-blue" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-white tabular-nums">{kpiMetrics.total}</p>
          <p className="mt-1 text-xs text-slate-400">All configured campaigns</p>
        </article>

        <article className="rounded-2xl border border-white/10 bg-bg-surface p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-400">Active now</p>
            <CheckCircle2 size={18} className="text-status-success" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-white tabular-nums">{kpiMetrics.active}</p>
          <p className="mt-1 text-xs text-slate-400">Live in buyer voucher center</p>
        </article>

        <article className="rounded-2xl border border-white/10 bg-bg-surface p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-400">Wallet claims</p>
            <Users size={18} className="text-brand-gold" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-white tabular-nums">{kpiMetrics.claimed}</p>
          <p className="mt-1 text-xs text-slate-400">Saved in buyer wallets</p>
        </article>

        <article className="rounded-2xl border border-white/10 bg-bg-surface p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-400">Total redemptions</p>
            <Ticket size={18} className="text-violet-300" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-white tabular-nums">{kpiMetrics.redeemed}</p>
          <p className="mt-1 text-xs text-slate-400">Applied across platform orders</p>
        </article>
      </section>

      {/* Search & Filters */}
      <Toolbar className="mt-6 flex-col items-stretch gap-3 xl:flex-row xl:items-center xl:justify-between rounded-xl border border-white/10 bg-bg-elevated p-3.5">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center min-w-0">
          <SearchField
            aria-label="Search vouchers"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code, title, or description"
            className="min-w-0 flex-1 sm:max-w-xs"
          />
          <select
            aria-label="Filter by discount type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
            className="h-11 shrink-0 whitespace-nowrap rounded-xl border border-white/15 bg-bg-input px-3 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-blue"
          >
            <option value="ALL">All discount types</option>
            <option value="PERCENTAGE">Percentage (%)</option>
            <option value="FIXED_AMOUNT">Fixed amount (฿)</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by voucher status">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              aria-pressed={statusFilter === opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={cn(
                'min-h-8 rounded-full border px-3 text-xs font-semibold transition',
                statusFilter === opt.value
                  ? 'border-brand-blue bg-brand-blue/20 text-brand-blue'
                  : 'border-white/10 text-gray-400 hover:border-white/25 hover:text-white'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Toolbar>

      {error && (
        <p role="alert" className="mt-4 rounded-xl border border-status-danger/30 bg-status-danger/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}

      {/* Voucher Catalog List */}
      <section className="mt-6">
        {loading ? (
          <div role="status" className="h-44 animate-pulse rounded-xl border border-white/10 bg-bg-elevated" />
        ) : vouchers.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-bg-elevated p-10 text-center">
            <Tag className="mx-auto mb-3 text-slate-500" size={32} />
            <p className="text-base font-semibold text-white">No vouchers found</p>
            <p className="mt-1 text-sm text-slate-400">
              {isUnfiltered
                ? 'Create your first discount code to display it in the Buyer Voucher Center.'
                : 'Try adjusting your search keyword or status filter.'}
            </p>
            {isUnfiltered && (
              <Button onClick={openCreateModal} className="mt-4 gap-2">
                <Plus size={16} />
                Create voucher
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden xl:block overflow-x-auto rounded-xl border border-white/10 bg-bg-elevated">
              <table className="mythix-table w-full text-left text-sm">
                <thead className="border-b border-white/10 text-xs uppercase text-gray-400">
                  <tr>
                    <th className="px-3 py-3.5">Code &amp; Title</th>
                    <th className="px-3 py-3.5">Discount</th>
                    <th className="px-3 py-3.5">Quota &amp; Usage</th>
                    <th className="px-3 py-3.5">Schedule</th>
                    <th className="px-3 py-3.5">Status</th>
                    <th className="px-3 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vouchers.map((v) => (
                    <tr key={v.id} className="border-b border-white/10 last:border-0 hover:bg-white/[.03] transition-colors">
                      <td className="px-3 py-3 max-w-[205px]">
                        <div className="flex items-center gap-2">
                          <span className="rounded-md border border-brand-blue/30 bg-brand-blue/15 px-2 py-0.5 font-mono text-xs font-bold text-brand-blue">
                            {v.code}
                          </span>
                        </div>
                        <p className="mt-1 font-semibold text-white truncate">{v.title}</p>
                        {v.description && (
                          <p className="mt-0.5 text-xs text-gray-400 truncate">{v.description}</p>
                        )}
                      </td>

                      <td className="px-3 py-3 whitespace-nowrap">
                        <p className="font-semibold text-amber-300">
                          {v.discountType === 'PERCENTAGE'
                            ? `${v.discountValue}% off`
                            : `${formatMoney(v.discountValue)} off`}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-400">
                          Min spend {formatMoney(v.minSpend)}
                          {v.discountType === 'PERCENTAGE' && v.maxDiscountAmount != null
                            ? ` · Cap ${formatMoney(v.maxDiscountAmount)}`
                            : ''}
                        </p>
                      </td>

                      <td className="px-3 py-3 min-w-[140px]">
                        <div className="flex items-center justify-between gap-2 text-xs text-gray-300 mb-1">
                          <span className="tabular-nums font-medium">
                            {v.usedQuota} / {v.totalQuota} used
                          </span>
                          <span className="text-gray-400 tabular-nums">{v.remainingQuota} left</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all',
                              v.quotaPercentage >= 85 ? 'bg-status-danger' : 'bg-brand-gold'
                            )}
                            style={{ width: `${Math.min(100, Math.max(v.usedQuota > 0 ? 4 : 0, v.quotaPercentage))}%` }}
                          />
                        </div>
                        <p className="mt-1 text-[11px] text-gray-400">
                          {v.claimedCount} claimed · {v.usedOrdersCount} orders
                        </p>
                      </td>

                      <td className="px-3 py-3 text-xs text-gray-300 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <CalendarClock size={13} className="text-gray-400 shrink-0" />
                          <span>{formatShortDateTime(v.startTime)}</span>
                        </div>
                        <div className="mt-0.5 pl-5 text-gray-400">to {formatShortDateTime(v.endTime)}</div>
                      </td>

                      <td className="px-3 py-3">
                        <EffectiveStatusBadge status={v.effectiveStatus} />
                      </td>

                      <td className="px-3 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            variant="secondary"
                            size="sm"
                            isLoading={togglingId === v.id}
                            disabled={togglingId === v.id}
                            onClick={() => void handleToggleStatus(v)}
                            aria-label={`${v.isActive ? 'Disable' : 'Enable'} ${v.code}`}
                            className="h-9 px-2.5 text-xs gap-1"
                          >
                            {v.isActive ? <PauseCircle size={14} /> : <PlayCircle size={14} />}
                            {v.isActive ? 'Disable' : 'Enable'}
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => openEditModal(v)}
                            aria-label={`Edit ${v.code}`}
                            className="h-9 px-2.5 text-xs gap-1"
                          >
                            <Pencil size={14} />
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setVoucherToDelete(v)}
                            aria-label={`Delete ${v.code}`}
                            className="h-9 px-2.5 text-xs gap-1"
                          >
                            <Trash2 size={14} />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Cards */}
            <div className="flex flex-col gap-3 xl:hidden">
              {vouchers.map((v) => (
                <article key={v.id} className="rounded-xl border border-white/10 bg-bg-elevated p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="rounded-md border border-brand-blue/30 bg-brand-blue/15 px-2 py-0.5 font-mono text-xs font-bold text-brand-blue">
                          {v.code}
                        </span>
                        <EffectiveStatusBadge status={v.effectiveStatus} />
                      </div>
                      <h3 className="mt-1.5 font-semibold text-white">{v.title}</h3>
                      {v.description && <p className="text-xs text-gray-400">{v.description}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-amber-300">
                        {v.discountType === 'PERCENTAGE'
                          ? `${v.discountValue}%`
                          : formatMoney(v.discountValue)}
                      </p>
                      <p className="text-[11px] text-gray-400">Min {formatMoney(v.minSpend)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 border-t border-white/10 pt-2.5">
                    <div>
                      Quota: <strong className="text-gray-200">{v.usedQuota}/{v.totalQuota}</strong> ({v.claimedCount} claims)
                    </div>
                    <div className="text-right">
                      Ends: <strong className="text-gray-200">{formatShortDateTime(v.endTime)}</strong>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-end gap-2 border-t border-white/10 pt-2.5">
                    <Button
                      variant="secondary"
                      size="sm"
                      isLoading={togglingId === v.id}
                      onClick={() => void handleToggleStatus(v)}
                      aria-label={`${v.isActive ? 'Disable' : 'Enable'} ${v.code}`}
                    >
                      {v.isActive ? 'Disable' : 'Enable'}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openEditModal(v)}
                      aria-label={`Edit ${v.code}`}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setVoucherToDelete(v)}
                      aria-label={`Delete ${v.code}`}
                    >
                      Delete
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Create / Edit Voucher Modal */}
      <Modal
        isOpen={editorOpen}
        onClose={closeEditor}
        title={editingVoucher ? `Edit voucher · ${editingVoucher.code}` : 'Create discount voucher'}
        mobileSheet
        className="md:max-w-3xl"
      >
        <form onSubmit={handleSubmitForm} className="space-y-5">
          {/* Live Preview */}
          <div className="rounded-xl border border-white/10 bg-bg-base/70 p-3.5">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Live Buyer Ticket Preview
            </p>
            <VoucherTicket voucher={previewVoucher} mode="preview" />
          </div>

          {formError && (
            <p role="alert" className="rounded-xl border border-status-danger/30 bg-status-danger/10 px-3.5 py-2.5 text-sm text-red-200">
              {formError}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="voucher-code" className="block text-xs font-semibold text-gray-300">
                Voucher code *
              </label>
              <input
                id="voucher-code"
                required
                maxLength={50}
                value={form.code}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    code: e.target.value.replace(/\s+/g, '').toUpperCase(),
                  }))
                }
                placeholder="e.g. MYTHIX50"
                aria-invalid={Boolean(fieldErrors.code)}
                className="mt-1.5 w-full rounded-lg border border-white/10 bg-bg-input px-3 py-2.5 font-mono text-sm text-white uppercase focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
              {fieldErrors.code ? (
                <p className="mt-1 text-xs text-status-danger">{fieldErrors.code}</p>
              ) : (
                <p className="mt-1 text-[11px] text-gray-400">Letters A-Z, digits 0-9, hyphens or underscores.</p>
              )}
            </div>

            <div>
              <label htmlFor="voucher-discount-type" className="block text-xs font-semibold text-gray-300">
                Discount type *
              </label>
              <select
                id="voucher-discount-type"
                value={form.discountType}
                onChange={(e) => {
                  const nextType = e.target.value as DiscountType;
                  setForm((f) => ({
                    ...f,
                    discountType: nextType,
                    maxDiscountAmount: nextType === 'FIXED_AMOUNT' ? '' : f.maxDiscountAmount,
                  }));
                }}
                className="mt-1.5 w-full rounded-lg border border-white/10 bg-bg-input px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                <option value="FIXED_AMOUNT">Fixed amount (฿)</option>
                <option value="PERCENTAGE">Percentage (%)</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="voucher-title" className="block text-xs font-semibold text-gray-300">
              Title *
            </label>
            <input
              id="voucher-title"
              required
              maxLength={255}
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. ส่วนลดพิเศษ ฿50"
              aria-invalid={Boolean(fieldErrors.title)}
              className="mt-1.5 w-full rounded-lg border border-white/10 bg-bg-input px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
            {fieldErrors.title && <p className="mt-1 text-xs text-status-danger">{fieldErrors.title}</p>}
          </div>

          <div>
            <label htmlFor="voucher-description" className="block text-xs font-semibold text-gray-300">
              Description
            </label>
            <textarea
              id="voucher-description"
              rows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="e.g. ลดทันที 50 บาท เมื่อช้อปการ์ดครบ 500 บาท"
              className="mt-1.5 w-full rounded-lg border border-white/10 bg-bg-input px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="voucher-discount-value" className="block text-xs font-semibold text-gray-300">
                {form.discountType === 'PERCENTAGE' ? 'Discount (%) *' : 'Discount (฿) *'}
              </label>
              <input
                id="voucher-discount-value"
                type="number"
                step="0.01"
                min="0.01"
                max={form.discountType === 'PERCENTAGE' ? '100' : undefined}
                required
                value={form.discountValue}
                onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
                aria-invalid={Boolean(fieldErrors.discountValue)}
                className="mt-1.5 w-full rounded-lg border border-white/10 bg-bg-input px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
              {fieldErrors.discountValue && (
                <p className="mt-1 text-xs text-status-danger">{fieldErrors.discountValue}</p>
              )}
            </div>

            <div>
              <label htmlFor="voucher-max-discount" className="block text-xs font-semibold text-gray-300">
                Max discount cap (฿)
              </label>
              <input
                id="voucher-max-discount"
                type="number"
                step="0.01"
                min="0"
                disabled={form.discountType === 'FIXED_AMOUNT'}
                value={form.discountType === 'FIXED_AMOUNT' ? '' : form.maxDiscountAmount}
                onChange={(e) => setForm((f) => ({ ...f, maxDiscountAmount: e.target.value }))}
                placeholder={form.discountType === 'FIXED_AMOUNT' ? 'N/A for fixed' : 'No limit'}
                aria-invalid={Boolean(fieldErrors.maxDiscountAmount)}
                className="mt-1.5 w-full rounded-lg border border-white/10 bg-bg-input px-3 py-2.5 text-sm text-white disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
              {fieldErrors.maxDiscountAmount && (
                <p className="mt-1 text-xs text-status-danger">{fieldErrors.maxDiscountAmount}</p>
              )}
            </div>

            <div>
              <label htmlFor="voucher-min-spend" className="block text-xs font-semibold text-gray-300">
                Min spend (฿)
              </label>
              <input
                id="voucher-min-spend"
                type="number"
                step="0.01"
                min="0"
                value={form.minSpend}
                onChange={(e) => setForm((f) => ({ ...f, minSpend: e.target.value }))}
                aria-invalid={Boolean(fieldErrors.minSpend)}
                className="mt-1.5 w-full rounded-lg border border-white/10 bg-bg-input px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
              {fieldErrors.minSpend && <p className="mt-1 text-xs text-status-danger">{fieldErrors.minSpend}</p>}
            </div>

            <div>
              <label htmlFor="voucher-total-quota" className="block text-xs font-semibold text-gray-300">
                Total quota *
              </label>
              <input
                id="voucher-total-quota"
                type="number"
                step="1"
                min={editingVoucher ? Math.max(1, editingVoucher.usedQuota) : 1}
                required
                value={form.totalQuota}
                onChange={(e) => setForm((f) => ({ ...f, totalQuota: e.target.value }))}
                aria-invalid={Boolean(fieldErrors.totalQuota)}
                className="mt-1.5 w-full rounded-lg border border-white/10 bg-bg-input px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
              {editingVoucher && (
                <p className="mt-1 text-[11px] text-gray-400">
                  Already redeemed: {editingVoucher.usedQuota}
                </p>
              )}
              {fieldErrors.totalQuota && (
                <p className="mt-1 text-xs text-status-danger">{fieldErrors.totalQuota}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="voucher-start-time" className="block text-xs font-semibold text-gray-300">
                Start date &amp; time *
              </label>
              <input
                id="voucher-start-time"
                type="datetime-local"
                required
                value={form.startTime}
                onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                aria-invalid={Boolean(fieldErrors.startTime)}
                className="mt-1.5 w-full rounded-lg border border-white/10 bg-bg-input px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
              {fieldErrors.startTime && <p className="mt-1 text-xs text-status-danger">{fieldErrors.startTime}</p>}
            </div>

            <div>
              <label htmlFor="voucher-end-time" className="block text-xs font-semibold text-gray-300">
                End date &amp; time *
              </label>
              <input
                id="voucher-end-time"
                type="datetime-local"
                required
                value={form.endTime}
                onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                aria-invalid={Boolean(fieldErrors.endTime)}
                className="mt-1.5 w-full rounded-lg border border-white/10 bg-bg-input px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
              {fieldErrors.endTime && <p className="mt-1 text-xs text-status-danger">{fieldErrors.endTime}</p>}
            </div>
          </div>

          <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.03] p-3 text-sm text-gray-200 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="size-4 rounded border-white/20 bg-bg-input accent-brand-blue"
            />
            <span>
              <strong className="text-white">Active campaign</strong>
              <span className="block text-xs text-gray-400">
                When enabled and within the start/end schedule, buyers see and can claim/use this voucher immediately.
              </span>
            </span>
          </label>

          <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
            <Button type="button" variant="secondary" disabled={submitting} onClick={closeEditor}>
              Cancel
            </Button>
            <Button type="submit" isLoading={submitting} disabled={submitting}>
              {editingVoucher ? 'Save changes' : 'Create voucher'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(voucherToDelete)}
        onClose={() => {
          if (!deleting) setVoucherToDelete(null);
        }}
        title="Delete discount voucher"
        mobileSheet
      >
        {voucherToDelete && (
          <div className="space-y-4">
            <p className="text-sm text-gray-300">
              Are you sure you want to permanently delete{' '}
              <span className="font-mono font-bold text-white">{voucherToDelete.code}</span> (
              <span className="text-gray-200">{voucherToDelete.title}</span>)?
            </p>

            <div className="rounded-xl border border-status-warning/30 bg-status-warning/10 p-3 text-xs text-amber-100 space-y-1">
              <p>
                • Wallet impact: <strong>{voucherToDelete.claimedCount}</strong> buyer wallet claim(s) will be removed immediately.
              </p>
              <p>
                • Order history: <strong>{voucherToDelete.usedOrdersCount}</strong> existing order(s) will keep their code &amp; discount snapshot safely intact.
              </p>
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2.5">
              <Button
                type="button"
                variant="secondary"
                disabled={deleting}
                onClick={() => setVoucherToDelete(null)}
              >
                Cancel
              </Button>
              {voucherToDelete.isActive && (
                <Button
                  type="button"
                  variant="gold"
                  disabled={deleting}
                  onClick={() => {
                    const target = voucherToDelete;
                    setVoucherToDelete(null);
                    void handleToggleStatus(target);
                  }}
                >
                  Pause instead
                </Button>
              )}
              <Button
                type="button"
                variant="danger"
                isLoading={deleting}
                disabled={deleting}
                onClick={() => void handleConfirmDelete()}
              >
                Delete permanently
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}
