import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from 'lucide-react';

import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import {
  fetchPublicOrderVerification,
  type PublicOrderVerification,
} from '../api/buyerOrders';

const STATUS_CONFIG: Record<string, {
  label: string;
  detail: string;
  variant: 'success' | 'warning' | 'danger' | 'gold' | 'default';
  icon: typeof Clock3;
}> = {
  PENDING: { label: 'Pending confirmation', detail: 'The seller has not confirmed this order yet.', variant: 'warning', icon: Clock3 },
  RESERVED: { label: 'Pending confirmation', detail: 'The seller has not confirmed this order yet.', variant: 'warning', icon: Clock3 },
  CONFIRMED: { label: 'Confirmed', detail: 'The seller has confirmed this order.', variant: 'gold', icon: CheckCircle2 },
  AWAITING_BUYER_CONTACT: { label: 'Awaiting buyer contact', detail: 'The buyer and seller are arranging payment and delivery.', variant: 'warning', icon: Clock3 },
  PENDING_SELLER_ACTION: { label: 'Preparing shipment', detail: 'The seller is preparing this order for shipment.', variant: 'warning', icon: PackageCheck },
  SENT: { label: 'Shipped', detail: 'This order has been sent to the buyer.', variant: 'gold', icon: PackageCheck },
  FULFILLED: { label: 'Completed', detail: 'This order has been received and completed.', variant: 'success', icon: CheckCircle2 },
  CANCELLED: { label: 'Cancelled', detail: 'This order was cancelled.', variant: 'danger', icon: XCircle },
};

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Not available'
    : new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
}

export function OrderVerificationPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [verification, setVerification] = useState<PublicOrderVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadVerification = useCallback(async () => {
    if (!orderNumber) {
      setError('Missing order number.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      setVerification(await fetchPublicOrderVerification(orderNumber));
    } catch (requestError) {
      setVerification(null);
      setError(requestError instanceof Error ? requestError.message : 'Unable to verify this order.');
    } finally {
      setLoading(false);
    }
  }, [orderNumber]);

  useEffect(() => {
    void loadVerification();
  }, [loadVerification]);

  const config = verification ? STATUS_CONFIG[verification.status] ?? {
    label: verification.status.replaceAll('_', ' '),
    detail: 'The latest order status is shown above.',
    variant: 'default' as const,
    icon: Clock3,
  } : null;
  const StatusIcon = config?.icon ?? ShieldCheck;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-12rem)] max-w-2xl items-center px-4 py-10 sm:px-6">
      <section className="w-full overflow-hidden rounded-2xl border border-brand-blue/30 bg-bg-card shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
        <header className="border-b border-white/10 bg-gradient-to-r from-brand-blue/20 via-bg-card to-brand-gold/10 px-6 py-7 sm:px-8">
          <div className="flex items-start gap-4">
            <div className="rounded-xl border border-brand-blue/30 bg-brand-blue/10 p-3 text-brand-blue">
              <ShieldCheck aria-hidden="true" size={28} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-blue">Mythix verified order</p>
              <h1 className="mt-1 text-2xl font-bold text-white">Order verification</h1>
              <p className="mt-2 text-sm leading-6 text-gray-300">This page shows the latest public status from the Mythix order system.</p>
            </div>
          </div>
        </header>

        <div className="p-6 sm:p-8">
          {loading && (
            <div aria-label="Loading order verification" className="space-y-4">
              <div className="h-6 w-40 animate-pulse rounded bg-white/10" />
              <div className="h-28 animate-pulse rounded-xl bg-white/[0.04]" />
            </div>
          )}

          {!loading && error && (
            <div role="alert" className="rounded-xl border border-status-danger/30 bg-status-danger/10 p-5 text-center">
              <AlertCircle aria-hidden="true" className="mx-auto text-status-danger" size={30} />
              <h2 className="mt-3 font-semibold text-white">Order could not be verified</h2>
              <p className="mt-2 text-sm text-gray-300">{error}</p>
              <Button className="mt-5 gap-2" variant="secondary" onClick={() => void loadVerification()}>
                <RefreshCw aria-hidden="true" size={16} /> Try again
              </Button>
            </div>
          )}

          {!loading && verification && config && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-white/10 bg-bg-elevated p-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Order number</p>
                  <p className="mt-1 font-mono text-lg font-bold text-white">{verification.orderNumber}</p>
                </div>
                <Badge variant={config.variant} className="gap-1.5 py-1">
                  <StatusIcon aria-hidden="true" size={14} /> {config.label}
                </Badge>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
                <p className="text-sm font-semibold text-white">{config.detail}</p>
                <dl className="mt-5 grid gap-4 border-t border-white/10 pt-5 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Order type</dt>
                    <dd className="mt-1 font-medium text-gray-100">{verification.orderType === 'AUCTION' ? 'Auction' : 'Direct sale'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Last updated</dt>
                    <dd className="mt-1 font-medium text-gray-100">{formatDate(verification.updatedAt)}</dd>
                  </div>
                </dl>
              </div>

              <p className="rounded-lg bg-white/[0.035] px-4 py-3 text-xs leading-5 text-gray-400">
                For privacy, this public verification page does not show buyer details, seller contact information, card details, or payment data.
              </p>
            </div>
          )}
        </div>

        <footer className="border-t border-white/10 px-6 py-4 text-center sm:px-8">
          <Link to="/" className="text-sm font-medium text-brand-blue hover:text-blue-300">Back to Mythix TCG Store</Link>
        </footer>
      </section>
    </div>
  );
}
