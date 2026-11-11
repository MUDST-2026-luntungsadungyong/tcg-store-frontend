import apiClient from '@/shared/api/client';
import { ENV } from '@/shared/config/env';
import { getStoredAccessToken } from '@/shared/api/authStorage';
import type { UserVoucher, Voucher, VoucherValidationResult } from '../model/types';
import {
  USER_VOUCHER_STORAGE_KEY,
  VOUCHER_CATALOG_STORAGE_KEY,
  emitVoucherChangedEvent,
  isVoucherCurrentlyUsable,
} from '../model/voucherUtils';

function offsetIsoFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

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
    startTime: offsetIsoFromNow(-1),
    endTime: offsetIsoFromNow(90),
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
    startTime: offsetIsoFromNow(-1),
    endTime: offsetIsoFromNow(60),
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
    startTime: offsetIsoFromNow(-1),
    endTime: offsetIsoFromNow(30),
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
    startTime: offsetIsoFromNow(-1),
    endTime: offsetIsoFromNow(45),
    isActive: true,
  },
];

export function isMockVoucherSession(): boolean {
  if (ENV.ENABLE_MOCK_API) return true;
  const token = getStoredAccessToken();
  return Boolean(token?.startsWith('mock-'));
}

function normalizeVoucherMetrics(v: Voucher): Voucher {
  const totalQuota = Math.max(1, Number(v.totalQuota) || 1);
  const usedQuota = Math.max(0, Math.min(totalQuota, Number(v.usedQuota) || 0));
  const remainingQuota = Math.max(0, totalQuota - usedQuota);
  const quotaPercentage = Math.min(100, Math.round((usedQuota / totalQuota) * 100));
  return {
    ...v,
    totalQuota,
    usedQuota,
    remainingQuota,
    quotaPercentage,
    isActive: v.isActive !== false,
  };
}

export function getLocalMockCatalog(): Voucher[] {
  try {
    const raw = localStorage.getItem(VOUCHER_CATALOG_STORAGE_KEY);
    if (!raw) {
      const seeded = INITIAL_MOCK_VOUCHERS.map(normalizeVoucherMetrics);
      localStorage.setItem(VOUCHER_CATALOG_STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map(normalizeVoucherMetrics);
    }
  } catch {
    // Ignore storage read errors
  }
  return INITIAL_MOCK_VOUCHERS.map(normalizeVoucherMetrics);
}

export function saveLocalMockCatalog(vouchers: Voucher[], eventType = 'UPDATED', voucherId?: number): void {
  const normalized = vouchers.map(normalizeVoucherMetrics);
  try {
    localStorage.setItem(VOUCHER_CATALOG_STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    // Ignore storage write errors
  }

  // Keep claimed user vouchers in sync with admin catalog edits/deletes in Mock Mode
  const byId = new Map(normalized.map((v) => [v.id, v]));
  const currentWallet = getLocalUserVouchersRaw();
  const syncedWallet = currentWallet
    .filter((uv) => byId.has(uv.voucherId))
    .map((uv) => {
      const master = byId.get(uv.voucherId)!;
      return {
        ...uv,
        code: master.code,
        title: master.title,
        description: master.description,
        discountType: master.discountType,
        discountValue: master.discountValue,
        minSpend: master.minSpend,
        maxDiscountAmount: master.maxDiscountAmount,
        endTime: master.endTime,
        startTime: master.startTime,
        isActive: master.isActive,
      };
    });
  try {
    localStorage.setItem(USER_VOUCHER_STORAGE_KEY, JSON.stringify(syncedWallet));
  } catch {
    // Ignore storage write errors
  }

  emitVoucherChangedEvent(eventType, voucherId);
}

function getLocalUserVouchersRaw(): UserVoucher[] {
  try {
    const raw = localStorage.getItem(USER_VOUCHER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getLocalUserVouchers(): UserVoucher[] {
  const raw = getLocalUserVouchersRaw();
  const catalogById = new Map(getLocalMockCatalog().map((v) => [v.id, v]));
  return raw
    .filter((uv) => !catalogById.size || catalogById.has(uv.voucherId))
    .map((uv) => {
      const master = catalogById.get(uv.voucherId);
      if (!master) return uv;
      return {
        ...uv,
        code: master.code,
        title: master.title,
        description: master.description,
        discountType: master.discountType,
        discountValue: master.discountValue,
        minSpend: master.minSpend,
        maxDiscountAmount: master.maxDiscountAmount,
        endTime: master.endTime,
        startTime: master.startTime,
        isActive: master.isActive,
      };
    });
}

export function saveLocalUserVouchers(vouchers: UserVoucher[]): void {
  try {
    localStorage.setItem(USER_VOUCHER_STORAGE_KEY, JSON.stringify(vouchers));
  } catch {
    // Ignore storage errors
  }
}

function getAnnotatedMockVouchers(): Voucher[] {
  const catalog = getLocalMockCatalog();
  const userVouchers = getLocalUserVouchers();
  const claimedIds = new Set(userVouchers.map((uv) => uv.voucherId));
  const claimedCodes = new Set(userVouchers.map((uv) => uv.code.toUpperCase()));
  const now = Date.now();

  return catalog
    .filter((v) => isVoucherCurrentlyUsable(v, now))
    .map((v) => {
      const isClaimed = claimedIds.has(v.id) || claimedCodes.has(v.code.toUpperCase());
      return {
        ...v,
        isClaimed,
        canClaim: !isClaimed && v.remainingQuota > 0,
      };
    });
}

export async function fetchAvailableVouchers(): Promise<Voucher[]> {
  if (isMockVoucherSession()) {
    return getAnnotatedMockVouchers();
  }

  const response = await apiClient.get<Voucher[]>('/vouchers');
  return response.data;
}

function claimLocalVoucher(voucherId: number): UserVoucher {
  const catalog = getLocalMockCatalog();
  const voucher = catalog.find((v) => v.id === voucherId);
  if (!voucher) throw new Error('ไม่พบคูปองส่วนลดนี้');
  if (!voucher.isActive) throw new Error('โค้ดส่วนลดนี้ถูกปิดใช้งานชั่วคราว');
  if (!isVoucherCurrentlyUsable(voucher)) throw new Error('โค้ดส่วนลดนี้ไม่อยู่ในช่วงเวลาที่เปิดใช้งาน');
  if (voucher.remainingQuota <= 0) throw new Error('โควตาโค้ดส่วนลดนี้เต็มแล้ว');

  const list = getLocalUserVouchersRaw();
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
    endTime: voucher.endTime,
    startTime: voucher.startTime,
    isActive: voucher.isActive,
  };
  list.unshift(newUv);
  saveLocalUserVouchers(list);
  emitVoucherChangedEvent('CLAIMED', voucher.id);
  return newUv;
}

export async function claimVoucherApi(voucherId: number): Promise<UserVoucher> {
  if (isMockVoucherSession()) {
    return claimLocalVoucher(voucherId);
  }

  try {
    const response = await apiClient.post<UserVoucher>(`/vouchers/${voucherId}/claim`);
    return response.data;
  } catch (err: any) {
    if (err?.response?.status === 401) {
      const token = getStoredAccessToken();
      if (token?.startsWith('mock-')) {
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
  if (isMockVoucherSession()) {
    const list = getLocalUserVouchers();
    if (status) {
      return list.filter((v) => v.status === status);
    }
    return list;
  }

  const params = status ? { status } : {};
  const response = await apiClient.get<UserVoucher[]>('/vouchers/my-vouchers', { params });
  return response.data;
}

function calculateMockValidation(code: string, subtotal: number): VoucherValidationResult {
  const clean = code.trim().toUpperCase();
  const matched = getLocalMockCatalog().find((v) => v.code.toUpperCase() === clean);
  if (!matched) {
    return {
      valid: false,
      subtotal,
      discountAmount: 0,
      finalTotal: subtotal,
      message: 'ไม่พบโค้ดส่วนลดนี้',
    };
  }
  if (!matched.isActive || (matched.endTime && Date.now() > Date.parse(matched.endTime))) {
    return {
      valid: false,
      code: matched.code,
      discountType: matched.discountType,
      discountValue: matched.discountValue,
      discountAmount: 0,
      subtotal,
      finalTotal: subtotal,
      message: 'โค้ดส่วนลดนี้ถูกปิดใช้งานหรือหมดอายุแล้ว',
    };
  }
  if (matched.startTime && Date.now() < Date.parse(matched.startTime)) {
    return {
      valid: false,
      code: matched.code,
      discountType: matched.discountType,
      discountValue: matched.discountValue,
      discountAmount: 0,
      subtotal,
      finalTotal: subtotal,
      message: 'แคมเปญโค้ดนี้ยังไม่เริ่มต้น',
    };
  }
  if (matched.remainingQuota <= 0) {
    return {
      valid: false,
      code: matched.code,
      discountType: matched.discountType,
      discountValue: matched.discountValue,
      discountAmount: 0,
      subtotal,
      finalTotal: subtotal,
      message: 'โค้ดส่วนลดนี้ถูกใช้สิทธิ์เต็มแล้ว',
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
  if (isMockVoucherSession()) {
    return calculateMockValidation(code, subtotal);
  }

  const response = await apiClient.post<VoucherValidationResult>('/vouchers/validate', {
    code,
    subtotal,
  });
  return response.data;
}

export function calculateMockDiscount(code: string, subtotal: number): { discountAmount: number; finalTotal: number } {
  const clean = code.trim().toUpperCase();
  const matched = getLocalMockCatalog().find((v) => v.code.toUpperCase() === clean);
  if (!matched || !isVoucherCurrentlyUsable(matched) || subtotal < matched.minSpend) {
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
  const list = getLocalUserVouchersRaw();
  const index = list.findIndex((uv) => uv.code.toUpperCase() === clean && uv.status === 'CLAIMED');
  if (index !== -1) {
    list[index].status = 'USED';
    list[index].usedAt = new Date().toISOString();
    saveLocalUserVouchers(list);
  }

  const catalog = getLocalMockCatalog();
  const catalogIndex = catalog.findIndex((v) => v.code.toUpperCase() === clean);
  if (catalogIndex !== -1) {
    catalog[catalogIndex] = normalizeVoucherMetrics({
      ...catalog[catalogIndex],
      usedQuota: catalog[catalogIndex].usedQuota + 1,
    });
    saveLocalMockCatalog(catalog, 'REDEEMED', catalog[catalogIndex].id);
  } else {
    emitVoucherChangedEvent('REDEEMED');
  }
}
