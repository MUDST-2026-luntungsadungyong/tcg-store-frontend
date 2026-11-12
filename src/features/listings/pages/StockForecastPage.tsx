import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Calculator,
  CheckCircle2,
  Clock,
  Download,
  Info,
  Package,
  PackageX,
  RefreshCw,
  ShieldAlert,
  TrendingDown,
} from 'lucide-react';

import {
  stockForecastApi,
  StockForecastError,
  toStockForecastError,
  validateForecastQuery,
  type ForecastMethod,
  type ForecastUrgency,
  type ForecastUrgencyFilter,
  type StockForecastItem,
  type StockForecastQuery,
  type StockForecastResponse,
} from '@/features/listings/api/stockForecast';
import { Badge, type BadgeProps } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { ButtonLink } from '@/shared/components/ButtonLink';
import { ErrorState } from '@/shared/components/ErrorState';
import { Input } from '@/shared/components/Input';
import { Modal } from '@/shared/components/Modal';
import { PageContainer, PageHeader, Panel, Toolbar } from '@/shared/components/PageLayout';
import { SearchField } from '@/shared/components/SearchField';
import { Select } from '@/shared/components/Select';
import { Skeleton } from '@/shared/components/Skeleton';
import { useToastStore } from '@/shared/model/useToastStore';

const WINDOW_OPTIONS = [
  { value: '7', label: 'Last 7 days' },
  { value: '14', label: 'Last 14 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '60', label: 'Last 60 days' },
  { value: '90', label: 'Last 90 days' },
];

const METHOD_OPTIONS = [
  { value: 'WEIGHTED', label: 'Weighted Moving Avg (Recent-biased)' },
  { value: 'SIMPLE', label: 'Simple Moving Avg' },
];

const URGENCY_OPTIONS = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'OUT_OF_STOCK', label: 'Out of stock' },
  { value: 'CRITICAL', label: 'Critical (Order now)' },
  { value: 'LOW', label: 'Low stock (Warning)' },
  { value: 'SAFE', label: 'Healthy' },
  { value: 'NO_RECENT_SALES', label: 'No recent sales' },
];

const URGENCY_META: Record<
  ForecastUrgency,
  { label: string; variant: BadgeProps['variant']; description: string }
> = {
  OUT_OF_STOCK: {
    label: 'Out of stock',
    variant: 'danger',
    description: 'Available stock is 0.',
  },
  CRITICAL: {
    label: 'Critical',
    variant: 'danger',
    description: 'Expected to run out before restock lead time.',
  },
  LOW: {
    label: 'Low stock',
    variant: 'warning',
    description: 'Within lead time + safety stock buffer.',
  },
  SAFE: {
    label: 'Healthy',
    variant: 'success',
    description: 'Sufficient stock beyond reorder point.',
  },
  NO_RECENT_SALES: {
    label: 'No sales',
    variant: 'default',
    description: 'No direct sales recorded in the selected window.',
  },
};

function sanitizeCsvCell(value: string | number | null | undefined): string {
  const raw = value === null || value === undefined ? '' : String(value);
  const formulaSafe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${formulaSafe.replaceAll('"', '""')}"`;
}

function formatDateDisplay(isoDate: string | null): string {
  if (!isoDate) return '—';
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function parseIntField(raw: string): number {
  if (!/^\d+$/.test(raw.trim())) return Number.NaN;
  return Number(raw.trim());
}

export function StockForecastPage() {
  const addToast = useToastStore((s) => s.addToast);

  const [windowDays, setWindowDays] = useState<number>(30);
  const [method, setMethod] = useState<ForecastMethod>('WEIGHTED');
  const [leadTimeInput, setLeadTimeInput] = useState('7');
  const [safetyDaysInput, setSafetyDaysInput] = useState('3');
  const [targetCoverInput, setTargetCoverInput] = useState('30');
  const [includeHidden, setIncludeHidden] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [debouncedLeadTime, setDebouncedLeadTime] = useState('7');
  const [debouncedSafetyDays, setDebouncedSafetyDays] = useState('3');
  const [debouncedTargetCover, setDebouncedTargetCover] = useState('30');
  const [urgencyFilter, setUrgencyFilter] = useState<ForecastUrgencyFilter>('ALL');

  const [data, setData] = useState<StockForecastResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<StockForecastError | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [selectedFormulaItem, setSelectedFormulaItem] = useState<StockForecastItem | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput);
      setDebouncedLeadTime(leadTimeInput);
      setDebouncedSafetyDays(safetyDaysInput);
      setDebouncedTargetCover(targetCoverInput);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [leadTimeInput, safetyDaysInput, searchInput, targetCoverInput]);

  const liveNumericQuery = useMemo<StockForecastQuery>(() => {
    return {
      windowDays,
      method,
      leadTimeDays: parseIntField(leadTimeInput),
      safetyDays: parseIntField(safetyDaysInput),
      targetCoverDays: parseIntField(targetCoverInput),
      includeHidden,
      search: searchInput,
      urgency: urgencyFilter,
    };
  }, [
    includeHidden,
    leadTimeInput,
    method,
    safetyDaysInput,
    searchInput,
    targetCoverInput,
    urgencyFilter,
    windowDays,
  ]);

  const parsedQuery = useMemo<StockForecastQuery>(() => {
    return {
      windowDays,
      method,
      leadTimeDays: parseIntField(debouncedLeadTime),
      safetyDays: parseIntField(debouncedSafetyDays),
      targetCoverDays: parseIntField(debouncedTargetCover),
      includeHidden,
      search: debouncedSearch,
      urgency: urgencyFilter,
    };
  }, [
    debouncedLeadTime,
    debouncedSafetyDays,
    debouncedSearch,
    debouncedTargetCover,
    includeHidden,
    method,
    urgencyFilter,
    windowDays,
  ]);

  const clientFieldErrors = useMemo(
    () => validateForecastQuery(liveNumericQuery),
    [liveNumericQuery],
  );
  const hasValidationErrors = Object.keys(clientFieldErrors).length > 0;

  const loadForecast = useCallback(
    async (queryToRun: StockForecastQuery) => {
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoading(true);
      setRefreshError(null);

      try {
        const result = await stockForecastApi.getForecast(queryToRun, controller.signal);
        if (controller.signal.aborted) return;
        setData(result);
        setError(null);
      } catch (err) {
        const forecastErr = toStockForecastError(err);
        if (forecastErr.code === 'CANCELLED' || controller.signal.aborted) {
          return;
        }
        setData((currentData) => {
          if (currentData) {
            setRefreshError(forecastErr.message);
            addToast({
              type: 'error',
              title: 'Could not refresh stock forecast',
              message: forecastErr.message,
            });
          } else {
            setError(forecastErr);
          }
          return currentData;
        });
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [addToast],
  );

  useEffect(() => {
    if (Object.keys(validateForecastQuery(parsedQuery)).length > 0) {
      setIsLoading(false);
      return;
    }
    void loadForecast(parsedQuery);
    return () => abortControllerRef.current?.abort();
  }, [loadForecast, parsedQuery, reloadNonce]);

  const handleResetFilters = () => {
    setWindowDays(30);
    setMethod('WEIGHTED');
    setLeadTimeInput('7');
    setSafetyDaysInput('3');
    setTargetCoverInput('30');
    setDebouncedLeadTime('7');
    setDebouncedSafetyDays('3');
    setDebouncedTargetCover('30');
    setIncludeHidden(false);
    setSearchInput('');
    setDebouncedSearch('');
    setUrgencyFilter('ALL');
  };

  const handleExportCsv = () => {
    if (!data || data.items.length === 0) return;

    const headers = [
      'Product ID',
      'Card Name',
      'Set',
      'Condition',
      'Language',
      'Status',
      'On Hand',
      'Reserved',
      'Auction Reserved',
      'Available Stock',
      `Sold (${data.windowDays}d)`,
      'Daily Sales Rate',
      'Days Until Stockout',
      'Est. Stockout Date',
      'Reorder Point',
      'Suggested Restock Qty',
      'Urgency',
    ];

    const rows = data.items.map((item) =>
      [
        item.productId,
        item.name,
        item.set ?? '',
        item.condition ?? '',
        item.language ?? '',
        item.status,
        item.onHand,
        item.reserved,
        item.auctionReserved,
        item.availableStock,
        item.soldInWindow,
        item.dailySalesRate.toFixed(2),
        item.daysUntilStockout ?? 'N/A',
        item.estimatedStockoutDate ?? 'N/A',
        item.reorderPoint,
        item.suggestedRestockQty,
        item.urgencyStatus,
      ]
        .map(sanitizeCsvCell)
        .join(','),
    );

    const csv = `\uFEFF${[headers.map(sanitizeCsvCell).join(','), ...rows].join('\r\n')}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mythix-stock-forecast-${data.generatedAt}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addToast({
      type: 'success',
      title: 'Exported CSV',
      message: `Exported ${data.items.length} SKU forecast row(s).`,
    });
  };

  const summary = data?.summary;
  const items = data?.items ?? [];
  const hasAnyInventory = (summary?.totalSkus ?? 0) > 0;

  if (error?.code === 'FORBIDDEN') {
    return (
      <PageContainer className="space-y-6 px-0 py-0 sm:px-0 lg:px-0">
        <PageHeader
          title="Stockout Forecast"
          eyebrow="Seller Inventory"
          description="Predict when your cards will run out based on recent direct sales velocity."
        />
        <Panel className="flex flex-col items-center gap-4 py-12 text-center">
          <ShieldAlert className="h-10 w-10 text-status-warning" />
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-white">Seller verification required</h2>
            <p className="max-w-md text-sm text-gray-400">{error.message}</p>
          </div>
          <ButtonLink to="/apply-seller" variant="primary">
            Go to Seller Application
          </ButtonLink>
        </Panel>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="space-y-6 px-0 py-0 sm:px-0 lg:px-0">
      <PageHeader
        title="Stockout Forecast"
        eyebrow="Inventory Planning"
        description="Estimate when each card listing will run out using Moving Average sales velocity and reorder lead times."
        actions={
          <>
            <ButtonLink to="/workspace/listings" variant="secondary">
              Manage Listings
            </ButtonLink>
            <Button
              type="button"
              variant="secondary"
              className="gap-2"
              disabled={!data || items.length === 0}
              onClick={handleExportCsv}
            >
              <Download size={16} />
              Export CSV
            </Button>
            <Button
              type="button"
              variant="primary"
              className="gap-2"
              disabled={isLoading || hasValidationErrors}
              onClick={() => setReloadNonce((n) => n + 1)}
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              Refresh
            </Button>
          </>
        }
      />

      {refreshError && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 rounded-xl border border-status-danger/30 bg-status-danger/10 p-4 text-sm text-gray-200"
        >
          <AlertTriangle className="shrink-0 text-status-danger" size={18} />
          <span className="flex-1">{refreshError} (Showing previous forecast data.)</span>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={isLoading || hasValidationErrors}
            onClick={() => setReloadNonce((n) => n + 1)}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <section aria-label="Stock urgency summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <button
          type="button"
          aria-pressed={urgencyFilter === 'OUT_OF_STOCK'}
          onClick={() =>
            setUrgencyFilter((current) => (current === 'OUT_OF_STOCK' ? 'ALL' : 'OUT_OF_STOCK'))
          }
          className={`rounded-2xl border p-4 text-left transition-colors ${
            urgencyFilter === 'OUT_OF_STOCK'
              ? 'border-status-danger bg-status-danger/15'
              : 'border-white/10 bg-bg-card hover:border-white/25'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Out of Stock
            </span>
            <PackageX size={18} className="text-status-danger" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">
            {summary ? summary.outOfStockCount : '—'}
          </p>
          <p className="mt-1 text-xs text-gray-400">0 available units</p>
        </button>

        <button
          type="button"
          aria-pressed={urgencyFilter === 'CRITICAL'}
          onClick={() =>
            setUrgencyFilter((current) => (current === 'CRITICAL' ? 'ALL' : 'CRITICAL'))
          }
          className={`rounded-2xl border p-4 text-left transition-colors ${
            urgencyFilter === 'CRITICAL'
              ? 'border-status-danger bg-status-danger/15'
              : 'border-white/10 bg-bg-card hover:border-white/25'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Critical
            </span>
            <TrendingDown size={18} className="text-status-danger" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">
            {summary ? summary.criticalCount : '—'}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            ≤ {Number.isInteger(parsedQuery.leadTimeDays) ? parsedQuery.leadTimeDays : 7}d lead time
          </p>
        </button>

        <button
          type="button"
          aria-pressed={urgencyFilter === 'LOW'}
          onClick={() => setUrgencyFilter((current) => (current === 'LOW' ? 'ALL' : 'LOW'))}
          className={`rounded-2xl border p-4 text-left transition-colors ${
            urgencyFilter === 'LOW'
              ? 'border-status-warning bg-status-warning/15'
              : 'border-white/10 bg-bg-card hover:border-white/25'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Low Stock
            </span>
            <Clock size={18} className="text-status-warning" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">
            {summary ? summary.lowCount : '—'}
          </p>
          <p className="mt-1 text-xs text-gray-400">Reached reorder point</p>
        </button>

        <button
          type="button"
          aria-pressed={urgencyFilter === 'SAFE'}
          onClick={() => setUrgencyFilter((current) => (current === 'SAFE' ? 'ALL' : 'SAFE'))}
          className={`rounded-2xl border p-4 text-left transition-colors ${
            urgencyFilter === 'SAFE'
              ? 'border-status-success bg-status-success/15'
              : 'border-white/10 bg-bg-card hover:border-white/25'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Healthy
            </span>
            <CheckCircle2 size={18} className="text-status-success" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">
            {summary ? summary.safeCount : '—'}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {summary ? `${summary.noRecentSalesCount} with no recent sales` : 'Buffer sufficient'}
          </p>
        </button>
      </section>

      {/* Parameters & Filter Panel */}
      <Panel className="space-y-4">
        <Toolbar className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div className="md:col-span-2 lg:col-span-1">
            <label className="mb-1 block text-sm font-medium text-gray-300" htmlFor="forecast-search">
              Search cards
            </label>
            <SearchField
              id="forecast-search"
              aria-label="Search stock forecast"
              placeholder="Card name, set, rarity..."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>

          <Select
            label="Sales window"
            value={String(windowDays)}
            options={WINDOW_OPTIONS}
            onChange={(event) => setWindowDays(Number(event.target.value))}
          />

          <Select
            label="Calculation method"
            value={method}
            options={METHOD_OPTIONS}
            onChange={(event) => setMethod(event.target.value as ForecastMethod)}
          />

          <Select
            label="Urgency status"
            value={urgencyFilter}
            options={URGENCY_OPTIONS}
            onChange={(event) => setUrgencyFilter(event.target.value as ForecastUrgencyFilter)}
          />
        </Toolbar>

        <div className="grid grid-cols-1 gap-3 border-t border-white/10 pt-4 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            label="Restock lead time (days)"
            type="number"
            min={0}
            max={180}
            step={1}
            value={leadTimeInput}
            error={clientFieldErrors.leadTimeDays}
            onChange={(event) => setLeadTimeInput(event.target.value)}
          />
          <Input
            label="Safety buffer (days)"
            type="number"
            min={0}
            max={90}
            step={1}
            value={safetyDaysInput}
            error={clientFieldErrors.safetyDays}
            onChange={(event) => setSafetyDaysInput(event.target.value)}
          />
          <Input
            label="Target stock cover (days)"
            type="number"
            min={1}
            max={365}
            step={1}
            value={targetCoverInput}
            error={clientFieldErrors.targetCoverDays}
            onChange={(event) => setTargetCoverInput(event.target.value)}
          />
          <div className="flex items-end pb-2">
            <label className="inline-flex cursor-pointer items-center gap-2.5 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={includeHidden}
                onChange={(event) => setIncludeHidden(event.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-bg-input text-brand-blue focus:ring-brand-blue"
              />
              Include hidden listings
            </label>
          </div>
        </div>
      </Panel>

      {/* Main Forecast Content */}
      {error && !data ? (
        <ErrorState message={error.message} onRetry={() => setReloadNonce((n) => n + 1)} />
      ) : isLoading && !data ? (
        <Panel className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </Panel>
      ) : !hasAnyInventory ? (
        <Panel className="flex flex-col items-center gap-3 py-14 text-center">
          <Package className="h-10 w-10 text-gray-500" />
          <h2 className="text-lg font-semibold text-white">No inventory listings yet</h2>
          <p className="max-w-md text-sm text-gray-400">
            Add cards to your seller inventory to track available stock and predict stockout dates.
          </p>
          <ButtonLink to="/workspace/listings" variant="primary">
            Add First Listing
          </ButtonLink>
        </Panel>
      ) : items.length === 0 ? (
        <Panel className="flex flex-col items-center gap-3 py-14 text-center">
          <Package className="h-10 w-10 text-gray-500" />
          <h2 className="text-lg font-semibold text-white">No matching listings</h2>
          <p className="max-w-md text-sm text-gray-400">
            No cards matched the current search or urgency filter.
          </p>
          <Button type="button" variant="secondary" onClick={handleResetFilters}>
            Reset Filters
          </Button>
        </Panel>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-bg-surface">
          {/* Desktop Table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-bg-card text-xs uppercase tracking-wider text-gray-400">
                  <th className="px-5 py-3.5 font-semibold">Card</th>
                  <th className="px-4 py-3.5 text-right font-semibold">Available</th>
                  <th className="px-4 py-3.5 text-right font-semibold">
                    Sold ({data?.windowDays ?? windowDays}d)
                  </th>
                  <th className="px-4 py-3.5 text-right font-semibold">Avg / Day</th>
                  <th className="px-4 py-3.5 text-right font-semibold">Est. Stockout</th>
                  <th className="px-4 py-3.5 text-right font-semibold">Reorder / Restock</th>
                  <th className="px-4 py-3.5 font-semibold">Urgency</th>
                  <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {items.map((item) => {
                  const meta = URGENCY_META[item.urgencyStatus];
                  const hasHolds = item.reserved > 0 || item.auctionReserved > 0;
                  return (
                    <tr key={item.productId} className="transition-colors hover:bg-white/[0.02]">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-14 w-10 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-bg-card">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-gray-600">
                                <Package size={16} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="max-w-[220px] truncate font-semibold text-white">
                                {item.name}
                              </p>
                              {item.status === 'HIDE' && (
                                <Badge variant="default">Hidden</Badge>
                              )}
                            </div>
                            <p className="mt-0.5 text-xs text-gray-400">
                              {[item.condition, item.language, item.set].filter(Boolean).join(' • ')}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-right">
                        <span
                          className={`text-base font-bold ${
                            item.availableStock === 0 ? 'text-status-danger' : 'text-white'
                          }`}
                        >
                          {item.availableStock}
                        </span>
                        {hasHolds && (
                          <p className="mt-0.5 text-xs text-gray-400">
                            On hand {item.onHand} (Hold {item.reserved + item.auctionReserved})
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-4 text-right text-gray-300">{item.soldInWindow}</td>

                      <td className="px-4 py-4 text-right font-medium text-white">
                        {item.dailySalesRate.toFixed(2)}
                      </td>

                      <td className="px-4 py-4 text-right">
                        {item.daysUntilStockout === null ? (
                          <span className="text-xs text-gray-400">No recent sales</span>
                        ) : (
                          <>
                            <p
                              className={`font-semibold ${
                                item.urgencyStatus === 'OUT_OF_STOCK' ||
                                item.urgencyStatus === 'CRITICAL'
                                  ? 'text-status-danger'
                                  : item.urgencyStatus === 'LOW'
                                    ? 'text-status-warning'
                                    : 'text-white'
                              }`}
                            >
                              {item.daysUntilStockout === 0
                                ? 'Today (0 days)'
                                : `${item.daysUntilStockout} day(s)`}
                            </p>
                            <p className="mt-0.5 text-xs text-gray-400">
                              {formatDateDisplay(item.estimatedStockoutDate)}
                            </p>
                          </>
                        )}
                      </td>

                      <td className="px-4 py-4 text-right">
                        <p className="text-gray-200">ROP: {item.reorderPoint}</p>
                        {item.suggestedRestockQty > 0 && (
                          <p className="mt-0.5 text-xs font-medium text-brand-blue">
                            +{item.suggestedRestockQty} suggested
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <Badge variant={meta.variant} title={meta.description}>
                          {meta.label}
                        </Badge>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            aria-label={`Explain calculation for ${item.name}`}
                            onClick={() => setSelectedFormulaItem(item)}
                          >
                            <Calculator size={15} />
                          </Button>
                          <ButtonLink
                            size="sm"
                            variant="secondary"
                            to={`/workspace/listings?search=${encodeURIComponent(item.name)}`}
                          >
                            Manage
                          </ButtonLink>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout */}
          <div className="divide-y divide-white/10 md:hidden">
            {items.map((item) => {
              const meta = URGENCY_META[item.urgencyStatus];
              return (
                <div key={item.productId} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-9 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-bg-card">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gray-600">
                            <Package size={15} />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{item.name}</p>
                        <p className="text-xs text-gray-400">
                          {[item.condition, item.language, item.set].filter(Boolean).join(' • ')}
                        </p>
                      </div>
                    </div>
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 rounded-xl bg-bg-card p-3 text-xs">
                    <div>
                      <p className="text-gray-400">Available</p>
                      <p className="mt-0.5 text-sm font-bold text-white">{item.availableStock}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Avg / Day</p>
                      <p className="mt-0.5 text-sm font-bold text-white">
                        {item.dailySalesRate.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Est. Stockout</p>
                      <p className="mt-0.5 text-sm font-bold text-white">
                        {item.daysUntilStockout === null ? '—' : `${item.daysUntilStockout}d`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-400">
                      ROP: {item.reorderPoint}
                      {item.suggestedRestockQty > 0
                        ? ` • Restock +${item.suggestedRestockQty}`
                        : ''}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedFormulaItem(item)}
                      >
                        Formula
                      </Button>
                      <ButtonLink
                        size="sm"
                        variant="secondary"
                        to={`/workspace/listings?search=${encodeURIComponent(item.name)}`}
                      >
                        Manage
                      </ButtonLink>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Formula Breakdown Modal */}
      <Modal
        isOpen={Boolean(selectedFormulaItem)}
        onClose={() => setSelectedFormulaItem(null)}
        title={selectedFormulaItem ? `Forecast Formula: ${selectedFormulaItem.name}` : 'Forecast Formula'}
      >
        {selectedFormulaItem && (
          <div className="space-y-4 text-sm text-gray-300">
            <div className="rounded-xl border border-white/10 bg-bg-input p-4 space-y-2">
              <p className="font-semibold text-white">1. Available Stock</p>
              <p className="text-xs text-gray-400">
                On Hand ({selectedFormulaItem.onHand}) − Order Holds ({selectedFormulaItem.reserved}) − Auction Holds ({selectedFormulaItem.auctionReserved}) ={' '}
                <strong className="text-white">{selectedFormulaItem.availableStock} unit(s)</strong>
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-bg-input p-4 space-y-2">
              <p className="font-semibold text-white">
                2. Daily Sales Rate ({data?.method === 'SIMPLE' ? 'Simple Moving Avg' : 'Weighted Moving Avg'})
              </p>
              <p className="text-xs text-gray-400">
                Direct sales: 7d = {selectedFormulaItem.sold7Days}, 14d = {selectedFormulaItem.sold14Days},{' '}
                {data?.windowDays ?? windowDays}d = {selectedFormulaItem.soldInWindow} →{' '}
                <strong className="text-white">{selectedFormulaItem.dailySalesRate.toFixed(2)} units/day</strong>
              </p>
              {data?.method !== 'SIMPLE' && (data?.windowDays ?? windowDays) >= 30 && (
                <p className="text-xs text-gray-500">
                  Weights: 50% (7-day rate) + 30% (14-day rate) + 20% ({data?.windowDays ?? windowDays}-day rate)
                </p>
              )}
            </div>

            <div className="rounded-xl border border-white/10 bg-bg-input p-4 space-y-2">
              <p className="font-semibold text-white">3. Stockout & Reorder Point</p>
              {selectedFormulaItem.daysUntilStockout === null ? (
                <p className="flex items-center gap-2 text-xs text-gray-400">
                  <Info size={14} className="shrink-0 text-brand-blue" />
                  Cannot divide by 0 because there are no recent direct sales in this window.
                </p>
              ) : (
                <p className="text-xs text-gray-400">
                  floor({selectedFormulaItem.availableStock} ÷ {selectedFormulaItem.dailySalesRate.toFixed(2)}) ={' '}
                  <strong className="text-white">{selectedFormulaItem.daysUntilStockout} day(s)</strong> (Est.{' '}
                  {formatDateDisplay(selectedFormulaItem.estimatedStockoutDate)})
                </p>
              )}
              <p className="text-xs text-gray-400">
                Reorder Point = ceil({selectedFormulaItem.dailySalesRate.toFixed(2)} × ({data?.leadTimeDays ?? 7} + {data?.safetyDays ?? 3})) ={' '}
                <strong className="text-white">{selectedFormulaItem.reorderPoint} unit(s)</strong>
              </p>
              <p className="text-xs text-gray-400">
                Suggested Restock (for {data?.targetCoverDays ?? 30}d cover) ={' '}
                <strong className="text-brand-blue">+{selectedFormulaItem.suggestedRestockQty} unit(s)</strong>
              </p>
            </div>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}
