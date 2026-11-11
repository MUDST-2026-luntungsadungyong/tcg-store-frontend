import type { UserVoucher, Voucher, VoucherEffectiveStatus } from './types';

export const VOUCHER_CATALOG_STORAGE_KEY = 'mythix_mock_vouchers_v1';
export const USER_VOUCHER_STORAGE_KEY = 'mythix_mock_user_vouchers_v1';
export const VOUCHER_BROADCAST_CHANNEL = 'mythix_vouchers';
export const VOUCHER_DOM_EVENT = 'mythix:vouchers-changed';

export function emitVoucherChangedEvent(type = 'UPDATED', voucherId?: number): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(VOUCHER_DOM_EVENT, { detail: { type, voucherId } }));
  }
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      const channel = new BroadcastChannel(VOUCHER_BROADCAST_CHANNEL);
      channel.postMessage({ type, voucherId, ts: Date.now() });
      channel.close();
    } catch {
      // Ignore BroadcastChannel errors in restricted contexts
    }
  }
}

export function isTimestampStarted(startTime?: string | null, nowMs = Date.now()): boolean {
  if (!startTime) return true;
  const parsed = Date.parse(startTime);
  return Number.isNaN(parsed) || nowMs >= parsed;
}

export function isTimestampExpired(endTime?: string | null, nowMs = Date.now()): boolean {
  if (!endTime) return false;
  const parsed = Date.parse(endTime);
  return !Number.isNaN(parsed) && nowMs > parsed;
}

export function isVoucherCurrentlyUsable(
  voucher: Pick<Voucher, 'isActive' | 'startTime' | 'endTime'>,
  nowMs = Date.now()
): boolean {
  if (voucher.isActive === false) return false;
  if (!isTimestampStarted(voucher.startTime, nowMs)) return false;
  if (isTimestampExpired(voucher.endTime, nowMs)) return false;
  return true;
}

export function isUserVoucherCurrentlyUsable(uv: UserVoucher, nowMs = Date.now()): boolean {
  if (uv.status !== 'CLAIMED') return false;
  if (uv.isActive === false) return false;
  if (!isTimestampStarted(uv.startTime, nowMs)) return false;
  if (isTimestampExpired(uv.endTime, nowMs)) return false;
  return true;
}

export function getUserVoucherAvailabilityReason(uv: UserVoucher, nowMs = Date.now()): string | null {
  if (uv.status === 'USED') return 'ใช้สิทธิ์แล้ว';
  if (uv.status === 'EXPIRED' || isTimestampExpired(uv.endTime, nowMs)) return 'หมดอายุแล้ว';
  if (uv.isActive === false) return 'ถูกปิดใช้งานโดยผู้ดูแลระบบ';
  if (!isTimestampStarted(uv.startTime, nowMs)) return 'ยังไม่เริ่มแคมเปญ';
  return null;
}

export function computeEffectiveStatus(
  v: Pick<Voucher, 'isActive' | 'startTime' | 'endTime' | 'totalQuota' | 'usedQuota'>,
  nowMs = Date.now()
): VoucherEffectiveStatus {
  if (v.isActive === false) return 'INACTIVE';
  if (isTimestampExpired(v.endTime, nowMs)) return 'EXPIRED';
  if (!isTimestampStarted(v.startTime, nowMs)) return 'SCHEDULED';
  if (v.usedQuota >= v.totalQuota) return 'EXHAUSTED';
  return 'ACTIVE';
}

export function toLocalDateTimeInputValue(isoString?: string | null): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function localDateTimeInputToIso(value: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString();
}
