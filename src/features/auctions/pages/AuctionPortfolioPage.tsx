import { isAxiosError } from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/model/useAuthStore';
import { getStoredAccessToken } from '@/shared/api/authStorage';
import { Button } from '@/shared/components/Button';
import { ENV } from '@/shared/config/env';
import {
  auctionError,
  buyerAuctionApi,
  defaultCaseApi,
  isAuctionBanned,
  type AuctionPenalty,
  type AuctionSummary,
  type BuyerPortfolio,
  type CasePage,
  type SecondChanceOffer,
} from '../api/auctions';
import { auctionDate, money } from '../model/auctionFormat';
import { useAuctionClock, useAuctionResource } from '../model/useAuctionResource';

function canUseMockPortfolioFallback(): boolean {
  if (import.meta.env.MODE === 'test') return false;
  return Boolean(ENV.ENABLE_MOCK_API || getStoredAccessToken()?.startsWith('mock-'));
}

const MOCK_PORTFOLIO_DATA: {
  portfolio: BuyerPortfolio;
  watchlist: AuctionSummary[];
  offers: SecondChanceOffer[];
  penalty: AuctionPenalty;
  cases: CasePage;
} = {
  portfolio: {
    bidsPlaced: 14,
    auctionsWon: 3,
    winRatePercent: 60,
    totalInvested: 12450,
    badges: ['Master Bidder', 'Fast Settler'],
    wonItems: [
      {
        auctionId: 101,
        orderId: 501,
        orderNumber: 'AUC-501',
        orderStatus: 'AWAITING_BUYER_CONTACT',
        cardName: 'Pikachu Illustrator Promo (PSA 9)',
        finalPrice: 8200,
        isPaid: false,
        quantity: 1,
      },
      {
        auctionId: 102,
        orderId: 502,
        orderNumber: 'AUC-502',
        orderStatus: 'COMPLETED',
        cardName: 'Charizard Base Set Holo 1st Edition',
        finalPrice: 4250,
        isPaid: true,
        quantity: 1,
      },
    ],
  },
  watchlist: [
    {
      id: 201,
      cardName: 'Umbreon VMAX Alt Art (Evolving Skies)',
      setName: 'Evolving Skies',
      imageUrl: null,
      frontImageUrl: null,
      condition: 'NM',
      gradingCompany: 'PSA',
      grade: '10',
      currentPrice: 6800,
      buyItNowPrice: 9500,
      bidCount: 9,
      status: 'ACTIVE',
      endAt: new Date(Date.now() + 7200000).toISOString(),
      isReserveMet: true,
      quantity: 1,
    },
  ],
  offers: [
    {
      id: 301,
      auctionId: 105,
      cardName: 'Rayquaza VMAX Alt Art',
      imageUrl: null,
      offerPrice: 4900,
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      quantity: 1,
    },
  ],
  penalty: {
    activeStrikes: 0,
    bannedUntil: null,
  },
  cases: {
    content: [],
    number: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,
  },
};

export function AuctionPortfolioPage() {
  const user = useAuthStore((state) => state.user);
  return user ? (
    <AuctionPortfolio key={user.id} />
  ) : (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:p-6">
      <div className="rounded-2xl border border-white/10 bg-bg-elevated p-6 sm:p-8 text-center space-y-3">
        <h1 className="text-xl sm:text-2xl font-bold text-white">พอร์ตการประมูลของฉัน</h1>
        <p className="text-xs sm:text-sm text-text-secondary">
          ติดตามรายการที่ชนะประมูล ข้อเสนอสำรอง (Second-Chance) และการ์ดใน Watchlist ของคุณ
        </p>
        <div className="pt-1">
          <Link
            className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl bg-brand-gold px-5 py-2.5 text-sm font-bold text-bg-base underline hover:bg-brand-gold/90 transition-colors"
            to="/login"
          >
            เข้าสู่ระบบเพื่อดูพอร์ตและ Watchlist
          </Link>
        </div>
      </div>
    </main>
  );
}

function AuctionPortfolio() {
  const [casePage, setCasePage] = useState(0);
  useAuctionClock(30000);
  const fetchPortfolio = useCallback(async () => {
    try {
      const [portfolio, watchlist, offers, penalty, cases] = await Promise.all([
        buyerAuctionApi.portfolio(),
        buyerAuctionApi.watchlist(),
        buyerAuctionApi.secondChanceOffers(),
        defaultCaseApi.penalty(),
        defaultCaseApi.mine(casePage),
      ]);
      return { portfolio, watchlist, offers, penalty, cases };
    } catch (err) {
      if (!canUseMockPortfolioFallback()) throw err;
      return MOCK_PORTFOLIO_DATA;
    }
  }, [casePage]);

  const { data, error, loading, reload } = useAuctionResource(
    fetchPortfolio,
    'โหลดพอร์ตการประมูลไม่สำเร็จ'
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [failure, setFailure] = useState('');
  const { hash } = useLocation();

  useEffect(() => {
    if (data && (hash.startsWith('#auction-order-') || hash === '#auction-participation')) {
      document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' });
    }
  }, [data, hash]);

  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    setFailure('');
    setMessage('');
    try {
      await action();
      setMessage(success);
      await reload(true);
    } catch (error) {
      setFailure(
        isAxiosError(error) && error.response?.status === 413
          ? 'ระบบปฏิเสธไฟล์เนื่องจากมีขนาดใหญ่เกินไป กรุณาลองใช้รูปที่เล็กลง'
          : auctionError(error, 'ทำรายการไม่สำเร็จ')
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl space-y-5 sm:space-y-6 px-4 py-5 sm:p-6 text-white">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <Link
            to="/auctions"
            className="inline-block text-xs sm:text-sm font-semibold text-brand-blue underline hover:text-white transition-colors"
          >
            กลับไปยังห้องประมูล
          </Link>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight break-words">
            พอร์ตการประมูลของฉัน
          </h1>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-status-danger/40 bg-status-danger/10 px-4 py-3 text-sm text-status-danger"
        >
          <span className="min-w-0 break-words">{error}</span>
          <button
            type="button"
            onClick={() => void reload()}
            className="shrink-0 font-semibold underline hover:text-white"
          >
            ลองใหม่
          </button>
        </p>
      )}
      {failure && (
        <p
          role="alert"
          className="rounded-xl border border-status-danger/40 bg-status-danger/10 px-4 py-3 text-sm text-status-danger break-words"
        >
          {failure}
        </p>
      )}
      {message && (
        <p
          role="status"
          className="rounded-xl border border-status-success/40 bg-status-success/10 px-4 py-3 text-sm text-status-success break-words"
        >
          {message}
        </p>
      )}
      {loading && (
        <p
          role="status"
          className="rounded-xl border border-white/10 bg-bg-elevated p-6 text-center text-sm text-text-secondary"
        >
          กำลังโหลด…
        </p>
      )}

      {data && (
        <>
          <section
            id="auction-participation"
            className="scroll-mt-24 break-words space-y-2.5 rounded-2xl border border-white/10 bg-bg-elevated p-4 sm:p-5 text-sm"
            aria-label="Auction participation"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base sm:text-lg font-semibold text-white">
                Auction participation
              </h2>
              <span className="rounded-full border border-white/10 bg-bg-surface px-2.5 py-0.5 text-xs font-medium text-text-secondary">
                Active strikes: {data.penalty.activeStrikes}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-200">
              {isAuctionBanned(data.penalty)
                ? `Banned until ${auctionDate(data.penalty.bannedUntil)} (Thai time)`
                : 'You can participate in auctions.'}
            </p>
            <p className="text-xs text-text-secondary">
              First approved case: warning; second: 7-day ban; third and later: 30-day ban.
            </p>
            {data.cases.content.length === 0 ? (
              <p className="text-xs text-text-secondary">No reported cases.</p>
            ) : (
              <div className="space-y-3 pt-1">
                {data.cases.content.map((item) => (
                  <div
                    key={item.id}
                    className="space-y-1.5 rounded-xl border border-white/10 bg-bg-surface p-3 text-xs sm:text-sm"
                  >
                    <p className="font-semibold text-white break-words">
                      Case #{item.id} · {item.status} · {auctionDate(item.createdAt)}
                    </p>
                    <p className="text-gray-300 break-words">Report reason: {item.reportReason}</p>
                    {item.decisionReason && (
                      <p className="text-gray-300 break-words">
                        Decision reason: {item.decisionReason}
                      </p>
                    )}
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-0.5">
                      <Link className="text-brand-blue underline" to={`/orders/${item.orderId}`}>
                        Order #{item.orderId}
                      </Link>
                      <span aria-hidden="true">·</span>
                      <Link
                        className="text-brand-blue underline"
                        to={`/auctions/${item.auctionId}`}
                      >
                        Auction #{item.auctionId}
                      </Link>
                    </p>
                    {item.history?.length > 0 && (
                      <details className="pt-1 text-xs text-text-secondary">
                        <summary className="cursor-pointer font-medium text-gray-300">
                          Review history
                        </summary>
                        <ul className="mt-1.5 space-y-1 pl-4 list-disc">
                          {item.history.map((entry, index) => (
                            <li key={index} className="break-words">
                              {entry.action} · {auctionDate(entry.createdAt)} · Admin #
                              {entry.adminId}: {entry.reason}
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}
            {data.cases.totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={casePage === 0}
                  onClick={() => setCasePage(casePage - 1)}
                >
                  Previous cases
                </Button>
                <span className="text-xs sm:text-sm text-text-secondary">
                  Page {casePage + 1} of {data.cases.totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={casePage + 1 >= data.cases.totalPages}
                  onClick={() => setCasePage(casePage + 1)}
                >
                  Next cases
                </Button>
              </div>
            )}
          </section>

          {/* 4 KPI Stat Cards — 2x2 on mobile, 4-col on sm+ */}
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ['การเสนอราคา', data.portfolio.bidsPlaced],
              ['ชนะประมูล', data.portfolio.auctionsWon],
              ['อัตราชนะ', `${data.portfolio.winRatePercent}%`],
              ['ยอดลงทุนที่ชำระแล้ว', money(data.portfolio.totalInvested)],
            ].map(([label, value]) => (
              <div
                key={label}
                className="min-w-0 rounded-xl border border-white/10 bg-bg-elevated p-3.5 sm:p-4"
              >
                <dt className="text-xs text-text-secondary break-words">{label}</dt>
                <dd className="mt-1 text-lg sm:text-2xl font-bold tabular-nums text-white break-words">
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          {data.portfolio.badges.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {data.portfolio.badges.map((badge) => (
                <span
                  key={badge}
                  className="inline-flex items-center gap-1 rounded-full border border-brand-gold/30 bg-brand-gold/10 px-3 py-1 text-xs font-bold text-brand-gold"
                >
                  🏆 {badge}
                </span>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-bg-elevated p-3.5 text-xs text-text-secondary break-words">
              เป้าหมายตราเกียรติยศ: ชนะประมูลอีก {Math.max(1, 3 - data.portfolio.auctionsWon)}{' '}
              ครั้งเพื่อปลดล็อกตรา Master Bidder
            </div>
          )}

          {data.portfolio.bidsPlaced === 0 && (
            <div className="rounded-2xl border border-white/10 bg-bg-elevated p-6 text-center space-y-3">
              <p className="text-sm text-text-secondary">
                คุณยังไม่เคยเข้าร่วมการประมูลการ์ดในระบบ
              </p>
              <Link
                to="/auctions"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-brand-gold px-4 py-2.5 text-xs font-bold text-bg-base hover:bg-brand-gold/90 transition-colors"
              >
                สำรวจห้องประมูลการ์ด
              </Link>
            </div>
          )}

          {/* Won Items */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-semibold text-white">รายการที่ชนะ</h2>
            {data.portfolio.wonItems.length === 0 && (
              <p className="rounded-xl border border-white/10 bg-bg-elevated p-4 text-xs sm:text-sm text-text-secondary">
                ยังไม่มีรายการที่ชนะ
              </p>
            )}
            <div className="space-y-3">
              {data.portfolio.wonItems.map((item) => (
                <article
                  id={`auction-order-${item.orderId}`}
                  className="scroll-mt-24 space-y-2 rounded-xl border border-white/10 bg-bg-elevated p-3.5 sm:p-4"
                  key={item.auctionId}
                >
                  <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                    <Link
                      to={`/auctions/${item.auctionId}`}
                      className="font-semibold text-sm sm:text-base text-white underline hover:text-brand-blue break-words"
                    >
                      {item.cardName}
                    </Link>
                    {item.orderId && (
                      <Link
                        className="inline-flex w-fit items-center rounded-lg border border-brand-blue/30 bg-brand-blue/10 px-2.5 py-1 text-xs font-semibold text-brand-blue underline hover:bg-brand-blue/20"
                        to={`/orders/${item.orderId}`}
                      >
                        {item.orderNumber}
                      </Link>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-300 break-words">
                    {item.quantity ?? 1} ใบ · {money(item.finalPrice)} ทั้งล็อต · {item.orderStatus}
                  </p>
                  {item.orderStatus === 'AWAITING_BUYER_CONTACT' && (
                    <p className="rounded-lg border border-brand-gold/30 bg-brand-gold/10 px-3 py-2 text-xs text-brand-gold">
                      กรุณาติดต่อร้านค้าเพื่อดำเนินการชำระเงินและจัดส่ง
                    </p>
                  )}
                </article>
              ))}
            </div>
          </section>

          {/* Second-Chance Offers */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-semibold text-white">Second-Chance Offers</h2>
            {data.offers.length === 0 && (
              <p className="rounded-xl border border-white/10 bg-bg-elevated p-4 text-xs sm:text-sm text-text-secondary">
                ยังไม่มีข้อเสนอ
              </p>
            )}
            <div className="space-y-3">
              {data.offers.map((offer) => (
                <article
                  className="space-y-3 rounded-xl border border-white/10 bg-bg-elevated p-3.5 sm:p-4"
                  key={offer.id}
                >
                  <div className="space-y-1">
                    <Link
                      to={`/auctions/${offer.auctionId}`}
                      className="font-semibold text-sm sm:text-base text-white underline hover:text-brand-blue break-words"
                    >
                      {offer.cardName}
                    </Link>
                    <p className="text-xs sm:text-sm text-gray-300 break-words">
                      {offer.quantity ?? 1} ใบ · {money(offer.offerPrice)} ทั้งล็อต · ตอบภายใน{' '}
                      {auctionDate(offer.expiresAt)} (เวลาไทย)
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                    <Button
                      disabled={busy || isAuctionBanned(data.penalty)}
                      className="w-full sm:w-auto justify-center"
                      onClick={() =>
                        void run(
                          () => buyerAuctionApi.respondSecondChance(offer.id, true),
                          'รับข้อเสนอและสร้างออเดอร์แล้ว'
                        )
                      }
                    >
                      รับข้อเสนอ
                    </Button>
                    <Button
                      disabled={busy}
                      variant="secondary"
                      className="w-full sm:w-auto justify-center"
                      onClick={() =>
                        void run(
                          () => buyerAuctionApi.respondSecondChance(offer.id, false),
                          'ปฏิเสธข้อเสนอแล้ว'
                        )
                      }
                    >
                      ปฏิเสธ
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Watchlist */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-semibold text-white">Watchlist</h2>
            {data.watchlist.length === 0 && (
              <p className="rounded-xl border border-white/10 bg-bg-elevated p-4 text-xs sm:text-sm text-text-secondary">
                ยังไม่มีรายการที่ติดตาม
              </p>
            )}
            <div className="space-y-2.5">
              {data.watchlist.map((auction) => (
                <article
                  className="flex flex-col gap-3 rounded-xl border border-white/10 bg-bg-elevated p-3.5 sm:flex-row sm:items-center sm:justify-between sm:p-4"
                  key={auction.id}
                >
                  <Link
                    to={`/auctions/${auction.id}`}
                    className="min-w-0 text-sm sm:text-base font-medium text-white underline hover:text-brand-blue break-words"
                  >
                    {auction.cardName} · {money(auction.currentPrice)}
                  </Link>
                  <Button
                    disabled={busy}
                    variant="secondary"
                    size="sm"
                    className="w-full sm:w-auto shrink-0 justify-center"
                    onClick={() =>
                      void run(
                        () => buyerAuctionApi.toggleWatch(auction.id),
                        'เลิกติดตามรายการแล้ว'
                      )
                    }
                  >
                    เลิกติดตาม
                  </Button>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
