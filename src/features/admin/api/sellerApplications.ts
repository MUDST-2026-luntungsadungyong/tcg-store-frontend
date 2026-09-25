import apiClient from '@/shared/api/client';

export interface SellerApplication {
  id: string;
  userId: string;
  applicantName: string;
  applicantEmail: string;
  shopName: string;
  shopDescription?: string;
  phone?: string;
  line?: string;
  facebook?: string;
  sellerStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt?: string;
}

export const sellerApplicationsApi = {
  listPending: async () => (await apiClient.get<SellerApplication[]>('/admin/seller-applications')).data,
  approve: async (applicationId: string) =>
    (await apiClient.patch<SellerApplication>(`/admin/seller-applications/${applicationId}/approve`)).data,
  reject: async (applicationId: string, reason: string) =>
    (await apiClient.patch<SellerApplication>(`/admin/seller-applications/${applicationId}/reject`, { reason })).data,
};
