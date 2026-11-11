import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { ENV } from '@/shared/config/env';
import { Search, Clock, Flame, Tag, TrendingUp, Bookmark, ChevronRight } from 'lucide-react';
import { buyerAuctionApi, type AuctionSummary } from '../api/auctions';
import { countdown, money } from '../model/auctionFormat';
import { useAuctionClock, useAuctionResource } from '../model/useAuctionResource';

type Tab = 'ALL' | 'ENDING_SOON' | 'HOT_BIDS' | 'BUY_IT_NOW' | 'NO_RESERVE';

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'ALL', label: 'ทั้งหมด', icon: <TrendingUp size={14} /> },
  { key: 'ENDING_SOON', label: 'ใกล้ปิด', icon: <Clock size={14} /> },
  { key: 'HOT_BIDS', label: 'Hot Bids', icon: <Flame size={14} /> },
  { key: 'BUY_IT_NOW', label: 'ซื้อทันที', icon: <Tag size={14} /> },
  { key: 'NO_RESERVE', label: 'ไม่มีราคาสำรอง', icon: <Bookmark size={14} /> },
];

const CONDITIONS = ['', 'MT', 'NM', 'LP', 'MP', 'HP', 'DMG'];

function conditionLabel(c: string | null) {
  const map: Record<string, string> = { MT: 'Mint', NM: 'Near Mint', LP: 'Lightly Played', MP: 'Moderately Played', HP: 'Heavily Played', DMG: 'Damaged' };
  return c ? (map[c] ?? c) : '—';
}

function statusBadge(status: AuctionSummary['status']) {
  if (status === 'ACTIVE') return <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">กำลังประมูล</span>;
  if (status === 'SCHEDULED') return <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] font-semibold text-sky-400">กำหนดการ</span>;
  return null;
}

function AuctionCard({ auction, now }: { auction: AuctionSummary; now: number }) {
  const photo = auction.frontImageUrl
    ? new URL(auction.frontImageUrl, new URL(ENV.API_BASE_URL, window.location.origin)).href
    : auction.imageUrl;
  const timeLeft = auction.endAt ? countdown(auction.endAt, now) : '—';
  const urgent = auction.endAt && Date.parse(auction.endAt) - now < 3_600_000;

  return (
    <Link
      to={`/auctions/${auction.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/8 bg-bg-elevated transition-all hover:border-brand-blue/40 hover:shadow-lg hover:shadow-brand-blue/10"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-bg-surface">
        {photo ? (
          <img
            src={photo}
            alt={auction.cardName ?? 'Card'}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-text-secondary/30">
            <Tag size={40} />
          </div>
        )}
        {/* Graded badge */}
        {auction.gradingCompany && auction.grade && (
          <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 backdrop-blur-sm">
            <span className="text-[10px] font-bold text-brand-gold">{auction.gradingCompany}</span>
            <span className="text-[10px] font-semibold text-white">{auction.grade}</span>
          </div>
        )}
        {/* Buy-It-Now badge */}
        {auction.buyItNowPrice && (
          <div className="absolute right-2 top-2 rounded-full bg-brand-gold/90 px-2 py-0.5 text-[10px] font-bold text-black">
            BIN
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="flex items-start justify-between gap-1">
          <p className="line-clamp-2 text-sm font-semibold text-text-primary leading-snug">
            {auction.cardName ?? 'ไม่ระบุชื่อ'}
          </p>
          {statusBadge(auction.status)}
        </div>
        {auction.setName && (
          <p className="text-xs text-text-secondary truncate">{auction.setName}</p>
        )}
        <div className="mt-auto flex items-end justify-between pt-2">
          <div>
            <p className="text-[10px] text-text-secondary">ราคาปัจจุบัน</p>
            <p className="text-base font-bold text-brand-blue">{money(auction.currentPrice)}</p>
            {auction.buyItNowPrice && (
              <p className="text-[10px] text-brand-gold">BIN {money(auction.buyItNowPrice)}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-[10px] text-text-secondary">{auction.bidCount} bid</p>
            <p className={`text-xs font-semibold ${urgent ? 'text-red-400' : 'text-text-secondary'}`}>
              {timeLeft}
            </p>
            {!auction.isReserveMet && (
              <p className="text-[10px] text-amber-400">ยังไม่ถึงราคาสำรอง</p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function BuyerAuctionsPage() {
  const [tab, setTab] = useState<Tab>('ALL');
  const [search, setSearch] = useState('');
  const [condition, setCondition] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [page, setPage] = useState(0);
    const now = useAuctionClock();
  const fetchAuctions = useCallback(() => buyerAuctionApi.search({
    page,
    size: 20,
    search: search.trim() || undefined,
    condition: condition || undefined,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    tab: tab !== 'ALL' ? tab : undefined,
  }), [tab, search, condition, minPrice, maxPrice, page]);
  const { data, loading, error, reload } = useAuctionResource(fetchAuctions, 'โหลดรายการประมูลไม่สำเร็จ');

return (
    <div className="min-h-screen bg-bg-base pb-20">
      {/* Header */}
      <div className="border-b border-white/8 bg-bg-surface/80 px-4 py-6 backdrop-blur-sm md:px-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="mb-1 text-2xl font-bold text-text-primary">ห้องประมูลการ์ด</h1>
          <p className="text-sm text-text-secondary">ค้นหาและเสนอราคาการ์ด TCG สะสม</p>
          <Link className="mt-3 inline-block text-brand-blue underline" to="/auctions/me">Watchlist และพอร์ตการประมูลของฉัน</Link>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8">
        {/* Search & Filters */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="ค้นหาชื่อการ์ด, ชุด..."
              className="w-full rounded-xl border border-white/10 bg-bg-elevated py-2.5 pl-9 pr-4 text-sm text-text-primary placeholder:text-text-secondary/60 focus:border-brand-blue/50 focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={condition}
              onChange={(e) => { setCondition(e.target.value); setPage(0); }}
              className="rounded-xl border border-white/10 bg-bg-elevated px-3 py-2.5 text-sm text-text-primary focus:border-brand-blue/50 focus:outline-none"
            >
              <option value="">สภาพทั้งหมด</option>
              {CONDITIONS.filter(Boolean).map((c) => (
                <option key={c} value={c}>{conditionLabel(c)}</option>
              ))}
            </select>
            <input
              type="number"
              value={minPrice}
              onChange={(e) => { setMinPrice(e.target.value); setPage(0); }}
              placeholder="ราคาต่ำสุด ฿"
              className="w-28 rounded-xl border border-white/10 bg-bg-elevated px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-brand-blue/50 focus:outline-none"
            />
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => { setMaxPrice(e.target.value); setPage(0); }}
              placeholder="สูงสุด ฿"
              className="w-24 rounded-xl border border-white/10 bg-bg-elevated px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-brand-blue/50 focus:outline-none"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-5 flex gap-1 overflow-x-auto pb-1">
          {TABS.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => { setTab(key); setPage(0); }}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                tab === key
                  ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/30'
                  : 'border border-white/10 bg-bg-elevated text-text-secondary hover:border-white/20 hover:text-text-primary'
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        {error ? (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center text-sm text-red-400">
            {error}
            <button onClick={() => void reload()} className="ml-2 underline">ลองใหม่</button>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="animate-pulse overflow-hidden rounded-2xl bg-bg-elevated">
                <div className="aspect-[3/4] bg-bg-surface/60" />
                <div className="p-3 space-y-2">
                  <div className="h-3 w-3/4 rounded bg-bg-surface/60" />
                  <div className="h-3 w-1/2 rounded bg-bg-surface/60" />
                </div>
              </div>
            ))}
          </div>
        ) : !data?.content.length ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <TrendingUp size={48} className="text-text-secondary/30" />
            <div>
              <p className="font-semibold text-text-primary">ไม่พบรายการประมูล</p>
              <p className="text-sm text-text-secondary">ลองปรับตัวกรองหรือค้นหาคำอื่น</p>
            </div>
          </div>
        ) : (
          <>
            <p className="mb-3 text-xs text-text-secondary">พบ {data.totalElements.toLocaleString()} รายการ</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {data.content.map((a) => (
                <AuctionCard key={a.id} auction={a} now={now} />
              ))}
            </div>

            {/* Pagination */}
            {data.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="flex size-9 items-center justify-center rounded-xl border border-white/10 bg-bg-elevated text-sm text-text-secondary hover:text-text-primary disabled:opacity-30"
                >
                  ←
                </button>
                <span className="text-sm text-text-secondary">หน้า {page + 1} / {data.totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(data.totalPages - 1, p + 1))}
                  disabled={page >= data.totalPages - 1}
                  className="flex size-9 items-center justify-center rounded-xl border border-white/10 bg-bg-elevated text-sm text-text-secondary hover:text-text-primary disabled:opacity-30"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
