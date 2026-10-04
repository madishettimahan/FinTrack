import { useState, useEffect, useCallback } from 'react';

export function useApi<T>(fetcher: () => Promise<T>, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true); setError(null);
    try { const result = await fetcher(); setData(result); }
    catch (err: any) { setError(err?.response?.data?.message || err.message || 'Something went wrong'); }
    finally { setLoading(false); }
  }, deps);

  useEffect(() => { refetch(); }, [refetch]);

  return { data, loading, error, refetch, setData };
}

export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => { const timer = setTimeout(() => setDebounced(value), delay); return () => clearTimeout(timer); }, [value, delay]);
  return debounced;
}
