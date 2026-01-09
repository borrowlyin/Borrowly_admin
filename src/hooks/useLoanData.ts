import { useState, useEffect } from 'react';
import { useLoanCache } from '@/contexts/LoanCacheContext';
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

interface UseLoanDataReturn {
  loans: LoanApplication[];
  loading: boolean;
  total: number;
  totalPages: number;
  page: number;
  isRefreshing: boolean;
  lastUpdated: Date | null;
  refetch: () => void;
}

export const useLoanData = (
  table: string,
  currentPage: number,
  search: string,
  statusFilter: string,
  limit: number = 10
): UseLoanDataReturn => {
  const { getCachedLoans, setCachedLoans, isRefreshing, lastUpdated } = useLoanCache();
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(currentPage);

  const fetchLoans = async (useCache = true) => {
    // Check cache first
    if (useCache) {
      const cached = getCachedLoans(table, currentPage, search, statusFilter);
      if (cached) {
        setLoans(cached.loans);
        setTotal(cached.total);
        setTotalPages(cached.totalPages);
        setPage(cached.page);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('table', table);
      params.append('page', String(currentPage));
      params.append('limit', String(limit));
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const res = await fetch(`${API_BASE_URL}/api/loans?${params.toString()}`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      const data = await res.json();
      let items: any[] = [];
      let totalCount = 0;
      let serverPage = currentPage;
      let serverTotalPages = 1;

      if (Array.isArray(data)) {
        items = data;
        totalCount = data.length;
      } else if (data && Array.isArray(data.data)) {
        items = data.data;
        totalCount = Number(data.total ?? items.length) || 0;
        serverPage = Number(data.page ?? currentPage) || currentPage;
        serverTotalPages = Number(data.totalPages ?? Math.max(1, Math.ceil(totalCount / limit)));
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

      const result = {
        loans: mapped,
        total: totalCount,
        totalPages: Math.max(1, serverTotalPages),
        page: Math.min(Math.max(1, serverPage), Math.max(1, serverTotalPages))
      };

      setLoans(result.loans);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      setPage(result.page);

      // Cache the result
      setCachedLoans(table, currentPage, search, statusFilter, result);
    } catch (error) {
      console.error('fetchLoans error:', error);
      setLoans([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => fetchLoans(false);

  useEffect(() => {
    fetchLoans();
  }, [table, currentPage, search, statusFilter]);

  return {
    loans,
    loading,
    total,
    totalPages,
    page,
    isRefreshing: isRefreshing(table),
    lastUpdated: lastUpdated(table),
    refetch
  };
};