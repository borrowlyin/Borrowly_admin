import React, { createContext, useContext, useEffect, useState } from 'react';
import { educationLoanCache } from '@/stores/educationLoanCache';

interface EducationLoanCacheContextType {
  clearCache: () => void;
  refreshAll: () => void;
  isGlobalRefreshing: boolean;
  totalCachedItems: number;
}

const EducationLoanCacheContext = createContext<EducationLoanCacheContextType | undefined>(undefined);

export const useEducationLoanCacheContext = () => {
  const context = useContext(EducationLoanCacheContext);
  if (!context) {
    throw new Error('useEducationLoanCacheContext must be used within EducationLoanCacheProvider');
  }
  return context;
};

export const EducationLoanCacheProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isGlobalRefreshing, setIsGlobalRefreshing] = useState(false);
  const [totalCachedItems, setTotalCachedItems] = useState(0);

  const clearCache = () => {
    educationLoanCache.clearCache();
    setTotalCachedItems(0);
  };

  const refreshAll = async () => {
    setIsGlobalRefreshing(true);
    try {
      // This would refresh all cached pages - implementation depends on your needs
      educationLoanCache.clearCache();
    } finally {
      setIsGlobalRefreshing(false);
    }
  };

  useEffect(() => {
    const unsubscribe = educationLoanCache.subscribe(() => {
      // Update total cached items count when cache changes
      // This is a simplified implementation
      setTotalCachedItems(prev => prev + 1);
    });

    return unsubscribe;
  }, []);

  const value: EducationLoanCacheContextType = {
    clearCache,
    refreshAll,
    isGlobalRefreshing,
    totalCachedItems,
  };

  return (
    <EducationLoanCacheContext.Provider value={value}>
      {children}
    </EducationLoanCacheContext.Provider>
  );
};