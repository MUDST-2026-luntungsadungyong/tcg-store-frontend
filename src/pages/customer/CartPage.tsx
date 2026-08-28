import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Archive,
  Minus,
  Package,
  Plus,
  ShoppingCart,
  Trash2,
  Truck,
} from 'lucide-react';

import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { useToastStore } from '@/components/common/Toast';
import type { CartItem } from '@/types';

type CartLocationState = {
  items?: CartItem[];
};

const formatPrice = (amount: number) =>
  new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
  }).format(amount);

export function CartPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const addToast = useToastStore((state) => state.addToast);

  // Temporary cart state.
  // Until a real useCartStore is added, CartPage receives items through:
  // navigate('/cart', { state: { items } })
  const routeItems =
    (location.state as CartLocationState | null)?.items ?? [];

  const [items, setItems] = useState<CartItem[]>(routeItems);

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

  const updateQuantity = (productId: string, quantity: number) => {
    setItems((currentItems) =>
      currentItems.map((item) => {
        if (item.product.id !== productId) {
          return item;
        }

        const nextQuantity = Math.max(
          1,
          Math.min(quantity, item.product.stock),
        );

        if (quantity > item.product.stock) {
          addToast({
            type: 'warning',
            title: 'Stock limit reached',
            message: `Only ${item.product.stock} item(s) are available.`,
          });
        }

        return {
          ...item,
          quantity: nextQuantity,
        };
      }),
    );
  };

  const removeItem = (productId: string) => {
    const item = items.find((cartItem) => cartItem.product.id === productId);

    setItems((currentItems) =>
      currentItems.filter(
        (cartItem) => cartItem.product.id !== productId,
      ),
    );

    if (item) {
      addToast({
        type: 'info',
        title: 'Item removed',
        message: `${item.product.name} was removed from your cart.`,
      });
    }
  };

  const proceedToCheckout = () => {
    if (items.length === 0) {
      addToast({
        type: 'warning',
        title: 'Cart is empty',
        message: 'Add at least one item before checking out.',
      });
      return;
    }

    const unavailableItem = items.find(
      (item) =>
        item.product.stock <= 0 ||
        item.quantity > item.product.stock,
    );

    if (unavailableItem) {
      addToast({
        type: 'error',
        title: 'Stock unavailable',
        message: `Please review the quantity for ${unavailableItem.product.name}.`,
      });
      return;
    }

    navigate('/checkout', {
      state: {
        items,
      },
    });
  };

  if (items.length === 0) {
    return (
      <div className="py-16">
        <div className="glass-card mx-auto max-w-xl rounded-2xl border border-white/10 p-8 text-center">
          <ShoppingCart className="mx-auto mb-4 h-12 w-12 text-gray-400" />

          <h1 className="mb-2 text-3xl font-bold text-white">
            Your cart is empty
          </h1>

          <p className="mb-6 text-gray-400">
            Browse the marketplace and add cards to your cart.
          </p>

          <Button onClick={() => navigate('/browse')}>
            Browse Cards
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 pb-20">
      <div className="mb-8">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-brand-blue">
          Shopping Cart
        </p>

        <h1 className="text-3xl font-bold text-white md:text-4xl">
          Your Cart
        </h1>

        <p className="mt-2 text-gray-400">
          Review your items before proceeding to checkout.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="glass-card rounded-2xl border border-white/10 p-6 lg:col-span-8">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <Archive className="h-5 w-5 text-brand-blue" />

            <h2 className="text-xl font-semibold text-white">
              Items in Cart
            </h2>

            <Badge variant="default">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </Badge>
          </div>

          <div className="divide-y divide-white/10">
            {items.map((item) => (
              <article
                key={item.product.id}
                className="flex flex-col gap-4 py-5 first:pt-0 last:pb-0 sm:flex-row"
              >
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="h-32 w-24 shrink-0 rounded-xl object-cover"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col justify-between gap-4 md:flex-row">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {item.product.name}
                      </h3>

                      <p className="mt-1 text-sm text-gray-400">
                        {item.product.game}
                        {item.product.condition
                          ? ` • ${item.product.condition}`
                          : ''}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Badge
                          variant={
                            item.product.stock > 0
                              ? 'success'
                              : 'danger'
                          }
                        >
                          {item.product.stock > 0
                            ? 'In Stock'
                            : 'Out of Stock'}
                        </Badge>

                        <span className="text-sm text-gray-500">
                          {item.product.stock} available
                        </span>
                      </div>
                    </div>

                    <strong className="whitespace-nowrap text-lg text-white">
                      {formatPrice(
                        item.product.price * item.quantity,
                      )}
                    </strong>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center rounded-lg border border-white/10 bg-white/5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="rounded-r-none px-3"
                        aria-label={`Decrease ${item.product.name} quantity`}
                        disabled={item.quantity <= 1}
                        onClick={() =>
                          updateQuantity(
                            item.product.id,
                            item.quantity - 1,
                          )
                        }
                      >
                        <Minus className="h-4 w-4" />
                      </Button>

                      <span
                        className="min-w-12 px-3 text-center text-sm font-semibold text-white"
                        aria-live="polite"
                      >
                        {item.quantity}
                      </span>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="rounded-l-none px-3"
                        aria-label={`Increase ${item.product.name} quantity`}
                        disabled={
                          item.product.stock <= 0 ||
                          item.quantity >= item.product.stock
                        }
                        onClick={() =>
                          updateQuantity(
                            item.product.id,
                            item.quantity + 1,
                          )
                        }
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-status-danger hover:text-status-danger"
                      onClick={() =>
                        removeItem(item.product.id)
                      }
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="lg:col-span-4">
          <div className="glass-card sticky top-24 rounded-2xl border border-white/10 p-6">
            <h2 className="mb-5 text-xl font-semibold text-white">
              Order Summary
            </h2>

            <dl className="space-y-4 text-sm">
              <div className="flex items-center justify-between text-gray-300">
                <dt>
                  Subtotal ({itemCount}{' '}
                  {itemCount === 1 ? 'item' : 'items'})
                </dt>
                <dd>{formatPrice(subtotal)}</dd>
              </div>

              <div className="flex items-center justify-between text-gray-300">
                <dt className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Shipping
                </dt>
                <dd className="text-status-success">Free</dd>
              </div>

              <div className="border-t border-white/10 pt-4">
                <div className="flex items-end justify-between">
                  <dt className="text-base font-semibold text-white">
                    Total
                  </dt>
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
              onClick={proceedToCheckout}
            >
              Proceed to Checkout
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="mt-2 w-full"
              onClick={() => navigate('/browse')}
            >
              Continue Shopping
            </Button>

            <div className="mt-5 flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
              <Package className="mt-0.5 h-5 w-5 shrink-0 text-brand-blue" />

              <p className="text-sm leading-6 text-gray-400">
                Stock availability will be checked again when you
                confirm the order during checkout.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default CartPage;
