import axios from 'axios';

import { initMockStorage, storage } from '@/infrastructure/mock-db/storage';
import apiClient from '@/shared/api/client';
import { ENV } from '@/shared/config/env';

export type ForecastMethod = 'WEIGHTED' | 'SIMPLE';
export type ForecastUrgency =
  | 'OUT_OF_STOCK'
  | 'CRITICAL'
  | 'LOW'
  | 'SAFE'
  | 'NO_RECENT_SALES';
export type ForecastUrgencyFilter = 'ALL' | ForecastUrgency;

export interface StockForecastQuery {
  windowDays: number;
  method: ForecastMethod;
  leadTimeDays: number;
  safetyDays: number;
  targetCoverDays: number;
  includeHidden: boolean;
  search?: string;
  urgency?: ForecastUrgencyFilter;
}

export interface StockForecastSummary {
  totalSkus: number;
  outOfStockCount: number;
  criticalCount: number;
  lowCount: number;
  safeCount: number;
  noRecentSalesCount: number;
}

export interface StockForecastItem {
  productId: string;
  cardId?: string;
  name: string;
  game: string;
  set?: string;
  rarity?: string;
  condition?: string;
  language?: string;
  image: string;
  status: string;
  price: number;
  onHand: number;
  reserved: number;
  auctionReserved: number;
  availableStock: number;
  soldInWindow: number;
  sold7Days: number;
  sold14Days: number;
  sold30Days: number;
  dailySalesRate: number;
  daysUntilStockout: number | null;
  estimatedStockoutDate: string | null;
  reorderPoint: number;
  suggestedRestockQty: number;
  urgencyStatus: ForecastUrgency;
}

export interface StockForecastResponse {
  windowDays: number;
  method: ForecastMethod;
  leadTimeDays: number;
  safetyDays: number;
  targetCoverDays: number;
  includeHidden: boolean;
  generatedAt: string;
  summary: StockForecastSummary;
  items: StockForecastItem[];
}

export type StockForecastErrorCode =
  | 'VALIDATION'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'TIMEOUT'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'CANCELLED'
  | 'REQUEST_FAILED';

export class StockForecastError extends Error {
  readonly code: StockForecastErrorCode;
  readonly fieldErrors: Record<string, string>;

  constructor(
    code: StockForecastErrorCode,
    message: string,
    fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = 'StockForecastError';
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export const ALLOWED_WINDOW_DAYS = [7, 14, 30, 60, 90] as const;

export function validateForecastQuery(
  query: StockForecastQuery,
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!ALLOWED_WINDOW_DAYS.includes(query.windowDays as (typeof ALLOWED_WINDOW_DAYS)[number])) {
    errors.windowDays = 'Window days must be 7, 14, 30, 60, or 90.';
  }
  if (!Number.isInteger(query.leadTimeDays) || query.leadTimeDays < 0 || query.leadTimeDays > 180) {
    errors.leadTimeDays = 'Lead time must be a whole number between 0 and 180 days.';
  }
  if (!Number.isInteger(query.safetyDays) || query.safetyDays < 0 || query.safetyDays > 90) {
    errors.safetyDays = 'Safety stock must be a whole number between 0 and 90 days.';
  }
  if (!Number.isInteger(query.targetCoverDays) || query.targetCoverDays < 1 || query.targetCoverDays > 365) {
    errors.targetCoverDays = 'Target cover must be a whole number between 1 and 365 days.';
  }
  return errors;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function toSafeNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toSafeInt(value: unknown, fallback = 0): number {
  const parsed = Math.trunc(Number(value));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeUrgency(value: unknown): ForecastUrgency {
  switch (String(value ?? '').toUpperCase()) {
    case 'OUT_OF_STOCK':
      return 'OUT_OF_STOCK';
    case 'CRITICAL':
      return 'CRITICAL';
    case 'LOW':
      return 'LOW';
    case 'SAFE':
      return 'SAFE';
    default:
      return 'NO_RECENT_SALES';
  }
}

function normalizeItem(raw: unknown): StockForecastItem {
  const r = asRecord(raw);
  const productId = r.productId ?? r.id;
  if ((typeof productId !== 'string' && typeof productId !== 'number') || String(productId).trim() === '') {
    throw new StockForecastError('REQUEST_FAILED', 'Server returned an invalid stock forecast item.');
  }

  const daysRaw = r.daysUntilStockout;
  const daysUntilStockout =
    daysRaw === null || daysRaw === undefined || daysRaw === ''
      ? null
      : Math.max(0, toSafeInt(daysRaw, 0));

  return {
    productId: String(productId),
    cardId: typeof r.cardId === 'string' ? r.cardId : undefined,
    name: typeof r.name === 'string' && r.name.trim() ? r.name : 'Unnamed Card',
    game: typeof r.game === 'string' ? r.game : 'Pokemon',
    set: typeof r.set === 'string' ? r.set : undefined,
    rarity: typeof r.rarity === 'string' ? r.rarity : undefined,
    condition: typeof r.condition === 'string' ? r.condition : undefined,
    language: typeof r.language === 'string' ? r.language : undefined,
    image: typeof r.image === 'string' ? r.image : '',
    status: typeof r.status === 'string' ? r.status : 'SHOW',
    price: Math.max(0, toSafeNumber(r.price, 0)),
    onHand: Math.max(0, toSafeInt(r.onHand, 0)),
    reserved: Math.max(0, toSafeInt(r.reserved, 0)),
    auctionReserved: Math.max(0, toSafeInt(r.auctionReserved, 0)),
    availableStock: Math.max(0, toSafeInt(r.availableStock, 0)),
    soldInWindow: Math.max(0, toSafeInt(r.soldInWindow, 0)),
    sold7Days: Math.max(0, toSafeInt(r.sold7Days, 0)),
    sold14Days: Math.max(0, toSafeInt(r.sold14Days, 0)),
    sold30Days: Math.max(0, toSafeInt(r.sold30Days, 0)),
    dailySalesRate: Math.max(0, toSafeNumber(r.dailySalesRate, 0)),
    daysUntilStockout,
    estimatedStockoutDate:
      typeof r.estimatedStockoutDate === 'string' && r.estimatedStockoutDate
        ? r.estimatedStockoutDate
        : null,
    reorderPoint: Math.max(0, toSafeInt(r.reorderPoint, 0)),
    suggestedRestockQty: Math.max(0, toSafeInt(r.suggestedRestockQty, 0)),
    urgencyStatus: normalizeUrgency(r.urgencyStatus),
  };
}

function normalizeResponse(raw: unknown): StockForecastResponse {
  const r = asRecord(raw);
  const summaryRaw = asRecord(r.summary);
  if (!Array.isArray(r.items)) {
    throw new StockForecastError('REQUEST_FAILED', 'Server returned an invalid stock forecast payload.');
  }

  return {
    windowDays: toSafeInt(r.windowDays, 30),
    method: r.method === 'SIMPLE' ? 'SIMPLE' : 'WEIGHTED',
    leadTimeDays: toSafeInt(r.leadTimeDays, 7),
    safetyDays: toSafeInt(r.safetyDays, 3),
    targetCoverDays: toSafeInt(r.targetCoverDays, 30),
    includeHidden: Boolean(r.includeHidden),
    generatedAt: typeof r.generatedAt === 'string' ? r.generatedAt : new Date().toISOString().slice(0, 10),
    summary: {
      totalSkus: Math.max(0, toSafeInt(summaryRaw.totalSkus, 0)),
      outOfStockCount: Math.max(0, toSafeInt(summaryRaw.outOfStockCount, 0)),
      criticalCount: Math.max(0, toSafeInt(summaryRaw.criticalCount, 0)),
      lowCount: Math.max(0, toSafeInt(summaryRaw.lowCount, 0)),
      safeCount: Math.max(0, toSafeInt(summaryRaw.safeCount, 0)),
      noRecentSalesCount: Math.max(0, toSafeInt(summaryRaw.noRecentSalesCount, 0)),
    },
    items: r.items.map(normalizeItem),
  };
}

export function toStockForecastError(error: unknown): StockForecastError {
  if (error instanceof StockForecastError) return error;

  if (axios.isCancel(error)) {
    return new StockForecastError('CANCELLED', 'Request was cancelled.');
  }

  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED') {
      return new StockForecastError(
        'TIMEOUT',
        'Stock forecast request timed out. Please try again.',
      );
    }

    if (!error.response) {
      return new StockForecastError(
        'NETWORK_ERROR',
        'Cannot reach the server. Check your connection and try again.',
      );
    }

    const status = error.response.status;
    const body = asRecord(error.response.data);
    const message = typeof body.message === 'string' ? body.message : undefined;
    const rawFieldErrors = asRecord(body.fieldErrors);
    const fieldErrors: Record<string, string> = {};
    for (const [k, v] of Object.entries(rawFieldErrors)) {
      if (typeof v === 'string') fieldErrors[k] = v;
    }

    if (status === 400 || status === 422) {
      const firstFieldError = Object.values(fieldErrors)[0];
      return new StockForecastError(
        'VALIDATION',
        firstFieldError ?? message ?? 'Invalid forecast parameters.',
        fieldErrors,
      );
    }
    if (status === 401) {
      return new StockForecastError(
        'UNAUTHORIZED',
        message ?? 'Your session has expired. Please sign in again.',
      );
    }
    if (status === 403) {
      return new StockForecastError(
        'FORBIDDEN',
        message ?? 'Approved seller access is required to view stock forecasts.',
      );
    }
    if (status >= 500) {
      return new StockForecastError(
        'SERVER_ERROR',
        message ?? 'The forecast service is temporarily unavailable. Please try again.',
      );
    }
    return new StockForecastError(
      'REQUEST_FAILED',
      message ?? 'Failed to load stock forecast.',
    );
  }

  if (error instanceof Error) {
    return new StockForecastError('REQUEST_FAILED', error.message);
  }

  return new StockForecastError('REQUEST_FAILED', 'Unexpected error while loading stock forecast.');
}

function mockForecast(query: StockForecastQuery): StockForecastResponse {
  initMockStorage();
  const now = Date.now();
  const listings = storage
    .getListings()
    .filter((l) => query.includeHidden || l.status === 'SHOW');
  const reservations = storage.getReservations();
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const countSince = (productId: string, days: number) => {
    const cutoff = now - days * 24 * 60 * 60 * 1000;
    return reservations.reduce((acc, order) => {
      if (order.status === 'CANCELLED') return acc;
      const created = new Date(order.createdAt).getTime();
      if (Number.isFinite(created) && created < cutoff) return acc;
      const qty = order.items
        .filter((item) => item.listing.id === productId)
        .reduce((sum, item) => sum + item.quantity, 0);
      return acc + qty;
    }, 0);
  };

  const urgencyRank: Record<ForecastUrgency, number> = {
    OUT_OF_STOCK: 0,
    CRITICAL: 1,
    LOW: 2,
    SAFE: 3,
    NO_RECENT_SALES: 4,
  };

  const allItems: StockForecastItem[] = listings
    .map((listing) => {
      const available = Math.max(0, listing.stock);
      const sold7 = countSince(listing.id, 7);
      const sold14 = countSince(listing.id, 14);
      const sold30 = countSince(listing.id, 30);
      const soldWindow = countSince(listing.id, query.windowDays);

      let rate = 0;
      if (query.method === 'SIMPLE' || query.windowDays === 7) {
        rate = soldWindow / query.windowDays;
      } else if (query.windowDays === 14) {
        rate = 0.6 * (sold7 / 7) + 0.4 * (sold14 / 14);
      } else {
        rate = 0.5 * (sold7 / 7) + 0.3 * (sold14 / 14) + 0.2 * (soldWindow / query.windowDays);
      }
      const roundedRate = Math.round(rate * 100) / 100;

      let daysUntilStockout: number | null = null;
      let estimatedStockoutDate: string | null = null;
      let urgencyStatus: ForecastUrgency = 'NO_RECENT_SALES';

      if (available === 0) {
        daysUntilStockout = 0;
        estimatedStockoutDate = todayStr;
        urgencyStatus = 'OUT_OF_STOCK';
      } else if (rate > 0) {
        daysUntilStockout = Math.floor(available / rate);
        const targetDate = new Date(today);
        targetDate.setDate(targetDate.getDate() + daysUntilStockout);
        estimatedStockoutDate = targetDate.toISOString().slice(0, 10);
        if (daysUntilStockout <= query.leadTimeDays) {
          urgencyStatus = 'CRITICAL';
        } else if (daysUntilStockout <= query.leadTimeDays + query.safetyDays) {
          urgencyStatus = 'LOW';
        } else {
          urgencyStatus = 'SAFE';
        }
      }

      const reorderPoint = Math.ceil(rate * (query.leadTimeDays + query.safetyDays));
      const suggestedRestockQty = Math.max(0, Math.ceil(rate * query.targetCoverDays) - available);

      return {
        productId: listing.id,
        cardId: listing.cardId,
        name: listing.name,
        game: listing.game,
        set: listing.set,
        rarity: listing.rarity,
        condition: listing.condition,
        language: listing.language,
        image: listing.image,
        status: listing.status,
        price: listing.price,
        onHand: available,
        reserved: 0,
        auctionReserved: 0,
        availableStock: available,
        soldInWindow: soldWindow,
        sold7Days: sold7,
        sold14Days: sold14,
        sold30Days: sold30,
        dailySalesRate: roundedRate,
        daysUntilStockout,
        estimatedStockoutDate,
        reorderPoint,
        suggestedRestockQty,
        urgencyStatus,
      };
    })
    .sort((a, b) => {
      const rankDiff = urgencyRank[a.urgencyStatus] - urgencyRank[b.urgencyStatus];
      if (rankDiff !== 0) return rankDiff;
      const daysA = a.daysUntilStockout ?? Number.MAX_SAFE_INTEGER;
      const daysB = b.daysUntilStockout ?? Number.MAX_SAFE_INTEGER;
      if (daysA !== daysB) return daysA - daysB;
      return b.dailySalesRate - a.dailySalesRate;
    });

  const summary: StockForecastSummary = {
    totalSkus: allItems.length,
    outOfStockCount: allItems.filter((i) => i.urgencyStatus === 'OUT_OF_STOCK').length,
    criticalCount: allItems.filter((i) => i.urgencyStatus === 'CRITICAL').length,
    lowCount: allItems.filter((i) => i.urgencyStatus === 'LOW').length,
    safeCount: allItems.filter((i) => i.urgencyStatus === 'SAFE').length,
    noRecentSalesCount: allItems.filter((i) => i.urgencyStatus === 'NO_RECENT_SALES').length,
  };

  const needle = query.search?.trim().toLowerCase();
  const items = allItems.filter((item) => {
    const matchesSearch =
      !needle ||
      [item.name, item.set, item.rarity, item.condition, item.language, item.game]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle));
    const matchesUrgency =
      !query.urgency || query.urgency === 'ALL' || item.urgencyStatus === query.urgency;
    return matchesSearch && matchesUrgency;
  });

  return {
    ...query,
    generatedAt: todayStr,
    summary,
    items,
  };
}

export const stockForecastApi = {
  async getForecast(
    query: StockForecastQuery,
    signal?: AbortSignal,
  ): Promise<StockForecastResponse> {
    const validationErrors = validateForecastQuery(query);
    const firstValidationError = Object.values(validationErrors)[0];
    if (firstValidationError) {
      throw new StockForecastError('VALIDATION', firstValidationError, validationErrors);
    }

    if (ENV.ENABLE_MOCK_API) {
      return mockForecast(query);
    }

    try {
      const { data } = await apiClient.get('/seller/listings/stock-forecast', {
        signal,
        params: {
          windowDays: query.windowDays,
          method: query.method,
          leadTimeDays: query.leadTimeDays,
          safetyDays: query.safetyDays,
          targetCoverDays: query.targetCoverDays,
          includeHidden: query.includeHidden,
          search: query.search?.trim() || undefined,
          urgency: query.urgency && query.urgency !== 'ALL' ? query.urgency : undefined,
        },
      });
      return normalizeResponse(data);
    } catch (error) {
      throw toStockForecastError(error);
    }
  },
};
