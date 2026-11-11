import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ImageOff, Info } from 'lucide-react';
import { formatCondition } from '@/entities/card/model/condition';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { ErrorState } from '@/shared/components/ErrorState';
import { PageContainer } from '@/shared/components/PageLayout';
import { Skeleton } from '@/shared/components/Skeleton';
import { cn } from '@/shared/lib';
import { auctionApi, type AuctionStatus, type RequestStatus } from '../api/auctions';

export function AuctionPage({ children }: { children: ReactNode }) {
  return <PageContainer className="space-y-6 !p-0">{children}</PageContainer>;
}

export function AuctionStatusBadge({ status }: { status: AuctionStatus | RequestStatus }) {
  const positive = status === 'ACTIVE' || status === 'APPROVED' || status === 'COMPLETED';
  const negative = status === 'CANCELLED' || status === 'REJECTED';
  const pending = status === 'PENDING_REVIEW' || status === 'AWAITING_BUYER_CONTACT';
  return <Badge variant={positive ? 'success' : negative ? 'danger' : pending ? 'warning' : 'default'}>{status.replaceAll('_', ' ')}</Badge>;
}

export function Notice({ children, title, tone = 'info' }: {
  children: ReactNode;
  title: string;
  tone?: 'info' | 'success' | 'warning';
}) {
  return (
    <div className={cn('flex items-start gap-3 rounded-xl border p-4', {
      'border-brand-blue/20 bg-brand-blue/5 text-brand-blue': tone === 'info',
      'border-status-success/20 bg-status-success/5 text-status-success': tone === 'success',
      'border-status-warning/20 bg-status-warning/5 text-status-warning': tone === 'warning',
    })}>
      <Info size={18} aria-hidden className="mt-0.5 shrink-0" />
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <div className="mt-1 text-sm leading-relaxed text-text-secondary">{children}</div>
      </div>
    </div>
  );
}

export function AuctionCardSummary({ name, imageUrl, setName, condition, inventoryId }: {
  name?: string | null;
  imageUrl?: string | null;
  setName?: string | null;
  condition?: string | null;
  inventoryId?: number | null;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-16 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-bg-input">
        {imageUrl ? <img alt="" src={imageUrl} loading="lazy" className="h-full w-full object-contain" /> : <ImageOff size={18} className="text-text-muted" aria-hidden />}
      </div>
      <div className="min-w-0">
        <p className="break-words text-sm font-semibold">{name || 'Untitled draft'}</p>
        <p className="text-xs text-text-secondary">{[setName, formatCondition(condition)].filter(Boolean).join(' · ')}</p>
        {inventoryId != null && <p className="mt-1 text-xs text-brand-blue">Inventory #{inventoryId}</p>}
      </div>
    </div>
  );
}

export function DetailRows({ items }: { items: Array<[string, ReactNode]> }) {
  return <dl className="space-y-3">
    {items.map(([label, value]) => (
      <div key={label} className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-sm">
        <dt className="text-text-secondary">{label}</dt>
        <dd className="max-w-full break-words font-medium">{value}</dd>
      </div>
    ))}
  </dl>;
}

export function AuctionLoading({ label }: { label: string }) {
  return <div role="status" aria-label={label} className="space-y-3">
    <span className="sr-only">{label}</span>
    <Skeleton className="h-24 w-full" />
    <Skeleton className="h-48 w-full" />
  </div>;
}

export function AuctionLink({ to, children }: { to: string; children: ReactNode }) {
  return <Link className="inline-flex min-h-9 items-center rounded-sm text-sm font-semibold text-brand-blue hover:underline focus-visible:outline-2 focus-visible:outline-brand-blue" to={to}>{children}</Link>;
}

export function PrivateImage({ file, url, label }: { file?: File; url?: string | null; label: string }) {
  const [preview, setPreview] = useState<{ input: File | string; src: string }>();
  const [error, setError] = useState<string>();
  const [attempt, setAttempt] = useState(0);
  const input = file || url;
  useEffect(() => {
    if (!input) return;
    const controller = new AbortController();
    let objectUrl: string | undefined;
    const load = async () => {
      try {
        const blob = typeof input === 'string' ? await auctionApi.attachment(input, controller.signal) : input;
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(blob);
        setPreview({ input, src: objectUrl });
      } catch {
        if (!controller.signal.aborted) setError(typeof input === 'string' ? input : input.name);
      }
    };
    void load();
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [input, attempt]);
  if (preview && preview.input === input) {
    return <a href={preview.src} target="_blank" rel="noreferrer" aria-label={`Open ${label}`} className="block rounded-lg focus-visible:outline-2 focus-visible:outline-brand-blue">
      <img src={preview.src} alt={label} className="h-36 w-full rounded-lg bg-bg-surface object-contain" />
    </a>;
  }
  if (input && error === (typeof input === 'string' ? input : input.name)) {
    return <ErrorState message={`Could not load ${label}.`} onRetry={() => { setError(undefined); setAttempt(attempt + 1); }} />;
  }
  return <div className="flex min-h-28 items-center justify-center rounded-lg border border-dashed border-white/15 bg-bg-surface p-3 text-sm text-text-muted">
    {input ? 'Loading image…' : 'No photo selected'}
  </div>;
}

export function RefreshButton({ busy, onClick }: { busy?: boolean; onClick: () => void }) {
  return <Button type="button" variant="secondary" isLoading={busy} onClick={onClick}>Refresh</Button>;
}
