import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Tag, Sparkles, Ticket, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/features/auth/model/useAuthStore';
import type { Voucher } from '../model/types';
import { fetchAvailableVouchers, claimVoucherApi } from '../api/vouchers';
import { useVoucherLiveUpdates } from '../model/useVoucherLiveUpdates';
import { VoucherTicket } from '../components/VoucherTicket';

export function VoucherCenterPage() {
  const user = useAuthStore((s) => s.user);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'percent' | 'fixed'>('all');

  const loadVouchers = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await fetchAvailableVouchers();
      setVouchers(data);
    } catch {
      if (!silent) {
        setErrorMessage('ไม่สามารถโหลดข้อมูลคูปองส่วนลดได้');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadVouchers(false);
  }, [loadVouchers, user?.id]);

  useVoucherLiveUpdates({
    onRefresh: () => loadVouchers(true),
  });

  const handleClaim = async (voucherId: number) => {
    if (!user) {
      setErrorMessage('กรุณาเข้าสู่ระบบก่อนทำการเก็บโค้ดส่วนลด');
      return;
    }

    setClaimingId(voucherId);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await claimVoucherApi(voucherId);
      setSuccessMessage('🎉 เก็บโค้ดส่วนลดสำเร็จ! โค้ดถูกเพิ่มในกระเป๋าของคุณแล้ว');
      // Update local state to claimed and sync latest quota
      setVouchers((prev) =>
        prev.map((v) =>
          v.id === voucherId
            ? { ...v, isClaimed: true, canClaim: false }
            : v
        )
      );
      void loadVouchers(true);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'ไม่สามารถเก็บโค้ดส่วนลดได้';
      setErrorMessage(msg);
      void loadVouchers(true);
      setTimeout(() => setErrorMessage(null), 4000);
    } finally {
      setClaimingId(null);
    }
  };

  const filteredVouchers = vouchers.filter((v) => {
    if (activeTab === 'percent') return v.discountType === 'PERCENTAGE';
    if (activeTab === 'fixed') return v.discountType === 'FIXED_AMOUNT';
    return true;
  });

  return (
    <main className="min-h-[calc(100vh-64px)] bg-[#0f172a] text-white px-4 py-8 md:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900/60 via-indigo-900/40 to-amber-900/40 border border-white/10 p-8 md:p-12 mb-8 shadow-2xl">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-bold mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              ศูนย์รวมคูปอง & โปรโมชันพิเศษ
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-3">
              แจกโค้ดส่วนลดสุดคุ้ม <span className="text-amber-400">ทุกวัน</span>
            </h1>
            <p className="text-gray-300 text-sm md:text-base leading-relaxed mb-6">
              เก็บโค้ดส่วนลดการ์ดสะสม TCG ยอดฮิต ทั้งส่วนลดเป็นเปอร์เซ็นต์และส่วนลดเงินสด นำไปใช้ลดทันทีในขั้นตอนการสั่งจองและชำระเงิน!
            </p>
            {user && (
              <Link
                to="/profile/vouchers"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-sm font-semibold transition-all"
              >
                <Ticket className="w-4 h-4 text-amber-400" />
                ดูโค้ดส่วนลดของฉัน
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            )}
          </div>
        </div>

        {/* Feedback Alerts */}
        {successMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-3 animate-fade-in shadow-lg">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="text-sm font-semibold">{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-3 animate-fade-in shadow-lg">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-semibold">{errorMessage}</span>
          </div>
        )}

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'all'
                ? 'bg-brand-blue text-bg-base shadow-md'
                : 'bg-white/5 hover:bg-white/10 text-gray-300'
            }`}
          >
            โค้ดส่วนลดทั้งหมด ({vouchers.length})
          </button>
          <button
            onClick={() => setActiveTab('percent')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'percent'
                ? 'bg-brand-blue text-bg-base shadow-md'
                : 'bg-white/5 hover:bg-white/10 text-gray-300'
            }`}
          >
            ส่วนลดเปอร์เซ็นต์ (%)
          </button>
          <button
            onClick={() => setActiveTab('fixed')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'fixed'
                ? 'bg-brand-blue text-bg-base shadow-md'
                : 'bg-white/5 hover:bg-white/10 text-gray-300'
            }`}
          >
            ส่วนลดเงินสด (฿)
          </button>
        </div>

        {/* Vouchers Grid */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-brand-blue border-r-transparent mb-4" />
            <p className="text-sm text-gray-400">กำลังโหลดโค้ดส่วนลด...</p>
          </div>
        ) : filteredVouchers.length === 0 ? (
          <div className="py-20 text-center rounded-3xl border border-white/10 bg-[#161f36] p-8">
            <Tag className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold">ยังไม่มีโค้ดส่วนลดในหมวดนี้</h3>
            <p className="text-sm text-gray-400 mt-1">โปรดติดตามโค้ดใหม่ๆ เร็วๆ นี้</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredVouchers.map((v) => (
              <VoucherTicket
                key={v.id}
                voucher={v}
                mode="center"
                isClaiming={claimingId === v.id}
                onClaim={handleClaim}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
