import { isAxiosError } from 'axios';
import apiClient from '@/shared/api/client';

export type AuctionStatus =
  | 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'ENDED'
  | 'AWAITING_PAYMENT' | 'COMPLETED' | 'CANCELLED'
  | 'BUYOUT_COMPLETED' | 'RESERVE_NOT_MET' | 'UNSOLD_NO_BIDS' | 'DEFAULTED';
export type RequestStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
export type StartMode = 'NOW' | 'SCHEDULED';
export type OfferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export interface AuctionInventory {
  productId: number;
  cardId: string;
  cardName: string;
  setName: string;
  imageUrl: string | null;
  cardNumber: string | null;
  rarity: string | null;
  condition: string;
  language?: string;
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
  language?: string;
  quantity?: number;
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

// ─── Buyer-facing types (US-14, US-15, US-17, US-18) ───────────────────────

export interface AuctionSummary {
  quantity?: number;
  id: number;
  frontImageUrl: string | null;
  cardName: string | null;
  setName: string | null;
  imageUrl: string | null;
  condition: string | null;
  gradingCompany: string | null;
  grade: string | null;
  currentPrice: number;
  buyItNowPrice: number | null;
  bidCount: number;
  status: AuctionStatus;
  endAt: string | null;
  isReserveMet: boolean;
  serverTime?: string;
}

export interface BuyerAuctionDetail {
  language?: string;
  quantity?: number;
  id: number;
  cardName: string | null;
  setName: string | null;
  imageUrl: string | null;
  frontImageUrl: string | null;
  backImageUrl: string | null;
  condition: string | null;
  gradingCompany: string | null;
  grade: string | null;
  certNumber: string | null;
  certVerificationUrl: string | null;
  startPrice: number;
  currentPrice: number;
  buyItNowPrice: number | null;
  nextMinimumBid: number;
  bidCount: number;
  status: AuctionStatus;
  startAt: string | null;
  endAt: string | null;
  isReserveMet: boolean;
  isWatching: boolean;
  serverTime: string;
  sellerName: string | null;
  sellerId: number;
  sellerRating: number | null;
  sellerCompletedAuctions: number;
}

export interface BidView {
  id: number;
  bidAmount: number;
  maskedBidderName: string;
  bidType: string;
  createdAt: string;
  isSelf: boolean;
}

export interface AuctionPage {
  content: AuctionSummary[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface BuyoutResult {
  status: string;
  finalPrice: number;
  platformFeeAmount: number;
  sellerNetAmount: number;
  orderId?: number;
}

export interface SecondChanceOffer {
  quantity?: number;
  id: number;
  auctionId: number;
  cardName: string | null;
  imageUrl: string | null;
  offerPrice: number;
  status: OfferStatus;
  expiresAt: string;
  createdAt: string;
}

export interface AuctionSettlement {
  auctionId: number;
  finalPrice: number;
  platformFeeRate: number;
  platformFeeAmount: number;
  sellerNetAmount: number;
  costBasis: number;
}

export interface AuctionCommissionPolicy { rate: number; minimumFee: number; }

export const auctionCommissionApi = {
  get: async () => (await apiClient.get<AuctionCommissionPolicy>('/admin/auction-commission')).data,
  update: async (policy: AuctionCommissionPolicy) =>
    (await apiClient.put<AuctionCommissionPolicy>('/admin/auction-commission', policy)).data,
};

export interface SellerAnalytics {
  grossAuctionVolume: number;
  totalCost: number;
  totalPlatformFee: number;
  netRealizedProfit: number;
  profitMarginPercent: number;
  totalCompletedAuctions: number;
  items: Array<{
    auctionId: number;
    cardName: string | null;
    startPrice: number;
    finalPrice: number;
    costBasis: number;
    platformFee: number;
    netProfit: number;
    closedAt: string;
  }>;
}

export interface BuyerPortfolio {
  bidsPlaced: number;
  auctionsWon: number;
  winRatePercent: number;
  totalInvested: number;
  badges: string[];
  wonItems: Array<{
    auctionId: number;
    orderId: number;
    orderNumber: string;
    orderStatus: string;
    cardName: string | null;
    quantity: number;
    finalPrice: number;
    paymentDeadline: string | null;
    isPaid: boolean;
    hasPaymentProof: boolean;
  }>;
}

export interface PayResult { status: string; }

// ─── API path constants ──────────────────────────────────────────────────────

const sellerPath = '/seller/auctions';
const adminPath = '/admin/auction-cancellation-requests';
const buyerPath = '/auctions';
const userPath = '/user';
const multipart = { 'Content-Type': 'multipart/form-data' };

// ─── Seller / Admin auction API ─────────────────────────────────────────────

export const auctionApi = {
  inventory: async () => (await apiClient.get<AuctionInventory[]>(`${sellerPath}/inventory`)).data,
  list: async () => (await apiClient.get<Auction[]>(sellerPath)).data,
  get: async (id: number) => (await apiClient.get<Auction>(`${sellerPath}/${id}`)).data,
  createDraft: async (data: FormData, key: string) =>
    (await apiClient.post<Auction>(`${sellerPath}/drafts`, data, { headers: { ...multipart, 'Idempotency-Key': key } })).data,
  updateDraft: async (id: number, data: FormData) =>
    (await apiClient.put<Auction>(`${sellerPath}/${id}/draft`, data, { headers: multipart })).data,
  deleteDraft: async (id: number) => { await apiClient.delete(`${sellerPath}/${id}/draft`); },
  publish: async (id: number) => (await apiClient.post<Auction>(`${sellerPath}/${id}/publish`)).data,
  cancel: async (id: number) => (await apiClient.post<Auction>(`${sellerPath}/${id}/cancel`)).data,
  requestCancellation: async (id: number, data: FormData) =>
    (await apiClient.post<CancellationRequest>(`${sellerPath}/${id}/cancellation-requests`, data, { headers: multipart })).data,
  requests: async () => (await apiClient.get<CancellationRequest[]>(adminPath)).data,
  request: async (id: number) => (await apiClient.get<CancellationRequest>(`${adminPath}/${id}`)).data,
  approve: async (id: number) => (await apiClient.post<CancellationRequest>(`${adminPath}/${id}/approve`)).data,
  reject: async (id: number, reason: string) =>
    (await apiClient.post<CancellationRequest>(`${adminPath}/${id}/reject`, { reason })).data,
  attachment: async (url: string, signal?: AbortSignal) => {
    if (!/^\/api\/(?:seller\/auctions|admin\/auction-cancellation-requests)\//.test(url)) {
      throw new Error('Unexpected auction attachment URL.');
    }
    return (await apiClient.get<Blob>(url.slice(4), { responseType: 'blob', signal })).data;
  },
  settlement: async (id: number) => (await apiClient.get<AuctionSettlement>(`${sellerPath}/${id}/settlement-summary`)).data,
  getSellerAnalytics: async () => (await apiClient.get<SellerAnalytics>(`${sellerPath}/analytics`)).data,
  sendSecondChanceOffer: async (auctionId: number) =>
    (await apiClient.post<SecondChanceOffer>(`${sellerPath}/${auctionId}/second-chance-offer`)).data,
};

// ─── Buyer auction API ───────────────────────────────────────────────────────

export const buyerAuctionApi = {
  /** หน้า Discovery Hub: ค้นหาและกรองประมูล */
  search: async (params: {
    page?: number; size?: number; search?: string;
    game?: string; condition?: string; minPrice?: number; maxPrice?: number;
    tab?: 'ENDING_SOON' | 'HOT_BIDS' | 'BUY_IT_NOW' | 'NO_RESERVE';
  }) => {
    const { search, ...filters } = params;
    return (await apiClient.get<AuctionPage>(buyerPath, {
      params: { ...filters, keyword: search, sort: filters.tab === 'HOT_BIDS' ? 'hot_bids' : 'ending_soon' },
    })).data;
  },

  /** รายละเอียดประมูลสำหรับ Buyer */
  detail: async (id: number) => (await apiClient.get<BuyerAuctionDetail>(`${buyerPath}/${id}`)).data,

  /** ประวัติ bid (ชื่อ masked บางส่วน) */
  bids: async (id: number) => (await apiClient.get<BidView[]>(`${buyerPath}/${id}/bids`)).data,

  /** เสนอราคาแบบ Manual */
  placeBid: async (id: number, amount: number) =>
    (await apiClient.post<BidView>(`${buyerPath}/${id}/bids`, { amount })).data,

  /** ตั้ง Proxy Max Bid */
  placeProxyBid: async (id: number, maxAmount: number) =>
    (await apiClient.post<BidView>(`${buyerPath}/${id}/proxy-bid`, { maxAmount })).data,

  /** Buy-It-Now ทันที */
  buyout: async (id: number) => (await apiClient.post<BuyoutResult>(`${buyerPath}/${id}/buyout`)).data,

  /** Toggle Watchlist */
  toggleWatch: async (id: number) =>
    (await apiClient.post<{ auctionId: number; isWatching: boolean }>(`${buyerPath}/${id}/watch`)).data,

  /** รายการ Watchlist ของฉัน */
  watchlist: async () => (await apiClient.get<AuctionSummary[]>(`${userPath}/watchlist`)).data,

  submitPaymentProof: async (orderId: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    await apiClient.post(`/orders/${orderId}/payment-proof`, form, { headers: multipart });
  },
  paymentProof: async (orderId: number | string) =>
    (await apiClient.get<Blob>(`/orders/${orderId}/payment-proof`, { responseType: 'blob' })).data,

  secondChanceOffers: async () =>
    (await apiClient.get<SecondChanceOffer[]>(`${userPath}/auction-second-chance-offers`)).data,

  /** ตอบรับ / ปฏิเสธ Second-Chance Offer */
  respondSecondChance: async (offerId: number, accept: boolean) =>
    (await apiClient.post<{ status: string }>(`${buyerPath}/second-chance/${offerId}/respond`, null, { params: { accept } })).data,

  /** Buyer Portfolio สำหรับ US-18-3 */
  portfolio: async () => (await apiClient.get<BuyerPortfolio>(`${userPath}/auction-portfolio`)).data,
};

export function auctionError(error: unknown, fallback: string): string {
  if (!isAxiosError<{ message?: string }>(error)) return fallback;
  return error.response?.data?.message || fallback;
}
