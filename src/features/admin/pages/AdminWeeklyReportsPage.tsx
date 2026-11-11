import { useEffect, useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { weeklyReports, type WeeklyHistory, type WeeklyReport, type CardPerformance } from '../api/weeklyReports';

const money = (value: number) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(value);
const utc = (value: string) => `${value.replace('T', ' ')} UTC`;
const panel = 'rounded-2xl border border-white/10 bg-bg-elevated p-5';
function errorMessage(error: unknown) {
  const status = (error as { response?: { status?: number } })?.response?.status;
  if (status === 401) return 'Your session has expired. Sign in again to view reports.';
  if (status === 403) return 'Only administrators can access weekly reports.';
  if (status === 404) return 'This saved report is not available. Refresh the report history.';
  return 'Could not load weekly reports. Please try again.';
}

function Ranking({ title, cards }: { title: string; cards: CardPerformance[] }) {
  return <section className={panel}>
    <h2 className="mb-4 text-lg font-bold text-white">{title}</h2>
    {!cards.length ? <p className="text-sm text-slate-400">No fulfilled sales in this period.</p> :
      <div className="overflow-x-auto"><table className="w-full text-left text-sm">
        <thead className="text-slate-400"><tr><th className="py-2">Card</th><th>Units</th><th>Revenue</th><th>Gross profit</th></tr></thead>
        <tbody>{cards.map((card, index) => <tr key={card.cardId} className="border-t border-white/10 text-slate-200">
          <td className="py-3 pr-4"><span className="mr-2 text-slate-500">{index + 1}.</span>{card.name}<span className="block text-xs text-slate-400">{card.cardId}</span></td>
          <td className="pr-3">{card.unitsSold}</td><td className="whitespace-nowrap pr-3">{money(card.revenue)}</td><td className="whitespace-nowrap">{money(card.grossProfit)}</td>
        </tr>)}</tbody>
      </table></div>}
  </section>;
}

export function AdminWeeklyReportsPage() {
  const [page, setPage] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const [history, setHistory] = useState<WeeklyHistory | null>(null);
  const [selected, setSelected] = useState('');
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState('');
  const [reportError, setReportError] = useState('');
  const [exportError, setExportError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [stockPage, setStockPage] = useState(0);

  function selectWeek(week: string) {
    setReport(null); setReportError(''); setExportError(''); setReportLoading(Boolean(week)); setStockPage(0);
    setSelected(week);
  }

  function reloadHistory(nextPage = page) {
    setLoading(true); setError(''); setHistory(null); selectWeek('');
    setPage(nextPage); setRefresh(v => v + 1);
  }

  useEffect(() => {
    const controller = new AbortController();
    weeklyReports.history(page, controller.signal).then(data => {
      if (controller.signal.aborted) return;
      setHistory(data);
      setSelected(data.content[0]?.weekEndDate ?? '');
      setReportLoading(data.content.length > 0);
    }).catch(cause => { if (!controller.signal.aborted) setError(errorMessage(cause)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, refresh]);

  useEffect(() => {
    if (!selected) return;
    const controller = new AbortController();
    weeklyReports.get(selected, controller.signal).then(data => {
      if (!controller.signal.aborted) setReport(data);
    }).catch(cause => { if (!controller.signal.aborted) setReportError(errorMessage(cause)); })
      .finally(() => { if (!controller.signal.aborted) setReportLoading(false); });
    return () => controller.abort();
  }, [selected]);

  async function exportCsv() {
    if (!report || exporting) return;
    setExporting(true); setExportError('');
    try { await weeklyReports.download(report.weekEndDate); }
    catch (cause) { setExportError(`Export failed. ${errorMessage(cause)}`); }
    finally { setExporting(false); }
  }

  return <main id="main-content" className="mythix-page space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-xs uppercase tracking-widest text-brand-gold">Platform administration</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Weekly stock & profit reports</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-400">Saved weekly snapshots. Cut-off: Sunday 23:59 UTC; the next period starts at that same instant. Reports appear after the cut-off.</p>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => reloadHistory()} disabled={loading}><RefreshCw size={16} /> Refresh</Button>
        <Button onClick={exportCsv} disabled={!report || reportLoading || exporting || loading}><Download size={16} /> {exporting ? 'Exporting…' : 'Export CSV'}</Button>
      </div>
    </header>
    {loading && <p role="status" className={panel}>Loading report history…</p>}
    {error && <div role="alert" className={panel}><p>{error}</p><Button className="mt-3" onClick={() => reloadHistory()}>Try again</Button></div>}
    {history && !history.content.length && <section className={panel}>
      <h2 className="font-bold text-white">No completed weekly reports yet</h2>
      <p className="mt-2 text-sm text-slate-400">Stock tracking started {utc(history.trackingSince)}. The first report requires a full tracked week. Historical stock figures are not estimated.</p>
      {page > 0 && <Button onClick={() => reloadHistory(0)}>Back to latest reports</Button>}
    </section>}
    {history && history.content.length > 0 && <section className={panel} aria-label="Report history">
      <label className="block text-sm font-semibold text-white" htmlFor="report-week">Saved reporting period (UTC)</label>
      <select id="report-week" value={selected} onChange={e => selectWeek(e.target.value)} className="mt-2 w-full max-w-md rounded-lg border border-white/20 bg-bg-input p-3 text-white">
        {history.content.map(item => <option key={item.weekEndDate} value={item.weekEndDate}>Week ending {item.weekEndDate} at 23:59 UTC</option>)}
      </select>
      <div className="mt-4 flex items-center gap-4 text-sm">
        <Button variant="secondary" disabled={page === 0} onClick={() => reloadHistory(page - 1)}>Newer reports</Button>
        <span>Page {page + 1} of {history.totalPages}</span>
        <Button variant="secondary" disabled={page + 1 >= history.totalPages} onClick={() => reloadHistory(page + 1)}>Older reports</Button>
      </div>
    </section>}
    {!loading && selected && reportLoading && <p role="status" className={panel}>Loading saved report…</p>}
    {!loading && reportError && <div role="alert" className={panel}>{reportError}<Button className="ml-3" onClick={() => reloadHistory()}>Try again</Button></div>}
    {exportError && <p role="alert" className={panel}>{exportError}</p>}
    {!loading && report && <>
      <p className="text-sm text-slate-400">{utc(report.periodStart)} → {utc(report.periodEnd)} (end exclusive). Generated {utc(report.generatedAt)}.</p>
      <section aria-label="Weekly metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Stock added', report.stockAdded.toLocaleString()], ['Stock removed', report.stockRemoved.toLocaleString()],
          ['Fulfilled units sold', report.unitsSold.toLocaleString()], ['Closing inventory units', report.inventoryUnits.toLocaleString()],
          ['Inventory retail value', money(report.totalInventoryValue)], ['Inventory cost value', money(report.inventoryCost)],
          ['Fulfilled sales revenue', money(report.revenue)], ['Gross profit before fees', money(report.grossProfit)],
          ['Recorded platform fees', money(report.totalFeesCollected)], ['Stagnant listings', report.stagnantListings.toLocaleString()],
          ['Stagnant units', report.stagnantUnits.toLocaleString()], ['Stagnant retail value', money(report.stagnantValue)],
        ].map(([label, value]) => <div key={label} className={panel}><h2 className="text-sm text-slate-400">{label}</h2><p className="mt-2 text-2xl font-bold text-white">{value}</p></div>)}
      </section>
      <p className="text-sm text-slate-400">Added stock includes new listings and restocks. Removed stock includes shipments and seller adjustments. Sales, gross profit and recorded fees count FULFILLED orders only; this is not payment-provider settlement confirmation. Inventory values include reserved and hidden stock.</p>
      <div className="grid gap-6 xl:grid-cols-2"><Ranking title="Top 10 cards by revenue" cards={report.topByRevenue} /><Ranking title="Top 10 cards by gross profit" cards={report.topByProfit} /></div>
      <section className={panel}>
        <h2 className="text-lg font-bold text-white">Stagnant inventory · over 60 days</h2>
        <p className="mb-4 mt-1 text-sm text-slate-400">Listings older than 60 days with stock remaining and no SENT or FULFILLED activity during the last 60 days.</p>
        {!report.stagnantInventory.length ? <p className="text-sm text-slate-400">No stagnant inventory in this period.</p> : <>
          <div className="overflow-x-auto"><table className="w-full text-left text-sm">
            <thead className="text-slate-400"><tr><th className="py-2">Card / listing</th><th>Seller ID</th><th>Units</th><th>Retail value</th><th>Listed (UTC)</th></tr></thead>
            <tbody>{report.stagnantInventory.slice(stockPage * 20, (stockPage + 1) * 20).map(item => <tr key={item.productId} className="border-t border-white/10 text-slate-200">
              <td className="py-3 pr-4">{item.name}<span className="block text-xs text-slate-400">{item.cardId} · #{item.productId}</span></td><td>{item.sellerId}</td><td>{item.onHand}</td><td className="whitespace-nowrap pr-3">{money(item.inventoryValue)}</td><td className="whitespace-nowrap">{utc(item.listedAt)}</td>
            </tr>)}</tbody>
          </table></div>
          <div className="mt-4 flex items-center gap-4 text-sm"><Button variant="secondary" disabled={stockPage === 0} onClick={() => setStockPage(p => p - 1)}>Previous listings</Button><span>{stockPage + 1} / {Math.ceil(report.stagnantInventory.length / 20)}</span><Button variant="secondary" disabled={(stockPage + 1) * 20 >= report.stagnantInventory.length} onClick={() => setStockPage(p => p + 1)}>Next listings</Button></div>
        </>}
      </section>
    </>}
  </main>;
}
