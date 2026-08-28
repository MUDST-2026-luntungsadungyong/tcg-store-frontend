import apiClient from './client';
import { ENV } from '@/config/env';
import type { User } from '@/types';
import { storage } from './storage';

export const authApi = {
  login: async (email: string, password: string):Promise<{token: string, user: User}> => {
    if (ENV.ENABLE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 800));
      const users = storage.getUsers();
      // Simple mock authentication (do not use in production)
      const user = users.find(u => u.email === email);
      
      if (user && password === 'password123' && user.role === 'CUSTOMER') {
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
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },
  
  register: async (name: string, email: string, password: string): Promise<{ token: string; user: User }> => {
    if (ENV.ENABLE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 800));
      const users = storage.getUsers();
      if (users.some(u => u.email === email)) {
        throw new Error('Email already in use');
      }
      const user: User = { id: crypto.randomUUID(), name, email, role: 'CUSTOMER' };
      storage.setUsers([...users, user]);
      return { token: 'mock-jwt-token-customer', user };
    }
    const response = await apiClient.post('/auth/register', { name, email, password });
    return response.data;
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
          return users.find(u => u.role === 'CUSTOMER')!;
      }
      const response = await apiClient.get('/auth/me');
      return response.data;
  }
};
