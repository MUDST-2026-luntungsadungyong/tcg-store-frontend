import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/model/useAuthStore';
import { Button } from '@/shared/components/Button';
import { ButtonLink } from '@/shared/components/ButtonLink';
import { ErrorState } from '@/shared/components/ErrorState';
import { Input } from '@/shared/components/Input';
import { Modal } from '@/shared/components/Modal';
import { PageContainer, PageHeader, Panel } from '@/shared/components/PageLayout';
import { ENV } from '@/shared/config/env';
import { auctionError, buyerAuctionApi } from '../api/auctions';
import { AuctionCardSummary, AuctionLoading, AuctionStatusBadge, DetailRows } from '../components/AuctionUI';
import { auctionDate, countdown, money } from '../model/auctionFormat';
import { useAuctionClock, useAuctionResource } from '../model/useAuctionResource';

type Action = { mode: 'bid' | 'proxy'; amount: number } | { mode: 'buyout' };

export function BuyerAuctionDetailPage() {
  const { auctionId } = useParams();
  const id = Number(auctionId);
  if (!Number.isSafeInteger(id) || id < 1) return <ErrorState message="ไม่พบรายการประมูล" />;
  return <AuctionRoom key={id} id={id} />;
}

function AuctionRoom({ id }: { id: number }) {
  const user = useAuthStore(state => state.user);
  const fetchRoom = useCallback(async () => {
    const [auction, bids] = await Promise.all([buyerAuctionApi.detail(id), buyerAuctionApi.bids(id)]);
    return { auction, bids, offset: Date.parse(auction.serverTime) - Date.now() };
  }, [id]);
  const { data, error, loading, reload } = useAuctionResource(fetchRoom, 'โหลดห้องประมูลไม่สำเร็จ', 5000);
  const isLive = data?.auction.status === 'ACTIVE' || data?.auction.status === 'SCHEDULED';
  useEffect(() => {
    if (!isLive || typeof WebSocket === 'undefined') return;
    const url = new URL(ENV.API_BASE_URL, window.location.origin);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    url.pathname = `${url.pathname.replace(/\/$/, '')}/auctions/${id}/live`;
    let socket: WebSocket;
    let retry: number | undefined;
    function connect() {
      socket = new WebSocket(url);
      socket.onopen = () => { void reload(true); };
      socket.onmessage = () => { void reload(true); };
      socket.onclose = () => { retry = window.setTimeout(connect, 5000); };
    }
    connect();
    return () => {
      window.clearTimeout(retry);
      socket.onclose = null;
      socket.close();
    };
  }, [id, isLive, reload]);
  const clock = useAuctionClock();
  const [bid, setBid] = useState('');
  const [proxy, setProxy] = useState('');
  const [confirm, setConfirm] = useState<Action>();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [actionError, setActionError] = useState('');

  if (!data) return <PageContainer>{loading ? <AuctionLoading label="กำลังโหลดห้องประมูล" />
    : <ErrorState message={error} onRetry={() => reload()} />}</PageContainer>;

  const { auction, bids, offset } = data;
  const now = clock + offset;
  const open = auction.status === 'ACTIVE' && Boolean(auction.endAt && Date.parse(auction.endAt) > now);
  const owner = Boolean(user && String(user.id) === String(auction.sellerId));
  const canBid = open && Boolean(user) && !owner && !error;

  async function transact(action: Action | { mode: 'watch' }) {
    setBusy(true);
    setMessage('');
    setActionError('');
    try {
      switch (action.mode) {
        case 'bid':
          await buyerAuctionApi.placeBid(id, action.amount);
          setBid('');
          setMessage('บันทึกการเสนอราคาแล้ว');
          break;
        case 'proxy':
          await buyerAuctionApi.placeProxyBid(id, action.amount);
          setProxy('');
          setMessage('บันทึกราคาสูงสุดแล้ว');
          break;
        case 'buyout':
          await buyerAuctionApi.buyout(id);
          setMessage('ซื้อทันทีสำเร็จ ส่งหลักฐานได้ในพอร์ตการประมูล');
          break;
        case 'watch':
          await buyerAuctionApi.toggleWatch(id);
          break;
      }
      setConfirm(undefined);
      await reload(true);
    } catch (failure) {
      setConfirm(undefined);
      setActionError(auctionError(failure, 'ทำรายการไม่สำเร็จ กรุณาลองใหม่'));
      await reload(true);
    } finally {
      setBusy(false);
    }
  }

  const requestBid = (mode: 'bid' | 'proxy', value: string) => {
    const amount = Number(value);
    if (!/^\d{1,10}(?:\.\d{1,2})?$/.test(value) || amount < auction.nextMinimumBid) {
      setActionError(`กรอกราคาอย่างน้อย ${money(auction.nextMinimumBid)} และใช้ทศนิยมไม่เกินสองตำแหน่ง`);
      return;
    }
    setActionError('');
    setConfirm({ mode, amount });
  };

  return <main><PageContainer className="space-y-6">
    <Link to="/auctions" className="text-sm font-semibold text-brand-blue">← กลับไปหน้าประมูล</Link>
    <PageHeader title={auction.cardName || `ประมูล #${id}`} eyebrow="Auctions" />
    {error && <ErrorState message={error} onRetry={() => reload()} />}
    {actionError && <p role="alert" className="text-sm text-status-danger">{actionError}</p>}
    {message && <p role="status" className="text-sm text-status-success">{message} <Link to="/auctions/me" className="underline">ดูพอร์ตการประมูล</Link></p>}
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel className="space-y-4">
        <AuctionCardSummary name={auction.cardName} setName={auction.setName} condition={auction.condition} imageUrl={auction.imageUrl} />
        <div className="grid grid-cols-2 gap-3">
          {([['ด้านหน้า', auction.frontImageUrl], ['ด้านหลัง', auction.backImageUrl]] as const).map(([label, path]) => {
            if (!path?.startsWith('/api/auctions/')) return null;
            const image = ENV.API_BASE_URL.replace(/\/$/, '') + path.slice(4);
            return <a key={label} href={image} target="_blank" rel="noreferrer"><img className="h-48 w-full rounded-lg bg-bg-input object-contain" src={image} alt={`รูปการ์ด${label}`} /></a>;
          })}
        </div>
        <DetailRows items={[
          ['ผู้ขาย', auction.sellerName],
          ['รายการประมูลที่สำเร็จ', auction.sellerCompletedAuctions],
          ['เกรด', [auction.gradingCompany, auction.grade].filter(Boolean).join(' ') || '—'],
          ['เลขใบรับรอง', auction.certVerificationUrl && auction.certNumber
            ? <a className="text-brand-blue underline" href={auction.certVerificationUrl} target="_blank" rel="noreferrer">{auction.certNumber}</a>
            : auction.certNumber || '—'],
        ]} />
      </Panel>
      <Panel className="space-y-4">
        <AuctionStatusBadge status={auction.status} />
        <DetailRows items={[
          ['ราคาปัจจุบัน', money(auction.currentPrice)],
          ['จำนวน bid', auction.bidCount],
          ['ราคาขั้นต่ำถัดไป', money(auction.nextMinimumBid)],
          ['Reserve', auction.isReserveMet ? 'ผ่านเงื่อนไขราคาแล้ว' : 'ยังไม่ถึงราคาสำรอง'],
          ['เวลาปิด', auctionDate(auction.endAt)],
          ['เวลาที่เหลือ', open ? countdown(auction.endAt, now) : '—'],
        ]} />
        {!user && <ButtonLink to="/login">เข้าสู่ระบบเพื่อร่วมประมูล</ButtonLink>}
        {user && <Button type="button" variant="secondary" disabled={busy} onClick={() => void transact({ mode: 'watch' })}>
          {auction.isWatching ? 'นำออกจาก Watchlist' : 'เพิ่มใน Watchlist'}
        </Button>}
        {canBid && <>
          <form className="space-y-2" onSubmit={event => { event.preventDefault(); requestBid('bid', bid); }}>
            <Input label="ราคาเสนอ (บาท)" inputMode="decimal" value={bid} onChange={event => setBid(event.target.value)} />
            <div className="flex flex-wrap gap-2">
              {[50, 100, 500].map(step => <Button key={step} type="button" size="sm" variant="secondary"
                onClick={() => setBid(String(Math.max(auction.nextMinimumBid, auction.currentPrice + step)))}>+฿{step}</Button>)}
              <Button type="submit" disabled={busy}>เสนอราคา</Button>
            </div>
          </form>
          <form className="space-y-2" onSubmit={event => { event.preventDefault(); requestBid('proxy', proxy); }}>
            <Input label="ราคาสูงสุดสำหรับ Proxy Bid (บาท)" inputMode="decimal" value={proxy} onChange={event => setProxy(event.target.value)} />
            <Button type="submit" disabled={busy} variant="secondary">ตั้งราคาสูงสุด</Button>
          </form>
          {auction.buyItNowPrice != null && auction.buyItNowPrice > auction.currentPrice && <Button type="button" disabled={busy} variant="gold" onClick={() => setConfirm({ mode: 'buyout' })}>
            ซื้อทันที {money(auction.buyItNowPrice)}
          </Button>}
        </>}
      </Panel>
    </div>
    <Panel className="space-y-3">
      <h2 className="text-lg font-semibold">ประวัติการเสนอราคา</h2>
      {bids.length ? <ul className="divide-y divide-white/10">
        {bids.map(entry => <li key={entry.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm">
          <span>{entry.isSelf ? 'คุณ' : entry.maskedBidderName} · {auctionDate(entry.createdAt)}</span><span>{money(entry.bidAmount)}</span>
        </li>)}
      </ul> : <p className="text-sm text-text-secondary">ยังไม่มีการเสนอราคา</p>}
    </Panel>
    <Modal isOpen={Boolean(confirm)} onClose={() => { if (!busy) setConfirm(undefined); }} title="ยืนยันรายการ"
      footer={<Button type="button" isLoading={busy} disabled={!canBid} onClick={() => { if (confirm) void transact(confirm); }}>ยืนยัน</Button>}>
      <p>{confirm?.mode === 'buyout' ? 'ซื้อทันที' : confirm?.mode === 'proxy' ? 'ตั้งราคาสูงสุด' : 'เสนอราคา'} {money(confirm?.mode === 'buyout' ? auction.buyItNowPrice : confirm?.amount)}</p>
    </Modal>
  </PageContainer></main>;
}
