export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';
export type UserVoucherStatus = 'CLAIMED' | 'USED' | 'EXPIRED';
export type VoucherEffectiveStatus = 'ACTIVE' | 'SCHEDULED' | 'INACTIVE' | 'EXPIRED' | 'EXHAUSTED';

export interface Voucher {
  id: number;
  code: string;
  title: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  minSpend: number;
  maxDiscountAmount: number | null;
  totalQuota: number;
  usedQuota: number;
  remainingQuota: number;
  quotaPercentage: number;
  startTime: string | null;
  endTime: string | null;
  isActive: boolean;
  isClaimed?: boolean;
  canClaim?: boolean;
}

export interface UserVoucher {
  id: number;
  voucherId: number;
  code: string;
  title: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  minSpend: number;
  maxDiscountAmount: number | null;
  status: UserVoucherStatus;
  claimedAt: string;
  usedAt: string | null;
  endTime: string | null;
  isActive?: boolean;
  startTime?: string | null;
}

export interface VoucherValidationResult {
  valid: boolean;
  code?: string;
  discountType?: DiscountType;
  discountValue?: number;
  discountAmount: number;
  subtotal: number;
  finalTotal: number;
  message: string;
}

export interface AdminVoucher {
  id: number;
  code: string;
  title: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  minSpend: number;
  maxDiscountAmount: number | null;
  totalQuota: number;
  usedQuota: number;
  remainingQuota: number;
  quotaPercentage: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  effectiveStatus: VoucherEffectiveStatus;
  claimedCount: number;
  usedOrdersCount: number;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface AdminVoucherPayload {
  code: string;
  title: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  minSpend: number;
  maxDiscountAmount: number | null;
  totalQuota: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}
