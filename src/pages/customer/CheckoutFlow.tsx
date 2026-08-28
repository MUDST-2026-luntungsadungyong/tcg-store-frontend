import { useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  CreditCard,
  MapPin,
  Package,
  ShieldCheck,
  Truck,
  WalletCards,
} from 'lucide-react';

import { ordersApi } from '@/api/orders';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { Select } from '@/components/common/Select';
import { useToastStore } from '@/components/common/Toast';
import type { CartItem } from '@/types';

type CheckoutLocationState = {
  items?: CartItem[];
};

type ShippingForm = {
  fullName: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
};

const paymentOptions = [
  { value: '', label: 'Select payment method' },
  { value: 'QR_CODE', label: 'QR Code' },
  { value: 'CREDIT_CARD', label: 'Credit Card' },
  { value: 'ESCROW', label: 'Escrow' },
];

const formatPrice = (amount: number) =>
  new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
  }).format(amount);

export function CheckoutFlow() {
  const navigate = useNavigate();
  const location = useLocation();
  const addToast = useToastStore((state) => state.addToast);

  // CartPage passes the items to Checkout through router state.
  // navigate('/checkout', { state: { items } })
  const items = (location.state as CheckoutLocationState | null)?.items ?? [];

  const [shipping, setShipping] = useState<ShippingForm>({
    fullName: '',
    address: '',
    city: '',
    postalCode: '',
    phone: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('');
  const [qcProtectionEnabled, setQcProtectionEnabled] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const itemCount = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items],
  );

  const subtotal = useMemo(
    () =>
      items.reduce(
        (total, item) => total + item.product.price * item.quantity,
        0,
      ),
    [items],
  );

  const shippingComplete =
    shipping.fullName.trim() !== '' &&
    shipping.address.trim() !== '' &&
    shipping.city.trim() !== '' &&
    shipping.postalCode.trim() !== '' &&
    shipping.phone.trim() !== '';

  const detailsComplete = shippingComplete && paymentMethod !== '';

  const updateShipping = (field: keyof ShippingForm, value: string) => {
    setShipping((current) => ({ ...current, [field]: value }));
  };

  const handleReviewOrder = () => {
    if (items.length === 0) {
      addToast({
        type: 'warning',
        title: 'Cart is empty',
        message: 'Add at least one item before checking out.',
      });
      return;
    }

    if (!detailsComplete) {
      setShowValidation(true);
      addToast({
        type: 'warning',
        title: 'Checkout information required',
        message: 'Please complete the shipping address and payment method.',
      });
      return;
    }

    setConfirmationOpen(true);
  };

  const confirmOrder = async () => {
    if (isSubmitting || !detailsComplete || items.length === 0) return;

    setIsSubmitting(true);

    const shippingAddress = [
      shipping.fullName,
      shipping.address,
      `${shipping.city} ${shipping.postalCode}`,
      `Phone: ${shipping.phone}`,
    ].join(', ');

    try {
      const order = await ordersApi.createOrder(
        items,
        shippingAddress,
        paymentMethod,
      );

      setConfirmationOpen(false);

      navigate('/order-confirmation', {
        replace: true,
        state: {
          createdOrder: order,
          qcProtectionEnabled,
        },
      });
    } catch (error) {
      console.error('Failed to place order', error);
      addToast({
        type: 'error',
        title: 'Checkout failed',
        message: 'We could not place your order. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // CartPage owns the empty-cart state.
  // Checkout should only be accessible when there are items to review.
  if (items.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  return (
    <div className="py-6 pb-20">
      <div className="mb-8">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-brand-blue">
          Checkout
        </p>
        <h1 className="text-3xl font-bold text-white md:text-4xl">
          Order Review
        </h1>
        <p className="mt-2 text-gray-400">
          Review your shipping information, payment method, and cart items.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <section className="glass-card rounded-2xl border border-white/10 p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-blue/10">
                <MapPin className="h-5 w-5 text-brand-blue" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Shipping Address
                </h2>
                <p className="text-sm text-gray-400">
                  Enter the address where you want the order delivered.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                id="checkout-full-name"
                label="Full name"
                value={shipping.fullName}
                onChange={(event) =>
                  updateShipping('fullName', event.target.value)
                }
                error={
                  showValidation && !shipping.fullName.trim()
                    ? 'Full name is required.'
                    : undefined
                }
                placeholder="Jane Doe"
              />

              <Input
                id="checkout-phone"
                label="Phone"
                value={shipping.phone}
                onChange={(event) =>
                  updateShipping('phone', event.target.value)
                }
                error={
                  showValidation && !shipping.phone.trim()
                    ? 'Phone number is required.'
                    : undefined
                }
                placeholder="0812345678"
              />

              <Input
                id="checkout-address"
                label="Address"
                value={shipping.address}
                onChange={(event) =>
                  updateShipping('address', event.target.value)
                }
                error={
                  showValidation && !shipping.address.trim()
                    ? 'Address is required.'
                    : undefined
                }
                placeholder="123 Main Street"
                className="md:col-span-2"
              />

              <Input
                id="checkout-city"
                label="City / Province"
                value={shipping.city}
                onChange={(event) =>
                  updateShipping('city', event.target.value)
                }
                error={
                  showValidation && !shipping.city.trim()
                    ? 'City or province is required.'
                    : undefined
                }
                placeholder="Bangkok"
              />

              <Input
                id="checkout-postal-code"
                label="Postal code"
                value={shipping.postalCode}
                onChange={(event) =>
                  updateShipping('postalCode', event.target.value)
                }
                error={
                  showValidation && !shipping.postalCode.trim()
                    ? 'Postal code is required.'
                    : undefined
                }
                placeholder="10110"
              />
            </div>
          </section>

          <section className="glass-card rounded-2xl border border-white/10 p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-gold/10">
                <CreditCard className="h-5 w-5 text-brand-gold" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Payment Method
                </h2>
                <p className="text-sm text-gray-400">
                  Choose how you want to pay for this order.
                </p>
              </div>
            </div>

            <Select
              id="checkout-payment-method"
              label="Payment method"
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)}
              options={paymentOptions}
              error={
                showValidation && !paymentMethod
                  ? 'Please select a payment method.'
                  : undefined
              }
            />

            <div className="mt-5 flex items-start gap-3 rounded-xl border border-brand-blue/20 bg-brand-blue/5 p-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-blue" />
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">QC Protection</p>
                    <p className="text-sm text-gray-400">
                      Request an authenticity check before final delivery.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant={qcProtectionEnabled ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() =>
                      setQcProtectionEnabled((enabled) => !enabled)
                    }
                  >
                    {qcProtectionEnabled ? 'Enabled' : 'Enable'}
                  </Button>
                </div>
              </div>
            </div>
          </section>

          <section className="glass-card rounded-2xl border border-white/10 p-6">
            <div className="mb-5 flex items-center gap-3">
              <Package className="h-5 w-5 text-brand-blue" />
              <h2 className="text-xl font-semibold text-white">
                Items in Cart
              </h2>
              <Badge variant="default">{itemCount} items</Badge>
            </div>

            <div className="divide-y divide-white/10">
              {items.map((item) => (
                <article
                  key={item.product.id}
                  className="flex gap-4 py-5 first:pt-0 last:pb-0"
                >
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="h-24 w-20 shrink-0 rounded-lg object-cover"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row">
                      <div>
                        <h3 className="font-semibold text-white">
                          {item.product.name}
                        </h3>
                        <p className="mt-1 text-sm text-gray-400">
                          {item.product.game}
                          {item.product.condition
                            ? ` • ${item.product.condition}`
                            : ''}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <Badge
                            variant={
                              item.product.stock > 0 ? 'success' : 'danger'
                            }
                          >
                            {item.product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                          </Badge>
                          <span className="text-sm text-gray-400">
                            Qty: {item.quantity}
                          </span>
                        </div>
                      </div>

                      <strong className="whitespace-nowrap text-white">
                        {formatPrice(item.product.price * item.quantity)}
                      </strong>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="lg:col-span-4">
          <div className="glass-card sticky top-24 rounded-2xl border border-white/10 p-6">
            <h2 className="mb-5 text-xl font-semibold text-white">
              Order Summary
            </h2>

            <dl className="space-y-4 text-sm">
              <div className="flex items-center justify-between text-gray-300">
                <dt>Subtotal ({itemCount} items)</dt>
                <dd>{formatPrice(subtotal)}</dd>
              </div>

              <div className="flex items-center justify-between text-gray-300">
                <dt className="flex items-center gap-2">
                  <Truck className="h-4 w-4" /> Shipping
                </dt>
                <dd className="text-status-success">Free</dd>
              </div>

              {qcProtectionEnabled && (
                <div className="flex items-center justify-between text-gray-300">
                  <dt className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" /> QC Protection
                  </dt>
                  <dd>Included</dd>
                </div>
              )}

              <div className="border-t border-white/10 pt-4">
                <div className="flex items-end justify-between">
                  <dt className="text-base font-semibold text-white">Total</dt>
                  <dd className="text-2xl font-bold text-white">
                    {formatPrice(subtotal)}
                  </dd>
                </div>
              </div>
            </dl>

            <Button
              type="button"
              size="lg"
              className="mt-6 w-full"
              onClick={handleReviewOrder}
            >
              Confirm Checkout
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="mt-2 w-full"
              onClick={() => navigate('/cart')}
            >
              Back to Cart
            </Button>
          </div>
        </aside>
      </div>

      <Modal
        isOpen={confirmationOpen}
        onClose={() => {
          if (!isSubmitting) setConfirmationOpen(false);
        }}
        title="Confirm your order?"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              disabled={isSubmitting}
              onClick={() => setConfirmationOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              isLoading={isSubmitting}
              onClick={confirmOrder}
            >
              Confirm Order
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-gray-300">
          <p>
            Please review your shipping address, payment method, and items
            before confirming.
          </p>

          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-white">
              <MapPin className="h-4 w-4 text-brand-blue" />
              <strong>Ship to</strong>
            </div>
            <p className="text-sm">
              {shipping.fullName}<br />
              {shipping.address}<br />
              {shipping.city} {shipping.postalCode}<br />
              {shipping.phone}
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4">
            <span className="flex items-center gap-2">
              <WalletCards className="h-4 w-4 text-brand-gold" />
              Payment
            </span>
            <strong className="text-white">
              {paymentOptions.find((option) => option.value === paymentMethod)
                ?.label ?? paymentMethod}
            </strong>
          </div>

          <div className="flex items-center justify-between border-t border-white/10 pt-4">
            <strong className="text-white">Order Total</strong>
            <strong className="text-xl text-white">
              {formatPrice(subtotal)}
            </strong>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default CheckoutFlow;
