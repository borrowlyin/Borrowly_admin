import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/api';

interface ApiResponse {
  summary: {
    total_amount: number;
    total_applications: number;
  };
  breakdown: {
    loan_type: string;
    total_amount: string;
    total_applications: string;
  }[];
}

type TimePeriod = "today" | "3days" | "1week" | "10days" | "1month" | "1year";

export const useAnalyticsCache = (selectedPeriod: TimePeriod) => {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async (range: TimePeriod, isAutoRefresh = false) => {
    if (isAutoRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/api/payments/analysis?range=${range}`);
      setData(response.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const refetch = useCallback(() => {
    fetchData(selectedPeriod, true);
  }, [fetchData, selectedPeriod]);

  // Initial fetch and period change
  useEffect(() => {
    fetchData(selectedPeriod);
  }, [selectedPeriod, fetchData]);

  // Auto-refresh every 1 minute
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(selectedPeriod, true);
    }, 60000); // 1 minute

    return () => clearInterval(interval);
  }, [selectedPeriod, fetchData]);

  return {
    data,
    loading,
    isRefreshing,
    lastUpdated,
    refetch
  };
};