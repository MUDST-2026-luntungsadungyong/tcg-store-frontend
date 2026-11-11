import { useCallback, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Calculator,
  CheckCircle2,
  Coins,
  Gavel,
  Percent,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { getStoredAccessToken } from '@/shared/api/authStorage';
import { Button } from '@/shared/components/Button';
import { PageContainer, PageHeader, Panel } from '@/shared/components/PageLayout';
import { ENV } from '@/shared/config/env';
import { cn } from '@/shared/lib';
import { useToastStore } from '@/shared/model/useToastStore';
import {
  auctionCommissionApi,
  auctionError,
  type AuctionCommissionPolicy,
} from '../api/auctions';
import { money } from '../model/auctionFormat';
import { useAuctionResource } from '../model/useAuctionResource';

const MOCK_COMMISSION_STORAGE_KEY = 'mythix_mock_auction_commission_policy';
const DEFAULT_COMMISSION_POLICY: AuctionCommissionPolicy = {
  rate: 0.05,
  minimumFee: 20,
};

function canUseMockCommissionFallback(): boolean {
  if (import.meta.env.MODE === 'test') return false;
  return Boolean(ENV.ENABLE_MOCK_API || getStoredAccessToken()?.startsWith('mock-'));
}

function readLocalMockCommissionPolicy(): AuctionCommissionPolicy {
  try {
    const raw = localStorage.getItem(MOCK_COMMISSION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AuctionCommissionPolicy>;
      const rate = Number(parsed.rate);
      const minimumFee = Number(parsed.minimumFee);
      if (
        Number.isFinite(rate) &&
        rate >= 0 &&
        rate <= 1 &&
        Number.isFinite(minimumFee) &&
        minimumFee >= 0
      ) {
        return { rate, minimumFee };
      }
    }
  } catch {
    // Ignore storage read errors
  }
  return DEFAULT_COMMISSION_POLICY;
}

function writeLocalMockCommissionPolicy(policy: AuctionCommissionPolicy): AuctionCommissionPolicy {
  try {
    localStorage.setItem(MOCK_COMMISSION_STORAGE_KEY, JSON.stringify(policy));
  } catch {
    // Ignore storage write errors
  }
  return policy;
}

const RATE_PRESETS = [
  { label: '3%', value: '3', tag: 'Promo' },
  { label: '5%', value: '5', tag: 'Standard' },
  { label: '7.5%', value: '7.5', tag: 'Premium' },
  { label: '10%', value: '10', tag: 'High-Value' },
] as const;

const SAMPLE_BIDS = [200, 500, 1000, 5000] as const;

function CommissionPolicyWorkspace({
  data,
  onPolicySaved,
}: {
  data: AuctionCommissionPolicy;
  onPolicySaved: (updated: AuctionCommissionPolicy) => void;
}) {
  const { addToast } = useToastStore();

  const initialPercent = String(Number((data.rate * 100).toFixed(2)));
  const initialMinFee = String(data.minimumFee);

  const [percentInput, setPercentInput] = useState(initialPercent);
  const [minimumFeeInput, setMinimumFeeInput] = useState(initialMinFee);
  const [sampleBidInput, setSampleBidInput] = useState('1000');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [failure, setFailure] = useState('');

  const activePercent = useMemo(() => Number((data.rate * 100).toFixed(2)), [data.rate]);
  const activeMinFee = useMemo(() => Number(data.minimumFee), [data.minimumFee]);

  const draftPercent = useMemo(() => {
    const parsed = Number(percentInput);
    return Number.isFinite(parsed) && parsed >= 0 ? Math.min(100, parsed) : 0;
  }, [percentInput]);

  const draftMinFee = useMemo(() => {
    const parsed = Number(minimumFeeInput);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  }, [minimumFeeInput]);

  const breakEvenBid = useMemo(() => {
    const rateFraction = draftPercent / 100;
    if (rateFraction <= 0 || draftMinFee <= 0) return 0;
    return Math.ceil((draftMinFee / rateFraction) * 100) / 100;
  }, [draftMinFee, draftPercent]);

  const simulation = useMemo(() => {
    const bid = Math.max(0, Number(sampleBidInput) || 0);
    const rateFraction = draftPercent / 100;
    const rawPercentFee = Math.round(bid * rateFraction * 100) / 100;
    const appliedFee = bid <= 0 ? 0 : Math.min(bid, Math.max(rawPercentFee, draftMinFee));
    const sellerNet = Math.max(0, Math.round((bid - appliedFee) * 100) / 100);
    const usesMinimumFloor = bid > 0 && rawPercentFee < draftMinFee;

    return {
      bid,
      rawPercentFee,
      appliedFee,
      sellerNet,
      usesMinimumFloor,
    };
  }, [draftMinFee, draftPercent, sampleBidInput]);

  const handleResetDraft = () => {
    setPercentInput(initialPercent);
    setMinimumFeeInput(initialMinFee);
    setMessage('');
    setFailure('');
  };

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    setSaving(true);
    setFailure('');
    setMessage('');
    const percent = Number(fields.get('percent') ?? percentInput);
    const minimumFee = Number(fields.get('minimumFee') ?? minimumFeeInput);
    const nextPolicy: AuctionCommissionPolicy = {
      rate: Number((percent / 100).toFixed(4)),
      minimumFee,
    };
    try {
      let updated: AuctionCommissionPolicy;
      try {
        updated = await auctionCommissionApi.update(nextPolicy);
      } catch (err) {
        if (!canUseMockCommissionFallback()) throw err;
        updated = writeLocalMockCommissionPolicy(nextPolicy);
      }
      onPolicySaved(updated);
      setPercentInput(String(Number((updated.rate * 100).toFixed(2))));
      setMinimumFeeInput(String(updated.minimumFee));
      setMessage('Commission policy saved.');
      addToast({
        type: 'success',
        message: 'Auction commission policy updated.',
      });
    } catch (err) {
      setFailure(auctionError(err, 'Could not save the commission policy.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Summary KPI Cards — 2-col on mobile/tablet, 4-col on xl */}
      <section
        aria-label="Commission policy metrics"
        className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4"
      >
        <article className="min-w-0 rounded-2xl border border-white/10 bg-bg-surface p-3.5 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs sm:text-sm font-medium text-slate-400 break-words">
              Active commission rate
            </p>
            <Percent size={17} className="shrink-0 text-brand-gold" aria-hidden="true" />
          </div>
          <p className="mt-2 sm:mt-3 text-xl sm:text-3xl font-bold text-white tabular-nums break-words">
            {activePercent}%
          </p>
          <p className="mt-1 text-[11px] sm:text-xs text-slate-400">
            Deducted from final winning bid
          </p>
        </article>

        <article className="min-w-0 rounded-2xl border border-white/10 bg-bg-surface p-3.5 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs sm:text-sm font-medium text-slate-400 break-words">
              Minimum fee floor
            </p>
            <Coins size={17} className="shrink-0 text-brand-blue" aria-hidden="true" />
          </div>
          <p className="mt-2 sm:mt-3 text-xl sm:text-3xl font-bold text-white tabular-nums break-words">
            {money(activeMinFee)}
          </p>
          <p className="mt-1 text-[11px] sm:text-xs text-slate-400">
            Applied when % fee is below floor
          </p>
        </article>

        <article className="min-w-0 rounded-2xl border border-white/10 bg-bg-surface p-3.5 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs sm:text-sm font-medium text-slate-400 break-words">
              Floor break-even bid
            </p>
            <Calculator size={17} className="shrink-0 text-violet-300" aria-hidden="true" />
          </div>
          <p className="mt-2 sm:mt-3 text-xl sm:text-3xl font-bold text-white tabular-nums break-words">
            {breakEvenBid > 0 ? money(breakEvenBid) : '—'}
          </p>
          <p className="mt-1 text-[11px] sm:text-xs text-slate-400">
            Bids above this use the {draftPercent}% rate
          </p>
        </article>

        <article className="min-w-0 rounded-2xl border border-white/10 bg-bg-surface p-3.5 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs sm:text-sm font-medium text-slate-400 break-words">
              Settlement stage
            </p>
            <ShieldCheck size={17} className="shrink-0 text-status-success" aria-hidden="true" />
          </div>
          <p className="mt-2 sm:mt-3 text-lg sm:text-2xl font-bold text-white break-words">
            FULFILLED
          </p>
          <p className="mt-1 text-[11px] sm:text-xs text-slate-400">
            Snapshot locked at checkout &amp; payout
          </p>
        </article>
      </section>

      {/* Main Two-Column Workspace */}
      <div className="grid gap-5 sm:gap-6 lg:grid-cols-12">
        {/* Left Column: Policy Configuration Form */}
        <Panel className="min-w-0 lg:col-span-7 space-y-5 sm:space-y-6 bg-bg-surface p-4 sm:p-6">
          <div className="flex flex-col gap-2 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Gavel size={18} className="shrink-0 text-brand-gold" aria-hidden="true" />
                <span className="break-words">Commission Policy Configuration</span>
              </h2>
              <p className="mt-1 text-xs text-gray-400">
                Set the platform fee rate and minimum THB deduction for completed auctions.
              </p>
            </div>
            <span className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-lg border border-brand-gold/30 bg-brand-gold/10 px-2.5 py-1 text-xs font-semibold text-brand-gold">
              <Sparkles size={13} aria-hidden="true" />
              US-18-2 Policy Engine
            </span>
          </div>

          {/* Preset Rate Selector */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Quick rate presets
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {RATE_PRESETS.map((preset) => {
                const isSelected = Number(percentInput) === Number(preset.value);
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setPercentInput(preset.value)}
                    className={cn(
                      'flex flex-col items-start rounded-xl border px-3 py-2.5 text-left transition-all focus:outline-none focus:ring-2 focus:ring-brand-blue',
                      isSelected
                        ? 'border-brand-gold bg-brand-gold/15 text-white shadow-sm'
                        : 'border-white/10 bg-bg-elevated text-gray-300 hover:border-white/25 hover:text-white'
                    )}
                  >
                    <span className="text-sm sm:text-base font-bold tabular-nums">
                      {preset.label}
                    </span>
                    <span className="text-[11px] text-gray-400">{preset.tag}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <form className="space-y-5" onSubmit={save}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2 text-sm font-medium text-gray-200">
                <span>Commission rate (%)</span>
                <input
                  className="mt-1 block h-11 w-full rounded-xl border border-white/15 bg-bg-input px-3.5 py-2 text-base font-semibold text-white tabular-nums placeholder-gray-500 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  type="number"
                  name="percent"
                  value={percentInput}
                  onChange={(e) => setPercentInput(e.target.value)}
                  min="0"
                  max="100"
                  step="0.01"
                  required
                />
                <span className="block text-xs font-normal text-gray-400">
                  Allowed range: 0% to 100% (up to 2 decimal places).
                </span>
              </label>

              <label className="block space-y-2 text-sm font-medium text-gray-200">
                <span>Minimum fee (THB)</span>
                <input
                  className="mt-1 block h-11 w-full rounded-xl border border-white/15 bg-bg-input px-3.5 py-2 text-base font-semibold text-white tabular-nums placeholder-gray-500 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  type="number"
                  name="minimumFee"
                  value={minimumFeeInput}
                  onChange={(e) => setMinimumFeeInput(e.target.value)}
                  min="0"
                  max="9999999999.99"
                  step="0.01"
                  required
                />
                <span className="block text-xs font-normal text-gray-400">
                  Minimum THB fee charged when the percentage fee is lower.
                </span>
              </label>
            </div>

            {/* Formula Callout */}
            <div className="rounded-xl border border-white/10 bg-bg-elevated p-3.5 sm:p-4 text-xs text-gray-300 space-y-1.5">
              <p className="font-semibold text-white">Auto-Deduction Formula</p>
              <p className="font-mono text-[11px] text-brand-gold break-words">
                Fee = min(Winning Bid, max(Winning Bid × {draftPercent}%, {money(draftMinFee)}))
              </p>
              <p className="text-gray-400">
                Existing completed orders keep their historical fee snapshot. Updated rates apply
                immediately to new auction settlements.
              </p>
            </div>

            {message && (
              <p
                role="status"
                className="flex items-center gap-2 rounded-xl border border-status-success/30 bg-status-success/10 px-4 py-3 text-sm font-medium text-status-success"
              >
                <CheckCircle2 size={16} className="shrink-0" aria-hidden="true" />
                <span className="break-words">{message}</span>
              </p>
            )}

            {failure && (
              <p
                role="alert"
                className="flex items-center gap-2 rounded-xl border border-status-danger/40 bg-status-danger/10 px-4 py-3 text-sm font-medium text-red-200"
              >
                <AlertCircle
                  size={16}
                  className="shrink-0 text-status-danger"
                  aria-hidden="true"
                />
                <span className="break-words">{failure}</span>
              </p>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2.5 sm:gap-3 border-t border-white/10 pt-4">
              <Button
                type="button"
                variant="secondary"
                disabled={saving}
                onClick={handleResetDraft}
                className="flex-1 sm:flex-initial justify-center gap-1.5"
              >
                <RotateCcw size={15} aria-hidden="true" />
                Reset
              </Button>
              <Button
                type="submit"
                variant="gold"
                disabled={saving}
                isLoading={saving}
                className="flex-1 sm:flex-initial justify-center"
              >
                Save policy
              </Button>
            </div>
          </form>
        </Panel>

        {/* Right Column: Live Settlement Simulator */}
        <div className="min-w-0 lg:col-span-5 space-y-5 sm:space-y-6">
          <Panel className="space-y-4 bg-bg-surface p-4 sm:p-6">
            <div className="border-b border-white/10 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Calculator size={17} className="shrink-0 text-brand-blue" aria-hidden="true" />
                <span>Live Settlement Simulator</span>
              </h2>
              <p className="mt-1 text-xs text-gray-400">
                Preview how the configured policy affects seller payout on any winning bid.
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="sample-winning-bid"
                className="block text-xs font-semibold uppercase tracking-wider text-gray-400"
              >
                Sample winning bid (THB)
              </label>
              <input
                id="sample-winning-bid"
                type="number"
                min="0"
                step="50"
                value={sampleBidInput}
                onChange={(e) => setSampleBidInput(e.target.value)}
                className="block h-10 w-full rounded-xl border border-white/15 bg-bg-input px-3.5 text-sm font-semibold text-white tabular-nums focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
              <div className="grid grid-cols-2 gap-1.5 pt-1 sm:flex sm:flex-wrap">
                {SAMPLE_BIDS.map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => setSampleBidInput(String(sample))}
                    className={cn(
                      'rounded-lg border px-2.5 py-1.5 sm:py-1 text-xs font-medium tabular-nums transition text-center',
                      Number(sampleBidInput) === sample
                        ? 'border-brand-blue bg-brand-blue/20 text-brand-blue'
                        : 'border-white/10 bg-bg-elevated text-gray-400 hover:border-white/20 hover:text-white'
                    )}
                  >
                    {money(sample)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5 rounded-xl border border-white/10 bg-bg-elevated p-3.5 sm:p-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 text-gray-300">
                <span>Final winning bid</span>
                <span className="font-semibold text-white tabular-nums">
                  {money(simulation.bid)}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400">
                <span>Percentage calculation ({draftPercent}%)</span>
                <span className="tabular-nums">{money(simulation.rawPercentFee)}</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400">
                <span>Minimum fee floor</span>
                <span className="tabular-nums">{money(draftMinFee)}</span>
              </div>

              <div className="border-t border-white/10 pt-2.5 flex flex-wrap items-center justify-between gap-2">
                <span className="text-gray-300 flex flex-wrap items-center gap-1.5 min-w-0">
                  <span>Platform commission</span>
                  <span
                    className={cn(
                      'rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                      simulation.usesMinimumFloor
                        ? 'border-brand-blue/30 bg-brand-blue/10 text-brand-blue'
                        : 'border-brand-gold/30 bg-brand-gold/10 text-brand-gold'
                    )}
                  >
                    {simulation.usesMinimumFloor ? 'Min floor' : `${draftPercent}% rate`}
                  </span>
                </span>
                <span className="font-bold text-brand-gold tabular-nums">
                  -{money(simulation.appliedFee)}
                </span>
              </div>

              <div className="border-t border-white/10 pt-2.5 flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-white">Seller net payout</span>
                <span className="text-base font-bold text-status-success tabular-nums">
                  {money(simulation.sellerNet)}
                </span>
              </div>
            </div>
          </Panel>

          <Panel className="space-y-3 bg-bg-surface p-4 sm:p-5 text-xs text-gray-300">
            <p className="font-semibold uppercase tracking-wider text-brand-gold">
              Escrow &amp; Settlement Lifecycle
            </p>
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-start gap-2">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-brand-gold" />
                <span>
                  <strong className="text-gray-200">1. Winner Checkout:</strong> Buyer funds are
                  held in platform escrow while the commission snapshot is recorded.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-brand-blue" />
                <span>
                  <strong className="text-gray-200">2. Floor Comparison:</strong> If the percentage
                  fee is lower than {money(draftMinFee)}, the minimum fee floor is applied
                  automatically.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-status-success" />
                <span>
                  <strong className="text-gray-200">3. Fulfilled Payout:</strong> Once delivery is
                  confirmed, net proceeds are released to the seller and platform revenue is
                  recognized.
                </span>
              </li>
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}

export function AuctionCommissionPage() {
  const loadCommissionPolicy = useCallback(async () => {
    try {
      return await auctionCommissionApi.get();
    } catch (err) {
      if (!canUseMockCommissionFallback()) throw err;
      return readLocalMockCommissionPolicy();
    }
  }, []);

  const { data, error, loading, reload, replaceData } = useAuctionResource(
    loadCommissionPolicy,
    'Could not load the commission policy.'
  );

  return (
    <main id="main-content">
      <PageContainer className="space-y-5 sm:space-y-6">
        <PageHeader
          eyebrow={<span className="text-brand-gold">Platform administration</span>}
          title="Auction Commission"
          description="Changes apply to future auction orders. Configure the percentage commission rate and minimum fee floor automatically deducted upon settlement."
          actions={
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-status-success/30 bg-status-success/10 px-3 py-1.5 text-xs font-semibold text-status-success">
                <span className="size-2 rounded-full bg-status-success animate-pulse" />
                Escrow auto-deduction active
              </span>
              <Link
                to="/admin/orders"
                className="inline-flex min-h-10 sm:min-h-11 flex-1 sm:flex-initial items-center justify-center gap-2 rounded-xl border border-white/10 bg-bg-elevated px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-200 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue shrink-0"
              >
                <ReceiptText size={16} className="text-brand-gold" aria-hidden="true" />
                Order monitoring
              </Link>
              <Button
                type="button"
                variant="secondary"
                onClick={() => void reload()}
                isLoading={loading}
                className="gap-2 shrink-0"
              >
                <RefreshCw size={16} aria-hidden="true" />
                Refresh
              </Button>
            </div>
          }
        />

        {error && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-status-danger/40 bg-status-danger/10 px-4 py-3 text-sm text-red-100"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <AlertCircle size={18} className="shrink-0 text-status-danger" aria-hidden="true" />
              <span className="break-words">{error}</span>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={() => void reload()}>
              Retry
            </Button>
          </div>
        )}

        {loading && !data && (
          <div
            role="status"
            className="rounded-2xl border border-white/10 bg-bg-elevated p-8 text-center text-sm text-gray-300"
          >
            <div className="mx-auto mb-3 size-8 animate-spin rounded-full border-2 border-brand-gold border-t-transparent" />
            Loading policy…
          </div>
        )}

        {data && <CommissionPolicyWorkspace data={data} onPolicySaved={replaceData} />}
      </PageContainer>
    </main>
  );
}
