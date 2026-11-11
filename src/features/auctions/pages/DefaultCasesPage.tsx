import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/components/Button';
import { Modal } from '@/shared/components/Modal';
import { auctionDate } from '../model/auctionFormat';
import { useAuctionResource } from '../model/useAuctionResource';
import { auctionError, defaultCaseApi, type DefaultCase } from '../api/auctions';

export function SellerDefaultCasesPage() { return <DefaultCases admin={false} />; }
export function AdminDefaultCasesPage() { return <DefaultCases admin />; }

function DefaultCases({ admin }: { admin: boolean }) {
  const [page, setPage] = useState(0);
  const fetchCases = useCallback(() => admin ? defaultCaseApi.admin(page) : defaultCaseApi.mine(page), [admin, page]);
  const { data, loading, error, reload } = useAuctionResource(fetchCases, 'Could not load default cases.');
  const [decision, setDecision] = useState<{ item: DefaultCase; action: 'approve' | 'reject' | 'reverse' }>();
  const [reason, setReason] = useState('');
  const [failure, setFailure] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit() {
    if (!decision || !reason.trim()) return;
    setBusy(true); setFailure('');
    try { await defaultCaseApi.decide(decision.item.id, decision.action, reason.trim()); setDecision(undefined); setReason(''); await reload(); }
    catch (error) { setFailure(auctionError(error, 'Could not save the decision.')); }
    finally { setBusy(false); }
  }
  return <main className="mx-auto max-w-5xl space-y-5 p-5">
    <h1 className="text-2xl font-bold">Default cases</h1>
    <p className="text-text-secondary">Reports are reviewed by an administrator before any penalty. Approved cases: first warning, second 7-day ban, third and later 30-day ban.</p>
    {loading && <p role="status">Loading cases…</p>}
    {error && <p role="alert">{error} <button className="underline" onClick={() => void reload()}>Try again</button></p>}
    {data && !data.content.length && <p>No default cases yet.</p>}
    <div className="space-y-3">{data?.content.map(item => <article key={item.id} className="break-words space-y-2 rounded-xl border border-white/10 bg-bg-elevated p-4" data-testid={`default-case-${item.id}`}>
      <h2 className="font-semibold">Case #{item.id} · {item.status}</h2>
      <p><Link className="underline" to={`/auctions/${item.auctionId}`}>Auction #{item.auctionId}</Link> · <Link className="underline" to={admin ? `/admin/orders?orderNumber=${encodeURIComponent(item.orderNumber || String(item.orderId))}` : `/workspace/orders?orderId=${item.orderId}`}>{item.orderNumber || `Order #${item.orderId}`}</Link>{admin && ` · Buyer #${item.buyerId} · Seller #${item.sellerId}`}</p>
      <p>Reported {auctionDate(item.createdAt)} · Reason: {item.reportReason}</p>
      {item.decisionReason && <p>Decision reason: {item.decisionReason}</p>}
      {item.history?.length > 0 && <details><summary>Review history</summary><ul className="space-y-1 pt-2">{item.history.map((entry, index) => <li key={index}>{entry.action} · {auctionDate(entry.createdAt)} · Admin #{entry.adminId}: {entry.reason}</li>)}</ul></details>}
      {admin && <div className="flex flex-wrap gap-2">{(item.status === 'PENDING' ? ['approve', 'reject'] : item.status === 'APPROVED' ? ['reverse'] : []).map(action => <Button key={action} variant={action === 'approve' ? 'primary' : 'secondary'} onClick={() => { setFailure(''); setReason(''); setDecision({ item, action: action as 'approve' | 'reject' | 'reverse' }); }}>{action[0].toUpperCase() + action.slice(1)}</Button>)}</div>}
    </article>)}</div>
    {data && data.totalPages > 1 && <div className="flex items-center gap-3"><Button variant="secondary" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button><span>Page {page + 1} of {data.totalPages}</span><Button variant="secondary" disabled={page + 1 >= data.totalPages} onClick={() => setPage(page + 1)}>Next</Button></div>}
    <Modal mobileSheet isOpen={Boolean(decision)} onClose={() => { if (!busy) setDecision(undefined); }} title="Confirm decision" footer={<Button disabled={!reason.trim()} isLoading={busy} onClick={() => void submit()}>Confirm decision</Button>}>
      <div className="space-y-3"><p>{decision?.action === 'approve' ? 'Approve this report and apply the penalty under the strike policy?' : `${decision?.action === 'reverse' ? 'Reverse' : 'Reject'} this case?`}</p><label className="block">Decision reason<textarea required maxLength={2000} className="mt-2 w-full rounded-xl border border-white/20 bg-bg-input p-3 text-white" value={reason} onChange={event => setReason(event.target.value)} /></label>{failure && <p role="alert">{failure}</p>}</div>
    </Modal>
  </main>;
}
