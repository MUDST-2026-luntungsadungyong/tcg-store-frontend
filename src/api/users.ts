import apiClient from './client';
import { ENV } from '@/config/env';
import type { User } from '@/types';
import { storage } from './storage';

export const usersApi = {
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
    }
}
