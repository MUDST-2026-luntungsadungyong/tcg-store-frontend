import apiClient from '@/shared/api/client';
import {
  getLocalMockCatalog,
  getLocalUserVouchers,
  isMockVoucherSession,
  saveLocalMockCatalog,
} from '@/features/vouchers/api/vouchers';
import type {
  AdminVoucher,
  AdminVoucherPayload,
  DiscountType,
  Voucher,
  VoucherEffectiveStatus,
} from '@/features/vouchers/model/types';
import { computeEffectiveStatus } from '@/features/vouchers/model/voucherUtils';

export interface AdminVoucherFilterParams {
  search?: string;
  status?: VoucherEffectiveStatus | 'ALL' | '';
  discountType?: DiscountType | 'ALL' | '';
}

export interface AdminVoucherApiError {
  message: string;
  code?: string;
  fieldErrors: Record<string, string>;
}

function toMockAdminVoucher(v: Voucher): AdminVoucher {
  const wallet = getLocalUserVouchers();
  const claimedCount = wallet.filter((uv) => uv.voucherId === v.id).length;
  const usedOrdersCount = wallet.filter((uv) => uv.voucherId === v.id && uv.status === 'USED').length;

  return {
    id: v.id,
    code: v.code,
    title: v.title,
    description: v.description,
    discountType: v.discountType,
    discountValue: v.discountValue,
    minSpend: v.minSpend,
    maxDiscountAmount: v.maxDiscountAmount,
    totalQuota: v.totalQuota,
    usedQuota: v.usedQuota,
    remainingQuota: v.remainingQuota,
    quotaPercentage: v.quotaPercentage,
    startTime: v.startTime || new Date(Date.now() - 86_400_000).toISOString(),
    endTime: v.endTime || new Date(Date.now() + 30 * 86_400_000).toISOString(),
    isActive: v.isActive !== false,
    effectiveStatus: computeEffectiveStatus(v),
    claimedCount,
    usedOrdersCount: Math.max(usedOrdersCount, v.usedQuota),
    createdAt: v.startTime || null,
    updatedAt: new Date().toISOString(),
  };
}

function validateMockPayload(payload: AdminVoucherPayload, minQuota = 0): void {
  const code = payload.code.trim().toUpperCase();
  if (!/^[A-Z0-9_-]{2,50}$/.test(code)) {
    throw {
      message: 'Voucher code must be 2–50 characters using A-Z, 0-9, - or _',
      fieldErrors: { code: 'Voucher code must be 2–50 characters using A-Z, 0-9, - or _' },
    };
  }
  if (!payload.title.trim()) {
    throw { message: 'Voucher title is required', fieldErrors: { title: 'Voucher title is required' } };
  }
  if (payload.discountValue <= 0) {
    throw {
      message: 'Discount value must be greater than 0',
      fieldErrors: { discountValue: 'Discount value must be greater than 0' },
    };
  }
  if (payload.discountType === 'PERCENTAGE' && payload.discountValue > 100) {
    throw {
      message: 'Percentage discount cannot exceed 100%',
      fieldErrors: { discountValue: 'Percentage discount cannot exceed 100%' },
    };
  }
  if (payload.totalQuota < Math.max(1, minQuota)) {
    throw {
      message: `Total quota cannot be less than ${Math.max(1, minQuota)}`,
      fieldErrors: { totalQuota: `Total quota cannot be less than ${Math.max(1, minQuota)}` },
    };
  }
  if (Date.parse(payload.endTime) <= Date.parse(payload.startTime)) {
    throw {
      message: 'End time must be after start time',
      fieldErrors: { endTime: 'End time must be after start time' },
    };
  }
}

export async function listAdminVouchers(params: AdminVoucherFilterParams = {}): Promise<AdminVoucher[]> {
  if (isMockVoucherSession()) {
    const query = (params.search || '').trim().toLowerCase();
    return getLocalMockCatalog()
      .map(toMockAdminVoucher)
      .filter((v) => {
        if (!query) return true;
        return (
          v.code.toLowerCase().includes(query) ||
          v.title.toLowerCase().includes(query) ||
          v.description.toLowerCase().includes(query)
        );
      })
      .filter((v) => !params.status || params.status === 'ALL' || v.effectiveStatus === params.status)
      .filter((v) => !params.discountType || params.discountType === 'ALL' || v.discountType === params.discountType);
  }

  const response = await apiClient.get<AdminVoucher[]>('/admin/vouchers', {
    params: {
      search: params.search || undefined,
      status: params.status && params.status !== 'ALL' ? params.status : undefined,
      discountType: params.discountType && params.discountType !== 'ALL' ? params.discountType : undefined,
    },
  });
  return response.data;
}

export async function createAdminVoucher(payload: AdminVoucherPayload): Promise<AdminVoucher> {
  if (isMockVoucherSession()) {
    validateMockPayload(payload, 0);
    const catalog = getLocalMockCatalog();
    const code = payload.code.trim().toUpperCase();
    if (catalog.some((v) => v.code.toUpperCase() === code)) {
      throw {
        code: 'VOUCHER_CODE_EXISTS',
        message: `Voucher code '${code}' already exists`,
        fieldErrors: { code: `Voucher code '${code}' already exists` },
      };
    }

    const nextId = catalog.reduce((max, v) => Math.max(max, v.id), 0) + 1;
    const created: Voucher = {
      id: nextId,
      code,
      title: payload.title.trim(),
      description: payload.description.trim(),
      discountType: payload.discountType,
      discountValue: Number(payload.discountValue),
      minSpend: Math.max(0, Number(payload.minSpend) || 0),
      maxDiscountAmount:
        payload.discountType === 'PERCENTAGE' && payload.maxDiscountAmount && payload.maxDiscountAmount > 0
          ? Number(payload.maxDiscountAmount)
          : null,
      totalQuota: Number(payload.totalQuota),
      usedQuota: 0,
      remainingQuota: Number(payload.totalQuota),
      quotaPercentage: 0,
      startTime: payload.startTime,
      endTime: payload.endTime,
      isActive: payload.isActive,
    };

    saveLocalMockCatalog([created, ...catalog], 'CREATED', created.id);
    return toMockAdminVoucher(created);
  }

  const response = await apiClient.post<AdminVoucher>('/admin/vouchers', payload);
  return response.data;
}

export async function updateAdminVoucher(id: number, payload: AdminVoucherPayload): Promise<AdminVoucher> {
  if (isMockVoucherSession()) {
    const catalog = getLocalMockCatalog();
    const index = catalog.findIndex((v) => v.id === id);
    if (index === -1) {
      throw { message: 'Voucher not found', fieldErrors: {} };
    }
    const existing = catalog[index];
    validateMockPayload(payload, existing.usedQuota);
    const code = payload.code.trim().toUpperCase();
    if (catalog.some((v) => v.id !== id && v.code.toUpperCase() === code)) {
      throw {
        code: 'VOUCHER_CODE_EXISTS',
        message: `Voucher code '${code}' already exists`,
        fieldErrors: { code: `Voucher code '${code}' already exists` },
      };
    }

    const totalQuota = Number(payload.totalQuota);
    const remainingQuota = Math.max(0, totalQuota - existing.usedQuota);
    const quotaPercentage = totalQuota <= 0 ? 0 : Math.min(100, Math.round((existing.usedQuota / totalQuota) * 100));

    const updated: Voucher = {
      ...existing,
      code,
      title: payload.title.trim(),
      description: payload.description.trim(),
      discountType: payload.discountType,
      discountValue: Number(payload.discountValue),
      minSpend: Math.max(0, Number(payload.minSpend) || 0),
      maxDiscountAmount:
        payload.discountType === 'PERCENTAGE' && payload.maxDiscountAmount && payload.maxDiscountAmount > 0
          ? Number(payload.maxDiscountAmount)
          : null,
      totalQuota,
      remainingQuota,
      quotaPercentage,
      startTime: payload.startTime,
      endTime: payload.endTime,
      isActive: payload.isActive,
    };

    const next = [...catalog];
    next[index] = updated;
    saveLocalMockCatalog(next, 'UPDATED', updated.id);
    return toMockAdminVoucher(updated);
  }

  const response = await apiClient.put<AdminVoucher>(`/admin/vouchers/${id}`, payload);
  return response.data;
}

export async function toggleAdminVoucherStatus(id: number, isActive: boolean): Promise<AdminVoucher> {
  if (isMockVoucherSession()) {
    const catalog = getLocalMockCatalog();
    const index = catalog.findIndex((v) => v.id === id);
    if (index === -1) {
      throw { message: 'Voucher not found', fieldErrors: {} };
    }
    const updated = { ...catalog[index], isActive };
    const next = [...catalog];
    next[index] = updated;
    saveLocalMockCatalog(next, 'TOGGLED', updated.id);
    return toMockAdminVoucher(updated);
  }

  const response = await apiClient.patch<AdminVoucher>(`/admin/vouchers/${id}/status`, { isActive });
  return response.data;
}

export async function deleteAdminVoucher(id: number): Promise<void> {
  if (isMockVoucherSession()) {
    const catalog = getLocalMockCatalog();
    const next = catalog.filter((v) => v.id !== id);
    saveLocalMockCatalog(next, 'DELETED', id);
    return;
  }

  await apiClient.delete(`/admin/vouchers/${id}`);
}

export function extractAdminVoucherError(err: unknown, fallback = 'Unable to complete voucher operation'): AdminVoucherApiError {
  if (err && typeof err === 'object') {
    const axiosLike = err as {
      response?: { data?: { code?: string; message?: string; fieldErrors?: Record<string, string> } };
      code?: string;
      message?: string;
      fieldErrors?: Record<string, string>;
    };
    const data = axiosLike.response?.data;
    if (data) {
      return {
        code: data.code,
        message: data.message || fallback,
        fieldErrors: data.fieldErrors || {},
      };
    }
    if (axiosLike.fieldErrors || axiosLike.message) {
      return {
        code: axiosLike.code,
        message: axiosLike.message || fallback,
        fieldErrors: axiosLike.fieldErrors || {},
      };
    }
  }
  return { message: fallback, fieldErrors: {} };
}
