import { isAxiosError } from 'axios';
import apiClient from '@/shared/api/client';

export type AuctionStatus = 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'ENDED' | 'AWAITING_PAYMENT' | 'COMPLETED' | 'CANCELLED';
export type RequestStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
export type StartMode = 'NOW' | 'SCHEDULED';

export interface AuctionInventory {
  productId: number;
  cardId: string;
  cardName: string;
  setName: string;
  imageUrl: string | null;
  cardNumber: string | null;
  rarity: string | null;
  condition: string;
  status: 'SHOW' | 'HIDE' | 'OUT_OF_STOCK';
  availableQuantity: number;
  collectionMatch: boolean;
}

export interface CancellationEvidence {
  id: number;
  fileName: string;
  url: string;
}

export interface CancellationRequest {
  id: number;
  auctionId: number;
  auctionStatus: AuctionStatus;
  cardName: string;
  sellerId: number;
  sellerName: string;
  productId: number | null;
  imageUrl: string | null;
  condition: string | null;
  highestBid: number | null;
  endAt: string | null;
  bidCount: number;
  reason: string;
  status: RequestStatus;
  decisionReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  evidence: CancellationEvidence[];
}

export interface Auction {
  id: number;
  status: AuctionStatus;
  productId: number | null;
  cardId: string | null;
  cardName: string | null;
  setName: string | null;
  imageUrl: string | null;
  condition: string | null;
  gradingCompany: string | null;
  grade: string | null;
  certNumber: string | null;
  frontImageUrl: string | null;
  backImageUrl: string | null;
  startPrice: number | null;
  reservePrice: number | null;
  buyItNowPrice: number | null;
  startMode: StartMode | null;
  startAt: string | null;
  endAt: string | null;
  durationHours: number | null;
  bidCount: number;
  highestBid: number | null;
  updatedAt: string;
  serverTime?: string;
  cancellationRequest: CancellationRequest | null;
}

const seller = '/seller/auctions';
const admin = '/admin/auction-cancellation-requests';
const multipart = { 'Content-Type': 'multipart/form-data' };

export const auctionApi = {
  inventory: async () => (await apiClient.get<AuctionInventory[]>(`${seller}/inventory`)).data,
  list: async () => (await apiClient.get<Auction[]>(seller)).data,
  get: async (id: number) => (await apiClient.get<Auction>(`${seller}/${id}`)).data,
  createDraft: async (data: FormData, key: string) =>
    (await apiClient.post<Auction>(`${seller}/drafts`, data, { headers: { ...multipart, 'Idempotency-Key': key } })).data,
  updateDraft: async (id: number, data: FormData) =>
    (await apiClient.put<Auction>(`${seller}/${id}/draft`, data, { headers: multipart })).data,
  deleteDraft: async (id: number) => { await apiClient.delete(`${seller}/${id}/draft`); },
  publish: async (id: number) => (await apiClient.post<Auction>(`${seller}/${id}/publish`)).data,
  cancel: async (id: number) => (await apiClient.post<Auction>(`${seller}/${id}/cancel`)).data,
  requestCancellation: async (id: number, data: FormData) =>
    (await apiClient.post<CancellationRequest>(`${seller}/${id}/cancellation-requests`, data, { headers: multipart })).data,
  requests: async () => (await apiClient.get<CancellationRequest[]>(admin)).data,
  request: async (id: number) => (await apiClient.get<CancellationRequest>(`${admin}/${id}`)).data,
  approve: async (id: number) => (await apiClient.post<CancellationRequest>(`${admin}/${id}/approve`)).data,
  reject: async (id: number, reason: string) =>
    (await apiClient.post<CancellationRequest>(`${admin}/${id}/reject`, { reason })).data,
  attachment: async (url: string, signal?: AbortSignal) => {
    if (!/^\/api\/(?:seller\/auctions|admin\/auction-cancellation-requests)\//.test(url)) {
      throw new Error('Unexpected auction attachment URL.');
    }
    return (await apiClient.get<Blob>(url.slice(4), { responseType: 'blob', signal })).data;
  },
};

export function auctionError(error: unknown, fallback: string): string {
  if (!isAxiosError<{ message?: string }>(error)) return fallback;
  return error.response?.data?.message || fallback;
}
