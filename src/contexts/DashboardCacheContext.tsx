import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
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

interface DashboardCacheContextType {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  isRefreshing: boolean;
  refresh: () => void;
}

const DashboardCacheContext = createContext<DashboardCacheContextType | undefined>(undefined);

export const DashboardCacheProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitialized = useRef(false);

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

  const refresh = () => {
    fetchDashboardData(false);
  };

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      fetchDashboardData(true);

      intervalRef.current = setInterval(() => {
        fetchDashboardData(false);
      }, 60000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <DashboardCacheContext.Provider value={{
      data,
      loading,
      error,
      lastUpdated,
      isRefreshing,
      refresh
    }}>
      {children}
    </DashboardCacheContext.Provider>
  );
};

export const useDashboardCache = (): DashboardCacheContextType => {
  const context = useContext(DashboardCacheContext);
  if (context === undefined) {
    throw new Error('useDashboardCache must be used within a DashboardCacheProvider');
  }
  return context;
};