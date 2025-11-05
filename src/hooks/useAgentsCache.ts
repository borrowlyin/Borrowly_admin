import { useState, useEffect } from 'react';
import { agentsCache } from '@/stores/agentsCache';

export const useAgentsCache = (page: number, search: string, stateFilter: string, typeFilter: string, approvalFilter: string) => {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const updateState = () => {
    const cached = agentsCache.getCachedData(page, search, stateFilter, typeFilter, approvalFilter);
    if (cached) {
      setAgents(cached.agents);
      setTotalItems(cached.totalItems);
      setTotalPages(cached.totalPages);
      setLastUpdated(cached.timestamp);
      setLoading(false);
    }
  };

  const fetchData = async (isInitial = false) => {
    if (isInitial) {
      const cached = agentsCache.getCachedData(page, search, stateFilter, typeFilter, approvalFilter);
      if (cached) {
        setAgents(cached.agents);
        setTotalItems(cached.totalItems);
        setTotalPages(cached.totalPages);
        setLastUpdated(cached.timestamp);
        setLoading(false);
        return;
      }
    }

    try {
      if (isInitial) setLoading(true);
      else setIsRefreshing(true);

      const result = await agentsCache.fetchData(page, search, stateFilter, typeFilter, approvalFilter);
      setAgents(result.agents);
      setTotalItems(result.totalItems);
      setTotalPages(result.totalPages);
      setLastUpdated(result.timestamp);
    } catch (error) {
      console.error('Agents fetch error:', error);
    } finally {
      if (isInitial) setLoading(false);
      else setIsRefreshing(false);
    }
  };

  const refetch = () => fetchData(false);

  useEffect(() => {
    fetchData(true);
    const unsubscribe = agentsCache.subscribe(updateState);
    return unsubscribe;
  }, [page, search, stateFilter, typeFilter, approvalFilter]);

  return {
    agents,
    loading,
    totalItems,
    totalPages,
    isRefreshing,
    lastUpdated,
    refetch
  };
};