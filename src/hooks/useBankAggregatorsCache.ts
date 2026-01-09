import { useState, useEffect } from 'react';
import { bankAggregatorsCache } from '@/stores/bankAggregatorsCache';

export const useBankAggregatorsCache = () => {
  const [banks, setBanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const updateState = () => {
    const cached = bankAggregatorsCache.getCachedData();
    if (cached) {
      setBanks(cached.banks);
      setLastUpdated(cached.timestamp);
      setLoading(false);
    }
  };

  const fetchData = async (isInitial = false) => {
    if (isInitial) {
      const cached = bankAggregatorsCache.getCachedData();
      if (cached) {
        setBanks(cached.banks);
        setLastUpdated(cached.timestamp);
        setLoading(false);
        return;
      }
    }

    try {
      if (isInitial) setLoading(true);
      else setIsRefreshing(true);

      const result = await bankAggregatorsCache.fetchData();
      setBanks(result.banks);
      setLastUpdated(result.timestamp);
    } catch (error) {
      console.error('Bank aggregators fetch error:', error);
    } finally {
      if (isInitial) setLoading(false);
      else setIsRefreshing(false);
    }
  };

  const refetch = () => fetchData(false);

  useEffect(() => {
    fetchData(true);
    const unsubscribe = bankAggregatorsCache.subscribe(updateState);
    return unsubscribe;
  }, []);

  return {
    banks,
    loading,
    isRefreshing,
    lastUpdated,
    refetch
  };
};