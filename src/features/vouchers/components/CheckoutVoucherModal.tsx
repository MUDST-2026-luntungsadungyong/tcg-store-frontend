import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { X, Tag, AlertCircle, Check } from 'lucide-react';
import type { UserVoucher, Voucher } from '../model/types';
import { fetchMyVouchers, validateVoucherApi } from '../api/vouchers';
import { useVoucherLiveUpdates } from '../model/useVoucherLiveUpdates';
import {
  getUserVoucherAvailabilityReason,
  isUserVoucherCurrentlyUsable,
} from '../model/voucherUtils';
import { VoucherTicket } from './VoucherTicket';

function mapUserVoucherToVoucher(uv: UserVoucher): Voucher {
  return {
    id: uv.voucherId ?? uv.id,
    code: uv.code,
    title: uv.title,
    description: uv.description,
    discountType: uv.discountType,
    discountValue: Number(uv.discountValue),
    minSpend: Number(uv.minSpend || 0),
    maxDiscountAmount: uv.maxDiscountAmount != null ? Number(uv.maxDiscountAmount) : null,
    totalQuota: 1,
    usedQuota: 0,
    remainingQuota: 1,
    quotaPercentage: 100,
    startTime: uv.startTime ?? null,
    endTime: uv.endTime,
    isActive: uv.isActive !== false,
    isClaimed: true,
  };
}

interface CheckoutVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtotal: number;
  selectedVoucher: Voucher | null;
  onApplyVoucher: (voucher: Voucher | null) => void;
}

export function CheckoutVoucherModal({
  isOpen,
  onClose,
  subtotal,
  selectedVoucher,
  onApplyVoucher,
}: CheckoutVoucherModalProps) {
  const [userVouchers, setUserVouchers] = useState<UserVoucher[]>([]);
  const [loading, setLoading] = useState(false);
  const [customCode, setCustomCode] = useState('');
  const [customError, setCustomError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [tempSelected, setTempSelected] = useState<Voucher | null>(selectedVoucher);

  const loadClaimedVouchers = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    try {
      const data = await fetchMyVouchers('CLAIMED');
      setUserVouchers(data);
    } catch {
      if (!silent) {
        setUserVouchers([]);
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTempSelected(selectedVoucher);
      setCustomError(null);
      void loadClaimedVouchers(false);
    }
  }, [isOpen, selectedVoucher, loadClaimedVouchers]);

  useVoucherLiveUpdates({
    enabled: isOpen,
    onRefresh: () => loadClaimedVouchers(true),
  });

  if (!isOpen) return null;

  const usableVouchers = userVouchers.filter((uv) => isUserVoucherCurrentlyUsable(uv)).map(mapUserVoucherToVoucher);
  const unavailableUserVouchers = userVouchers.filter((uv) => !isUserVoucherCurrentlyUsable(uv));
  const vouchers = usableVouchers;

  const handleApplyCustomCode = async (e: FormEvent) => {
    e.preventDefault();
    const code = customCode.trim().toUpperCase();
    if (!code) return;

    setValidating(true);
    setCustomError(null);
    try {
      const res = await validateVoucherApi(code, subtotal);
      if (res.valid) {
        // Find in vouchers or create synthetic voucher
        const matched = vouchers.find((v) => v.code.toUpperCase() === code);
        if (matched) {
          setTempSelected(matched);
        } else {
          setTempSelected({
            id: 0,
            code,
            title: `โค้ดส่วนลด ${code}`,
            description: res.message,
            discountType: res.discountType || 'FIXED_AMOUNT',
            discountValue: res.discountValue || res.discountAmount,
            minSpend: 0,
            maxDiscountAmount: null,
            totalQuota: 999,
            usedQuota: 0,
            remainingQuota: 999,
            quotaPercentage: 10,
            startTime: null,
            endTime: null,
            isActive: true,
          });
        }
        setCustomCode('');
      } else {
        setCustomError(res.message || 'โค้ดส่วนลดไม่ถูกต้องหรือไม่สามารถใช้ได้');
      }
    } catch (err: any) {
      setCustomError(err?.response?.data?.message || 'ไม่สามารถตรวจสอบโค้ดส่วนลดได้');
    } finally {
      setValidating(false);
    }
  };

  const eligibleVouchers = vouchers.filter((v) => subtotal >= v.minSpend);
  const ineligibleVouchers = vouchers.filter((v) => subtotal < v.minSpend);

  const handleConfirm = () => {
    onApplyVoucher(tempSelected);
    onClose();
  };

  const handleRemove = () => {
    setTempSelected(null);
    onApplyVoucher(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#0f172a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-[#161f36]">
          <div className="flex items-center gap-2.5">
            <Tag className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white">เลือกโค้ดส่วนลด Mythix</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Custom Code Input Form */}
          <form onSubmit={handleApplyCustomCode} className="space-y-2">
            <label className="block text-xs font-semibold text-gray-300">ใส่โค้ดส่วนลดโปรโมชัน</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="ระบุโค้ดส่วนลด เช่น WELCOME10"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                className="flex-1 bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-blue"
              />
              <button
                type="submit"
                disabled={!customCode.trim() || validating}
                className="px-5 py-2.5 rounded-xl bg-brand-blue hover:bg-brand-blue/90 text-bg-base font-bold text-sm transition-all disabled:opacity-50"
              >
                {validating ? 'ตรวจ...' : 'ใช้โค้ด'}
              </button>
            </div>
            {customError && (
              <div className="flex items-center gap-1.5 text-xs text-rose-400 mt-1">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{customError}</span>
              </div>
            )}
          </form>

          {/* Selected Voucher Highlight */}
          {tempSelected && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
                  ✓
                </div>
                <div>
                  <div className="text-xs text-amber-300 font-semibold">กำลังเลือกใช้โค้ด</div>
                  <div className="text-sm font-bold text-white">{tempSelected.code} - {tempSelected.title}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTempSelected(null)}
                className="text-xs text-gray-400 hover:text-rose-400 transition-colors underline"
              >
                ไม่ใช้โค้ดนี้
              </button>
            </div>
          )}

          {/* Vouchers List */}
          {loading ? (
            <div className="py-12 text-center text-gray-400 text-sm">กำลังโหลดคูปองส่วนลด...</div>
          ) : (
            <div className="space-y-6">
              {/* Eligible Vouchers */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  โค้ดส่วนลดที่ใช้ได้ ({eligibleVouchers.length})
                </h3>
                {eligibleVouchers.length === 0 ? (
                  <p className="text-sm text-gray-500 italic py-2">
                    {vouchers.length === 0
                      ? 'คุณยังไม่มีโค้ดส่วนลดที่เก็บไว้'
                      : 'ไม่มีโค้ดส่วนลดที่ตรงตามยอดซื้อปัจจุบัน'}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {eligibleVouchers.map((v) => (
                      <VoucherTicket
                        key={v.id}
                        voucher={v}
                        mode="checkout"
                        subtotal={subtotal}
                        selected={tempSelected?.code.toUpperCase() === v.code.toUpperCase()}
                        onSelect={(voucher) => setTempSelected(voucher)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Ineligible Vouchers */}
              {ineligibleVouchers.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                    โค้ดส่วนลดที่ยังไม่ถึงเกณฑ์ ({ineligibleVouchers.length})
                  </h3>
                  <div className="space-y-3">
                    {ineligibleVouchers.map((v) => (
                      <VoucherTicket
                        key={v.id}
                        voucher={v}
                        mode="checkout"
                        subtotal={subtotal}
                        selected={false}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Temporarily Disabled / Expired Claimed Vouchers */}
              {unavailableUserVouchers.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                    โค้ดที่ไม่พร้อมใช้งานในขณะนี้ ({unavailableUserVouchers.length})
                  </h3>
                  <div className="space-y-2">
                    {unavailableUserVouchers.map((uv) => (
                      <div
                        key={uv.id}
                        className="rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3 flex items-center justify-between gap-3 opacity-60"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-gray-300">{uv.code}</span>
                            <span className="text-xs font-medium text-gray-400 truncate">{uv.title}</span>
                          </div>
                          <p className="text-[11px] text-gray-500 truncate">{uv.description}</p>
                        </div>
                        <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] font-semibold text-gray-400">
                          {getUserVoucherAvailabilityReason(uv) || 'ไม่สามารถใช้งานได้'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-[#161f36]">
          <div>
            {tempSelected ? (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-4 h-4" /> เลือกโค้ด {tempSelected.code}
              </span>
            ) : (
              <span className="text-xs text-gray-400">ยังไม่ได้เลือกโค้ดส่วนลด</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {selectedVoucher && (
              <button
                type="button"
                onClick={handleRemove}
                className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-gray-300 text-xs font-bold transition-all"
              >
                ยกเลิกการใช้โค้ด
              </button>
            )}
            <button
              type="button"
              onClick={handleConfirm}
              className="px-6 py-2.5 rounded-xl bg-brand-blue hover:bg-brand-blue/90 text-bg-base text-xs font-bold transition-all shadow-md"
            >
              ตกลง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
