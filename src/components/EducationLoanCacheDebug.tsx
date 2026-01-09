import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EducationLoanCacheManager, CacheStats } from '@/lib/educationLoanCacheUtils';
import { educationLoanCache } from '@/stores/educationLoanCache';
import { RefreshCw, Trash2, Download, Eye, EyeOff } from 'lucide-react';

export const EducationLoanCacheDebug: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  const updateStats = () => {
    setStats(EducationLoanCacheManager.getCacheStats());
  };

  useEffect(() => {
    if (isVisible) {
      updateStats();
      const interval = setInterval(updateStats, 2000);
      return () => clearInterval(interval);
    }
  }, [isVisible]);

  const handleClearCache = () => {
    educationLoanCache.clearCache();
    updateStats();
  };

  const handleRefreshStale = async () => {
    const count = await EducationLoanCacheManager.refreshStaleEntries();
    setRefreshCount(count);
    updateStats();
  };

  const handleExportCache = () => {
    const data = EducationLoanCacheManager.exportCacheData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `education-loan-cache-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePreload = () => {
    EducationLoanCacheManager.preloadCommonQueries();
    setTimeout(updateStats, 1000);
  };

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white hover:bg-blue-700"
      >
        <Eye className="w-4 h-4 mr-1" />
        Cache Debug
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80 max-h-96 overflow-y-auto">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm">Education Loan Cache Debug</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
          >
            <EyeOff className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {stats && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Entries:</span>
              <Badge variant="secondary">{stats.totalEntries}</Badge>
            </div>
            
            <div className="flex justify-between text-xs">
              <span>Memory:</span>
              <Badge variant="secondary">{stats.memoryUsage} KB</Badge>
            </div>
            
            {stats.newestEntry && (
              <div className="flex justify-between text-xs">
                <span>Last Update:</span>
                <span className="text-green-600">
                  {stats.newestEntry.toLocaleTimeString()}
                </span>
              </div>
            )}
            
            {refreshCount > 0 && (
              <div className="flex justify-between text-xs">
                <span>Last Refresh:</span>
                <Badge variant="outline">{refreshCount} entries</Badge>
              </div>
            )}
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={updateStats}
            className="text-xs"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Refresh
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearCache}
            className="text-xs"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Clear
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshStale}
            className="text-xs"
          >
            Refresh Stale
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreload}
            className="text-xs"
          >
            Preload
          </Button>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCache}
          className="w-full text-xs"
        >
          <Download className="w-3 h-3 mr-1" />
          Export Cache Data
        </Button>
      </CardContent>
    </Card>
  );
};