import { useState, useEffect } from 'react';
import { contactUsCache } from '@/stores/contactUsCache';

export const useContactUsCache = (page: number, search: string, statusFilter: string) => {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const updateState = () => {
    const cached = contactUsCache.getCachedData(page, search, statusFilter);
    if (cached) {
      setContacts(cached.contacts);
      setTotal(cached.total);
      setTotalPages(cached.totalPages);
      setLastUpdated(cached.timestamp);
      setLoading(false);
    }
  };

  const fetchData = async (isInitial = false) => {
    if (isInitial) {
      const cached = contactUsCache.getCachedData(page, search, statusFilter);
      if (cached) {
        setContacts(cached.contacts);
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

      const result = await contactUsCache.fetchData(page, search, statusFilter);
      setContacts(result.contacts);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      setLastUpdated(result.timestamp);
    } catch (error) {
      console.error('Contact us fetch error:', error);
    } finally {
      if (isInitial) setLoading(false);
      else setIsRefreshing(false);
    }
  };

  const refetch = () => fetchData(false);

  useEffect(() => {
    fetchData(true);
    const unsubscribe = contactUsCache.subscribe(updateState);
    return unsubscribe;
  }, [page, search, statusFilter]);

  return {
    contacts,
    loading,
    total,
    totalPages,
    isRefreshing,
    lastUpdated,
    refetch
  };
};