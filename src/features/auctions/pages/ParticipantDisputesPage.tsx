import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '@/shared/api/client';
import { Button } from '@/shared/components/Button';
import { ErrorState } from '@/shared/components/ErrorState';
import { PageContainer, PageHeader, Panel } from '@/shared/components/PageLayout';
import { AuctionLoading } from '../components/AuctionUI';
import { auctionDate } from '../model/auctionFormat';
import { useAuctionResource } from '../model/useAuctionResource';

interface Dispute { id: number; auctionId: number; orderId: number; reason: string; status: string; createdAt: string; decisionReason: string | null; evidenceUrls: string[]; evidence?: { url: string; submittedBy: number; createdAt: string }[] }
interface Page { content: Dispute[]; totalPages: number }
export function ParticipantDisputesPage() {
  const [page, setPage] = useState(0);
  const [failure, setFailure] = useState('');
  const [uploading, setUploading] = useState<number | null>(null);
  const fetchCases = useCallback(async () => (await apiClient.get<Page>('/auction-disputes/me', { params: { page, size: 20 } })).data, [page]);
  const { data, loading, error, reload } = useAuctionResource(fetchCases, 'Could not load your disputes.');
  async function download(url: string) {
    if (!/^\/api\/auction-disputes\/\d+\/evidence\/\d+$/.test(url)) { setFailure('This evidence link is invalid.'); return; }
    try { const blob = (await apiClient.get<Blob>(url.slice(4), { responseType: 'blob' })).data; const objectUrl = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = objectUrl; anchor.download = 'dispute-evidence'; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000); setFailure(''); }
    catch { setFailure('Could not download the evidence. Please try again.'); }
  }
  async function addEvidence(id: number, files: FileList | null) {
    if (!files?.length) return;
    const body = new FormData(); Array.from(files).forEach(file => body.append('evidence', file));
    setUploading(id); setFailure('');
    try { await apiClient.post(`/auction-disputes/${id}/evidence`, body); await reload(); }
    catch { setFailure('Could not add evidence. Use JPEG, PNG or WebP images; a case can contain up to eight images.'); }
    finally { setUploading(null); }
  }
  return <main><PageContainer className="space-y-6"><PageHeader title="Auction disputes" description="Review your cases, evidence and recorded decisions. Payments and returns are arranged outside Mythix." actions={<Button variant="secondary" isLoading={loading} onClick={() => void reload()}>Refresh</Button>} />
    {loading && !data && <AuctionLoading label="Loading disputes" />}{error && <ErrorState message={error} onRetry={() => reload()} />}{failure && <p role="alert" className="text-status-danger">{failure}</p>}
    {data && !error && <>{data.content.length ? <div className="space-y-4">{data.content.map(d => <Panel key={d.id} className="space-y-3"><div className="flex flex-wrap justify-between gap-2"><h2 className="text-lg font-semibold">Dispute #{d.id} · Auction #{d.auctionId}</h2><span className="text-brand-gold">{d.status.replaceAll('_', ' ')}</span></div><p className="text-sm text-text-secondary">Submitted {auctionDate(d.createdAt)} · <Link to={`/auctions/${d.auctionId}`} className="text-brand-blue underline">View auction</Link></p><p className="whitespace-pre-wrap break-words text-sm">{d.reason}</p><div className="flex flex-wrap gap-2">{(d.evidence ?? d.evidenceUrls.map(url => ({ url, submittedBy: null, createdAt: null }))).map((item, i) => <div key={item.url} className="space-y-1"><Button size="sm" variant="secondary" onClick={() => void download(item.url)}>Download evidence {i + 1}</Button>{item.submittedBy != null && <p className="text-xs text-text-secondary">User #{item.submittedBy} · {auctionDate(item.createdAt)}</p>}</div>)}</div>{d.status === 'PENDING' && <label className="block text-sm font-medium">Add evidence (JPEG, PNG or WebP; up to eight images total)<input type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={uploading !== null} onChange={event => { void addEvidence(d.id, event.target.files); event.target.value = ''; }} className="mt-2 block w-full text-sm" /></label>}{d.decisionReason && <p className="text-sm text-text-secondary">Decision reason: {d.decisionReason}</p>}</Panel>)}</div> : <Panel className="py-12 text-center"><h2 className="text-lg font-semibold">No disputes yet</h2><p className="mt-2 text-sm text-text-secondary">Your auction disputes will appear here.</p></Panel>}
    {data.totalPages > 1 && <div className="flex items-center gap-3"><Button variant="secondary" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button><span>Page {page + 1} of {data.totalPages}</span><Button variant="secondary" disabled={page + 1 >= data.totalPages} onClick={() => setPage(page + 1)}>Next</Button></div>}</>}
  </PageContainer></main>;
}
