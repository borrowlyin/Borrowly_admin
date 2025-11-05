import { API_BASE_URL } from '@/lib/api';

interface PersonalLoan {
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

interface CacheData {
  loans: PersonalLoan[];
  total: number;
  totalPages: number;
  page: number;
  timestamp: Date;
}

class PersonalLoanCacheStore {
  private cache = new Map<string, CacheData>();
  private intervals = new Map<string, NodeJS.Timeout>();
  private subscribers = new Set<() => void>();

  getCacheKey(page: number, search: string, statusFilter: string) {
    return `${page}-${search}-${statusFilter}`;
  }

  subscribe(callback: () => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notify() {
    this.subscribers.forEach(callback => callback());
  }

  getCachedData(page: number, search: string, statusFilter: string) {
    const key = this.getCacheKey(page, search, statusFilter);
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp.getTime() < 60000) {
      return cached;
    }
    return null;
  }

  async fetchData(page: number, search: string, statusFilter: string) {
    const key = this.getCacheKey(page, search, statusFilter);
    
    try {
      const params = new URLSearchParams();
      params.append('table', 'personal_loans');
      params.append('page', String(page));
      params.append('limit', '10');
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const res = await fetch(`${API_BASE_URL}/api/loans?${params.toString()}`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      const data = await res.json();
      let items: any[] = [];
      let totalCount = 0;
      let serverTotalPages = 1;

      if (Array.isArray(data)) {
        items = data;
        totalCount = data.length;
      } else if (data && Array.isArray(data.data)) {
        items = data.data;
        totalCount = Number(data.total ?? items.length) || 0;
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

      const cacheData: CacheData = {
        loans: mapped,
        total: totalCount,
        totalPages: Math.max(1, serverTotalPages),
        page,
        timestamp: new Date()
      };

      this.cache.set(key, cacheData);
      this.setupAutoRefresh(page, search, statusFilter);
      this.notify();
      
      return cacheData;
    } catch (error) {
      console.error('Personal loan fetch error:', error);
      throw error;
    }
  }

  private setupAutoRefresh(page: number, search: string, statusFilter: string) {
    const key = this.getCacheKey(page, search, statusFilter);
    
    if (this.intervals.has(key)) return;
    
    const interval = setInterval(() => {
      this.fetchData(page, search, statusFilter).catch(console.error);
    }, 60000);
    
    this.intervals.set(key, interval);
  }

  clearCache() {
    this.cache.clear();
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();
  }
}

export const personalLoanCache = new PersonalLoanCacheStore();