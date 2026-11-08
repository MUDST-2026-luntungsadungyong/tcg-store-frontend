import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, ArrowLeft, ShoppingBag, Clock } from 'lucide-react';
import { useAuthStore } from '@/features/auth/model/useAuthStore';
import type { UserVoucher } from '../model/types';
import { fetchMyVouchers } from '../api/vouchers';

export function MyVouchersPage() {
  const user = useAuthStore((s) => s.user);
  const [vouchers, setVouchers] = useState<UserVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'CLAIMED' | 'USED' | 'EXPIRED'>('CLAIMED');

  const loadUserVouchers = async () => {
    try {
      setLoading(true);
      const data = await fetchMyVouchers();
      setVouchers(data);
    } catch {
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      void loadUserVouchers();
    }
  }, [user]);

  const filteredVouchers = vouchers.filter((v) => v.status === activeTab);

  return (
    <main className="min-h-[calc(100vh-64px)] bg-[#0f172a] text-white px-4 py-8 md:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <Link
            to="/vouchers"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> ไปศูนย์รวมโค้ดส่วนลด
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2.5">
                <Ticket className="w-7 h-7 text-amber-400" />
                โค้ดส่วนลดของฉัน (My Vouchers)
              </h1>
              <p className="text-sm text-gray-400 mt-1">คูปองส่วนลดที่คุณได้กดรับไว้ พร้อมใช้งานในการสั่งซื้อ</p>
            </div>
            <Link
              to="/cards"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-blue hover:bg-brand-blue/90 text-bg-base font-bold text-sm transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              ไปเลือกซื้อการ์ด
            </Link>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-3 border-b border-white/10 mb-6 pb-2">
          <button
            onClick={() => setActiveTab('CLAIMED')}
            className={`pb-2 text-sm font-semibold transition-all relative ${
              activeTab === 'CLAIMED' ? 'text-amber-400 font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            พร้อมใช้งาน ({vouchers.filter((v) => v.status === 'CLAIMED').length})
            {activeTab === 'CLAIMED' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('USED')}
            className={`pb-2 text-sm font-semibold transition-all relative ${
              activeTab === 'USED' ? 'text-amber-400 font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            ใช้แล้ว ({vouchers.filter((v) => v.status === 'USED').length})
            {activeTab === 'USED' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('EXPIRED')}
            className={`pb-2 text-sm font-semibold transition-all relative ${
              activeTab === 'EXPIRED' ? 'text-amber-400 font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            หมดอายุ ({vouchers.filter((v) => v.status === 'EXPIRED').length})
            {activeTab === 'EXPIRED' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-full" />
            )}
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div className="py-20 text-center text-gray-400">กำลังโหลดคูปอง...</div>
        ) : filteredVouchers.length === 0 ? (
          <div className="py-16 text-center rounded-3xl border border-white/10 bg-[#161f36] p-8">
            <Ticket className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold">ไม่มีโค้ดส่วนลดในสถานะนี้</h3>
            <p className="text-sm text-gray-400 mt-1 mb-5">คุณสามารถเข้าดูโค้ดใหม่ๆ ได้ที่ศูนย์รวมคูปอง</p>
            <Link
              to="/vouchers"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-semibold transition-colors"
            >
              ไปเก็บโค้ดส่วนลด
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredVouchers.map((uv) => (
              <div
                key={uv.id}
                className="rounded-2xl border border-white/10 bg-[#161f36] p-5 flex flex-col justify-between shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-brand-blue/20 text-brand-blue border border-brand-blue/30">
                      {uv.code}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        uv.status === 'CLAIMED'
                          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                          : uv.status === 'USED'
                          ? 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                          : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                      }`}
                    >
                      {uv.status === 'CLAIMED' ? 'พร้อมใช้งาน' : uv.status === 'USED' ? 'ใช้แล้ว' : 'หมดอายุ'}
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-base mb-1">{uv.title}</h3>
                  <p className="text-xs text-gray-300 mb-3">{uv.description}</p>
                </div>

                <div className="border-t border-white/10 pt-3 flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {uv.endTime
                      ? `หมดอายุ ${new Date(uv.endTime).toLocaleDateString('th-TH')}`
                      : 'ไม่มีกำหนดหมดอายุ'}
                  </div>
                  {uv.status === 'CLAIMED' && (
                    <Link
                      to="/cart"
                      className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                    >
                      ใช้ในการสั่งซื้อ →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
