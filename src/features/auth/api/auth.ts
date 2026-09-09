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
}

interface BackendAuthResponse {
  token: string;
  user: BackendUser;
}

interface ApiErrorResponse {
  message?: string;
}

export function toFrontendUser(user: BackendUser): User {
  const roleByBackendRole: Record<string, Role> = {
    USER: 'BUYER',
    CUSTOMER: 'BUYER',
    SELLER: 'SELLER',
    ADMIN: 'ADMIN',
  };
  const role = roleByBackendRole[user.role];

  if (!role) {
    throw new Error('Unsupported user role');
  }

  return { id: String(user.id), name: user.name, email: user.email, role };
}

export function getAuthErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.message ?? fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

export const authApi = {
  login: async (email: string, password: string):Promise<{token: string, user: User}> => {
    if (ENV.ENABLE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 800));
      const users = storage.getUsers();
      // Simple mock authentication (do not use in production)
      const user = users.find(u => u.email === email);
      
      if (user && password === 'password123' && user.role === 'BUYER') {
         return { token: 'mock-jwt-token-customer', user };
      }
      if (user && password === 'admin123' && user.role === 'ADMIN') {
         return { token: 'mock-jwt-token-admin', user };
      }
      if (user && password === 'seller123' && user.role === 'SELLER') {
         return { token: 'mock-jwt-token-seller', user };
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
      const user: User = { id: crypto.randomUUID(), name, email, role: 'BUYER' };
      storage.setUsers([...users, user]);
      return { token: 'mock-jwt-token-customer', user };
    }
    const response = await apiClient.post<BackendAuthResponse>('/auth/register', { name, email, password });
    return { token: response.data.token, user: toFrontendUser(response.data.user) };
  },

  forgotPassword: async (email: string): Promise<void> => {
    if (ENV.ENABLE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 800));
      return;
    }
    await apiClient.post('/auth/forgot-password', { email });
  },

  resetPassword: async (newPassword: string): Promise<void> => {
    if (ENV.ENABLE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 800));
      return;
    }
    await apiClient.post('/auth/reset-password', { newPassword });
  },

  getProfile: async (): Promise<User> => {
      if (ENV.ENABLE_MOCK_API) {
          await new Promise(resolve => setTimeout(resolve, 300));
          // In mock mode, we assume the user is customer 1 if they have a token
          const token = localStorage.getItem('token');
          if(!token) throw new Error('Unauthorized');
          
          const users = storage.getUsers();
          if(token.includes('admin')){
             return users.find(u => u.role === 'ADMIN')!;
          }
          if(token.includes('seller')){
             return users.find(u => u.role === 'SELLER')!;
          }
          return users.find(u => u.role === 'BUYER')!;
      }
      const response = await apiClient.get<BackendUser>('/auth/me');
      return toFrontendUser(response.data);
  }
};
