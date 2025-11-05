import { API_BASE_URL } from '@/lib/api';

interface CareerApplication {
  id: string;
  generatedUserId?: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  cvUrl?: string;
  assistance?: string;
  privacy?: boolean;
  jobRole?: string;
  team?: string;
  location?: string;
  status: string;
  createdAt?: string;
  [key: string]: any;
}

interface CacheData {
  applications: CareerApplication[];
  timestamp: Date;
}

class CareersCacheStore {
  private cache = new Map<string, CacheData>();
  private intervals = new Map<string, NodeJS.Timeout>();
  private subscribers = new Set<() => void>();

  getCacheKey() {
    return 'careers-data';
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
      const res = await fetch(`${API_BASE_URL}/api/careers`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      const response = await res.json();
      const raw = response?.data ?? response ?? [];
      
      const normalized = raw.map((app: any) => ({
        ...app,
        id: String(app.id ?? app.generatedUserId ?? app._id ?? app.uuid),
        firstName: app.firstName ?? app.first_name ?? app.first_name ?? '',
        lastName: app.lastName ?? app.last_name ?? '',
        status: (app.status ?? 'pending').toLowerCase(),
      }));

      const cacheData: CacheData = {
        applications: normalized,
        timestamp: new Date()
      };

      this.cache.set(key, cacheData);
      this.setupAutoRefresh();
      this.notify();
      
      return cacheData;
    } catch (error) {
      console.error('Careers fetch error:', error);
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

export const careersCache = new CareersCacheStore();