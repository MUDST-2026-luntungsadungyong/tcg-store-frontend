import { beforeEach, describe, expect, it, vi } from 'vitest';

const { put } = vi.hoisted(() => ({ put: vi.fn() }));

vi.mock('@/shared/api/client', () => ({
  default: { put },
}));

vi.mock('@/shared/config/env', () => ({
  ENV: { ENABLE_MOCK_API: false, API_BASE_URL: 'http://localhost:8080/api' },
}));

import { usersApi } from './users';

describe('usersApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updateProfile() calls PUT /users/:id with update payload and returns updated user', async () => {
    const mockUpdatedUser = {
      id: 'usr-1',
      name: 'Ash Ketchum',
      email: 'ash@mythix.com',
      role: 'USER',
      phone: '081-123-4567',
    };

    put.mockResolvedValueOnce({ data: mockUpdatedUser });

    const result = await usersApi.updateProfile('usr-1', {
      name: 'Ash Ketchum',
      phone: '081-123-4567',
    });

    expect(put).toHaveBeenCalledWith('/users/usr-1', {
      name: 'Ash Ketchum',
      phone: '081-123-4567',
    });
    expect(result).toEqual(mockUpdatedUser);
  });
});
