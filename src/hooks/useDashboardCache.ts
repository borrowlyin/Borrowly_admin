import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '@/lib/api';

interface DashboardData {
  totalApplicants: number;
  totalContactedCandidates: number;
  loans: Record<string, {
    totalApplicants: number;
    statusCounts: {
      pending: number;
      approved: number;
      rejected: number;
      cancelled: number;
    };
  }>;
}

interface UseDashboardCacheReturn {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  isRefreshing: boolean;
  refresh: () => void;
}

export const useDashboardCache = (): UseDashboardCacheReturn => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchDashboardData = async (isInitial = false) => {
    try {
      if (isInitial) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/api/dashboard-data`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      
      const newData = await response.json();
      setData(newData);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Dashboard data fetch error:', err);
    } finally {
      if (isInitial) {
        setLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchDashboardData(true);

    // Set up interval for background refresh every 60 seconds
    intervalRef.current = setInterval(() => {
      fetchDashboardData(false);
    }, 60000);

    // Cleanup interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const refresh = () => {
    fetchDashboardData(false);
  };

  return { data, loading, error, lastUpdated, isRefreshing, refresh };
};