import { useState, useEffect } from 'react';
import { careersCache } from '@/stores/careersCache';

export const useCareersCache = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const updateState = () => {
    const cached = careersCache.getCachedData();
    if (cached) {
      setApplications(cached.applications);
      setLastUpdated(cached.timestamp);
      setLoading(false);
    }
  };

  const fetchData = async (isInitial = false) => {
    if (isInitial) {
      const cached = careersCache.getCachedData();
      if (cached) {
        setApplications(cached.applications);
        setLastUpdated(cached.timestamp);
        setLoading(false);
        return;
      }
    }

    try {
      if (isInitial) setLoading(true);
      else setIsRefreshing(true);

      const result = await careersCache.fetchData();
      setApplications(result.applications);
      setLastUpdated(result.timestamp);
    } catch (error) {
      console.error('Careers fetch error:', error);
    } finally {
      if (isInitial) setLoading(false);
      else setIsRefreshing(false);
    }
  };

  const refetch = () => fetchData(false);

  useEffect(() => {
    fetchData(true);
    const unsubscribe = careersCache.subscribe(updateState);
    return unsubscribe;
  }, []);

  return {
    applications,
    loading,
    isRefreshing,
    lastUpdated,
    refetch
  };
};