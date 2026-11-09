import { isAxiosError } from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/model/useAuthStore';
import { Button } from '@/shared/components/Button';
import { auctionError, buyerAuctionApi } from '../api/auctions';
import { auctionDate, money } from '../model/auctionFormat';
import { useAuctionResource } from '../model/useAuctionResource';

export function AuctionPortfolioPage() {
  const user = useAuthStore(state => state.user);
  return user ? <AuctionPortfolio key={user.id} /> : <main className="mx-auto max-w-5xl p-5">
    <h1 className="text-2xl font-bold">พอร์ตการประมูลของฉัน</h1>
    <Link className="underline" to="/login">เข้าสู่ระบบเพื่อดูพอร์ตและ Watchlist</Link>
  </main>;
}

function AuctionPortfolio() {
  const fetchPortfolio = useCallback(async () => {
    const [portfolio, watchlist, offers] = await Promise.all([
      buyerAuctionApi.portfolio(), buyerAuctionApi.watchlist(), buyerAuctionApi.secondChanceOffers(),
    ]);
    return { portfolio, watchlist, offers };
  }, []);
  const { data, error, loading, reload } = useAuctionResource(fetchPortfolio, 'โหลดพอร์ตการประมูลไม่สำเร็จ');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [failure, setFailure] = useState('');
  const { hash } = useLocation();

  useEffect(() => {
    if (data && hash.startsWith('#auction-order-')) {
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
      setFailure(isAxiosError(error) && error.response?.status === 413
        ? 'ระบบปฏิเสธไฟล์เนื่องจากมีขนาดใหญ่เกินไป กรุณาลองใช้รูปที่เล็กลง'
        : auctionError(error, 'ทำรายการไม่สำเร็จ'));
    } finally {
      setBusy(false);
    }
  }

  return <main className="mx-auto max-w-5xl space-y-5 p-5">
    <Link to="/auctions" className="underline">กลับไปยังห้องประมูล</Link>
    <h1 className="text-2xl font-bold">พอร์ตการประมูลของฉัน</h1>
    {error && <p role="alert">{error} <button onClick={() => void reload()} className="underline">ลองใหม่</button></p>}
    {failure && <p role="alert">{failure}</p>}
    {message && <p role="status">{message}</p>}
    {loading && <p role="status">กำลังโหลด…</p>}
    {data && <>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ['การเสนอราคา', data.portfolio.bidsPlaced],
          ['ชนะประมูล', data.portfolio.auctionsWon],
          ['อัตราชนะ', `${data.portfolio.winRatePercent}%`],
          ['ยอดลงทุนที่ชำระแล้ว', money(data.portfolio.totalInvested)],
        ].map(([label, value]) => <div key={label} className="rounded-lg bg-bg-elevated p-3">
          <dt className="text-text-secondary">{label}</dt><dd className="font-semibold">{value}</dd>
        </div>)}
      </dl>
      {data.portfolio.badges.length > 0 && <p>{data.portfolio.badges.join(' · ')}</p>}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">รายการที่ชนะ</h2>
        {data.portfolio.wonItems.length === 0 && <p>ยังไม่มีรายการที่ชนะ</p>}
        {data.portfolio.wonItems.map(item => <article id={`auction-order-${item.orderId}`}
          className="scroll-mt-24 space-y-2 rounded-lg bg-bg-elevated p-3" key={item.auctionId}>
          <Link to={`/auctions/${item.auctionId}`} className="font-semibold underline">{item.cardName}</Link>
          <p>{item.quantity ?? 1} ใบ · {money(item.finalPrice)} ทั้งล็อต · {item.orderStatus}</p>
          {item.orderId && <Link className="underline" to={`/orders/${item.orderId}`}>{item.orderNumber}</Link>}
          {item.orderStatus === 'AWAITING_BUYER_CONTACT' &&
            <p>กรุณาติดต่อร้านค้าเพื่อดำเนินการชำระเงินและจัดส่ง</p>}
        </article>)}
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Second-Chance Offers</h2>
        {data.offers.length === 0 && <p>ยังไม่มีข้อเสนอ</p>}
        {data.offers.map(offer => <article className="space-y-2 rounded-lg bg-bg-elevated p-3" key={offer.id}>
          <Link to={`/auctions/${offer.auctionId}`} className="font-semibold underline">{offer.cardName}</Link>
          <p>{offer.quantity ?? 1} ใบ · {money(offer.offerPrice)} ทั้งล็อต · ตอบภายใน {auctionDate(offer.expiresAt)} (เวลาไทย)</p>
          <div className="flex gap-2">
            <Button disabled={busy} onClick={() => void run(
              () => buyerAuctionApi.respondSecondChance(offer.id, true), 'รับข้อเสนอและสร้างออเดอร์แล้ว',
            )}>รับข้อเสนอ</Button>
            <Button disabled={busy} variant="secondary" onClick={() => void run(
              () => buyerAuctionApi.respondSecondChance(offer.id, false), 'ปฏิเสธข้อเสนอแล้ว',
            )}>ปฏิเสธ</Button>
          </div>
        </article>)}
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Watchlist</h2>
        {data.watchlist.length === 0 && <p>ยังไม่มีรายการที่ติดตาม</p>}
        {data.watchlist.map(auction => <article className="flex items-center justify-between gap-3 rounded-lg bg-bg-elevated p-3" key={auction.id}>
          <Link to={`/auctions/${auction.id}`} className="underline">{auction.cardName} · {money(auction.currentPrice)}</Link>
          <Button disabled={busy} variant="secondary" onClick={() => void run(
            () => buyerAuctionApi.toggleWatch(auction.id), 'เลิกติดตามรายการแล้ว',
          )}>เลิกติดตาม</Button>
        </article>)}
      </section>
    </>}
  </main>;
}
