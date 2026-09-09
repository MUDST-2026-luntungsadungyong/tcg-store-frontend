import axios from 'axios';
import apiClient from './client';
import { ENV } from '@/config/env';
import { storage } from './storage';
import type { SellerVerification, SellerVerificationInput, User } from '@/types';

interface BackendSellerVerification extends SellerVerification {
  sellerStatus: 'VERIFIED';
}

interface ApiErrorResponse {
  code?: string;
  message?: string;
}

export class SellerVerificationError extends Error {
  constructor(message: string, readonly code = 'REQUEST_FAILED') {
    super(message);
    this.name = 'SellerVerificationError';
  }
}

function currentMockUser(): User {
  const token = localStorage.getItem('token');
  if (!token) throw new SellerVerificationError('Please sign in before applying to become a seller.', 'UNAUTHENTICATED');
  const user = storage.getUsers().find((candidate) => candidate.role === 'CUSTOMER');
  if (!user) throw new SellerVerificationError('Your account could not be found.', 'NOT_FOUND');
  return user;
}

export const sellerVerificationApi = {
  async submit(input: SellerVerificationInput): Promise<SellerVerification> {
    if (ENV.ENABLE_MOCK_API) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const user = currentMockUser();
      if (user.role === 'SELLER') {
        throw new SellerVerificationError('This account already has a seller profile.', 'SELLER_ALREADY_VERIFIED');
      }

      const updated = { ...user, role: 'SELLER' as const, sellerStatus: 'VERIFIED' as const };
      storage.setUsers(storage.getUsers().map((candidate) => candidate.id === user.id ? updated : candidate));
      return {
        id: user.id,
        ...input,
        sellerStatus: 'VERIFIED',
        verifiedAt: new Date().toISOString(),
      };
    }

    try {
      const response = await apiClient.post<BackendSellerVerification>('/sellers/verify', input);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        throw new SellerVerificationError(error.response?.data?.message ?? 'Unable to submit your seller application.', error.response?.data?.code);
      }
      throw error instanceof SellerVerificationError ? error : new SellerVerificationError('Unable to submit your seller application.');
    }
  },
};
