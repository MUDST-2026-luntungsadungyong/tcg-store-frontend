import { useCallback, useState } from 'react';
import { Button } from '@/shared/components/Button';
import { ErrorState } from '@/shared/components/ErrorState';
import { Modal } from '@/shared/components/Modal';
import { PageContainer, PageHeader, Panel } from '@/shared/components/PageLayout';
import apiClient from '@/shared/api/client';
import { auctionError } from '../api/auctions';
import { AuctionLoading } from '../components/AuctionUI';
import { auctionDate } from '../model/auctionFormat';
import { useAuctionResource } from '../model/useAuctionResource';

type Decision = 'FULL_REFUND' | 'RETURN' | 'DISMISS';
interface Dispute { id: number; auctionId: number; orderId: number; buyerId: number; sellerId: number; reason: string; status: string; createdAt: string; decidedAt: string | null; decisionReason: string | null; evidenceUrls: string[]; evidence?: { url: string; submittedBy: number; createdAt: string }[] }
interface Page { content: Dispute[]; totalPages: number }
export function AdminAuctionDisputesPage() {
  const [page, setPage] = useState(0);
  const fetchCases = useCallback(async () => (await apiClient.get<Page>('/admin/auction-disputes', { params: { page, size: 20 } })).data, [page]);
  const { data, loading, error, reload } = useAuctionResource(fetchCases, 'Could not load disputes.');
  const [choice, setChoice] = useState<{ dispute: Dispute; decision: Decision }>();
  const [reason, setReason] = useState('');
  const [failure, setFailure] = useState('');
  const [busy, setBusy] = useState(false);
  const [evidenceFailure, setEvidenceFailure] = useState('');
  async function openEvidence(url: string) {
    if (!/^\/api\/admin\/auction-disputes\/\d+\/evidence\/\d+$/.test(url)) { setEvidenceFailure('This evidence link is invalid.'); return; }
    try { const blob = (await apiClient.get<Blob>(url.slice(4), { responseType: 'blob' })).data; const objectUrl = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = objectUrl; anchor.download = 'dispute-evidence'; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000); setEvidenceFailure(''); }
    catch { setEvidenceFailure('Could not download the evidence. Please try again.'); }
  }
  async function submit() {
    if (!choice || !reason.trim()) return;
    setBusy(true); setFailure('');
    try { await apiClient.post(`/admin/auction-disputes/${choice.dispute.id}/decide`, { decision: choice.decision, reason: reason.trim() }); setChoice(undefined); setReason(''); await reload(); }
    catch (err) { setFailure(auctionError(err, 'Could not record the decision.')); }
    finally { setBusy(false); }
  }
  return <main><PageContainer className="space-y-6"><PageHeader eyebrow={<span className="text-brand-gold">Platform administration</span>} title="Auction disputes" description="Review evidence and record a resolution. Payments and returns are arranged outside Mythix." actions={<Button variant="secondary" isLoading={loading} onClick={() => void reload()}>Refresh</Button>} />
    {loading && !data && <AuctionLoading label="Loading disputes" />}{error && <ErrorState message={error} onRetry={() => reload()} />}{evidenceFailure && <p role="alert" className="text-status-danger">{evidenceFailure}</p>}
    {data && !error && <>{data.content.length ? <div className="space-y-4">{data.content.map(d => <Panel key={d.id} className="space-y-3"><div className="flex flex-wrap items-baseline justify-between gap-2"><h2 className="text-lg font-semibold">Dispute #{d.id} · Auction #{d.auctionId}</h2><span className="text-sm text-brand-gold">{d.status.replaceAll('_', ' ')}</span></div><p className="text-sm text-text-secondary">Order #{d.orderId} · Buyer #{d.buyerId} · Seller #{d.sellerId} · Submitted {auctionDate(d.createdAt)}</p><p className="whitespace-pre-wrap break-words text-sm">{d.reason}</p><div className="flex flex-wrap gap-2">{(d.evidence ?? d.evidenceUrls.map(url => ({ url, submittedBy: null, createdAt: null }))).map((item, i) => <div key={item.url} className="space-y-1"><Button size="sm" variant="secondary" onClick={() => void openEvidence(item.url)}>Download evidence {i + 1}</Button>{item.submittedBy != null && <p className="text-xs text-text-secondary">User #{item.submittedBy} · {auctionDate(item.createdAt)}</p>}</div>)}</div>{d.decisionReason && <p className="text-sm text-text-secondary">Decision: {d.decisionReason}</p>}{d.status === 'PENDING' && <div className="flex flex-wrap gap-2">{([['FULL_REFUND', 'Full refund'], ['RETURN', 'Return item'], ['DISMISS', 'Dismiss']] as const).map(([decision, label]) => <Button key={decision} variant="secondary" onClick={() => { setFailure(''); setReason(''); setChoice({ dispute: d, decision }); }}>{label}</Button>)}</div>}</Panel>)}</div> : <Panel className="py-12 text-center"><h2 className="text-lg font-semibold">No disputes yet</h2><p className="mt-2 text-sm text-text-secondary">Buyer disputes will appear here for review.</p></Panel>}
    {data.totalPages > 1 && <div className="flex items-center gap-3"><Button variant="secondary" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button><span>Page {page + 1} of {data.totalPages}</span><Button variant="secondary" disabled={page + 1 >= data.totalPages} onClick={() => setPage(page + 1)}>Next</Button></div>}</>}
    <Modal isOpen={Boolean(choice)} onClose={() => { if (!busy) setChoice(undefined); }} title="Record dispute decision" footer={<><Button variant="secondary" disabled={busy} onClick={() => setChoice(undefined)}>Back</Button><Button isLoading={busy} disabled={!reason.trim()} onClick={() => void submit()}>Record decision</Button></>}><div className="space-y-3"><p className="text-sm text-text-secondary">{choice?.decision.replaceAll('_', ' ')} will be recorded. Any payment or return must be arranged outside Mythix.</p><label className="block text-sm font-medium">Decision reason<textarea required maxLength={2000} rows={4} value={reason} onChange={event => setReason(event.target.value)} className="mt-2 block w-full rounded-xl border border-white/20 bg-bg-input p-3" /></label>{failure && <p role="alert" className="text-status-danger">{failure}</p>}</div></Modal>
  </PageContainer></main>;
}
