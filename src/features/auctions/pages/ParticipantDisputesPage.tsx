import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import apiClient from '@/shared/api/client';
import { Button } from '@/shared/components/Button';
import { ErrorState } from '@/shared/components/ErrorState';
import { PageContainer, PageHeader, Panel } from '@/shared/components/PageLayout';
import { AuctionLoading } from '../components/AuctionUI';
import { auctionDate } from '../model/auctionFormat';
import { useAuctionResource } from '../model/useAuctionResource';

interface Dispute {
  id: number;
  auctionId: number;
  orderId: number;
  reason: string;
  status: string;
  createdAt: string;
  decisionReason: string | null;
  evidenceUrls: string[];
  evidence?: { url: string; submittedBy: number | null; createdAt: string | null }[];
}
interface Page { content: Dispute[]; totalPages: number }

export function ParticipantDisputesPage() {
  const [searchParams] = useSearchParams();
  const disputeParam = searchParams.get('disputeId');
  const disputeId = disputeParam && /^\d+$/.test(disputeParam) && Number.isSafeInteger(Number(disputeParam)) && Number(disputeParam) > 0
    ? Number(disputeParam)
    : null;
  const hasInvalidDisputeId = disputeParam !== null && disputeId === null;
  const [page, setPage] = useState(0);
  const [failure, setFailure] = useState('');
  const [uploading, setUploading] = useState<number | null>(null);
  const [targetResult, setTargetResult] = useState<{ id: number; dispute: Dispute } | null>(null);
  const [targetErrorId, setTargetErrorId] = useState<number | null>(null);
  const fetchCases = useCallback(async () => (await apiClient.get<Page>('/auction-disputes/me', { params: { page, size: 20 } })).data, [page]);
  const { data, loading, error, reload } = useAuctionResource(fetchCases, 'Could not load your disputes.');

  const fetchTarget = useCallback(async (id: number) => {
    const result = (await apiClient.get<Dispute>(`/auction-disputes/${id}`)).data;
    if (result.id !== id) throw new Error('Dispute response did not match the requested ID.');
    return result;
  }, []);

  useEffect(() => {
    let active = true;
    if (disputeId === null) return () => { active = false; };
    void fetchTarget(disputeId)
      .then((result) => { if (active) setTargetResult({ id: disputeId, dispute: result }); })
      .catch(() => { if (active) setTargetErrorId(disputeId); });
    return () => { active = false; };
  }, [disputeId, fetchTarget]);

  const targetCase = targetResult?.id === disputeId ? targetResult.dispute : null;
  const targetError = disputeId !== null && targetErrorId === disputeId;

  useEffect(() => {
    if (!targetCase || !data) return;
    const element = document.getElementById(`dispute-${targetCase.id}`);
    element?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    element?.focus?.({ preventScroll: true });
  }, [targetCase, data]);

  const disputes = useMemo(() => {
    if (!targetCase) return data?.content ?? [];
    return [targetCase, ...(data?.content ?? []).filter((item) => item.id !== targetCase.id)];
  }, [data?.content, targetCase]);

  async function download(url: string) {
    if (!/^\/api\/auction-disputes\/\d+\/evidence\/\d+$/.test(url)) { setFailure('This evidence link is invalid.'); return; }
    try { const blob = (await apiClient.get<Blob>(url.slice(4), { responseType: 'blob' })).data; const objectUrl = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = objectUrl; anchor.download = 'dispute-evidence'; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000); setFailure(''); }
    catch { setFailure('Could not download the evidence. Please try again.'); }
  }

  async function addEvidence(id: number, files: FileList | null) {
    if (!files?.length) return;
    const body = new FormData(); Array.from(files).forEach(file => body.append('evidence', file));
    setUploading(id); setFailure('');
    try {
      await apiClient.post(`/auction-disputes/${id}/evidence`, body);
      await reload();
      if (disputeId === id) setTargetResult({ id, dispute: await fetchTarget(id) });
    } catch { setFailure('Could not add evidence. Use JPEG, PNG or WebP images; a case can contain up to eight images.'); }
    finally { setUploading(null); }
  }

  return <main><PageContainer className="space-y-6"><PageHeader title="Auction disputes" description="Review your cases, evidence and recorded decisions. Payments and returns are arranged outside Mythix." actions={<Button variant="secondary" isLoading={loading} onClick={() => void reload()}>Refresh</Button>} />
    {loading && !data && <AuctionLoading label="Loading disputes" />}{error && <ErrorState message={error} onRetry={() => reload()} />}{failure && <p role="alert" className="text-status-danger">{failure}</p>}
    {hasInvalidDisputeId && <p role="status" className="text-sm text-text-secondary">This dispute link is invalid. You can still browse your disputes below.</p>}
    {disputeId !== null && targetError && <p role="status" className="text-sm text-text-secondary">Could not load dispute #{disputeId}. Your other disputes are still available below.</p>}
    {data && !error && <>{disputes.length ? <div className="space-y-4">{disputes.map(d => {
      const isTarget = d.id === disputeId && Boolean(targetCase);
      return <Panel key={d.id} id={isTarget ? `dispute-${d.id}` : undefined} tabIndex={isTarget ? -1 : undefined} aria-label={isTarget ? `Dispute ${d.id}, opened from notification` : undefined} className={`space-y-3 ${isTarget ? 'border-2 border-brand-blue ring-2 ring-brand-blue/30' : ''}`}>
        <div className="flex flex-wrap justify-between gap-2"><h2 className="text-lg font-semibold">Dispute #{d.id} · Auction #{d.auctionId}</h2><span className="text-brand-gold">{d.status.replaceAll('_', ' ')}</span></div>
        <p className="text-sm text-text-secondary">Submitted {auctionDate(d.createdAt)} · <Link to={`/auctions/${d.auctionId}`} className="text-brand-blue underline">View auction</Link></p>
        <p className="whitespace-pre-wrap break-words text-sm">{d.reason}</p>
        <div className="flex flex-wrap gap-2">{(d.evidence ?? d.evidenceUrls.map(url => ({ url, submittedBy: null, createdAt: null }))).map((item, i) => <div key={item.url} className="space-y-1"><Button size="sm" variant="secondary" onClick={() => void download(item.url)}>Download evidence {i + 1}</Button>{item.submittedBy != null && <p className="text-xs text-text-secondary">User #{item.submittedBy} · {auctionDate(item.createdAt)}</p>}</div>)}</div>
        {d.status === 'PENDING' && <label className="block text-sm font-medium">Add evidence (JPEG, PNG or WebP; up to eight images total)<input type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={uploading !== null} onChange={event => { void addEvidence(d.id, event.target.files); event.target.value = ''; }} className="mt-2 block w-full text-sm" /></label>}
        {d.decisionReason && <p className="text-sm text-text-secondary">Decision reason: {d.decisionReason}</p>}
      </Panel>;
    })}</div> : <Panel className="py-12 text-center"><h2 className="text-lg font-semibold">No disputes yet</h2><p className="mt-2 text-sm text-text-secondary">Your auction disputes will appear here.</p></Panel>}
    {data.totalPages > 1 && <div className="flex items-center gap-3"><Button variant="secondary" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button><span>Page {page + 1} of {data.totalPages}</span><Button variant="secondary" disabled={page + 1 >= data.totalPages} onClick={() => setPage(page + 1)}>Next</Button></div>}</>}
  </PageContainer></main>;
}
