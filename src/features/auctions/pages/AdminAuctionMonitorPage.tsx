import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/shared/components/Button';

import { ErrorState } from '@/shared/components/ErrorState';

import { Modal } from '@/shared/components/Modal';

import { PageContainer, PageHeader, Panel } from '@/shared/components/PageLayout';

import { SearchField } from '@/shared/components/SearchField';

import { adminAuctionApi, type AdminAuction } from '../api/adminAuctions';

import { auctionError } from '../api/auctions';

import { AuctionLoading, AuctionStatusBadge } from '../components/AuctionUI';

import { auctionDate, matchesAuctionSearch, money } from '../model/auctionFormat';

import { useAuctionResource } from '../model/useAuctionResource';



type Action = 'pause' | 'resume' | 'cancel';

export function AdminAuctionMonitorPage() {

  const [page, setPage] = useState(0);

  const fetchPage = useCallback(() => adminAuctionApi.list(page), [page]);

  const { data, loading, error, reload } = useAuctionResource(fetchPage, 'Could not load auctions.');

  const pollBusy = useRef(false);

  useEffect(() => {

    let cancelled = false;

    let timer: number;

    const poll = async () => {

      if (!pollBusy.current) { pollBusy.current = true; try { await reload(true); } finally { pollBusy.current = false; } }

      if (!cancelled) timer = window.setTimeout(() => void poll(), 10000);

    };

    timer = window.setTimeout(() => void poll(), 10000);

    return () => { cancelled = true; window.clearTimeout(timer); };

  }, [reload]);

  const [query, setQuery] = useState('');

  const [selection, setSelection] = useState<{ auction: AdminAuction; action: Action }>();

  const [reason, setReason] = useState('');

  const [busy, setBusy] = useState(false);

  const [failure, setFailure] = useState('');

  const [notice, setNotice] = useState('');

  const rows = (data?.content ?? []).filter(a => matchesAuctionSearch(query, a.id, a.cardName, a.sellerId, a.leadingBidderId));

  async function submit() {

    if (!selection || !reason.trim()) return;

    setBusy(true); setFailure('');

    try {

      await adminAuctionApi.action(selection.auction.id, selection.action, reason.trim());

      setNotice(`Auction #${selection.auction.id} was ${selection.action === 'pause' ? 'paused' : selection.action === 'resume' ? 'resumed' : 'cancelled'}.`);

      setSelection(undefined); setReason(''); await reload();

    } catch (err) { setFailure(auctionError(err, 'The action could not be saved. Refresh the auction status and try again.')); }

    finally { setBusy(false); }

  }

  return <main><PageContainer className="space-y-6">

    <PageHeader eyebrow={<span className="text-brand-gold">Platform administration</span>} title="Auction monitoring" description="Review live auction activity and intervene when an auction needs attention." actions={<Button variant="secondary" isLoading={loading} onClick={() => void reload()}>Refresh</Button>} />

    {notice && <p role="status" className="rounded-xl border border-status-success/30 p-4 text-sm">{notice}</p>}

    {loading && !data && <AuctionLoading label="Loading auctions" />}

    {error && <ErrorState message={error} onRetry={() => reload()} />}

    {data && !error && <>

      <SearchField aria-label="Search auctions on this page" placeholder="Search this page by card, auction, seller or bidder ID" value={query} onChange={event => setQuery(event.target.value)} />

      <p className="text-sm text-text-secondary">Search filters the auctions on the current page.</p>
      {rows.length ? <Panel className="overflow-hidden !p-0"><div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm">

        <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-text-muted"><tr>{['Auction', 'Seller', 'Status', 'Latest bid', 'Leading bidder', 'Ends · Bangkok', 'Actions'].map(label => <th key={label} scope="col" className="p-4">{label}</th>)}</tr></thead>

        <tbody className="divide-y divide-white/10">{rows.map(a => <tr key={a.id}>

          <td className="p-4"><p className="font-semibold">{a.cardName || 'Auction'}</p><p className="text-text-secondary">#{a.id}</p></td><td className="p-4">#{a.sellerId}</td>

          <td className="p-4">{a.status === 'PAUSED' ? <span className="text-status-warning">Paused</span> : <AuctionStatusBadge status={a.status} />}</td>

          <td className="p-4 tabular-nums">{money(a.highestBid)}<p className="text-xs text-text-secondary">{a.bidCount} bids · {auctionDate(a.latestBidAt)}</p>{a.priceAnomaly && <p className="text-status-warning">Unusual price increase</p>}</td><td className="p-4">{a.leadingBidderId ? `#${a.leadingBidderId}` : '—'}{a.highRiskUser && <p className="mt-1 text-status-warning">High-risk bidder</p>}</td><td className="p-4">{auctionDate(a.endAt)}</td>

          <td className="p-4"><div className="flex flex-wrap gap-2">{(a.status === 'ACTIVE' || a.status === 'PAUSED') && <Button size="sm" variant="secondary" onClick={() => { setFailure(''); setReason(''); setSelection({ auction: a, action: a.status === 'PAUSED' ? 'resume' : 'pause' }); }}>{a.status === 'PAUSED' ? 'Resume' : 'Pause'}</Button>}{['ACTIVE', 'SCHEDULED', 'PAUSED'].includes(a.status) && <Button size="sm" variant="danger" onClick={() => { setFailure(''); setReason(''); setSelection({ auction: a, action: 'cancel' }); }}>Force cancel</Button>}</div></td>

        </tr>)}</tbody></table></div></Panel> : <Panel className="py-12 text-center"><h2 className="text-lg font-semibold">{query ? 'No matching auctions' : 'No auctions to monitor'}</h2><p className="mt-2 text-sm text-text-secondary">{query ? 'Try another card name or ID.' : 'Auctions will appear here when they are available for monitoring.'}</p></Panel>}

      {data.totalPages > 1 && <div className="flex items-center gap-3"><Button variant="secondary" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button><span>Page {page + 1} of {data.totalPages}</span><Button variant="secondary" disabled={page + 1 >= data.totalPages} onClick={() => setPage(page + 1)}>Next</Button></div>}

    </>}

    <Modal isOpen={Boolean(selection)} onClose={() => { if (!busy) setSelection(undefined); }} title={`${selection?.action === 'cancel' ? 'Force cancel' : selection?.action === 'resume' ? 'Resume' : 'Pause'} auction #${selection?.auction.id ?? ''}?`} footer={<><Button variant="secondary" disabled={busy} onClick={() => setSelection(undefined)}>Back</Button><Button variant={selection?.action === 'cancel' ? 'danger' : 'primary'} isLoading={busy} disabled={!reason.trim()} onClick={() => void submit()}>Confirm action</Button></>}>

      <div className="space-y-3"><p className="text-sm text-text-secondary">{selection?.action === 'cancel' ? 'This cancels the auction and records your reason.' : selection?.action === 'pause' ? 'Bidding and the countdown will be suspended while the auction is reviewed.' : 'Bidding and the countdown will resume.'}</p><label className="block text-sm font-medium">Reason<textarea required maxLength={1000} value={reason} onChange={event => setReason(event.target.value)} className="mt-2 block w-full rounded-xl border border-white/20 bg-bg-input p-3" rows={4} /></label>{failure && <p role="alert" className="text-sm text-status-danger">{failure}</p>}</div>

    </Modal>

  </PageContainer></main>;

}
