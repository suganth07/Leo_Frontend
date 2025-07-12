/**
 * Performance Monitor Component for Leo Photography Platform
 * Real-time monitoring of system performance and user experience
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PhotographyAPI from '@/lib/optimized-api-client';

interface PerformanceMetrics {
  memory: {
    rss_mb: number;
    vms_mb: number;
    percent: number;
  };
  cpu: {
    percent: number;
    num_threads: number;
  };
  cache: {
    hit_rate: number;
    total_requests: number;
    memory_items: number;
  };
  face_model: {
    loaded: boolean;
    type: string;
  };
  timestamp: string;
}

interface ClientMetrics {
  pageLoadTime: number;
  apiResponseTime: number;
  cacheHitRate: number;
  errorRate: number;
}

export default function PerformanceMonitor() {
  const [serverMetrics, setServerMetrics] = useState<PerformanceMetrics | null>(null);
  const [clientMetrics, setClientMetrics] = useState<ClientMetrics>({
    pageLoadTime: 0,
    apiResponseTime: 0,
    cacheHitRate: 0,
    errorRate: 0,
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch server performance metrics
  const fetchServerMetrics = useCallback(async () => {
    try {
      setIsLoading(true);
      const startTime = performance.now();
      const response = await PhotographyAPI.getSystemPerformance();
      const responseTime = performance.now() - startTime;
      
      setServerMetrics(response.data);
      setClientMetrics(prev => ({
        ...prev,
        apiResponseTime: responseTime,
      }));
    } catch (error) {
      console.error('Failed to fetch server metrics:', error);
      setClientMetrics(prev => ({
        ...prev,
        errorRate: prev.errorRate + 1,
      }));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Measure client-side performance
  useEffect(() => {
    // Measure page load time
    if (typeof window !== 'undefined') {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        const pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
        setClientMetrics(prev => ({
          ...prev,
          pageLoadTime: pageLoadTime,
        }));
      }
    }
  }, []);

  // Auto-refresh metrics
  useEffect(() => {
    if (isExpanded) {
      fetchServerMetrics();
      const interval = setInterval(fetchServerMetrics, 5000); // Every 5 seconds
      return () => clearInterval(interval);
    }
  }, [isExpanded, fetchServerMetrics]);

  // Calculate cache hit rate
  const getCacheStats = async () => {
    try {
      const response = await PhotographyAPI.getCacheStats();
      if (response.data?.cache_stats) {
        setClientMetrics(prev => ({
          ...prev,
          cacheHitRate: response.data.cache_stats.hit_rate || 0,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch cache stats:', error);
    }
  };

  // Clear cache
  const clearCache = async () => {
    try {
      await PhotographyAPI.clearCache();
      await getCacheStats();
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  };

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'bg-green-500';
    if (value <= thresholds.warning) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatBytes = (bytes: number) => {
    return `${bytes.toFixed(1)} MB`;
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsExpanded(true)}
          variant="outline"
          size="sm"
          className="bg-white shadow-lg hover:shadow-xl"
        >
          📊 Performance
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      <Card className="p-4 bg-white shadow-2xl border-2">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-lg">Performance Monitor</h3>
          <div className="flex gap-2">
            <Button
              onClick={getCacheStats}
              variant="outline"
              size="sm"
            >
              🔄
            </Button>
            <Button
              onClick={() => setIsExpanded(false)}
              variant="outline"
              size="sm"
            >
              ✕
            </Button>
          </div>
        </div>

        {/* Client-side metrics */}
        <div className="mb-4">
          <h4 className="font-medium mb-2 text-blue-600">Client Performance</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span>Page Load:</span>
              <Badge variant="outline">
                {formatTime(clientMetrics.pageLoadTime)}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>API Response:</span>
              <Badge 
                variant="outline"
                className={getStatusColor(clientMetrics.apiResponseTime, { good: 500, warning: 1000 })}
              >
                {formatTime(clientMetrics.apiResponseTime)}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Cache Hit Rate:</span>
              <Badge variant="outline">
                {clientMetrics.cacheHitRate.toFixed(1)}%
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Errors:</span>
              <Badge 
                variant="outline"
                className={clientMetrics.errorRate > 0 ? 'bg-red-100' : 'bg-green-100'}
              >
                {clientMetrics.errorRate}
              </Badge>
            </div>
          </div>
        </div>

        {/* Server-side metrics */}
        {serverMetrics && (
          <div className="mb-4">
            <h4 className="font-medium mb-2 text-green-600">Server Performance</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span>Memory:</span>
                <Badge 
                  variant="outline"
                  className={getStatusColor(serverMetrics.memory.percent, { good: 70, warning: 85 })}
                >
                  {formatBytes(serverMetrics.memory.rss_mb)}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>CPU:</span>
                <Badge 
                  variant="outline"
                  className={getStatusColor(serverMetrics.cpu.percent, { good: 50, warning: 80 })}
                >
                  {serverMetrics.cpu.percent.toFixed(1)}%
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Cache Items:</span>
                <Badge variant="outline">
                  {serverMetrics.cache.memory_items}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Face Model:</span>
                <Badge 
                  variant="outline"
                  className={serverMetrics.face_model.loaded ? 'bg-green-100' : 'bg-red-100'}
                >
                  {serverMetrics.face_model.loaded ? '✓' : '✗'}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            onClick={clearCache}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            Clear Cache
          </Button>
          <Button
            onClick={fetchServerMetrics}
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? '⏳' : 'Refresh'}
          </Button>
        </div>

        {/* Status indicator */}
        <div className="mt-3 text-xs text-gray-500 text-center">
          Last updated: {serverMetrics ? new Date(serverMetrics.timestamp).toLocaleTimeString() : 'Never'}
        </div>
      </Card>
    </div>
  );
}
