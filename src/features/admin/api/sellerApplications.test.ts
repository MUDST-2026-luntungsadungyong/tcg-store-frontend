import { describe, expect, it, vi, beforeEach } from 'vitest';

const { get, patch } = vi.hoisted(() => ({
  get: vi.fn(),
  patch: vi.fn(),
}));

vi.mock('@/shared/api/client', () => ({
  default: { get, patch },
}));

import { sellerApplicationsApi, type SellerApplication } from './sellerApplications';

describe('sellerApplicationsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('listPending calls /admin/seller-applications and returns application list', async () => {
    const mockApplications: SellerApplication[] = [
      {
        id: '1',
        userId: '9',
        applicantName: 'Misty Cerulean',
        applicantEmail: 'misty@mythix.com',
        shopName: 'Cerulean Water Gym Cards',
        shopDescription: 'Official Water Pokemon Cards',
        sellerStatus: 'PENDING',
        requestedAt: '2026-09-24T10:00:00Z',
      },
    ];

    get.mockResolvedValueOnce({ data: mockApplications });

    const result = await sellerApplicationsApi.listPending();

    expect(get).toHaveBeenCalledWith('/admin/seller-applications');
    expect(result).toEqual(mockApplications);
  });

  it('approve calls PATCH /admin/seller-applications/:id/approve', async () => {
    const approvedApplication: SellerApplication = {
      id: '1',
      userId: '9',
      applicantName: 'Misty Cerulean',
      applicantEmail: 'misty@mythix.com',
      shopName: 'Cerulean Water Gym Cards',
      sellerStatus: 'APPROVED',
    };

    patch.mockResolvedValueOnce({ data: approvedApplication });

    const result = await sellerApplicationsApi.approve('1');

    expect(patch).toHaveBeenCalledWith('/admin/seller-applications/1/approve');
    expect(result.sellerStatus).toBe('APPROVED');
  });

  it('reject calls PATCH /admin/seller-applications/:id/reject with reason payload', async () => {
    const rejectedApplication: SellerApplication = {
      id: '1',
      userId: '9',
      applicantName: 'Misty Cerulean',
      applicantEmail: 'misty@mythix.com',
      shopName: 'Cerulean Water Gym Cards',
      sellerStatus: 'REJECTED',
    };

    patch.mockResolvedValueOnce({ data: rejectedApplication });

    const reason = 'ID document image is blurry';
    const result = await sellerApplicationsApi.reject('1', reason);

    expect(patch).toHaveBeenCalledWith('/admin/seller-applications/1/reject', { reason });
    expect(result.sellerStatus).toBe('REJECTED');
  });
});
