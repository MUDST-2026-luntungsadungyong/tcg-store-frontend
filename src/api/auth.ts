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
      throw new Error('Invalid credentials');
    }
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
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
          return users.find(u => u.role === 'CUSTOMER')!;
      }
      const response = await apiClient.get('/auth/me');
      return response.data;
  }
};
