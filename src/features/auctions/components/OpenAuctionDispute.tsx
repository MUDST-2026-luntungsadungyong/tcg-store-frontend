import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import apiClient from '@/shared/api/client';

import { Button } from '@/shared/components/Button';

import { Modal } from '@/shared/components/Modal';

import { auctionError } from '../api/auctions';



export function OpenAuctionDispute({ auctionId }: { auctionId: number }) {

  const [open, setOpen] = useState(false);

  const [reason, setReason] = useState('');

  const [files, setFiles] = useState<File[]>([]);

  const [busy, setBusy] = useState(false);

  const [error, setError] = useState('');

  const [success, setSuccess] = useState(false);
  const [checking, setChecking] = useState(true);
  const [lookupError, setLookupError] = useState('');
  useEffect(() => {
    let active = true;
    async function findExisting() {
      try {
        let page = 0;
        let totalPages = 1;
        while (page < totalPages) {
          const result = (await apiClient.get<{ content: { auctionId: number }[]; totalPages: number }>('/auction-disputes/me', { params: { page, size: 100 } })).data;
          if (result.content.some(item => item.auctionId === auctionId)) { if (active) setSuccess(true); break; }
          totalPages = result.totalPages; page++;
        }
      } catch { if (active) setLookupError('Could not check existing disputes. Refresh to try again.'); }
      finally { if (active) setChecking(false); }
    }
    void findExisting();
    return () => { active = false; };
  }, [auctionId]);

  async function submit() {

    if (!reason.trim() || !files.length) return;

    const body = new FormData(); body.append('reason', reason.trim()); files.forEach(file => body.append('evidence', file));

    setBusy(true); setError('');

    try { await apiClient.post(`/auctions/${auctionId}/disputes`, body); setOpen(false); setSuccess(true); }

    catch (failure) { setError(auctionError(failure, 'Could not open the dispute. Please try again. If the problem continues, contact support.')); }

    finally { setBusy(false); }

  }

  return <div className="space-y-2"><Link to="/auction-disputes" className="mr-3 text-sm text-brand-blue underline">View my disputes</Link>{lookupError && <p role="alert" className="text-sm text-status-danger">{lookupError}</p>}{success ? <p role="status" className="text-sm text-status-success">A dispute exists for this auction. View its current status in your disputes.</p> : <Button variant="secondary" disabled={checking || Boolean(lookupError)} onClick={() => setOpen(true)}>Open dispute</Button>}

    <Modal isOpen={open} onClose={() => { if (!busy) setOpen(false); }} title="Open an auction dispute" footer={<><Button variant="secondary" disabled={busy} onClick={() => setOpen(false)}>Back</Button><Button isLoading={busy} disabled={!reason.trim() || !files.length || files.length > 4} onClick={() => void submit()}>Submit dispute</Button></>}>

      <div className="space-y-4"><p className="text-sm text-text-secondary">Submit within three days after receiving the parcel. Describe the problem and attach evidence for review.</p><label className="block text-sm font-medium">What went wrong?<textarea required maxLength={2000} rows={4} value={reason} onChange={event => setReason(event.target.value)} className="mt-2 block w-full rounded-xl border border-white/20 bg-bg-input p-3" /></label><label className="block text-sm font-medium">Evidence photos (1–4 JPEG, PNG or WebP images)<input required type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={event => setFiles(Array.from(event.target.files ?? []))} className="mt-2 block w-full text-sm" /></label>{error && <p role="alert" className="text-sm text-status-danger">{error}</p>}</div>

    </Modal></div>;

}
