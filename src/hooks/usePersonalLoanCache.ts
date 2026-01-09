import { useState, useEffect } from 'react';
import { personalLoanCache } from '@/stores/personalLoanCache';

export const usePersonalLoanCache = (page: number, search: string, statusFilter: string) => {
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const updateState = () => {
    const cached = personalLoanCache.getCachedData(page, search, statusFilter);
    if (cached) {
      setLoans(cached.loans);
      setTotal(cached.total);
      setTotalPages(cached.totalPages);
      setLastUpdated(cached.timestamp);
      setLoading(false);
    }
  };

  const fetchData = async (isInitial = false) => {
    if (isInitial) {
      const cached = personalLoanCache.getCachedData(page, search, statusFilter);
      if (cached) {
        setLoans(cached.loans);
        setTotal(cached.total);
        setTotalPages(cached.totalPages);
        setLastUpdated(cached.timestamp);
        setLoading(false);
        return;
      }
    }

    try {
      if (isInitial) setLoading(true);
      else setIsRefreshing(true);

      const result = await personalLoanCache.fetchData(page, search, statusFilter);
      setLoans(result.loans);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      setLastUpdated(result.timestamp);
    } catch (error) {
      console.error('Personal loan fetch error:', error);
    } finally {
      if (isInitial) setLoading(false);
      else setIsRefreshing(false);
    }
  };

  const refetch = () => fetchData(false);

  useEffect(() => {
    fetchData(true);
    const unsubscribe = personalLoanCache.subscribe(updateState);
    return unsubscribe;
  }, [page, search, statusFilter]);

  return {
    loans,
    loading,
    total,
    totalPages,
    isRefreshing,
    lastUpdated,
    refetch
  };
};