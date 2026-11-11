import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Download, Plus, RefreshCw, ShieldAlert, TrendingUp } from 'lucide-react';
import { isSellerUser } from '@/entities/account/model/types';
import { useAuthStore } from '@/features/auth/model/useAuthStore';
import { getStoredAccessToken } from '@/shared/api/authStorage';
import { Button } from '@/shared/components/Button';
import { Skeleton } from '@/shared/components/Skeleton';
import { ENV } from '@/shared/config/env';
import { auctionApi, type SellerAnalytics } from '../api/auctions';
import { AUCTIONS_PATH, auctionDate, money } from '../model/auctionFormat';
import { useAuctionClock, useAuctionResource } from '../model/useAuctionResource';

export type AnalyticsPeriod = '7d' | '30d' | '90d' | 'all';

const MOCK_SELLER_ANALYTICS: SellerAnalytics = {
  grossAuctionVolume: 18400,
  totalCost: 11200,
  totalPlatformFee: 920,
  netRealizedProfit: 6280,
  profitMarginPercent: 56.1,
  totalCompletedAuctions: 3,
  items: [
    {
      auctionId: 101,
      cardName: 'Pikachu Illustrator Promo (PSA 9)',
      startPrice: 4500,
      finalPrice: 8200,
      costBasis: 5000,
      platformFee: 410,
      netProfit: 2790,
      closedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      auctionId: 102,
      cardName: 'Charizard Base Set Holo 1st Edition',
      startPrice: 3500,
      finalPrice: 6400,
      costBasis: 4000,
      platformFee: 320,
      netProfit: 2080,
      closedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      auctionId: 103,
      cardName: 'Umbreon VMAX Alt Art (Evolving Skies)',
      startPrice: 2000,
      finalPrice: 3800,
      costBasis: 2200,
      platformFee: 190,
      netProfit: 1410,
      closedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
};

function canUseMockAnalyticsFallback(): boolean {
  if (import.meta.env.MODE === 'test') return false;
  return Boolean(ENV.ENABLE_MOCK_API || getStoredAccessToken()?.startsWith('mock-'));
}

export function AuctionAnalyticsPage() {
  const user = useAuthStore((s) => s.user);
  const isSeller = isSellerUser(user);

  const loadAnalytics = useCallback(async () => {
    try {
      return await auctionApi.getSellerAnalytics();
    } catch (err) {
      if (!canUseMockAnalyticsFallback()) throw err;
      return MOCK_SELLER_ANALYTICS;
    }
  }, []);

  const { data, error, loading, reload } = useAuctionResource(
    loadAnalytics,
    'ไม่สามารถโหลดข้อมูลสถิติการเงินได้ กรุณาลองใหม่อีกครั้ง'
  );

  const now = useAuctionClock(60_000);
  const [period, setPeriod] = useState<AnalyticsPeriod>('30d');
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  // Filter items based on selected period
  const filteredItems = useMemo(() => {
    const items = data?.items;
    if (!items) return [];
    if (period === 'all') return items;
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const cutoff = now - days * 24 * 60 * 60 * 1000;
    return items.filter((item) => {
      if (!item.closedAt) return true;
      const closedTime = new Date(item.closedAt).getTime();
      return Number.isFinite(closedTime) ? closedTime >= cutoff : true;
    });
  }, [data, now, period]);

  // Recalculate metrics for the selected period
  const metrics = useMemo(() => {
    const totalAuctions = filteredItems.length;
    const grossVolume = filteredItems.reduce((acc, cur) => acc + (cur.finalPrice || 0), 0);
    const totalCost = filteredItems.reduce((acc, cur) => acc + (cur.costBasis || 0), 0);
    const totalFee = filteredItems.reduce((acc, cur) => acc + (cur.platformFee || 0), 0);
    const netProfit = filteredItems.reduce((acc, cur) => acc + (cur.netProfit || 0), 0);
    const profitMargin = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;

    return {
      totalAuctions,
      grossVolume,
      totalCost,
      totalFee,
      netProfit,
      profitMargin,
    };
  }, [filteredItems]);

  // CSV Export handler
  const handleExportCSV = () => {
    setIsExporting(true);
    setExportMessage(null);
    try {
      if (filteredItems.length === 0) {
        setExportMessage('ไม่มีข้อมูลการประมูลในช่วงเวลานี้สำหรับการส่งออก');
        return;
      }

      const headers = [
        'Auction ID',
        'Card Name',
        'Closed Date',
        'Start Price (THB)',
        'Final Bid (THB)',
        'Cost Basis (THB)',
        'Platform Fee (THB)',
        'Net Realized Profit (THB)',
        'Profit Margin (%)',
      ];

      const rows = filteredItems.map((item) => {
        const margin =
          item.costBasis > 0
            ? ((item.netProfit / item.costBasis) * 100).toFixed(1) + '%'
            : 'N/A';
        return [
          item.auctionId,
          `"${(item.cardName || 'Unknown').replace(/"/g, '""')}"`,
          `"${item.closedAt ? auctionDate(item.closedAt) : '—'}"`,
          item.startPrice,
          item.finalPrice,
          item.costBasis,
          item.platformFee,
          item.netProfit,
          `"${margin}"`,
        ].join(',');
      });

      const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `auction-financial-report-${period}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setExportMessage('ส่งออกรายงานทางการเงิน (CSV) สำเร็จ');
    } catch {
      setExportMessage('ส่งออกรายงานไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsExporting(false);
    }
  };

  // 1. Auth Guard (US-18-1 Phase 1)
  if (!user || !isSeller) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-6 sm:p-6">
        <div className="rounded-2xl border border-status-danger/30 bg-status-danger/10 p-6 sm:p-8 text-center space-y-4">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-status-danger/20 text-status-danger">
            <ShieldAlert className="size-8" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white break-words">
            หน้านี้สำหรับผู้ขายที่ยืนยันตัวตนแล้วเท่านั้น
          </h1>
          <p className="text-sm text-gray-300 max-w-md mx-auto">
            คุณจำเป็นต้องมีสถานะเป็น Verified Seller เพื่อเข้าถึงระบบวิเคราะห์รายได้ ต้นทุน และกำไรจากการประมูล
          </p>
          <div className="pt-2">
            <Link
              to="/profile"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-brand-gold px-5 py-2.5 font-bold text-bg-base hover:bg-brand-gold/90 transition-colors"
            >
              ไปที่หน้าโปรไฟล์เพื่อขอสิทธิ์ผู้ขาย
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl space-y-5 sm:space-y-6 px-4 py-5 sm:p-6 text-white">
      {/* Header and Breadcrumb */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 space-y-1">
          <Link
            to={AUCTIONS_PATH}
            className="inline-block text-xs font-semibold text-text-secondary hover:text-white transition-colors"
          >
            ← กลับไปที่การประมูลของฉัน (My Auctions)
          </Link>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight break-words">
            สถิติการเงินและกำไรประมูล (Auction Analytics)
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary">
            US-18-1: ติดตามยอดประมูลรวม ต้นทุน ค่าธรรมเนียม และอัตราผลกำไรสุทธิ
          </p>
        </div>

        {/* Action Controls — full width stacked on mobile, inline on sm+ */}
        <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          {/* Period Filters */}
          <div className="grid w-full grid-cols-4 rounded-xl border border-white/10 bg-bg-surface p-1 text-xs sm:inline-flex sm:w-auto">
            {(
              [
                ['7d', '7 วัน'],
                ['30d', '30 วัน'],
                ['90d', '90 วัน'],
                ['all', 'ทั้งหมด'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setPeriod(value)}
                className={`rounded-lg px-2.5 sm:px-3 py-1.5 text-center font-medium transition-colors ${
                  period === value
                    ? 'bg-brand-blue text-white shadow-sm'
                    : 'text-text-secondary hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Export CSV Button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportCSV}
            disabled={loading || isExporting || !data || filteredItems.length === 0}
            className="flex w-full sm:w-auto items-center justify-center gap-1.5"
          >
            <Download size={14} />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Export notification message */}
      {exportMessage && (
        <div
          role="status"
          className="rounded-xl border border-brand-blue/30 bg-brand-blue/10 px-4 py-2.5 text-xs text-brand-blue flex flex-wrap items-center justify-between gap-2"
        >
          <span className="min-w-0 break-words">{exportMessage}</span>
          <button
            type="button"
            onClick={() => setExportMessage(null)}
            className="shrink-0 text-text-secondary hover:text-white text-xs underline"
          >
            ปิด
          </button>
        </div>
      )}

      {/* Error State with Retry Button */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-status-danger/40 bg-status-danger/10 p-4 sm:p-5 text-status-danger flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="min-w-0">
            <p className="font-semibold break-words">{error}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              เกิดข้อผิดพลาดในการดึงข้อมูลสถิติการเงิน กรุณากดลองใหม่อีกครั้ง
            </p>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={() => void reload()}
            className="flex w-full sm:w-auto items-center justify-center gap-1.5 shrink-0"
          >
            <RefreshCw size={14} />
            ลองใหม่อีกครั้ง (Retry)
          </Button>
        </div>
      )}

      {/* Skeleton Loading State (US-18-1 Phase 2) */}
      {loading && (
        <div className="space-y-6" aria-label="Loading analytics" role="status">
          <div className="grid grid-cols-1 gap-3 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="rounded-xl bg-bg-elevated p-4">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-7 w-28" />
              </div>
            ))}
          </div>
          <div className="rounded-xl bg-bg-elevated p-4 sm:p-6 space-y-4">
            <Skeleton className="h-6 w-48 max-w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      )}

      {/* Loaded Content */}
      {!loading && data && (
        <>
          {/* Empty State (US-18-1 No Auctions) */}
          {data.items.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-bg-elevated p-6 sm:p-10 text-center space-y-4">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-gold/10 text-brand-gold">
                <BarChart3 className="size-7" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">ยังไม่มีประวัติการประมูลที่สำเร็จ</h2>
              <p className="text-xs sm:text-sm text-text-secondary max-w-md mx-auto">
                เมื่อห้องประมูลของคุณจบลงและผู้ซื้อชำระเงินเรียบร้อย สถิติรายได้ ต้นทุน ค่าธรรมเนียม และกำไรสุทธิจะแสดงขึ้นที่นี่
              </p>
              <div className="pt-2">
                <Link
                  to={`${AUCTIONS_PATH}/new`}
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-brand-gold px-5 py-2.5 font-bold text-bg-base hover:bg-brand-gold/90 transition-colors"
                >
                  <Plus size={18} />
                  สร้างห้องประมูลใหม่
                </Link>
              </div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-bg-elevated p-6 sm:p-8 text-center space-y-2">
              <p className="text-sm sm:text-base font-semibold text-white">
                ไม่มีรายการประมูลที่จบลงในช่วง{' '}
                {period === '7d'
                  ? '7 วันที่ผ่านมา'
                  : period === '30d'
                    ? '30 วันที่ผ่านมา'
                    : '90 วันที่ผ่านมา'}
              </p>
              <p className="text-xs text-text-secondary">
                ลองเลือกช่วงเวลาเป็น "ทั้งหมด" เพื่อดูประวัติประมูลก่อนหน้า
              </p>
            </div>
          ) : (
            <>
              {/* 5 KPI Metric Cards — Responsive 2-col on mobile, 3-col on tablet, 5-col on desktop */}
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                <div className="min-w-0 rounded-xl border border-white/10 bg-bg-elevated p-3.5 sm:p-4">
                  <dt className="text-[11px] sm:text-xs text-text-secondary uppercase font-semibold break-words">
                    ประมูลสำเร็จ
                  </dt>
                  <dd className="text-lg sm:text-2xl font-bold mt-1 text-white tabular-nums break-words">
                    {metrics.totalAuctions}{' '}
                    <span className="text-xs font-normal text-text-secondary">รายการ</span>
                  </dd>
                </div>

                <div className="min-w-0 rounded-xl border border-white/10 bg-bg-elevated p-3.5 sm:p-4">
                  <dt className="text-[11px] sm:text-xs text-text-secondary uppercase font-semibold break-words">
                    ยอดประมูลรวม (Gross)
                  </dt>
                  <dd className="text-lg sm:text-2xl font-bold mt-1 text-brand-gold tabular-nums break-words">
                    {money(metrics.grossVolume)}
                  </dd>
                </div>

                <div className="min-w-0 rounded-xl border border-white/10 bg-bg-elevated p-3.5 sm:p-4">
                  <dt className="text-[11px] sm:text-xs text-text-secondary uppercase font-semibold break-words">
                    ต้นทุนสินค้ารวม (Cost)
                  </dt>
                  <dd className="text-lg sm:text-2xl font-bold mt-1 text-gray-300 tabular-nums break-words">
                    {money(metrics.totalCost)}
                  </dd>
                </div>

                <div className="min-w-0 rounded-xl border border-white/10 bg-bg-elevated p-3.5 sm:p-4">
                  <dt className="text-[11px] sm:text-xs text-text-secondary uppercase font-semibold break-words">
                    ค่าธรรมเนียมแพลตฟอร์ม
                  </dt>
                  <dd className="text-lg sm:text-2xl font-bold mt-1 text-status-danger tabular-nums break-words">
                    -{money(metrics.totalFee)}
                  </dd>
                </div>

                <div className="min-w-0 rounded-xl border border-white/10 bg-bg-elevated p-3.5 sm:p-4 col-span-2 sm:col-span-2 lg:col-span-1">
                  <dt className="text-[11px] sm:text-xs text-text-secondary uppercase font-semibold flex flex-wrap items-center justify-between gap-1">
                    <span>กำไรสุทธิ (Net Profit)</span>
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-brand-gold/10 px-2 py-0.5 text-[10px] font-bold text-brand-gold">
                      <TrendingUp size={11} /> {metrics.profitMargin.toFixed(1)}%
                    </span>
                  </dt>
                  <dd
                    className={`text-lg sm:text-2xl font-bold mt-1 tabular-nums break-words ${
                      metrics.netProfit >= 0 ? 'text-status-success' : 'text-status-danger'
                    }`}
                  >
                    {money(metrics.netProfit)}
                  </dd>
                </div>
              </dl>

              {/* Price Comparison & Analytics Section */}
              <section className="space-y-4 rounded-2xl border border-white/10 bg-bg-elevated p-4 sm:p-6">
                <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-base sm:text-lg font-bold text-white flex items-start sm:items-center gap-2">
                    <BarChart3 className="mt-0.5 sm:mt-0 size-5 shrink-0 text-brand-blue" />
                    <span className="break-words">
                      เปรียบเทียบราคาเริ่มต้น vs ราคาจบจริง (Starting vs Final Price)
                    </span>
                  </h2>
                  <span className="text-xs text-text-secondary shrink-0">
                    {filteredItems.length} รายการ
                  </span>
                </div>

                <div className="space-y-3 pt-1 sm:pt-2">
                  {filteredItems.map((item) => {
                    const max = Math.max(item.startPrice, item.finalPrice, 1);
                    const margin =
                      item.costBasis > 0
                        ? ((item.netProfit / item.costBasis) * 100).toFixed(1)
                        : null;

                    return (
                      <article
                        key={item.auctionId}
                        className="rounded-xl border border-white/5 bg-bg-surface p-3.5 sm:p-4 space-y-3 transition-colors hover:border-white/15"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <Link
                            to={`${AUCTIONS_PATH}/${item.auctionId}`}
                            className="font-bold text-sm sm:text-base text-white hover:text-brand-blue transition-colors break-words sm:truncate sm:max-w-md underline"
                          >
                            {item.cardName || `Auction #${item.auctionId}`}
                          </Link>
                          <span className="text-xs text-text-secondary shrink-0">
                            {item.closedAt ? auctionDate(item.closedAt) : '—'}
                          </span>
                        </div>

                        {/* Comparative Bars — Stacked on mobile, 3-column grid on sm+ */}
                        <div className="space-y-2.5 sm:space-y-1.5 text-xs">
                          <div className="space-y-1 sm:grid sm:grid-cols-[5.25rem_1fr_auto] sm:items-center sm:gap-3 sm:space-y-0">
                            <div className="flex items-center justify-between sm:contents">
                              <span className="text-text-secondary font-medium">ราคาเปิด:</span>
                              <span className="font-semibold text-gray-300 tabular-nums sm:order-3">
                                {money(item.startPrice)}
                              </span>
                            </div>
                            <div
                              aria-hidden="true"
                              className="h-2 rounded bg-white/5 overflow-hidden sm:order-2"
                            >
                              <div
                                className="h-full rounded bg-brand-blue"
                                style={{
                                  width: `${Math.min(100, Math.max(5, (item.startPrice / max) * 100))}%`,
                                }}
                              />
                            </div>
                          </div>

                          <div className="space-y-1 sm:grid sm:grid-cols-[5.25rem_1fr_auto] sm:items-center sm:gap-3 sm:space-y-0">
                            <div className="flex items-center justify-between sm:contents">
                              <span className="text-text-secondary font-medium">ราคาจบจริง:</span>
                              <span className="font-bold text-brand-gold tabular-nums sm:order-3">
                                {money(item.finalPrice)}
                              </span>
                            </div>
                            <div
                              aria-hidden="true"
                              className="h-2 rounded bg-white/5 overflow-hidden sm:order-2"
                            >
                              <div
                                className="h-full rounded bg-brand-gold"
                                style={{
                                  width: `${Math.min(100, Math.max(5, (item.finalPrice / max) * 100))}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Item Financial Breakdown — Responsive stacked rows on mobile */}
                        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between pt-2 border-t border-white/5 text-xs text-text-secondary">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span>
                              ต้นทุน:{' '}
                              <strong className="text-gray-300 font-medium tabular-nums">
                                {money(item.costBasis)}
                              </strong>
                            </span>
                            <span aria-hidden="true" className="hidden xs:inline">
                              ·
                            </span>
                            <span>
                              ค่าธรรมเนียม:{' '}
                              <strong className="text-status-danger font-medium tabular-nums">
                                -{money(item.platformFee)}
                              </strong>
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2">
                            <span>
                              กำไรสุทธิ:{' '}
                              <strong
                                className={`font-bold tabular-nums ${
                                  item.netProfit >= 0 ? 'text-status-success' : 'text-status-danger'
                                }`}
                              >
                                {money(item.netProfit)}
                              </strong>
                            </span>
                            {margin !== null && (
                              <span className="rounded bg-brand-gold/10 px-1.5 py-0.5 text-[10px] font-bold text-brand-gold tabular-nums">
                                Margin: +{margin}%
                              </span>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            </>
          )}
        </>
      )}
    </main>
  );
}
