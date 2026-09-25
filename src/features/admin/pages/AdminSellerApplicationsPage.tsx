import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/shared/components/Button';
import { sellerApplicationsApi, type SellerApplication } from '../api/sellerApplications';
import { Modal } from '@/shared/components/Modal';

export function AdminSellerApplicationsPage() {
  const [applications, setApplications] = useState<SellerApplication[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<SellerApplication | null>(null);
  const [reason, setReason] = useState('');

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setApplications(await sellerApplicationsApi.listPending());
    } catch {
      setError('Unable to load seller applications. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadApplications(); }, [loadApplications]);

  async function approve(applicationId: string) {
    setApprovingId(applicationId);
    setError('');
    try {
      await sellerApplicationsApi.approve(applicationId);
      setApplications((current) => current.filter((application) => application.id !== applicationId));
    } catch {
      setError('Unable to approve this seller application. Please refresh and try again.');
    } finally {
      setApprovingId(null);
    }
  }
  async function reject() {
    if (!rejecting || !reason.trim()) return;
    setApprovingId(rejecting.id); setError('');
    try { await sellerApplicationsApi.reject(rejecting.id, reason); setApplications((items) => items.filter((item) => item.id !== rejecting.id)); setRejecting(null); setReason(''); }
    catch { setError('Unable to reject this seller application. Please try again.'); }
    finally { setApprovingId(null); }
  }

  return <main id="main-content" className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
    <header className="flex flex-col gap-5 border-b border-white/10 pb-7 sm:flex-row sm:items-end sm:justify-between">
      <div>
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-gold">Platform administration</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">Seller applications</h1>
      <p className="mt-2 max-w-2xl text-base leading-6 text-gray-300">Review each applicant before their seller workspace becomes available.</p>
      </div>
      <div className="rounded-xl border border-brand-gold/25 bg-brand-gold/10 px-4 py-3"><p className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-gold">Waiting for review</p><p className="mt-1 text-2xl font-bold tabular-nums text-white">{loading ? '—' : applications.length}</p></div>
    </header>
    {error && <p role="alert" className="mt-6 rounded-xl border border-status-danger/40 bg-status-danger/10 p-4 text-sm text-red-100">{error}</p>}
    {loading ? <div role="status" aria-label="Loading seller applications" className="mt-8 space-y-3">{Array.from({ length: 3 }, (_, index) => <div key={index} className="h-20 animate-pulse rounded-xl border border-white/10 bg-bg-elevated" />)}</div> : applications.length === 0 ? <section className="mt-8 rounded-2xl border border-white/10 bg-bg-elevated p-8 text-center"><h2 className="text-lg font-semibold text-white">The review queue is clear</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-400">New seller applications will appear here when a user submits their store profile.</p></section> : <section className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-bg-elevated"><div className="border-b border-white/10 px-5 py-4"><h2 className="font-semibold text-white">Applications awaiting a decision</h2><p className="mt-1 text-sm text-gray-400">Approval enables seller tools immediately. Rejections require a recorded reason.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-white/10 text-xs font-semibold uppercase tracking-wide text-gray-400"><tr><th className="px-5 py-4">Applicant</th><th className="px-5 py-4">Store</th><th className="px-5 py-4">Submitted</th><th className="px-5 py-4 text-right">Decision</th></tr></thead><tbody>{applications.map((application) => <tr key={application.id} className="border-b border-white/10 transition-colors last:border-0 hover:bg-white/[0.03]"><td className="px-5 py-4"><p className="font-medium text-white">{application.applicantName}</p><p className="mt-1 text-gray-400">{application.applicantEmail}</p></td><td className="px-5 py-4"><p className="font-medium text-white">{application.shopName}</p><p className="mt-1 max-w-sm text-gray-400">{application.shopDescription || 'No description provided'}</p></td><td className="px-5 py-4 text-gray-300">{application.requestedAt ? new Date(application.requestedAt).toLocaleDateString() : '—'}</td><td className="px-5 py-4"><div className="flex justify-end gap-2"><Button size="sm" variant="gold" isLoading={approvingId === application.id} onClick={() => void approve(application.id)}>Approve</Button><Button size="sm" variant="danger" disabled={approvingId === application.id} onClick={() => setRejecting(application)}>Reject</Button></div></td></tr>)}</tbody></table></div></section>}
    <Modal isOpen={Boolean(rejecting)} onClose={() => setRejecting(null)} title="Reject seller application" footer={<><Button variant="secondary" onClick={() => setRejecting(null)}>Cancel</Button><Button variant="danger" isLoading={Boolean(approvingId)} disabled={!reason.trim()} onClick={() => void reject()}>Reject application</Button></>}><label htmlFor="rejection-reason" className="block text-sm font-medium text-white">Reason for rejection</label><textarea id="rejection-reason" value={reason} onChange={(event) => setReason(event.target.value)} className="mt-2 min-h-28 w-full rounded-lg border border-white/15 bg-bg-input p-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-blue" maxLength={2000} required /></Modal>
  </main>;
}
