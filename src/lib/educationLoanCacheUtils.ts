import { educationLoanCache } from '@/stores/educationLoanCache';

export interface CacheStats {
  totalEntries: number;
  oldestEntry: Date | null;
  newestEntry: Date | null;
  memoryUsage: number; // approximate in KB
}

export class EducationLoanCacheManager {
  static getCacheStats(): CacheStats {
    const cache = (educationLoanCache as any).cache;
    const entries = Array.from(cache.values());
    
    return {
      totalEntries: entries.length,
      oldestEntry: entries.length > 0 ? new Date(Math.min(...entries.map(e => e.timestamp.getTime()))) : null,
      newestEntry: entries.length > 0 ? new Date(Math.max(...entries.map(e => e.timestamp.getTime()))) : null,
      memoryUsage: Math.round(JSON.stringify(entries).length / 1024), // rough estimate
    };
  }

  static clearExpiredEntries(maxAge: number = 300000) { // 5 minutes default
    const cache = (educationLoanCache as any).cache;
    const now = Date.now();
    
    for (const [key, value] of cache.entries()) {
      if (now - value.timestamp.getTime() > maxAge) {
        cache.delete(key);
      }
    }
  }

  static preloadCommonQueries() {
    // Preload common search patterns
    const commonQueries = [
      { page: 1, search: '', statusFilter: 'all' },
      { page: 1, search: '', statusFilter: 'pending' },
      { page: 1, search: '', statusFilter: 'approved' },
    ];

    commonQueries.forEach(({ page, search, statusFilter }) => {
      educationLoanCache.fetchData(page, search, statusFilter).catch(console.error);
    });
  }

  static exportCacheData() {
    const cache = (educationLoanCache as any).cache;
    const data = Array.from(cache.entries()).map(([key, value]) => ({
      key,
      timestamp: value.timestamp,
      totalLoans: value.loans.length,
      totalPages: value.totalPages,
    }));
    
    return {
      exportTime: new Date(),
      entries: data,
      stats: this.getCacheStats(),
    };
  }

  static async refreshStaleEntries(staleThreshold: number = 60000) { // 1 minute
    const cache = (educationLoanCache as any).cache;
    const now = Date.now();
    const refreshPromises: Promise<any>[] = [];

    for (const [key, value] of cache.entries()) {
      if (now - value.timestamp.getTime() > staleThreshold) {
        const [page, search, statusFilter] = key.split('-');
        refreshPromises.push(
          educationLoanCache.fetchData(
            parseInt(page), 
            search === 'undefined' ? '' : search, 
            statusFilter === 'undefined' ? 'all' : statusFilter
          )
        );
      }
    }

    if (refreshPromises.length > 0) {
      await Promise.allSettled(refreshPromises);
      return refreshPromises.length;
    }
    return 0;
  }
}

// Auto-cleanup expired entries every 5 minutes
setInterval(() => {
  EducationLoanCacheManager.clearExpiredEntries();
}, 300000);