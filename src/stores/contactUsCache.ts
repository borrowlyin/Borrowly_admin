import { API_BASE_URL } from '@/lib/api';

interface ContactInquiry {
  id: number;
  name?: string;
  email_address?: string;
  phone_number?: string;
  subject?: string;
  has_active_loan?: boolean;
  message?: string;
  status?: string;
  created_at?: string;
  [key: string]: any;
}

interface CacheData {
  contacts: ContactInquiry[];
  total: number;
  totalPages: number;
  page: number;
  timestamp: Date;
}

class ContactUsCacheStore {
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
      params.append('page', String(page));
      params.append('limit', '10');
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const res = await fetch(`${API_BASE_URL}/api/contact-us?${params.toString()}`);
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
      } else if (data && Array.isArray(data.items)) {
        items = data.items;
        totalCount = Number(data.total ?? items.length) || 0;
        serverTotalPages = Number(data.totalPages ?? Math.max(1, Math.ceil(totalCount / 10)));
      } else if (data && Array.isArray(data.result)) {
        items = data.result;
        totalCount = Number(data.total ?? items.length) || 0;
        serverTotalPages = Number(data.totalPages ?? Math.max(1, Math.ceil(totalCount / 10)));
      }

      const mapped: ContactInquiry[] = items.map((c: any) => ({
        id: Number(c.id),
        name: c.name ?? c.fullname ?? `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim(),
        email_address: c.email_address ?? c.email ?? c.emailAddress ?? '',
        phone_number: c.phone_number ?? c.mobile ?? c.contact_number ?? '',
        subject: c.subject ?? c.topic ?? '',
        has_active_loan: Boolean(c.has_active_loan ?? c.hasLoan ?? c.taken_loan),
        message: c.message ?? c.body ?? '',
        status: c.status ?? 'pending',
        created_at: c.created_at ?? c.createdAt ?? '',
        ...c,
      }));

      const cacheData: CacheData = {
        contacts: mapped,
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
      console.error('Contact us fetch error:', error);
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

export const contactUsCache = new ContactUsCacheStore();