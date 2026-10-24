import { getStoredAccessToken } from '@/shared/api/authStorage';
import axios from 'axios';
import apiClient from '@/shared/api/client';
import { ENV } from '@/shared/config/env';
import type { Role, User } from '@/entities/account/model/types';
import { storage } from '@/infrastructure/mock-db/storage';

interface BackendUser {
  id: string;
  name: string;
  email: string;
  role: string;
  sellerStatus?: string;
}

interface BackendAuthResponse {
  token: string;
  user: BackendUser;
}

interface ApiErrorResponse {
  message?: string;
  fieldErrors?: Record<string, string>;
}

export function toFrontendUser(user: BackendUser): User {
  const roleByBackendRole: Record<string, Role> = {
    USER: 'USER',
    CUSTOMER: 'USER',
    SELLER: 'USER',
    ADMIN: 'ADMIN',
  };
  const role = roleByBackendRole[user.role];

  if (!role) {
    throw new Error('Unsupported user role');
  }

  return {
    id: String(user.id),
    name: user.name,
    email: user.email,
    role,
    isSeller:
      user.role.toUpperCase() === 'SELLER' ||
      ['VERIFIED', 'APPROVED'].includes(user.sellerStatus?.toUpperCase() ?? ''),
    ...(user.sellerStatus ? { sellerStatus: user.sellerStatus } : {}),
  };
}

export function getAuthErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const details = error.response?.data;
    return details?.fieldErrors?.newPassword ?? details?.fieldErrors?.email ?? details?.message ?? fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

const DEMO_RESET_EMAIL_KEY = 'mythix_demo_reset_email';

export function hasPendingDemoReset(): boolean {
  return Boolean(sessionStorage.getItem(DEMO_RESET_EMAIL_KEY));
}

export const authApi = {
  login: async (email: string, password: string):Promise<{token: string, user: User}> => {
    if (ENV.ENABLE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 800));
      const users = storage.getUsers();
      // Simple mock authentication (do not use in production)
      const user = users.find(u => u.email === email);
      
      if (user && password === 'admin123' && user.role === 'ADMIN') {
         return { token: 'mock-jwt-token-admin', user };
      }
      if (user && user.role === 'USER' && (password === 'password123' || password === 'seller123')) {
         return { token: user.isSeller ? 'mock-jwt-token-seller' : 'mock-jwt-token-customer', user };
      }
      throw new Error('Invalid credentials');
    }
    const response = await apiClient.post<BackendAuthResponse>('/auth/login', { email, password });
    return { token: response.data.token, user: toFrontendUser(response.data.user) };
  },
  
  register: async (name: string, email: string, password: string): Promise<{ token: string; user: User }> => {
    if (ENV.ENABLE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 800));
      const users = storage.getUsers();
      if (users.some(u => u.email === email)) {
        throw new Error('Email already in use');
      }
      const user: User = { id: crypto.randomUUID(), name, email, role: 'USER', isSeller: false };
      storage.setUsers([...users, user]);
      return { token: 'mock-jwt-token-customer', user };
    }
    const response = await apiClient.post<BackendAuthResponse>('/auth/register', { name, email, password });
    return { token: response.data.token, user: toFrontendUser(response.data.user) };
  },

  forgotPassword: async (email: string): Promise<boolean> => {
    if (ENV.ENABLE_MOCK_API) {
      throw new Error('Use the backend API for the password reset demo.');
    }
    sessionStorage.removeItem(DEMO_RESET_EMAIL_KEY);
    const response = await apiClient.post<{ exists: boolean }>('/auth/forgot-password', { email });
    if (response.data.exists) sessionStorage.setItem(DEMO_RESET_EMAIL_KEY, email.trim().toLowerCase());
    return response.data.exists;
  },

  resetPassword: async (newPassword: string): Promise<void> => {
    if (ENV.ENABLE_MOCK_API) throw new Error('Use the backend API for the password reset demo.');
    const email = sessionStorage.getItem(DEMO_RESET_EMAIL_KEY);
    if (!email) throw new Error('Start again from Forgot Password.');
    await apiClient.post('/auth/reset-password', { email, newPassword });
    sessionStorage.removeItem(DEMO_RESET_EMAIL_KEY);
  },

  getProfile: async (): Promise<User> => {
      if (ENV.ENABLE_MOCK_API) {
          await new Promise(resolve => setTimeout(resolve, 300));
          // In mock mode, we assume the user is customer 1 if they have a token
          const token = getStoredAccessToken();
          if(!token) throw new Error('Unauthorized');
          
          const users = storage.getUsers();
          if(token.includes('admin')){
             return users.find(u => u.role === 'ADMIN')!;
          }
          if(token.includes('seller')){
             return users.find(u => u.isSeller)!;
          }
          return users.find(u => u.role === 'USER' && !u.isSeller)!;
      }
      const response = await apiClient.get<BackendUser>('/auth/me');
      return toFrontendUser(response.data);
  }
};
