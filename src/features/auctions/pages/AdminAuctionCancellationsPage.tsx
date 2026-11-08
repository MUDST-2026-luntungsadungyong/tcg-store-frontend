import { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/shared/components/Button';
import { ButtonLink } from '@/shared/components/ButtonLink';
import { ErrorState } from '@/shared/components/ErrorState';
import { Modal } from '@/shared/components/Modal';
import { PageContainer, PageHeader, Panel } from '@/shared/components/PageLayout';
import { SearchField } from '@/shared/components/SearchField';
import { auctionApi, auctionError, type CancellationRequest } from '../api/auctions';
import { EvidenceImages } from '../components/AuctionCancellation';
import { AuctionCardSummary, AuctionLink, AuctionLoading, AuctionStatusBadge, DetailRows, Notice } from '../components/AuctionUI';
import { AUCTION_TIMEZONE, CANCELLATIONS_PATH, auctionDate, matchesAuctionSearch, money } from '../model/auctionFormat';
import { useAuctionClock, useAuctionResource } from '../model/useAuctionResource';

const TODAY = new Intl.DateTimeFormat('en-GB', { timeZone: AUCTION_TIMEZONE, dateStyle: 'short' });
const adminEyebrow = <span className="text-brand-gold">Platform administration</span>;

function canApprove(request: CancellationRequest) {
  return request.auctionStatus === 'ACTIVE' || request.auctionStatus === 'SCHEDULED';
}

export function AdminAuctionCancellationsPage() {
  const [reviewed, setReviewed] = useState(false);
  const [query, setQuery] = useState('');
  const { data, loading, error, reload } = useAuctionResource(auctionApi.requests, 'Could not load cancellation requests.');
  const requests = data ?? [];
  const pending = requests.filter(request => request.status === 'PENDING_REVIEW');
  const closed = requests.filter(request => request.status !== 'PENDING_REVIEW');
  const today = TODAY.format(useAuctionClock(60_000));
  const metrics = [
    ['Pending review', pending.length],
    ['Reviewed today', closed.filter(request => request.reviewedAt && TODAY.format(Date.parse(request.reviewedAt)) === today).length],
    ['Needs manual handling', pending.filter(request => !canApprove(request)).length],
  ] as const;
  const rows = (reviewed ? closed : pending).filter(request => matchesAuctionSearch(query,
    request.sellerName, request.cardName, request.auctionId, request.id, request.reason));

  return <main><PageContainer className="space-y-6">
    <PageHeader eyebrow={adminEyebrow} title="Cancellation requests" description="Review exceptional circumstances and evidence before making a decision."
      actions={<Button type="button" variant="gold" isLoading={loading} onClick={() => { void reload(); }}>Refresh</Button>} />
    {loading && !data && <AuctionLoading label="Loading cancellation requests" />}
    {error && <ErrorState message={error} onRetry={() => reload()} />}
    {data && !error && <>
      <div className="grid gap-3 sm:grid-cols-3">
        {metrics.map(([label, count]) => <Panel key={label} className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-gold">{label}</p>
          <p className="text-2xl font-bold tabular-nums">{count}</p>
        </Panel>)}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Cancellation request status">
          <Button type="button" aria-pressed={!reviewed} variant={reviewed ? 'secondary' : 'gold'} onClick={() => setReviewed(false)}>Pending review ({pending.length})</Button>
          <Button type="button" aria-pressed={reviewed} variant={reviewed ? 'gold' : 'secondary'} onClick={() => setReviewed(true)}>Reviewed ({closed.length})</Button>
        </div>
        <div className="min-w-0 grow">
          <SearchField aria-label="Search cancellation requests" placeholder="Search seller, card, reason or request ID" value={query} onChange={event => setQuery(event.target.value)} />
        </div>
      </div>
      {rows.length ? <Panel className="overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[690px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-text-muted">
              <tr>{['Seller', 'Card / Auction', 'Status', 'Latest bids', 'Submitted · Bangkok', 'Review'].map(label => <th key={label} scope="col" className="p-4 font-semibold">{label}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {rows.map(request => <tr key={request.id}>
                <td className="p-4 font-semibold">{request.sellerName}</td>
                <td className="p-4">
                  <p>{request.cardName} · Auction #{request.auctionId}</p>
                  <p className="text-xs text-text-secondary">Request #{request.id}</p>
                </td>
                <td className="space-y-2 p-4">
                  <AuctionStatusBadge status={request.status} />
                  <div><AuctionStatusBadge status={request.auctionStatus} /></div>
                </td>
                <td className="p-4 tabular-nums">{request.bidCount}</td>
                <td className="p-4">{auctionDate(request.createdAt)}</td>
                <td className="p-4"><AuctionLink to={`${CANCELLATIONS_PATH}/${request.id}`}>Review request</AuctionLink></td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </Panel> : <Panel className="py-10 text-center">
        <h2 className="text-lg font-semibold">{query.trim() ? 'No matching requests' : reviewed ? 'No reviewed requests yet' : 'No pending cancellation requests'}</h2>
        <p className="mt-2 text-sm text-text-secondary">{query.trim() ? 'Try a different search.' : 'Requests appear here when their review status changes.'}</p>
      </Panel>}
    </>}
  </PageContainer></main>;
}

export function AdminAuctionCancellationReviewPage() {
  const { requestId } = useParams();
  return <CancellationReview key={requestId} id={Number(requestId)} />;
}

function CancellationReview({ id }: { id: number }) {
  const [decision, setDecision] = useState<'approve' | 'reject' | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [decisionError, setDecisionError] = useState('');
  const fetchData = useCallback(() => auctionApi.request(id), [id]);
  const { data: request, loading, error, reload, replaceData } = useAuctionResource(fetchData, 'Could not load the cancellation request.');

  const closeDecision = () => {
    if (!busy) setDecision(null);
  };
  const recordDecision = async () => {
    if (!request || !decision) return;
    setBusy(true);
    setDecisionError('');
    try {
      const updated = decision === 'approve' ? await auctionApi.approve(id) : await auctionApi.reject(id, reason.trim());
      replaceData(updated);
    } catch (failure) {
      setDecisionError(auctionError(failure, 'The decision could not be confirmed. Check the latest status before retrying.'));
      await reload(true);
    } finally {
      setBusy(false);
      setDecision(null);
    }
  };
  const pending = request?.status === 'PENDING_REVIEW';
  const eligible = Boolean(request && canApprove(request));
  const back = <ButtonLink to={CANCELLATIONS_PATH} variant="secondary">Back to Queue</ButtonLink>;
  return <main><PageContainer className="space-y-6">
    <PageHeader eyebrow={adminEyebrow} title="Review cancellation request"
      description={request ? `Request #${request.id} · ${request.cardName} · Auction #${request.auctionId}` : undefined}
      actions={<Button type="button" variant="secondary" isLoading={loading} onClick={() => { setDecisionError(''); void reload(); }}>Refresh</Button>} />
    {loading && !request && <AuctionLoading label="Loading cancellation request" />}
    {error && <ErrorState message={error} onRetry={() => reload()} />}
    {decisionError && pending && <div role="alert" className="space-y-2 rounded-xl border border-status-danger/25 bg-status-danger/5 p-4">
      <p className="text-sm text-status-danger">{decisionError}</p>
      <Button type="button" variant="secondary" size="sm" onClick={() => { setDecisionError(''); void reload(); }}>Check decision status</Button>
    </div>}
    {request && <>
      <div className="flex flex-wrap items-center gap-3">
        <AuctionStatusBadge status={request.status} />
        <p className="text-sm text-text-secondary">Submitted {auctionDate(request.createdAt)} · {AUCTION_TIMEZONE}</p>
      </div>
      {!pending && <div role="status"><Notice tone={request.status === 'APPROVED' ? 'success' : 'info'}
        title={request.status === 'APPROVED' ? 'Auction cancellation confirmed' : 'Request rejected'}>
        {request.status === 'APPROVED' ? 'The auction was cancelled and its inventory hold was released.' : 'The request was rejected. The auction follows its normal lifecycle.'}
      </Notice></div>}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-4">
          <Panel className="space-y-4">
            <h2 className="text-lg font-semibold">Reason & evidence</h2>
            <p className="whitespace-pre-wrap break-words text-sm text-text-secondary">{request.reason}</p>
            <EvidenceImages evidence={request.evidence} />
            <p className="text-xs text-text-secondary">Inspect the original evidence before recording a decision.</p>
          </Panel>
          <Panel className="space-y-4">
            <h2 className="text-lg font-semibold">Decision history</h2>
            <DetailRows items={[
              ['Request received', auctionDate(request.createdAt)],
              ['Decision', pending ? 'Pending review' : request.status],
              ['Reviewed', auctionDate(request.reviewedAt)],
            ]} />
            {request.decisionReason && <p className="whitespace-pre-wrap break-words text-sm text-text-secondary">{request.decisionReason}</p>}
          </Panel>
        </div>
        <aside className="min-w-0 space-y-4">
          <Panel className="space-y-3">
            <h2 className="text-lg font-semibold">Seller</h2>
            <p className="font-medium">{request.sellerName}</p>
            <p className="text-sm text-text-secondary">Seller #{request.sellerId}</p>
          </Panel>
          <Panel className="space-y-4">
            <h2 className="text-lg font-semibold">Current auction</h2>
            <AuctionCardSummary name={request.cardName} imageUrl={request.imageUrl} condition={request.condition} inventoryId={request.productId} />
            <AuctionStatusBadge status={request.auctionStatus} />
            <DetailRows items={[
              ['Latest bid count', request.bidCount],
              ['Highest bid', money(request.highestBid)],
              [`Ends · ${AUCTION_TIMEZONE}`, auctionDate(request.endAt)],
            ]} />
          </Panel>
        </aside>
      </div>
      {pending && <Notice title={eligible ? 'Check current eligibility before approval' : 'This auction is no longer cancellable'} tone="warning">
        {eligible ? 'Approval checks the latest auction status. The auction continues while review is pending.' : 'The request remains open for a decision. Approval is unavailable once the auction has ended.'}
      </Notice>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {back}
        {pending && !error && <div className="flex flex-wrap gap-2">
          <Button type="button" variant="danger" disabled={loading || busy} onClick={() => { setReason(''); setDecision('reject'); }}>Reject Request</Button>
          <Button type="button" variant="gold" disabled={!eligible || loading || busy} onClick={() => setDecision('approve')}>Approve Cancellation</Button>
        </div>}
      </div>
    </>}
    {!request && back}
    <Modal isOpen={Boolean(decision)} onClose={closeDecision} title={decision === 'approve' ? 'Approve cancellation?' : 'Reject cancellation request?'}
      footer={<>
        <Button type="button" variant="secondary" disabled={busy} onClick={closeDecision}>Back to Review</Button>
        <Button type="submit" form="cancellation-decision" variant={decision === 'approve' ? 'gold' : 'danger'} isLoading={busy}
          disabled={decision === 'reject' && !reason.trim()}>
          {decision === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
        </Button>
      </>}
    >
      <form id="cancellation-decision" className="space-y-3" onSubmit={event => { event.preventDefault(); void recordDecision(); }}>
        <p className="text-sm text-text-secondary">{decision === 'approve'
          ? 'Approval cancels the auction if it is still eligible and releases its inventory hold.'
          : 'Rejection records your reason and leaves the auction status as it is.'}</p>
        {decision === 'reject' && <div className="space-y-2">
          <label htmlFor="cancellation-reject-reason" className="text-sm font-medium">Rejection reason</label>
          <textarea id="cancellation-reject-reason" required rows={4} maxLength={1000} value={reason} disabled={busy}
            onChange={event => setReason(event.target.value)}
            className="block w-full rounded-xl border border-white/15 bg-bg-input p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
        </div>}
      </form>
    </Modal>
  </PageContainer></main>;
}
