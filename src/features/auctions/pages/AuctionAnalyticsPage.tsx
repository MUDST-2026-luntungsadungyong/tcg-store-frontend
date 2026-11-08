import { Link } from 'react-router-dom';
import { auctionApi } from '../api/auctions';
import { AUCTIONS_PATH, money } from '../model/auctionFormat';
import { useAuctionResource } from '../model/useAuctionResource';

export function AuctionAnalyticsPage() {
  const { data, error, loading, reload } = useAuctionResource(auctionApi.getSellerAnalytics, 'Could not load analytics.');
  return <main className="mx-auto max-w-6xl space-y-5 p-5">
    <Link to={AUCTIONS_PATH} className="underline">My Auctions</Link>
    <h1 className="text-2xl font-bold">Auction Analytics</h1>
    {error && <p role="alert">{error} <button onClick={() => void reload()} className="underline">Retry</button></p>}
    {loading && <p role="status">Loading analytics…</p>}
    {data && <>
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ['Fulfilled auctions', data.totalCompletedAuctions],
          ['Gross volume', money(data.grossAuctionVolume)],
          ['Platform fees', money(data.totalPlatformFee)],
          ['Net profit', money(data.netRealizedProfit)],
        ].map(([label, value]) => <div key={label} className="rounded-lg bg-bg-elevated p-3">
          <dt className="text-text-secondary">{label}</dt><dd className="font-semibold">{value}</dd>
        </div>)}
      </dl>
      <h2 className="text-lg font-semibold">Starting and final prices</h2>
      {data.items.length === 0 && <p>No fulfilled auctions yet.</p>}
      {data.items.map(item => {
        const max = Math.max(item.startPrice, item.finalPrice, 1);
        return <section key={item.auctionId} className="space-y-2 rounded-lg bg-bg-elevated p-4">
          <Link to={`${AUCTIONS_PATH}/${item.auctionId}`} className="font-semibold underline">{item.cardName}</Link>
          {([['Start', item.startPrice], ['Final', item.finalPrice]] as const).map(([label, price]) =>
            <div key={label} className="grid grid-cols-[4rem_1fr_auto] items-center gap-3">
              <span>{label}</span>
              <div aria-hidden="true" className="h-2 rounded bg-bg-surface">
                <div className={`h-full rounded ${label === 'Start' ? 'bg-brand-blue' : 'bg-brand-gold'}`} style={{ width: `${price / max * 100}%` }} />
              </div>
              <span>{money(price)}</span>
            </div>)}
          <p className="text-sm text-text-secondary">Cost {money(item.costBasis)} · Fee {money(item.platformFee)} · Profit {money(item.netProfit)}</p>
        </section>;
      })}
    </>}
  </main>;
}
