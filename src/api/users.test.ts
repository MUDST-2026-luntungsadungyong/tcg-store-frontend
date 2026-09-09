import { beforeEach, describe, expect, it, vi } from 'vitest';

const { get, put } = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn() }));

vi.mock('./client', () => ({
  default: { get, put },
}));

import { usersApi } from './users';

describe('usersApi', () => {
  beforeEach(() => {
    get.mockReset();
    put.mockReset();
  });

  it('hydrates all contact and seller fields from the backend profile endpoint', async () => {
    get.mockResolvedValue({
      data: {
        id: '42',
        name: 'Naphat',
        email: 'naphat@example.com',
        phone: '081-234-5678',
        line: '@cardvaultth',
        facebook: 'fb.com/cardvaultth',
        role: 'SELLER',
        sellerStatus: 'VERIFIED',
      },
    });

    await expect(usersApi.getProfile()).resolves.toEqual({
      id: '42',
      name: 'Naphat',
      email: 'naphat@example.com',
      phone: '081-234-5678',
      contactLine: '@cardvaultth',
      contactFacebook: 'fb.com/cardvaultth',
      role: 'SELLER',
      sellerStatus: 'VERIFIED',
    });
    expect(get).toHaveBeenCalledWith('/users/profile');
  });

  it('maps the contact update response back to frontend field names', async () => {
    put.mockResolvedValue({
      data: {
        id: '42',
        name: 'Naphat',
        email: 'naphat@example.com',
        phone: '081-999-0000',
        line: '@mythix',
        facebook: null,
        role: 'CUSTOMER',
        sellerStatus: 'NONE',
      },
    });

    const user = { id: '42', name: 'Naphat', email: 'naphat@example.com', role: 'CUSTOMER' as const };
    await expect(usersApi.updateContactInfo(user, {
      phone: '081-999-0000',
      contactLine: '@mythix',
      contactFacebook: '',
    })).resolves.toMatchObject({
      phone: '081-999-0000',
      contactLine: '@mythix',
      role: 'CUSTOMER',
      sellerStatus: 'NONE',
    });
    expect(put).toHaveBeenCalledWith('/users/profile', {
      name: 'Naphat',
      phone: '081-999-0000',
      line: '@mythix',
      facebook: '',
    });
  });
});
