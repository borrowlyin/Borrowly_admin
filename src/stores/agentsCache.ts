import { API_BASE_URL } from '@/lib/api';

interface Agent {
  id: string;
  full_name?: string;
  phone?: string;
  email?: string;
  professional_type?: string;
  state?: string;
  created_at?: string;
  approval?: boolean | null;
  [key: string]: any;
}

interface CacheData {
  agents: Agent[];
  totalItems: number;
  totalPages: number;
  page: number;
  timestamp: Date;
}

class AgentsCacheStore {
  private cache = new Map<string, CacheData>();
  private intervals = new Map<string, NodeJS.Timeout>();
  private subscribers = new Set<() => void>();

  getCacheKey(page: number, search: string, stateFilter: string, typeFilter: string, approvalFilter: string) {
    return `${page}-${search}-${stateFilter}-${typeFilter}-${approvalFilter}`;
  }

  subscribe(callback: () => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notify() {
    this.subscribers.forEach(callback => callback());
  }

  getCachedData(page: number, search: string, stateFilter: string, typeFilter: string, approvalFilter: string) {
    const key = this.getCacheKey(page, search, stateFilter, typeFilter, approvalFilter);
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp.getTime() < 60000) {
      return cached;
    }
    return null;
  }

  async fetchData(page: number, search: string, stateFilter: string, typeFilter: string, approvalFilter: string) {
    const key = this.getCacheKey(page, search, stateFilter, typeFilter, approvalFilter);
    
    try {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', '10');
      if (search) params.append('search', search);
      if (stateFilter !== 'all') params.append('state', stateFilter);
      if (typeFilter !== 'all') params.append('professional_type', typeFilter);

      if (approvalFilter === 'approved') {
        params.append('approval', 'true');
      } else if (approvalFilter === 'pending') {
        params.append('approval', 'false');
      }

      const url = `${API_BASE_URL}/api/agents/admin/agents/newlist?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      
      const data = await res.json();
      const items: Agent[] = Array.isArray(data.agents) ? data.agents : data.data ?? [];
      const meta = data.meta ?? {};

      const mapped = items.map((a) => ({ ...a, id: String(a.id) }));

      const cacheData: CacheData = {
        agents: mapped,
        totalItems: Number(meta.totalItems ?? items.length),
        totalPages: Math.max(1, Number(meta.totalPages ?? 1)),
        page: Math.max(1, Math.min(Number(meta.currentPage ?? page), Math.max(1, Number(meta.totalPages ?? 1)))),
        timestamp: new Date()
      };

      this.cache.set(key, cacheData);
      this.setupAutoRefresh(page, search, stateFilter, typeFilter, approvalFilter);
      this.notify();
      
      return cacheData;
    } catch (error) {
      console.error('Agents fetch error:', error);
      throw error;
    }
  }

  private setupAutoRefresh(page: number, search: string, stateFilter: string, typeFilter: string, approvalFilter: string) {
    const key = this.getCacheKey(page, search, stateFilter, typeFilter, approvalFilter);
    
    if (this.intervals.has(key)) return;
    
    const interval = setInterval(() => {
      this.fetchData(page, search, stateFilter, typeFilter, approvalFilter).catch(console.error);
    }, 60000);
    
    this.intervals.set(key, interval);
  }

  clearCache() {
    this.cache.clear();
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();
  }
}

export const agentsCache = new AgentsCacheStore();