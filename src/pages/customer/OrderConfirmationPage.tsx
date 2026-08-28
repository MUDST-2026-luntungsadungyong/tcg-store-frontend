import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  MapPin,
  Package,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react';

import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import type { Order } from '@/types';

type OrderConfirmationLocationState = {
  createdOrder?: Order;
  qcProtectionEnabled?: boolean;
};

const formatPrice = (amount: number) =>
  new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
  }).format(amount);

const paymentLabels: Record<string, string> = {
  QR_CODE: 'QR Code',
  CREDIT_CARD: 'Credit Card',
  ESCROW: 'Escrow',
};

export function OrderConfirmationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as OrderConfirmationLocationState | null;
  const order = state?.createdOrder;
  const qcProtectionEnabled = state?.qcProtectionEnabled ?? false;

  const itemCount = useMemo(
    () => order?.items.reduce((total, item) => total + item.quantity, 0) ?? 0,
    [order],
  );

  if (!order) {
    return (
      <div className="py-16">
        <div className="glass-card mx-auto max-w-xl rounded-2xl border border-white/10 p-8 text-center">
          <Package className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h1 className="mb-2 text-3xl font-bold text-white">
            Order information unavailable
          </h1>
          <p className="mb-6 text-gray-400">
            Open this page after completing checkout to view the order summary.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={() => navigate('/orders')}>View My Orders</Button>
            <Button variant="secondary" onClick={() => navigate('/browse')}>
              Browse Cards
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 pb-20">
      <section className="mx-auto mb-8 max-w-3xl text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-status-success/10">
          <CheckCircle2 className="h-9 w-9 text-status-success" />
        </div>
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-status-success">
          Order placed successfully
        </p>
        <h1 className="text-3xl font-bold text-white md:text-4xl">
          Order Confirmed
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-gray-400">
          Your order has been created and is waiting for the next processing step.
        </p>
      </section>

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="glass-card rounded-2xl border border-white/10 p-6 lg:col-span-2">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5">
            <div>
              <p className="text-sm text-gray-400">Order number</p>
              <h2 className="mt-1 text-2xl font-bold text-white">{order.id}</h2>
            </div>
            <Badge variant="warning">{order.status}</Badge>
          </div>

          <div className="mb-6">
            <div className="mb-4 flex items-center gap-3">
              <Package className="h-5 w-5 text-brand-blue" />
              <h3 className="text-lg font-semibold text-white">
                Items ({itemCount})
              </h3>
            </div>

            <div className="divide-y divide-white/10">
              {order.items.map((item) => (
                <article
                  key={item.product.id}
                  className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="h-20 w-16 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate font-semibold text-white">
                      {item.product.name}
                    </h4>
                    <p className="mt-1 text-sm text-gray-400">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <strong className="whitespace-nowrap text-white">
                    {formatPrice(item.product.price * item.quantity)}
                  </strong>
                </article>
              ))}
            </div>
          </div>

          <div className="grid gap-4 border-t border-white/10 pt-6 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="mb-2 flex items-center gap-2 text-white">
                <MapPin className="h-4 w-4 text-brand-blue" />
                <strong>Shipping Address</strong>
              </div>
              <p className="text-sm leading-6 text-gray-400">
                {order.shippingAddress}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="mb-2 flex items-center gap-2 text-white">
                <CreditCard className="h-4 w-4 text-brand-gold" />
                <strong>Payment Method</strong>
              </div>
              <p className="text-sm text-gray-400">
                {paymentLabels[order.paymentMethod] ?? order.paymentMethod}
              </p>
            </div>
          </div>
        </section>

        <aside className="glass-card h-fit rounded-2xl border border-white/10 p-6">
          <h2 className="mb-5 text-xl font-semibold text-white">
            Order Summary
          </h2>

          <dl className="space-y-4 text-sm">
            <div className="flex items-center justify-between text-gray-300">
              <dt>Items</dt>
              <dd>{itemCount}</dd>
            </div>

            <div className="flex items-center justify-between text-gray-300">
              <dt>Shipping</dt>
              <dd className="text-status-success">Free</dd>
            </div>

            <div className="flex items-center justify-between text-gray-300">
              <dt className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" /> QC Protection
              </dt>
              <dd>{qcProtectionEnabled ? 'Enabled' : 'Not enabled'}</dd>
            </div>

            <div className="border-t border-white/10 pt-4">
              <div className="flex items-end justify-between">
                <dt className="font-semibold text-white">Total</dt>
                <dd className="text-2xl font-bold text-white">
                  {formatPrice(order.totalAmount)}
                </dd>
              </div>
            </div>
          </dl>

          <Button
            type="button"
            size="lg"
            className="mt-6 w-full"
            onClick={() => navigate('/orders')}
          >
            <ShoppingBag className="mr-2 h-5 w-5" />
            View My Orders
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="mt-2 w-full"
            onClick={() => navigate('/browse')}
          >
            Continue Shopping
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </aside>
      </div>
    </div>
  );
}

export default OrderConfirmationPage;
