import { useEffect, useRef } from 'react';
import { getStoredAccessToken } from '@/shared/api/authStorage';
import { ENV } from '@/shared/config/env';
import {
  USER_VOUCHER_STORAGE_KEY,
  VOUCHER_BROADCAST_CHANNEL,
  VOUCHER_CATALOG_STORAGE_KEY,
  VOUCHER_DOM_EVENT,
} from './voucherUtils';

interface UseVoucherLiveUpdatesOptions {
  enabled?: boolean;
  onRefresh: () => void | Promise<void>;
  pollIntervalMs?: number;
}

function isMockEnvironment(): boolean {
  if (ENV.ENABLE_MOCK_API) return true;
  const token = getStoredAccessToken();
  return Boolean(token?.startsWith('mock-'));
}

export function useVoucherLiveUpdates({
  enabled = true,
  onRefresh,
  pollIntervalMs = 20000,
}: UseVoucherLiveUpdatesOptions): void {
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    if (!enabled) return;

    const triggerRefresh = () => {
      void onRefreshRef.current();
    };

    const handleDomEvent = () => {
      triggerRefresh();
    };

    const handleStorage = (event: StorageEvent) => {
      if (
        event.key === VOUCHER_CATALOG_STORAGE_KEY ||
        event.key === USER_VOUCHER_STORAGE_KEY ||
        event.key === null
      ) {
        triggerRefresh();
      }
    };

    const handleFocus = () => {
      triggerRefresh();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        triggerRefresh();
      }
    };

    window.addEventListener(VOUCHER_DOM_EVENT, handleDomEvent);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        channel = new BroadcastChannel(VOUCHER_BROADCAST_CHANNEL);
        channel.onmessage = () => {
          triggerRefresh();
        };
      } catch {
        channel = null;
      }
    }

    let socket: WebSocket | null = null;
    let reconnectTimer: number | undefined;
    let disposed = false;
    let hasConnectedBefore = false;

    const connectWebSocket = () => {
      if (disposed || isMockEnvironment() || typeof WebSocket === 'undefined') {
        return;
      }
      try {
        const url = new URL(ENV.API_BASE_URL, window.location.origin);
        url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
        url.pathname = `${url.pathname.replace(/\/$/, '')}/vouchers/live`;

        const ws = new WebSocket(url);
        socket = ws;
        ws.onopen = () => {
          if (hasConnectedBefore) {
            triggerRefresh();
          }
          hasConnectedBefore = true;
        };
        ws.onmessage = () => {
          triggerRefresh();
        };
        ws.onerror = () => {
          ws.close();
        };
        ws.onclose = () => {
          if (!disposed) {
            reconnectTimer = window.setTimeout(connectWebSocket, 4000);
          }
        };
      } catch {
        // Ignore WS connection construction errors (e.g. unsupported environment)
      }
    };

    connectWebSocket();

    let pollTimer: number | undefined;
    if (pollIntervalMs > 0) {
      pollTimer = window.setInterval(() => {
        if (document.visibilityState === 'visible') {
          triggerRefresh();
        }
      }, pollIntervalMs);
    }

    return () => {
      disposed = true;
      window.clearTimeout(reconnectTimer);
      window.clearInterval(pollTimer);
      window.removeEventListener(VOUCHER_DOM_EVENT, handleDomEvent);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (channel) {
        channel.close();
      }
      if (socket) {
        socket.onclose = null;
        socket.close();
      }
    };
  }, [enabled, pollIntervalMs]);
}
