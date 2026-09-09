import apiClient from './client';
import { ENV } from '@/config/env';
import { toFrontendUser } from './auth';
import type { User } from '@/types';
import { storage } from './storage';

interface BackendProfile {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  line?: string | null;
  facebook?: string | null;
  role: string;
  sellerStatus?: string | null;
}

function toProfileUser(profile: BackendProfile): User {
  const user = toFrontendUser({ ...profile, sellerStatus: profile.sellerStatus ?? undefined });
  return {
    ...user,
    phone: profile.phone ?? undefined,
    contactLine: profile.line ?? undefined,
    contactFacebook: profile.facebook ?? undefined,
  };
}

export const usersApi = {
  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<BackendProfile>('/users/profile');
    return toProfileUser(response.data);
  },
    updateProfile: async (userId: string, data: Partial<User>): Promise<User> => {
        if (ENV.ENABLE_MOCK_API) {
            await new Promise(resolve => setTimeout(resolve, 800));
            const users = storage.getUsers();
            const index = users.findIndex(u => u.id === userId);
            if (index === -1) throw new Error('User not found');
            
            users[index] = { ...users[index], ...data };
            storage.setUsers(users);
            return users[index];
        }
        const response = await apiClient.put(`/users/${userId}`, data);
        return response.data;
    },
  updateContactInfo: async (user: User, data: Pick<User, 'phone' | 'contactLine' | 'contactFacebook'>): Promise<User> => {
    if (ENV.ENABLE_MOCK_API) {
      const users = storage.getUsers();
      const index = users.findIndex((candidate) => candidate.id === user.id);
      if (index === -1) throw new Error('User not found');
      users[index] = { ...users[index], ...data };
      storage.setUsers(users);
      return users[index];
    }
    const response = await apiClient.put('/users/profile', {
      name: user.name,
      phone: data.phone,
      line: data.contactLine,
      facebook: data.contactFacebook,
    });
    return toProfileUser(response.data);
  },
};
