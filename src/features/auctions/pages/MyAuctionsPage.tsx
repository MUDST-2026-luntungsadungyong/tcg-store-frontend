import { useState } from 'react';
import { Gavel } from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { ButtonLink } from '@/shared/components/ButtonLink';
import { ErrorState } from '@/shared/components/ErrorState';
import { FeedbackPopup } from '@/shared/components/FeedbackPopup';
import { PageHeader, Panel, Toolbar } from '@/shared/components/PageLayout';
import { SearchField } from '@/shared/components/SearchField';
import { auctionApi, auctionError, type Auction, type AuctionStatus } from '../api/auctions';
import { AuctionCardSummary, AuctionLink, AuctionLoading, AuctionPage, AuctionStatusBadge, Notice, RefreshButton } from '../components/AuctionUI';
import { AUCTIONS_PATH, AUCTION_TIMEZONE, auctionDate, countdown, matchesAuctionSearch, money } from '../model/auctionFormat';
import { useAuctionClock, useAuctionResource } from '../model/useAuctionResource';

const TABS: Array<{ name: string; statuses: AuctionStatus[]; description: string }> = [
  { name: 'Drafts', statuses: ['DRAFT'], description: 'Pick up where you left off. Drafts are private and can be edited or deleted.' },
  { name: 'Scheduled', statuses: ['SCHEDULED'], description: 'Your upcoming auctions. Inventory is held from confirmation.' },
  { name: 'Active', statuses: ['ACTIVE'], description: 'Manage your auctions, follow bids and keep track of every outcome.' },
  { name: 'Ended & Awaiting Payment', statuses: ['ENDED', 'AWAITING_PAYMENT', 'BUYOUT_COMPLETED', 'UNSOLD_NO_BIDS', 'RESERVE_NOT_MET', 'DEFAULTED', 'CANCELLED'], description: 'Review auction outcomes and payment progress after bidding ends.' },
  { name: 'Completed', statuses: ['COMPLETED'], description: 'View completed auctions and their payment history.' },
];
const MONTH = new Intl.DateTimeFormat('en-GB', { timeZone: AUCTION_TIMEZONE, month: 'numeric', year: 'numeric' });
const PAGE_SIZE = 12;

function statusNote(status: AuctionStatus) {
  switch (status) {
    case 'ENDED': return 'Auction ended';
    case 'BUYOUT_COMPLETED':
    case 'AWAITING_PAYMENT': return 'Awaiting buyer payment';
    case 'UNSOLD_NO_BIDS': return 'No sale · No bids';
    case 'RESERVE_NOT_MET': return 'No sale · Reserve not met';
    case 'DEFAULTED': return 'Winner missed payment deadline';
    case 'COMPLETED': return 'Completed';
    case 'CANCELLED': return 'Cancelled';
    default: return '—';
  }
}

function auctionTiming(auction: Auction, now: number) {
  if (auction.status === 'ACTIVE' || auction.status === 'SCHEDULED') {
    const active = auction.status === 'ACTIVE';
    const date = active ? auction.endAt : auction.startAt;
    return <><p className="font-semibold">{countdown(date, now)}</p><p className="text-xs text-text-secondary">{active ? 'Ends' : 'Starts'} {auctionDate(date)}</p></>;
  }
  if (auction.status === 'DRAFT') return <><p>{auctionDate(auction.updatedAt)}</p><p className="text-xs text-text-secondary">Last saved</p></>;
  if (auction.status === 'ENDED' && auction.bidCount === 0) return 'No sale · No bids';
  return statusNote(auction.status);
}

export function MyAuctionsPage() {
  const [selectedTab, setSelectedTab] = useState(2);
  const [query, setQuery] = useState('');
  const [requestedPage, setRequestedPage] = useState(1);
  const [deleting, setDeleting] = useState<Auction>();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [message, setMessage] = useState('');
  const now = useAuctionClock();
  const { data, error, loading, reload, replaceData } = useAuctionResource(auctionApi.list, 'Could not load your auctions.', 15_000);
  const auctions = data ?? [];
  const tab = TABS[selectedTab];
  const visible = auctions.filter(auction => tab.statuses.includes(auction.status)
    && matchesAuctionSearch(query, auction.cardName, auction.id, `AUC-${auction.id}`, auction.productId, auction.setName));
  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  const rows = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const month = MONTH.format(now);
  const metrics = [
    ['Active auctions', auctions.filter(auction => auction.status === 'ACTIVE').length],
    ['Total bids', auctions.reduce((sum, auction) => sum + auction.bidCount, 0)],
    ['Awaiting payment', auctions.filter(auction => auction.status === 'AWAITING_PAYMENT').length],
    ['Completed this month', auctions.filter(auction => auction.status === 'COMPLETED' && MONTH.format(Date.parse(auction.updatedAt)) === month).length],
  ] as const;
  const deleteDraft = async () => {
    if (!deleting) return;
    setBusy(true);
    setActionError('');
    try {
      await auctionApi.deleteDraft(deleting.id);
      replaceData(auctions.filter(auction => auction.id !== deleting.id));
      setDeleting(undefined);
      setMessage('Draft deleted.');
    } catch (failure) {
      setDeleting(undefined);
      setActionError(auctionError(failure, 'Could not delete the draft. Refresh the list before trying again.'));
      void reload(true);
    } finally {
      setBusy(false);
    }
  };

  return <AuctionPage>
    <PageHeader eyebrow="Seller auctions" title="My Auctions" description={tab.description}
      actions={<div className="flex gap-2">
        <ButtonLink to={`${AUCTIONS_PATH}/analytics`} variant="secondary">Auction Analytics</ButtonLink>
        <ButtonLink to={`${AUCTIONS_PATH}/new`}>Create Auction</ButtonLink>
      </div>} />
    {message && <div role="status"><Notice title={message} tone="success">Your inventory is unchanged.</Notice></div>}
    {actionError && <ErrorState message={actionError} onRetry={() => { setActionError(''); return reload(); }} />}
    {loading && !data && <AuctionLoading label="Loading auctions" />}
    {error && <ErrorState message={error} onRetry={() => reload()} />}
    {data && <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metrics.map(([label, count]) => <Panel key={label} className="space-y-1">
          <p className="text-xs text-text-secondary sm:text-sm">{label}</p>
          <p className="text-2xl font-bold tabular-nums">{count}</p>
        </Panel>)}
      </div>
      <nav aria-label="Auction statuses" className="flex flex-wrap gap-2">
        {TABS.map(({ name, statuses }, index) => <Button key={name} type="button" size="sm"
          variant={selectedTab === index ? 'primary' : 'secondary'} aria-pressed={selectedTab === index}
          onClick={() => { setSelectedTab(index); setRequestedPage(1); }}>
          {name} <span className="ml-1 opacity-80">{auctions.filter(auction => statuses.includes(auction.status)).length}</span>
        </Button>)}
      </nav>
      {selectedTab === 0 && <Notice title="Draft inventory stays available">Availability is checked again before creation.</Notice>}
      <Panel className="!p-3">
        <Toolbar>
          <div className="flex-1">
            <SearchField aria-label="Search auctions" placeholder="Search card name, auction ID or inventory item" value={query}
              onChange={event => { setQuery(event.target.value); setRequestedPage(1); }} />
          </div>
          <RefreshButton busy={loading} onClick={() => { void reload(); }} />
        </Toolbar>
      </Panel>
      {rows.length ? <Panel className="overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[690px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-text-muted">
              <tr>{['Card / Auction', 'Auction / Request', selectedTab === 0 || selectedTab === 1 ? 'Start price' : 'Highest bid', 'Bids',
                ['Last saved', 'Starts in', 'Time remaining', 'Result / Payment', 'Result / Payment'][selectedTab], 'Actions'].map(label => <th key={label} scope="col" className="p-4 font-semibold">{label}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {rows.map(auction => <tr key={auction.id}>
                <td className="p-4">
                  <AuctionCardSummary name={auction.cardName} imageUrl={auction.imageUrl} setName={auction.setName} condition={auction.condition} />
                  <p className="mt-1 text-xs text-brand-blue">{auction.status === 'DRAFT' ? 'Draft' : 'Auction'} #{auction.id}</p>
                </td>
                <td className="space-y-2 p-4">
                  <AuctionStatusBadge status={auction.status} />
                  {auction.cancellationRequest && <div><AuctionStatusBadge status={auction.cancellationRequest.status} /></div>}
                </td>
                <td className="p-4 font-semibold">{money(selectedTab === 0 || selectedTab === 1 ? auction.startPrice : auction.highestBid)}</td>
                <td className="p-4 tabular-nums">{auction.bidCount}</td>
                <td className="p-4 tabular-nums">{auctionTiming(auction, now)}</td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-x-3">
                    <AuctionLink to={`${AUCTIONS_PATH}/${auction.id}`}>View details</AuctionLink>
                    {auction.status === 'DRAFT' && <>
                      <AuctionLink to={`${AUCTIONS_PATH}/${auction.id}/edit`}>Edit Draft</AuctionLink>
                      <Button type="button" size="sm" variant="ghost" onClick={() => setDeleting(auction)}>Delete Draft</Button>
                    </>}
                  </div>
                </td>
              </tr>)}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-4 py-3">
          <p className="text-xs text-text-secondary">Showing {rows.length} of {visible.length} auctions · {AUCTION_TIMEZONE}</p>
          {totalPages > 1 && <div className="flex items-center gap-2">
            <Button type="button" size="sm" variant="secondary" disabled={page === 1} onClick={() => setRequestedPage(page - 1)}>Previous</Button>
            <span className="text-sm">{page} / {totalPages}</span>
            <Button type="button" size="sm" variant="secondary" disabled={page === totalPages} onClick={() => setRequestedPage(page + 1)}>Next</Button>
          </div>}
        </div>
      </Panel> : <Panel className="flex flex-col items-center gap-3 py-10 text-center">
        <Gavel size={26} aria-hidden className="text-brand-blue" />
        <h2 className="text-lg font-semibold">{query.trim() ? 'No matching auctions' : 'No auctions in this status'}</h2>
        <p className="text-sm text-text-secondary">{query.trim() ? 'Try a different card name or auction ID.' : 'Your auctions appear here as their status changes.'}</p>
        {!query.trim() && <ButtonLink to={`${AUCTIONS_PATH}/new`} variant="secondary" size="sm">Create Auction</ButtonLink>}
      </Panel>}
    </>}
    <FeedbackPopup isOpen={Boolean(deleting)} tone="destructive" title="Delete this draft?"
      message={`Draft #${deleting?.id ?? ''} will be permanently removed. Your inventory stays available.`}
      primaryAction={{ label: 'Delete Draft', onClick: () => { void deleteDraft(); }, isLoading: busy }}
      secondaryAction={{ label: 'Keep Draft', onClick: () => { if (!busy) setDeleting(undefined); } }}
    />
  </AuctionPage>;
}
