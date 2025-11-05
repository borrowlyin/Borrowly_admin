import { API_BASE_URL } from '@/lib/api';

interface Bank {
  id: string;
  fullname?: string;
  email?: string;
  phonenumber?: string;
  designation?: string;
  bankname?: string;
  branchname?: string;
  ifsccode?: string;
  bankaddress?: string;
  profilephoto?: string;
  idprooftype?: string;
  created_at?: string;
  [key: string]: any;
}

interface CacheData {
  banks: Bank[];
  timestamp: Date;
}

class BankAggregatorsCacheStore {
  private cache = new Map<string, CacheData>();
  private intervals = new Map<string, NodeJS.Timeout>();
  private subscribers = new Set<() => void>();

  getCacheKey() {
    return 'banks-data';
  }

  subscribe(callback: () => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notify() {
    this.subscribers.forEach(callback => callback());
  }

  getCachedData() {
    const key = this.getCacheKey();
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp.getTime() < 60000) {
      return cached;
    }
    return null;
  }

  async fetchData() {
    const key = this.getCacheKey();
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/GetAllBanks`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      const data = await res.json();
      const banks = data.data || [];

      const cacheData: CacheData = {
        banks,
        timestamp: new Date()
      };

      this.cache.set(key, cacheData);
      this.setupAutoRefresh();
      this.notify();
      
      return cacheData;
    } catch (error) {
      console.error('Bank aggregators fetch error:', error);
      throw error;
    }
  }

  private setupAutoRefresh() {
    const key = this.getCacheKey();
    
    if (this.intervals.has(key)) return;
    
    const interval = setInterval(() => {
      this.fetchData().catch(console.error);
    }, 60000);
    
    this.intervals.set(key, interval);
  }

  clearCache() {
    this.cache.clear();
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();
  }
}

export const bankAggregatorsCache = new BankAggregatorsCacheStore();