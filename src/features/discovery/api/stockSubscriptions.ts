import axios from 'axios';

import apiClient from '@/shared/api/client';

export interface StockSubscription {
  globalCardId: string;
  subscribed: boolean;
  subscribedAt: string | null;
}

function normalizeSubscription(raw: unknown, globalCardId: string): StockSubscription {
  if (!raw || typeof raw !== 'object') {
    return { globalCardId, subscribed: false, subscribedAt: null };
  }
  const value = raw as Record<string, unknown>;
  return {
    globalCardId: String(value.globalCardId ?? globalCardId),
    subscribed: value.subscribed === true || value.isSubscribed === true,
    subscribedAt: typeof value.subscribedAt === 'string' ? value.subscribedAt : null,
  };
}

export function isStockAlreadyAvailable(error: unknown): boolean {
  if (!axios.isAxiosError(error) || error.response?.status !== 409) return false;
  const body = error.response.data as { code?: unknown; message?: unknown } | undefined;
  return body?.code === 'STOCK_ALREADY_AVAILABLE' ||
    (typeof body?.message === 'string' && body.message.includes('STOCK_ALREADY_AVAILABLE'));
}

export const stockSubscriptionsApi = {
  async get(globalCardId: string): Promise<StockSubscription> {
    const path = `/stock-subscriptions/${encodeURIComponent(globalCardId)}`;
    try {
      const { data } = await apiClient.get<unknown>(path);
      return normalizeSubscription(data, globalCardId);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return { globalCardId, subscribed: false, subscribedAt: null };
      }
      throw error;
    }
  },

  async subscribe(globalCardId: string): Promise<StockSubscription> {
    const { data } = await apiClient.put<unknown>(
      `/stock-subscriptions/${encodeURIComponent(globalCardId)}`,
    );
    return normalizeSubscription(data, globalCardId);
  },

  async unsubscribe(globalCardId: string): Promise<void> {
    await apiClient.delete(`/stock-subscriptions/${encodeURIComponent(globalCardId)}`);
  },
};
