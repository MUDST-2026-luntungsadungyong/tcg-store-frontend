import apiClient from '@/shared/api/client';
import type { AuctionStatus } from './auctions';

export interface AdminAuction {
  id: number; sellerId: number; cardName: string | null; status: AuctionStatus | 'PAUSED';
  endAt: string | null; bidCount: number; highestBid: number | null;
  leadingBidderId: number | null; pausedAt: string | null; latestBidAt: string | null; highRiskUser: boolean; priceAnomaly: boolean;
}
export const adminAuctionApi = {
  list: async (page = 0) => (await apiClient.get<{ content: AdminAuction[]; totalPages: number }>('/admin/auctions/live-feed', { params: { page, size: 20 } })).data,
  action: async (id: number, action: 'pause' | 'resume' | 'cancel', reason: string) =>
    (await apiClient.post<AdminAuction>(`/admin/auctions/${id}/${action}`, { reason })).data,
};
