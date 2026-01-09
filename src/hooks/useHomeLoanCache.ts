import { useState, useEffect } from 'react';
import { homeLoanCache } from '@/stores/homeLoanCache';

export const useHomeLoanCache = (page: number, search: string, statusFilter: string) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async (showRefreshing = false) => {
    const cached = homeLoanCache.getCachedData(page, search, statusFilter);
    
    if (cached) {
      setData(cached);
      if (showRefreshing) setIsRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const result = await homeLoanCache.fetchData(page, search, statusFilter);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch home loans');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const unsubscribe = homeLoanCache.subscribe(() => {
      const cached = homeLoanCache.getCachedData(page, search, statusFilter);
      if (cached) setData(cached);
    });

    fetchData();
    return unsubscribe;
  }, [page, search, statusFilter]);

  const refresh = () => fetchData(true);

  return { data, loading, error, refresh, isRefreshing };
};