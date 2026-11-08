import { useState, type MouseEvent } from 'react';
import { Check, Copy, Tag, Clock } from 'lucide-react';
import type { Voucher } from '../model/types';

interface VoucherTicketProps {
  voucher: Voucher;
  onClaim?: (voucherId: number) => void;
  onSelect?: (voucher: Voucher) => void;
  isClaiming?: boolean;
  selected?: boolean;
  mode?: 'center' | 'checkout';
  subtotal?: number;
}

export function VoucherTicket({
  voucher,
  onClaim,
  onSelect,
  isClaiming = false,
  selected = false,
  mode = 'center',
  subtotal = 0,
}: VoucherTicketProps) {
  const isPercent = voucher.discountType === 'PERCENTAGE';
  const isEligible = subtotal >= voucher.minSpend;
  const isSoldOut = voucher.remainingQuota <= 0;
  const [copied, setCopied] = useState(false);

  const copyCode = (e: MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(voucher.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedExpiry = voucher.endTime
    ? new Date(voucher.endTime).toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: '2-digit',
      })
    : null;

  return (
    <div
      className={`relative flex flex-col sm:flex-row items-stretch rounded-2xl border transition-all duration-200 overflow-hidden shadow-lg ${
        selected
          ? 'border-brand-blue bg-[#1e293b]/95 ring-2 ring-brand-blue shadow-brand-blue/20'
          : !isEligible && mode === 'checkout'
          ? 'border-white/5 bg-[#141b2d]/60 opacity-60'
          : 'border-white/10 bg-[#161f36] hover:border-brand-blue/50'
      }`}
    >
      {/* Left side: Voucher Discount Visual */}
      <div className="relative flex flex-col items-center justify-center p-4 sm:w-36 bg-gradient-to-br from-amber-500 to-orange-600 text-white select-none">
        <Tag className="w-6 h-6 mb-1 text-white/90" />
        <span className="text-xs uppercase tracking-wider font-semibold opacity-90">MYTHIX DEAL</span>
        <div className="text-xl sm:text-2xl font-black mt-0.5">
          {isPercent ? `${voucher.discountValue}%` : `฿${voucher.discountValue}`}
        </div>
        <span className="text-[11px] font-medium opacity-90">ส่วนลด</span>

        {/* Perforated holes */}
        <div className="hidden sm:block absolute -right-3 -top-3 w-6 h-6 rounded-full bg-[#0f172a] z-10" />
        <div className="hidden sm:block absolute -right-3 -bottom-3 w-6 h-6 rounded-full bg-[#0f172a] z-10" />
      </div>

      {/* Center: Voucher details */}
      <div className="flex-1 p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
              {voucher.title}
            </span>
            <button
              type="button"
              onClick={copyCode}
              title="คัดลอกโค้ด"
              className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded transition-colors"
            >
              <code>{voucher.code}</code>
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-gray-400" />}
            </button>
          </div>

          <p className="text-sm text-gray-200 font-medium line-clamp-2">{voucher.description}</p>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
            <span>ขั้นต่ำ ฿{voucher.minSpend.toLocaleString()}</span>
            {voucher.maxDiscountAmount && (
              <span>· ลดสูงสุด ฿{voucher.maxDiscountAmount.toLocaleString()}</span>
            )}
            {formattedExpiry && (
              <span className="flex items-center gap-1 text-gray-400">
                <Clock className="w-3 h-3" />
                หมดอายุ {formattedExpiry}
              </span>
            )}
          </div>
        </div>

        {/* Quota Progress Bar (for voucher center) */}
        {mode === 'center' && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
              <span>โควตาคงเหลือ</span>
              <span>{isSoldOut ? 'สิทธิ์เต็มแล้ว' : `เหลือ ${voucher.remainingQuota} สิทธิ์`}</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  voucher.quotaPercentage >= 80 ? 'bg-rose-500' : 'bg-amber-400'
                }`}
                style={{ width: `${Math.min(100, Math.max(5, voucher.quotaPercentage))}%` }}
              />
            </div>
          </div>
        )}

        {/* Warning if checkout mode and not eligible */}
        {mode === 'checkout' && !isEligible && (
          <div className="mt-2 text-xs text-rose-400 font-medium">
            ซื้อเพิ่มอีก ฿{(voucher.minSpend - subtotal).toLocaleString('en-US', { minimumFractionDigits: 2 })} เพื่อใช้โค้ดนี้
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="p-4 flex items-center justify-center sm:border-l sm:border-white/10 sm:w-32 bg-white/[0.02]">
        {mode === 'center' ? (
          voucher.isClaimed ? (
            <button
              disabled
              className="w-full py-2 px-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-default"
            >
              <Check className="w-3.5 h-3.5" />
              เก็บแล้ว
            </button>
          ) : isSoldOut ? (
            <button
              disabled
              className="w-full py-2 px-3 rounded-xl bg-gray-700/50 text-gray-400 text-xs font-semibold cursor-not-allowed"
            >
              หมดแล้ว
            </button>
          ) : (
            <button
              onClick={() => onClaim?.(voucher.id)}
              disabled={isClaiming}
              className="w-full py-2 px-3 rounded-xl bg-brand-blue hover:bg-brand-blue/90 text-bg-base text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {isClaiming ? 'กำลังเก็บ...' : 'เก็บโค้ด'}
            </button>
          )
        ) : (
          <button
            onClick={() => isEligible && onSelect?.(voucher)}
            disabled={!isEligible}
            className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              selected
                ? 'bg-brand-blue text-bg-base'
                : isEligible
                ? 'bg-white/10 hover:bg-white/20 text-white'
                : 'bg-white/5 text-gray-500 cursor-not-allowed'
            }`}
          >
            {selected ? 'เลือกแล้ว' : 'ใช้โค้ด'}
          </button>
        )}
      </div>
    </div>
  );
}
