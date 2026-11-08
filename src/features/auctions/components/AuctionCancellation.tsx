import { useState } from 'react';
import { IMAGE_TYPES, imageFileError } from '@/features/listings/model/imagePolicy';
import { Button } from '@/shared/components/Button';
import { Panel } from '@/shared/components/PageLayout';
import { Select } from '@/shared/components/Select';
import type { CancellationEvidence, CancellationRequest } from '../api/auctions';
import { AUCTION_TIMEZONE, auctionDate } from '../model/auctionFormat';
import { AuctionStatusBadge, DetailRows, Notice, PrivateImage } from './AuctionUI';

const REASONS = ['Card damaged', 'Card lost or stolen', 'Other exceptional circumstances'];
const EVIDENCE_LIMIT = 4;

export function EvidenceImages({ evidence }: { evidence: CancellationEvidence[] }) {
  if (evidence.length === 0) return <p className="text-sm text-text-secondary">No evidence available.</p>;
  return <ul className="grid gap-3 sm:grid-cols-2">
    {evidence.map(file => <li className="min-w-0 space-y-2 rounded-xl bg-bg-surface p-3" key={file.id}>
      <PrivateImage url={file.url} label={file.fileName} />
      <p className="break-all text-xs text-text-secondary">{file.fileName}</p>
    </li>)}
  </ul>;
}

export function CancellationRecord({ request }: { request: CancellationRequest }) {
  return <Panel className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-lg font-semibold">Cancellation request</h2>
      <AuctionStatusBadge status={request.status} />
    </div>
    <DetailRows items={[
      ['Request ID', `#${request.id}`],
      [`Submitted · ${AUCTION_TIMEZONE}`, auctionDate(request.createdAt)],
      ...(request.reviewedAt ? [['Decision time', auctionDate(request.reviewedAt)] as [string, string]] : []),
    ]} />
    <p className="whitespace-pre-wrap break-words text-sm text-text-secondary">{request.reason}</p>
    {request.decisionReason && <p className="whitespace-pre-wrap break-words text-sm">Admin decision: {request.decisionReason}</p>}
    <EvidenceImages evidence={request.evidence} />
  </Panel>;
}

export function RequestCancellationForm({ onBack, onSubmit, busy, error }: {
  onBack: () => void;
  onSubmit: (form: FormData) => void;
  busy: boolean;
  error?: string;
}) {
  const [reason, setReason] = useState('');
  const [explanation, setExplanation] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState('');
  return <form onSubmit={event => {
    event.preventDefault();
    if (!reason || !explanation.trim() || !files.length) return;
    const form = new FormData();
    form.append('reason', `${reason}\n${explanation.trim()}`);
    files.forEach(file => form.append('evidence', file));
    onSubmit(form);
  }}>
    <fieldset disabled={busy} className="space-y-4">
      <Panel className="space-y-4">
        <h2 className="text-lg font-semibold">Tell us what happened</h2>
        <Select label="Reason" required value={reason} onChange={event => setReason(event.target.value)}
          options={[{ value: '', label: 'Select a reason' }, ...REASONS.map(value => ({ value, label: value }))]} />
        <div className="space-y-2">
          <label htmlFor="cancellation-explanation" className="text-sm font-medium">Explanation</label>
          <textarea id="cancellation-explanation" value={explanation} onChange={event => setExplanation(event.target.value)} maxLength={950} required
            placeholder="Describe why the auction can no longer be fulfilled." rows={4}
            className="block w-full rounded-xl border border-white/15 bg-bg-input p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
        </div>
        <div className="space-y-2">
          <label htmlFor="auction-evidence" className="text-sm font-medium">Evidence</label>
          <p id="auction-evidence-help" className="text-sm text-text-secondary">Add 1–4 JPG, PNG or WebP images, up to 5 MiB each.</p>
          <input id="auction-evidence" type="file" multiple accept={IMAGE_TYPES.join(',')}
            aria-describedby="auction-evidence-help" aria-invalid={Boolean(fileError)}
            className="block w-full min-w-0 text-sm text-text-secondary file:mr-2 file:rounded-lg file:border-0 file:bg-bg-elevated file:px-3 file:py-2 file:text-text-primary"
            onChange={event => {
              const newFiles = Array.from(event.target.files ?? []);
              event.target.value = '';
              if (!newFiles.length) return;
              const issue = files.length + newFiles.length > EVIDENCE_LIMIT
                ? 'Attach up to four images.'
                : newFiles.map(imageFileError).find(Boolean);
              setFileError(issue ?? '');
              if (!issue) setFiles([...files, ...newFiles]);
            }}
          />
          {fileError && <p role="alert" className="text-sm text-status-danger">{fileError}</p>}
          {files.length > 0 && <ul className="grid gap-3 sm:grid-cols-2">
            {files.map((file, index) => <li key={`${file.name}-${index}`} className="min-w-0 space-y-2">
              <PrivateImage file={file} label={file.name} />
              <p className="break-all text-xs text-text-secondary">{file.name}</p>
              <Button type="button" size="sm" variant="ghost" aria-label={`Remove ${file.name}`}
                onClick={() => { setFileError(''); setFiles(files.filter((_, position) => position !== index)); }}>Remove</Button>
            </li>)}
          </ul>}
        </div>
      </Panel>
      <Notice title="Auction continues">The auction and its inventory hold remain in place while the request is reviewed.</Notice>
      {error && <p role="alert" className="text-sm text-status-danger">{error}</p>}
      <div className="flex flex-wrap justify-between gap-2">
        <Button type="button" variant="secondary" onClick={onBack}>Back to Details</Button>
        <Button type="submit" isLoading={busy} disabled={!reason || !explanation.trim() || !files.length}>Submit Request</Button>
      </div>
    </fieldset>
  </form>;
}
