import { useState, useEffect } from 'react';
import { insuranceCache } from '@/stores/insuranceCache';

export const useInsuranceCache = (page: number, search: string, statusFilter: string) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async (showRefreshing = false) => {
    const cached = insuranceCache.getCachedData(page, search, statusFilter);
    
    if (cached) {
      setData(cached);
      if (showRefreshing) setIsRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const result = await insuranceCache.fetchData(page, search, statusFilter);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch insurance');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const unsubscribe = insuranceCache.subscribe(() => {
      const cached = insuranceCache.getCachedData(page, search, statusFilter);
      if (cached) setData(cached);
    });

    fetchData();
    return unsubscribe;
  }, [page, search, statusFilter]);

  const refresh = () => fetchData(true);

  return {
    insurances: data?.insurances || [],
    loading,
    total: data?.total || 0,
    totalPages: data?.totalPages || 1,
    isRefreshing,
    lastUpdated: data?.timestamp,
    refetch: refresh
  };
};