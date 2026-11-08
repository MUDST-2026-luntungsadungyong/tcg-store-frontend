import { useCallback, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { formatCondition } from '@/entities/card/model/condition';
import { Button } from '@/shared/components/Button';
import { ButtonLink } from '@/shared/components/ButtonLink';
import { ErrorState } from '@/shared/components/ErrorState';
import { FeedbackPopup } from '@/shared/components/FeedbackPopup';
import { PageHeader, Panel } from '@/shared/components/PageLayout';
import { auctionApi, auctionError, type Auction } from '../api/auctions';
import { CancellationRecord, RequestCancellationForm } from '../components/AuctionCancellation';
import { AuctionCardSummary, AuctionLoading, AuctionPage, AuctionStatusBadge, DetailRows, Notice, RefreshButton } from '../components/AuctionUI';
import { AuctionPhotos } from '../components/AuctionWizardSections';
import { AUCTIONS_PATH, AUCTION_TIMEZONE, auctionDate, countdown, durationLabel, money } from '../model/auctionFormat';
import { useAuctionClock, useAuctionResource } from '../model/useAuctionResource';

export function AuctionDetailsPage() {
  const { auctionId } = useParams();
  return <AuctionDetails key={auctionId} id={Number(auctionId)} />;
}

function AuctionDetails({ id }: { id: number }) {
  const navigate = useNavigate();
  const location = useLocation();
  const created = Boolean((location.state as { created?: boolean } | null)?.created);
  const [confirm, setConfirm] = useState<'cancel' | 'delete' | null>(null);
  const [requestForm, setRequestForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const fetchData = useCallback(() => auctionApi.get(id), [id]);
  const { data: auction, error, loading, reload, replaceData } = useAuctionResource(fetchData, 'Could not load auction details.', 15_000);
  const now = useAuctionClock();
  const live = auction?.status === 'ACTIVE' || auction?.status === 'SCHEDULED';
  const pending = auction?.cancellationRequest?.status === 'PENDING_REVIEW';
  const canRequest = live && auction.bidCount > 0 && !pending;

  const runAction = async () => {
    if (!confirm) return;
    setBusy(true);
    setMessage('');
    try {
      if (confirm === 'delete') {
        await auctionApi.deleteDraft(id);
        navigate(AUCTIONS_PATH, { replace: true });
      } else {
        replaceData(await auctionApi.cancel(id));
      }
    } catch (failure) {
      setMessage(auctionError(failure, 'Could not confirm the change. Check the latest status before retrying.'));
      await reload(true);
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  const requestCancellation = async (form: FormData) => {
    if (!auction) return;
    setBusy(true);
    setMessage('');
    try {
      const cancellationRequest = await auctionApi.requestCancellation(id, form);
      replaceData({ ...auction, status: cancellationRequest.auctionStatus, cancellationRequest });
      setRequestForm(false);
    } catch (failure) {
      setMessage(auctionError(failure, 'Could not submit the request. Check the latest status before retrying.'));
      await reload(true);
    } finally {
      setBusy(false);
    }
  };

  if (!auction) return <AuctionPage>
    <PageHeader eyebrow="Seller auctions" title="Auction Details" />
    {loading ? <AuctionLoading label="Loading auction details" /> : <ErrorState message={error} onRetry={() => reload()} />}
    <ButtonLink to={AUCTIONS_PATH} variant="secondary">Back to My Auctions</ButtonLink>
  </AuctionPage>;

  const status = auction.status;
  const request = auction.cancellationRequest;
  const deleted = confirm === 'delete';
  if (requestForm && canRequest) return <AuctionPage>
    <PageHeader eyebrow="Seller auctions" title="Request Cancellation"
      description={`Auction #${id} · Exceptional circumstances require administrator review.`} />
    <Notice title={`${auction.bidCount} bids received`} tone="warning">Submit a request with evidence. The auction continues until an administrator approves the cancellation.</Notice>
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <RequestCancellationForm busy={busy} error={message} onBack={() => { setRequestForm(false); setMessage(''); }} onSubmit={form => { void requestCancellation(form); }} />
      <div className="space-y-4">
        <AuctionOverview auction={auction} />
        <BidOverview auction={auction} now={now} />
      </div>
    </div>
  </AuctionPage>;
  return <AuctionPage>
    <PageHeader eyebrow="Seller auctions" title={status === 'CANCELLED' ? 'Auction Cancelled' : 'Auction Details'}
      description={`${status === 'DRAFT' ? 'Draft' : 'Auction'} #${id} · ${auction.cardName || 'Untitled draft'}`}
      actions={<RefreshButton busy={loading} onClick={() => { setMessage(''); void reload(); }} />} />
    {error && <ErrorState message={error} onRetry={() => reload()} />}
    {message && <ErrorState message={message} onRetry={() => { setMessage(''); return reload(); }} />}
    {created && live && <div role="status"><Notice tone="success" title={status === 'SCHEDULED' ? 'Auction scheduled successfully' : 'Auction created successfully'}>
      Inventory #{auction.productId} is reserved for this auction.
    </Notice></div>}
    {status === 'CANCELLED' && <Notice title="Your auction has been cancelled" tone="success">
      The auction hold was released. Any other reservations still apply.
    </Notice>}
    {pending && <Notice title="Cancellation request submitted" tone="warning">
      {live ? 'Your request is pending review. The auction continues and inventory stays reserved.' : 'Your request is pending review. The auction has already ended.'}
    </Notice>}
    {status === 'ENDED' && auction.bidCount === 0 && <Notice title="Auction ended">No bids were placed. The auction hold was released.</Notice>}
    {status === 'DRAFT' && <Notice title="Inventory is available">Drafts do not reserve stock. Availability is checked when you confirm creation.</Notice>}
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <div className="min-w-0 space-y-4">
        <AuctionOverview auction={auction} />
        {(auction.frontImageUrl || auction.backImageUrl) && <AuctionPhotos urls={{ front: auction.frontImageUrl, back: auction.backImageUrl }} />}
        {request && <CancellationRecord request={request} />}
      </div>
      <aside className="min-w-0 space-y-4">
        <BidOverview auction={auction} now={now} />
        <Panel className="space-y-4">
          <h2 className="text-lg font-semibold">Pricing · Seller only</h2>
          <DetailRows items={[
            ['Starting price', money(auction.startPrice)],
            ['Hidden reserve · Seller only', money(auction.reservePrice)],
            ['Buy-It-Now', money(auction.buyItNowPrice)],
          ]} />
        </Panel>
        {!error && live && !pending && <div className="flex flex-wrap gap-2">
          {canRequest
            ? <Button type="button" variant="secondary" onClick={() => { setMessage(''); setRequestForm(true); }}>Request Cancellation</Button>
            : <Button type="button" variant="danger" onClick={() => setConfirm('cancel')}>Cancel Auction</Button>}
        </div>}
      </aside>
    </div>
    <div className="flex flex-wrap justify-between gap-3">
      <ButtonLink to={AUCTIONS_PATH} variant="secondary">Back to My Auctions</ButtonLink>
      {status === 'DRAFT' && <div className="flex flex-wrap gap-2">
        <Button type="button" variant="danger" onClick={() => setConfirm('delete')}>Delete Draft</Button>
        <ButtonLink to={`${AUCTIONS_PATH}/${id}/edit`}>Edit Draft</ButtonLink>
      </div>}
    </div>
    <FeedbackPopup isOpen={Boolean(confirm)} tone="destructive" title={deleted ? 'Delete this draft?' : 'Cancel this auction?'}
      message={deleted
        ? `Draft #${id} will be permanently removed. Your inventory stays available.`
        : `Auction #${id} will end early. The server checks the latest bid count and releases the auction hold if cancellation succeeds.`}
      primaryAction={{ label: deleted ? 'Delete Draft' : 'Cancel Auction', onClick: () => { void runAction(); }, isLoading: busy }}
      secondaryAction={{ label: deleted ? 'Keep Draft' : 'Keep Auction', onClick: () => { if (!busy) setConfirm(null); } }}
    />
  </AuctionPage>;
}

function AuctionOverview({ auction }: { auction: Auction }) {
  return <Panel className="space-y-4">
    <div className="flex flex-wrap justify-between gap-2">
      <h2 className="text-lg font-semibold">Auction overview</h2>
      <AuctionStatusBadge status={auction.status} />
    </div>
    <AuctionCardSummary name={auction.cardName} imageUrl={auction.imageUrl} setName={auction.setName} condition={auction.condition} inventoryId={auction.productId} />
    <DetailRows items={[
      ['Condition', formatCondition(auction.condition, '—')],
      ['Grading', auction.gradingCompany ? [auction.gradingCompany, auction.grade, auction.certNumber].filter(Boolean).join(' · ') : 'Ungraded'],
      [`Start · ${AUCTION_TIMEZONE}`, auctionDate(auction.startAt)],
      ['Duration', durationLabel(auction.durationHours)],
      [`End · ${AUCTION_TIMEZONE}`, auctionDate(auction.endAt)],
    ]} />
  </Panel>;
}

function BidOverview({ auction, now }: { auction: Auction; now: number }) {
  const scheduled = auction.status === 'SCHEDULED';
  const live = scheduled || auction.status === 'ACTIVE';
  return <Panel className="space-y-4">
    <h2 className="text-lg font-semibold">Bidding overview</h2>
    <DetailRows items={[
      ['Highest bid', money(auction.highestBid)],
      ['Bids', auction.bidCount],
      ...(live ? [[scheduled ? 'Starts in' : 'Time remaining', countdown(scheduled ? auction.startAt : auction.endAt, now)] as [string, string]] : []),
    ]} />
  </Panel>;
}
