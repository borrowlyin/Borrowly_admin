import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { API_BASE_URL } from '@/lib/api';

interface LoanApplication {
  id: string;
  fullname?: string;
  email?: string;
  mobile?: string;
  businessdesiredloanamount?: string;
  status?: string;
  reason?: string;
  created_at?: string;
  [key: string]: any;
}

interface LoanCacheData {
  loans: LoanApplication[];
  total: number;
  totalPages: number;
  page: number;
}

interface LoanCacheContextType {
  getCachedLoans: (table: string, page: number, search: string, statusFilter: string) => LoanCacheData | null;
  setCachedLoans: (table: string, page: number, search: string, statusFilter: string, data: LoanCacheData) => void;
  isRefreshing: (table: string) => boolean;
  lastUpdated: (table: string) => Date | null;
}

const LoanCacheContext = createContext<LoanCacheContextType | undefined>(undefined);

export const LoanCacheProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cache, setCache] = useState<Map<string, { data: LoanCacheData; timestamp: Date }>>(new Map());
  const [refreshing, setRefreshing] = useState<Set<string>>(new Set());
  const intervalRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const getCacheKey = (table: string, page: number, search: string, statusFilter: string) => 
    `${table}-${page}-${search}-${statusFilter}`;

  const getCachedLoans = (table: string, page: number, search: string, statusFilter: string) => {
    const key = getCacheKey(table, page, search, statusFilter);
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp.getTime() < 60000) { // 1 minute cache
      return cached.data;
    }
    return null;
  };

  const setCachedLoans = (table: string, page: number, search: string, statusFilter: string, data: LoanCacheData) => {
    const key = getCacheKey(table, page, search, statusFilter);
    setCache(prev => new Map(prev.set(key, { data, timestamp: new Date() })));
    
    // Set up auto-refresh for this cache entry
    if (!intervalRefs.current.has(key)) {
      const interval = setInterval(() => {
        refreshLoanData(table, page, search, statusFilter);
      }, 60000);
      intervalRefs.current.set(key, interval);
    }
  };

  const refreshLoanData = async (table: string, page: number, search: string, statusFilter: string) => {
    const key = getCacheKey(table, page, search, statusFilter);
    setRefreshing(prev => new Set(prev.add(table)));

    try {
      const params = new URLSearchParams();
      params.append('table', table);
      params.append('page', String(page));
      params.append('limit', '10');
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const res = await fetch(`${API_BASE_URL}/api/loans?${params.toString()}`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      const data = await res.json();
      let items: any[] = [];
      let totalCount = 0;
      let serverPage = page;
      let serverTotalPages = 1;

      if (Array.isArray(data)) {
        items = data;
        totalCount = data.length;
      } else if (data && Array.isArray(data.data)) {
        items = data.data;
        totalCount = Number(data.total ?? items.length) || 0;
        serverPage = Number(data.page ?? page) || page;
        serverTotalPages = Number(data.totalPages ?? Math.max(1, Math.ceil(totalCount / 10)));
      }

      const mapped = items.map((loan: any) => ({
        id: String(loan.id),
        fullname: loan.fullname ?? loan.full_name ?? `${loan.first_name ?? ''} ${loan.last_name ?? ''}`.trim(),
        email: loan.email ?? loan.email_address ?? '',
        mobile: loan.mobile ?? loan.contact_number ?? '',
        businessdesiredloanamount: loan.businessdesiredloanamount ?? loan.amount ?? 'N/A',
        status: loan.status ?? 'pending',
        reason: loan.reason ?? loan.status_reason ?? '',
        created_at: loan.created_at ?? loan.createdAt ?? '',
        ...loan,
      }));

      const newData: LoanCacheData = {
        loans: mapped,
        total: totalCount,
        totalPages: Math.max(1, serverTotalPages),
        page: Math.min(Math.max(1, serverPage), Math.max(1, serverTotalPages))
      };

      setCache(prev => new Map(prev.set(key, { data: newData, timestamp: new Date() })));
    } catch (error) {
      console.error('Background refresh error:', error);
    } finally {
      setRefreshing(prev => {
        const newSet = new Set(prev);
        newSet.delete(table);
        return newSet;
      });
    }
  };

  const isRefreshing = (table: string) => refreshing.has(table);

  const lastUpdated = (table: string) => {
    for (const [key, value] of cache.entries()) {
      if (key.startsWith(table)) {
        return value.timestamp;
      }
    }
    return null;
  };

  useEffect(() => {
    return () => {
      // Cleanup intervals
      intervalRefs.current.forEach(interval => clearInterval(interval));
      intervalRefs.current.clear();
    };
  }, []);

  return (
    <LoanCacheContext.Provider value={{
      getCachedLoans,
      setCachedLoans,
      isRefreshing,
      lastUpdated
    }}>
      {children}
    </LoanCacheContext.Provider>
  );
};

export const useLoanCache = (): LoanCacheContextType => {
  const context = useContext(LoanCacheContext);
  if (context === undefined) {
    throw new Error('useLoanCache must be used within a LoanCacheProvider');
  }
  return context;
};