import { useCallback, useEffect, useRef, useState } from 'react';
import { auctionError } from '../api/auctions';

export function useAuctionResource<T>(fetchData: () => Promise<T>, fallback: string, refreshMs?: number) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const sequence = useRef(0);
  const reload = useCallback(async (quiet = false) => {
    const request = ++sequence.current;
    if (!quiet) {
      setLoading(true);
      setError('');
    }
    try {
      const value = await fetchData();
      if (sequence.current === request) {
        setData(value);
        setError('');
      }
    } catch (failure) {
      if (sequence.current === request) setError(auctionError(failure, fallback));
    } finally {
      if (sequence.current === request) setLoading(false);
    }
  }, [fetchData, fallback]);
  useEffect(() => {
    void reload();
    const interval = refreshMs ? window.setInterval(() => { void reload(true); }, refreshMs) : undefined;
    return () => {
      sequence.current++;
      window.clearInterval(interval);
    };
  }, [reload, refreshMs]);
  const replaceData = (value: T) => {
    sequence.current++;
    setLoading(false);
    setError('');
    setData(value);
  };
  return { data, error, loading, reload, replaceData };
}

export function useAuctionClock(intervalMs = 1000) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(interval);
  }, [intervalMs]);
  return now;
}
