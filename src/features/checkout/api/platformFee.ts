import apiClient from '@/shared/api/client';
import { ENV } from '@/shared/config/env';

export interface PlatformFeePolicy {
  rate: number;
  minimumFee: number;
}

export const DEFAULT_PLATFORM_FEE_POLICY: PlatformFeePolicy = {
  rate: 0.05,
  minimumFee: 20,
};

export async function fetchPlatformFeePolicy(): Promise<PlatformFeePolicy> {
  if (ENV.ENABLE_MOCK_API) return DEFAULT_PLATFORM_FEE_POLICY;
  const response = await apiClient.get<PlatformFeePolicy>('/platform/fee-policy');
  const rate = Number(response.data?.rate);
  const minimumFee = Number(response.data?.minimumFee);
  if (!Number.isFinite(rate) || rate < 0 || rate > 1 || !Number.isFinite(minimumFee) || minimumFee < 0) {
    throw new Error('The server returned an invalid platform fee policy.');
  }
  return { rate, minimumFee };
}

export function calculatePlatformFee(subtotal: number, policy: PlatformFeePolicy): number {
  if (subtotal <= 0) return 0;
  return Math.min(subtotal, Math.max(Math.round(subtotal * policy.rate * 100) / 100, policy.minimumFee));
}
