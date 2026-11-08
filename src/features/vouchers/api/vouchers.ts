import apiClient from '@/shared/api/client';
import { ENV } from '@/shared/config/env';
import { getStoredAccessToken } from '@/shared/api/authStorage';
import type { UserVoucher, Voucher, VoucherValidationResult } from '../model/types';

export const INITIAL_MOCK_VOUCHERS: Voucher[] = [
  {
    id: 1,
    code: 'WELCOME10',
    title: 'ส่วนลด 10% สมาชิกใหม่',
    description: 'ลด 10% สูงสุด 100 บาท เมื่อซื้อขั้นต่ำ 300 บาท',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    minSpend: 300,
    maxDiscountAmount: 100,
    totalQuota: 500,
    usedQuota: 45,
    remainingQuota: 455,
    quotaPercentage: 9,
    startTime: null,
    endTime: null,
    isActive: true,
  },
  {
    id: 2,
    code: 'MYTHIX50',
    title: 'ส่วนลดพิเศษ ฿50',
    description: 'ลดทันที 50 บาท เมื่อช้อปการ์ดครบ 500 บาท',
    discountType: 'FIXED_AMOUNT',
    discountValue: 50,
    minSpend: 500,
    maxDiscountAmount: null,
    totalQuota: 300,
    usedQuota: 120,
    remainingQuota: 180,
    quotaPercentage: 40,
    startTime: null,
    endTime: null,
    isActive: true,
  },
  {
    id: 3,
    code: 'FLASH100',
    title: 'Flash Sale ฿100',
    description: 'ลด 100 บาท สำหรับยอดสั่งซื้อตั้งแต่ 1,000 บาทขึ้นไป',
    discountType: 'FIXED_AMOUNT',
    discountValue: 100,
    minSpend: 1000,
    maxDiscountAmount: null,
    totalQuota: 100,
    usedQuota: 85,
    remainingQuota: 15,
    quotaPercentage: 85,
    startTime: null,
    endTime: null,
    isActive: true,
  },
  {
    id: 4,
    code: 'POKEMON15',
    title: 'Mega Deal Pokemon 15%',
    description: 'ลด 15% สูงสุด 200 บาท เมื่อซื้อขั้นต่ำ 800 บาท',
    discountType: 'PERCENTAGE',
    discountValue: 15,
    minSpend: 800,
    maxDiscountAmount: 200,
    totalQuota: 200,
    usedQuota: 30,
    remainingQuota: 170,
    quotaPercentage: 15,
    startTime: null,
    endTime: null,
    isActive: true,
  },
];

const LOCAL_STORAGE_KEY_USER_VOUCHERS = 'mythix_mock_user_vouchers_v1';

function isMockSession(): boolean {
  if (ENV.ENABLE_MOCK_API) return true;
  const token = getStoredAccessToken();
  return Boolean(token?.startsWith('mock-'));
}

export function getLocalUserVouchers(): UserVoucher[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_USER_VOUCHERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalUserVouchers(vouchers: UserVoucher[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_USER_VOUCHERS, JSON.stringify(vouchers));
  } catch {
    // Ignore storage errors
  }
}

function getAnnotatedMockVouchers(): Voucher[] {
  const userVouchers = getLocalUserVouchers();
  const claimedCodes = new Set(userVouchers.map((uv) => uv.code.toUpperCase()));

  return INITIAL_MOCK_VOUCHERS.map((v) => ({
    ...v,
    isClaimed: claimedCodes.has(v.code.toUpperCase()),
    canClaim: !claimedCodes.has(v.code.toUpperCase()) && v.remainingQuota > 0,
  }));
}

export async function fetchAvailableVouchers(): Promise<Voucher[]> {
  if (isMockSession()) {
    return getAnnotatedMockVouchers();
  }

  try {
    const response = await apiClient.get<Voucher[]>('/api/vouchers');
    return response.data;
  } catch {
    return getAnnotatedMockVouchers();
  }
}

function claimLocalVoucher(voucherId: number): UserVoucher {
  const voucher = INITIAL_MOCK_VOUCHERS.find((v) => v.id === voucherId);
  if (!voucher) throw new Error('ไม่พบคูปองส่วนลดนี้');

  const list = getLocalUserVouchers();
  if (list.some((uv) => uv.voucherId === voucherId)) {
    throw new Error('คุณได้เก็บโค้ดนี้ไปแล้ว');
  }

  const newUv: UserVoucher = {
    id: Date.now(),
    voucherId: voucher.id,
    code: voucher.code,
    title: voucher.title,
    description: voucher.description,
    discountType: voucher.discountType,
    discountValue: voucher.discountValue,
    minSpend: voucher.minSpend,
    maxDiscountAmount: voucher.maxDiscountAmount,
    status: 'CLAIMED',
    claimedAt: new Date().toISOString(),
    usedAt: null,
    endTime: null,
  };
  list.unshift(newUv);
  saveLocalUserVouchers(list);
  return newUv;
}

export async function claimVoucherApi(voucherId: number): Promise<UserVoucher> {
  if (isMockSession()) {
    return claimLocalVoucher(voucherId);
  }

  try {
    const response = await apiClient.post<UserVoucher>(`/api/vouchers/${voucherId}/claim`);
    return response.data;
  } catch (err: any) {
    if (err?.response?.status === 401) {
      const token = getStoredAccessToken();
      if (!token || token.startsWith('mock-')) {
        return claimLocalVoucher(voucherId);
      }
      throw new Error('เซสชันการเข้าสู่ระบบหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง');
    }

    if (err?.response?.data?.message) {
      throw new Error(err.response.data.message);
    }
    throw new Error(err?.message || 'ไม่สามารถเก็บโค้ดส่วนลดได้');
  }
}

export async function fetchMyVouchers(status?: string): Promise<UserVoucher[]> {
  if (isMockSession()) {
    const list = getLocalUserVouchers();
    if (status) {
      return list.filter((v) => v.status === status);
    }
    return list;
  }

  try {
    const params = status ? { status } : {};
    const response = await apiClient.get<UserVoucher[]>('/api/vouchers/my-vouchers', { params });
    return response.data;
  } catch {
    const list = getLocalUserVouchers();
    if (status) {
      return list.filter((v) => v.status === status);
    }
    return list;
  }
}

function calculateMockValidation(code: string, subtotal: number): VoucherValidationResult {
  const clean = code.trim().toUpperCase();
  const matched = INITIAL_MOCK_VOUCHERS.find((v) => v.code.toUpperCase() === clean);
  if (!matched) {
    return {
      valid: false,
      subtotal,
      discountAmount: 0,
      finalTotal: subtotal,
      message: 'ไม่พบโค้ดส่วนลดนี้',
    };
  }
  if (subtotal < matched.minSpend) {
    return {
      valid: false,
      code: matched.code,
      discountType: matched.discountType,
      discountValue: matched.discountValue,
      discountAmount: 0,
      subtotal,
      finalTotal: subtotal,
      message: `ยอดสั่งซื้อขั้นต่ำ ฿${matched.minSpend.toLocaleString()} (ซื้อเพิ่มอีก ฿${(matched.minSpend - subtotal).toLocaleString()})`,
    };
  }

  let discount = 0;
  if (matched.discountType === 'FIXED_AMOUNT') {
    discount = Math.min(matched.discountValue, subtotal);
  } else {
    discount = (subtotal * matched.discountValue) / 100;
    if (matched.maxDiscountAmount && discount > matched.maxDiscountAmount) {
      discount = matched.maxDiscountAmount;
    }
    discount = Math.min(discount, subtotal);
  }

  return {
    valid: true,
    code: matched.code,
    discountType: matched.discountType,
    discountValue: matched.discountValue,
    discountAmount: discount,
    subtotal,
    finalTotal: subtotal - discount,
    message: `ใช้ส่วนลดได้สำเร็จ ลดทันที ฿${discount.toLocaleString()}`,
  };
}

export async function validateVoucherApi(code: string, subtotal: number): Promise<VoucherValidationResult> {
  if (isMockSession()) {
    return calculateMockValidation(code, subtotal);
  }

  try {
    const response = await apiClient.post<VoucherValidationResult>('/api/vouchers/validate', {
      code,
      subtotal,
    });
    return response.data;
  } catch {
    return calculateMockValidation(code, subtotal);
  }
}

export function calculateMockDiscount(code: string, subtotal: number): { discountAmount: number; finalTotal: number } {
  const clean = code.trim().toUpperCase();
  const matched = INITIAL_MOCK_VOUCHERS.find((v) => v.code.toUpperCase() === clean);
  if (!matched || subtotal < matched.minSpend) {
    return { discountAmount: 0, finalTotal: subtotal };
  }
  let discount = 0;
  if (matched.discountType === 'FIXED_AMOUNT') {
    discount = Math.min(matched.discountValue, subtotal);
  } else {
    discount = (subtotal * matched.discountValue) / 100;
    if (matched.maxDiscountAmount && discount > matched.maxDiscountAmount) {
      discount = matched.maxDiscountAmount;
    }
    discount = Math.min(discount, subtotal);
  }
  return {
    discountAmount: discount,
    finalTotal: Math.max(0, subtotal - discount),
  };
}

export function markLocalVoucherUsed(code: string): void {
  const clean = code.trim().toUpperCase();
  const list = getLocalUserVouchers();
  const index = list.findIndex((uv) => uv.code.toUpperCase() === clean && uv.status === 'CLAIMED');
  if (index !== -1) {
    list[index].status = 'USED';
    list[index].usedAt = new Date().toISOString();
    saveLocalUserVouchers(list);
  }
}
