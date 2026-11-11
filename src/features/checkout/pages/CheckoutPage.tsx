import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ButtonLink } from '@/shared/components/ButtonLink';
import { AlertCircle, ArrowLeft, LockKeyhole, Tag, ChevronRight, Check } from 'lucide-react';

import { useAuthStore } from '@/features/auth/model/useAuthStore';
import { checkoutReservationCart } from '@/features/reservation-cart/api/reservationCart';
import { useReservationCartStore } from '@/features/reservation-cart/model/useReservationCartStore';
import { previewReservationOrders } from '@/features/reservations/api/reservationOrders';
import { fetchMyVouchers, validateVoucherApi } from '@/features/vouchers/api/vouchers';
import { CheckoutVoucherModal } from '@/features/vouchers/components/CheckoutVoucherModal';
import type { Voucher } from '@/features/vouchers/model/types';
import { useVoucherLiveUpdates } from '@/features/vouchers/model/useVoucherLiveUpdates';
import { isUserVoucherCurrentlyUsable } from '@/features/vouchers/model/voucherUtils';
import {
  calculatePlatformFee,
  DEFAULT_PLATFORM_FEE_POLICY,
  fetchPlatformFeePolicy,
  type PlatformFeePolicy,
} from '@/features/checkout/api/platformFee';

const money = (value: number) => `฿${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export function CheckoutPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const items = useReservationCartStore((state) => state.items);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [feePolicy, setFeePolicy] = useState<PlatformFeePolicy>(DEFAULT_PLATFORM_FEE_POLICY);

  const preview = useMemo(() => {
    try {
      return previewReservationOrders(items);
    } catch {
      return null;
    }
  }, [items]);

  const revalidateSelectedVoucher = useCallback(async () => {
    if (!selectedVoucher || !preview) return;
    try {
      const validation = await validateVoucherApi(selectedVoucher.code, preview.totalAmount);
      if (!validation.valid) {
        setSelectedVoucher(null);
        setError(`โค้ดส่วนลด ${selectedVoucher.code} ไม่สามารถใช้งานได้แล้ว: ${validation.message}`);
        return;
      }
      const wallet = await fetchMyVouchers('CLAIMED');
      const matched = wallet.find((uv) => uv.code.toUpperCase() === selectedVoucher.code.toUpperCase());
      if (matched) {
        if (!isUserVoucherCurrentlyUsable(matched)) {
          setSelectedVoucher(null);
          setError(`โค้ดส่วนลด ${selectedVoucher.code} ถูกปิดใช้งานหรือหมดอายุแล้ว`);
          return;
        }
        setSelectedVoucher((prev) =>
          prev
            ? {
                ...prev,
                title: matched.title,
                description: matched.description,
                discountType: matched.discountType,
                discountValue: Number(matched.discountValue),
                minSpend: Number(matched.minSpend || 0),
                maxDiscountAmount: matched.maxDiscountAmount != null ? Number(matched.maxDiscountAmount) : null,
                startTime: matched.startTime ?? prev.startTime,
                endTime: matched.endTime,
                isActive: matched.isActive !== false,
              }
            : null
        );
      }
    } catch {
      // Keep current state on transient network glitch
    }
  }, [selectedVoucher, preview]);

  useVoucherLiveUpdates({
    enabled: Boolean(selectedVoucher),
    onRefresh: revalidateSelectedVoucher,
  });

  const discountAmount = useMemo(() => {
    if (!selectedVoucher || !preview) return 0;
    if (preview.totalAmount < selectedVoucher.minSpend) return 0;
    if (selectedVoucher.discountType === 'FIXED_AMOUNT') {
      return Math.min(selectedVoucher.discountValue, preview.totalAmount);
    }
    const pct = (preview.totalAmount * selectedVoucher.discountValue) / 100;
    const capped = selectedVoucher.maxDiscountAmount ? Math.min(pct, selectedVoucher.maxDiscountAmount) : pct;
    return Math.min(capped, preview.totalAmount);
  }, [selectedVoucher, preview]);

  const finalTotal = useMemo(() => {
    if (!preview) return 0;
    return Math.max(0, preview.totalAmount - discountAmount);
  }, [preview, discountAmount]);

  const platformFee = useMemo(
    () => calculatePlatformFee(preview?.totalAmount ?? 0, feePolicy),
    [preview, feePolicy],
  );

  useEffect(() => {
    void fetchPlatformFeePolicy().then(setFeePolicy).catch(() => {
      // Keep the published default visible if the public policy endpoint is temporarily unavailable.
      setFeePolicy(DEFAULT_PLATFORM_FEE_POLICY);
    });
  }, []);

  if (!preview || items.length === 0) {
    return (
      <main className="min-h-[calc(100vh-64px)] bg-bg-base px-4 py-16 text-white md:px-8">
        <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-bg-card p-10 text-center">
          <h1 className="text-3xl font-bold">Nothing to review</h1>
          <p className="mt-3 text-gray-400">Add a card to your reservation cart first.</p>
          <ButtonLink to="/cards" className="mt-7" size="lg">Browse cards</ButtonLink>
        </div>
      </main>
    );
  }

  const submitReservation = async () => {
    if (!user) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await checkoutReservationCart(user.id, selectedVoucher?.code);
      const orderIds = result.orders.map((order) => order.id).join(',');
      navigate(`/checkout/confirmation?orderIds=${encodeURIComponent(orderIds)}`);
    } catch (err: any) {
      const serverMessage = err?.response?.data?.message ?? err?.response?.data?.error;
      setError(serverMessage || (err instanceof Error ? err.message : 'Unable to reserve these cards. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-64px)] bg-bg-base px-4 py-10 text-white md:px-8">
      <div className="mx-auto max-w-5xl">
        <Link to="/cart" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white"><ArrowLeft size={16} /> Back to cart</Link>
        <div className="mt-6 mb-8">
          <h1 className="text-3xl font-bold md:text-4xl">Order Review</h1>
          <p className="mt-2 text-sm text-gray-400">Confirm the cards to reserve before creating the order.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <section className="space-y-4">
            {preview.groups.map((group) => (
              <div key={group.sellerId} className="rounded-2xl border border-white/10 bg-bg-card p-5">
                <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
                  <h2 className="font-semibold">Seller {group.sellerId}</h2>
                  <span className="text-sm text-gray-400">{group.items.length} item(s)</span>
                </div>
                <div className="space-y-3">
                  {group.items.map((item) => (
                    <div key={item.listing.id} className="flex items-center gap-3">
                      <img src={item.listing.image} alt="" className="size-14 rounded-lg bg-bg-base object-contain p-1" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{item.listing.name}</p>
                        <p className="text-xs text-gray-400">Qty {item.quantity} · {money(item.listing.price)} each</p>
                      </div>
                      <span className="text-sm font-semibold text-brand-blue">{money(item.listing.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>

          <aside className="h-fit rounded-2xl border border-white/10 bg-bg-card p-6">
            <h2 className="text-lg font-bold">Reservation total</h2>

            {/* Shopee-style Voucher Selector Button */}
            <div className="mt-4 pb-4 border-b border-white/10">
              <button
                type="button"
                onClick={() => setIsVoucherModalOpen(true)}
                className="w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-left flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">โค้ดส่วนลด Mythix</div>
                    {selectedVoucher ? (
                      <div className="text-xs font-bold text-amber-300 truncate flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-400" />
                        {selectedVoucher.code} ({money(discountAmount)})
                      </div>
                    ) : (
                      <div className="text-xs text-gray-300 truncate">เลือกหรือใส่โค้ดส่วนลด</div>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors shrink-0" />
              </button>
            </div>

            {/* Price Breakdown */}
            <div className="mt-4 space-y-2 text-sm border-b border-white/10 pb-4">
              <div className="flex items-center justify-between text-gray-400">
                <span>ยอดรวมสินค้า (Subtotal)</span>
                <span className="text-white">{money(preview.totalAmount)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex items-center justify-between text-emerald-400 font-semibold animate-fade-in">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" /> ส่วนลดจากโค้ด
                  </span>
                  <span>-{money(discountAmount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-gray-400">
                <span>Platform service fee (seller)</span>
                <span className="text-brand-gold">{money(platformFee)}</span>
              </div>
              <p className="-mt-1 text-[11px] leading-4 text-gray-500">
                {`${(feePolicy.rate * 100).toFixed(0)}% (minimum ${money(feePolicy.minimumFee)}) is deducted from the seller settlement; your total is unchanged.`}
              </p>
              <div className="pt-2 flex items-center justify-between text-base font-bold text-white border-t border-white/5">
                <span>ยอดชำระสุทธิ</span>
                <span className="text-xl text-brand-blue">{money(finalTotal)}</span>
              </div>
            </div>

            <div className="mt-4 flex items-start gap-3 rounded-xl bg-brand-blue/10 p-3 text-xs leading-5 text-gray-300">
              <LockKeyhole size={16} className="mt-0.5 shrink-0 text-brand-blue" />
              <span>Stock is validated and reserved when you confirm. No payment or shipping address is collected in this phase.</span>
            </div>

            {error && (
              <div role="alert" className="mt-4 flex gap-2 rounded-xl border border-status-danger/30 bg-status-danger/10 p-3 text-sm text-red-200">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => void submitReservation()}
              disabled={isSubmitting || !user}
              className="mt-6 flex w-full items-center justify-center rounded-xl bg-brand-blue px-5 py-3 font-semibold text-bg-base hover:bg-brand-blue/90 disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-lg active:scale-98"
            >
              {isSubmitting ? 'Reserving…' : `Confirm reservation (${money(finalTotal)})`}
            </button>
          </aside>
        </div>
      </div>

      {/* Shopee-style Voucher Selection Modal */}
      <CheckoutVoucherModal
        isOpen={isVoucherModalOpen}
        onClose={() => setIsVoucherModalOpen(false)}
        subtotal={preview.totalAmount}
        selectedVoucher={selectedVoucher}
        onApplyVoucher={(voucher) => setSelectedVoucher(voucher)}
      />
    </main>
  );
}
