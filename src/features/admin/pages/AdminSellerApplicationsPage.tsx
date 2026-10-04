import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, Check, Copy, FileText, Mail, Phone, Store, UserRound, X, RefreshCw } from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { sellerApplicationsApi, type SellerApplication } from '../api/sellerApplications';
import { Modal } from '@/shared/components/Modal';

function CopyButton({ label, value, copiedField, onCopy }: { label: string; value: string; copiedField: string; onCopy: (value: string, label: string) => void }) {
  const copied = copiedField === label;
  return <button type="button" aria-label={`Copy ${label}`} disabled={!value} onClick={() => onCopy(value, label)} className="rounded p-1 text-gray-400 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40">
    {copied ? <Check size={15} aria-hidden="true" className="text-status-success" /> : <Copy size={15} aria-hidden="true" />}
  </button>;
}

export function AdminSellerApplicationsPage() {
  const [applications, setApplications] = useState<SellerApplication[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<SellerApplication | null>(null);
  const [viewing, setViewing] = useState<SellerApplication | null>(null);
  const [reason, setReason] = useState('');
  const [copiedField, setCopiedField] = useState('');

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
  async function copy(value: string, label: string) {
    try { await navigator.clipboard.writeText(value); setCopiedField(label); }
    catch { setError('Unable to copy this value. Please try again.'); }
  }
  function openDetails(application: SellerApplication) { setCopiedField(''); setViewing(application); }
  function closeDetails() { setCopiedField(''); setViewing(null); }

  return <main id="main-content" className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
    <header className="flex flex-col gap-5 border-b border-white/10 pb-7 sm:flex-row sm:items-end sm:justify-between">
      <div>
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-gold">Platform administration</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">Seller applications</h1>
      <p className="mt-2 max-w-2xl text-base leading-6 text-gray-300">Review each applicant before their seller workspace becomes available.</p>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Button variant="secondary" onClick={loadApplications} isLoading={loading} className="gap-2 shrink-0 h-fit">
          <RefreshCw size={16} aria-hidden="true" />
          Refresh
        </Button>
        <div className="rounded-xl border border-brand-gold/25 bg-brand-gold/10 px-4 py-3 min-w-[9rem]">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-gold">Waiting for review</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-white">{loading ? '—' : applications.length}</p>
        </div>
      </div>
    </header>
    {error && <div role="alert" className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-status-danger/40 bg-status-danger/10 p-4"><p className="text-sm text-red-100">{error}</p><Button variant="secondary" size="sm" onClick={loadApplications}>Retry</Button></div>}
    {loading ? <div role="status" aria-label="Loading seller applications" className="mt-8 space-y-3">{Array.from({ length: 3 }, (_, index) => <div key={index} className="h-20 animate-pulse rounded-xl border border-white/10 bg-bg-elevated" />)}</div> : applications.length === 0 ? <section className="mt-8 rounded-2xl border border-white/10 bg-bg-elevated p-8 text-center"><h2 className="text-lg font-semibold text-white">The review queue is clear</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-400">New seller applications will appear here when a user submits their store profile.</p></section> : <><section className="mt-8 space-y-3 md:hidden">{applications.map((application) => <article key={application.id} tabIndex={0} aria-label={`View details for ${application.shopName}`} onClick={() => openDetails(application)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openDetails(application); } }} className="cursor-pointer rounded-2xl border border-white/10 bg-bg-elevated p-4 transition-colors hover:bg-white/[0.03] active:bg-white/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="text-xs font-medium uppercase tracking-wide text-gray-400">Name</p><p className="mt-1 truncate font-semibold text-white">{application.applicantName}</p><p className="mt-1 truncate text-sm text-gray-300">{application.applicantEmail}</p></div><div className="shrink-0 text-right"><p className="text-xs font-medium uppercase tracking-wide text-gray-400">Submitted</p><p className="mt-1 text-sm text-white">{application.requestedAt ? new Date(application.requestedAt).toLocaleDateString() : '—'}</p></div></div><div className="mt-4 border-t border-white/10 pt-4"><p className="text-xs font-medium uppercase tracking-wide text-gray-400">Store name</p><p className="mt-1 font-semibold text-white">{application.shopName}</p></div><div className="mt-4 grid grid-cols-2 gap-2"><Button size="sm" variant="secondary" className="col-span-2 gap-1.5" onClick={(event) => { event.stopPropagation(); openDetails(application); }}><FileText size={16} aria-hidden="true" />Check detail</Button><Button size="sm" variant="gold" className="gap-1.5" isLoading={approvingId === application.id} onClick={(event) => { event.stopPropagation(); void approve(application.id); }}><Check size={16} aria-hidden="true" />Approve</Button><Button size="sm" variant="danger" className="gap-1.5" disabled={approvingId === application.id} onClick={(event) => { event.stopPropagation(); setRejecting(application); }}><X size={16} aria-hidden="true" />Reject</Button></div></article>)}</section><section className="mt-8 hidden overflow-hidden rounded-2xl border border-white/10 bg-bg-elevated md:block"><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="border-b border-white/10 text-xs font-semibold uppercase tracking-wide text-gray-400"><tr><th className="px-5 py-4">Name</th><th className="px-5 py-4">Email</th><th className="px-5 py-4">Store name</th><th className="px-5 py-4">Submitted</th><th className="px-5 py-4 text-right">Decision</th></tr></thead><tbody>{applications.map((application) => <tr key={application.id} tabIndex={0} aria-label={`View details for ${application.shopName}`} onClick={() => openDetails(application)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openDetails(application); } }} className="cursor-pointer border-b border-white/10 transition-colors last:border-0 hover:bg-white/[0.03] focus:outline-none focus-visible:bg-white/[0.03] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-blue"><td className="px-5 py-4 font-medium text-white">{application.applicantName}</td><td className="px-5 py-4 text-gray-300">{application.applicantEmail}</td><td className="px-5 py-4 font-medium text-white">{application.shopName}</td><td className="px-5 py-4 text-gray-300">{application.requestedAt ? new Date(application.requestedAt).toLocaleDateString() : '—'}</td><td className="px-5 py-4"><div className="flex justify-end gap-2"><Button size="sm" variant="secondary" className="gap-1.5" onClick={(event) => { event.stopPropagation(); openDetails(application); }}><FileText size={16} aria-hidden="true" />Check detail</Button><Button size="sm" variant="gold" className="gap-1.5" isLoading={approvingId === application.id} onClick={(event) => { event.stopPropagation(); void approve(application.id); }}><Check size={16} aria-hidden="true" />Approve</Button><Button size="sm" variant="danger" className="gap-1.5" disabled={approvingId === application.id} onClick={(event) => { event.stopPropagation(); setRejecting(application); }}><X size={16} aria-hidden="true" />Reject</Button></div></td></tr>)}</tbody></table></div></section></>}
    <Modal isOpen={Boolean(viewing)} onClose={closeDetails} title="Seller details" mobileSheet className="max-w-2xl">{viewing && <div className="space-y-5 sm:space-y-6"><section><h3 className="text-sm font-semibold text-white">Applicant</h3><dl className="mt-3 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5"><dt className="flex items-center justify-between gap-2 text-xs font-medium text-gray-400"><span className="flex items-center gap-2"><UserRound size={15} aria-hidden="true" />Full name</span><CopyButton label="Full name" value={viewing.applicantName} copiedField={copiedField} onCopy={copy} /></dt><dd className="mt-2 font-medium text-white">{viewing.applicantName}</dd></div><div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5"><dt className="flex items-center justify-between gap-2 text-xs font-medium text-gray-400"><span className="flex items-center gap-2"><Mail size={15} aria-hidden="true" />Email</span><CopyButton label="Email" value={viewing.applicantEmail} copiedField={copiedField} onCopy={copy} /></dt><dd className="mt-2 break-words text-white">{viewing.applicantEmail}</dd></div></dl></section><section><h3 className="text-sm font-semibold text-white">Store profile</h3><dl className="mt-3 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5"><dt className="flex items-center justify-between gap-2 text-xs font-medium text-gray-400"><span className="flex items-center gap-2"><Store size={15} aria-hidden="true" />Store name</span><CopyButton label="Store name" value={viewing.shopName} copiedField={copiedField} onCopy={copy} /></dt><dd className="mt-2 font-medium text-white">{viewing.shopName}</dd></div><div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5"><dt className="flex items-center justify-between gap-2 text-xs font-medium text-gray-400"><span className="flex items-center gap-2"><CalendarDays size={15} aria-hidden="true" />Submitted</span><CopyButton label="Submitted" value={viewing.requestedAt ? new Date(viewing.requestedAt).toLocaleString() : ''} copiedField={copiedField} onCopy={copy} /></dt><dd className="mt-2 flex items-center gap-2 text-white"><CalendarDays size={15} aria-hidden="true" />{viewing.requestedAt ? new Date(viewing.requestedAt).toLocaleString() : '—'}</dd></div><div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5 sm:col-span-2"><dt className="flex items-center justify-between gap-2 text-xs font-medium text-gray-400"><span className="flex items-center gap-2"><FileText size={15} aria-hidden="true" />Description</span><CopyButton label="Description" value={viewing.shopDescription || ''} copiedField={copiedField} onCopy={copy} /></dt><dd className="mt-2 whitespace-pre-wrap leading-6 text-gray-200">{viewing.shopDescription || 'No description provided'}</dd></div></dl></section><section><h3 className="text-sm font-semibold text-white">Contact channels</h3><dl className="mt-3 grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5"><dt className="flex items-center justify-between gap-2 text-xs font-medium text-gray-400"><span className="flex items-center gap-2"><Phone size={15} aria-hidden="true" />Phone</span><CopyButton label="Phone" value={viewing.phone || ''} copiedField={copiedField} onCopy={copy} /></dt><dd className="mt-2 break-words text-white">{viewing.phone || 'Not provided'}</dd></div><div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5"><dt className="flex items-center justify-between gap-2 text-xs font-medium text-gray-400"><span className="flex items-center gap-2"><img src="https://cdn.simpleicons.org/line/06C755" alt="" className="h-[15px] w-[15px]" />LINE</span><CopyButton label="LINE" value={viewing.line || ''} copiedField={copiedField} onCopy={copy} /></dt><dd className="mt-2 break-words text-white">{viewing.line || 'Not provided'}</dd></div><div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5"><dt className="flex items-center justify-between gap-2 text-xs font-medium text-gray-400"><span className="flex items-center gap-2"><img src="https://cdn.simpleicons.org/facebook/1877F2" alt="" className="h-[15px] w-[15px]" />Facebook</span><CopyButton label="Facebook" value={viewing.facebook || ''} copiedField={copiedField} onCopy={copy} /></dt><dd className="mt-2 break-words text-white">{viewing.facebook || 'Not provided'}</dd></div></dl></section></div>}</Modal>
    <Modal isOpen={Boolean(rejecting)} onClose={() => setRejecting(null)} title="Reject seller application" footer={<><Button variant="secondary" onClick={() => setRejecting(null)}>Cancel</Button><Button variant="danger" isLoading={Boolean(approvingId)} disabled={!reason.trim()} onClick={() => void reject()}>Reject application</Button></>}><label htmlFor="rejection-reason" className="block text-sm font-medium text-white">Reason for rejection</label><textarea id="rejection-reason" value={reason} onChange={(event) => setReason(event.target.value)} className="mt-2 min-h-28 w-full rounded-lg border border-white/15 bg-bg-input p-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-blue" maxLength={2000} required /></Modal>
  </main>;
}
