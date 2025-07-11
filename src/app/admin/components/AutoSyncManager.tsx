"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Square, 
  RefreshCw, 
  Activity, 
  Camera, 
  Users, 
  Clock, 
  BarChart3,
  CheckCircle,
  AlertCircle,
  TrendingUp
} from "lucide-react";
import { toast } from "sonner";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

interface SyncStats {
  total_photos_processed: number;
  total_faces_detected: number;
  last_sync_time: string | null;
  active_folders: string[];
}

interface SyncStatus {
  sync_active: boolean;
  sync_interval_display: string;
  stats: SyncStats;
  performance: {
    memory_usage_mb: number;
    memory_usage_percent: number;
    face_model_loaded: boolean;
  };
  configuration: {
    max_concurrent_folders: number;
    batch_size: number;
    optimized_for: string;
  };
}

interface DashboardData {
  overview: {
    total_folders: number;
    total_photos: number;
    total_faces_detected: number;
    sync_active: boolean;
    system_ready: boolean;
  };
  folder_stats: Array<{
    id: string;
    name: string;
    photo_count: number;
    face_count: number;
    last_sync: string;
    encoding_exists: boolean;
  }>;
  performance: {
    memory_usage_mb: number;
    face_model: string;
  };
}

export default function AutoSyncManager() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Check if backend is available
  const isBackendAvailable = Boolean(BASE_URL);

  useEffect(() => {
    if (isBackendAvailable) {
      fetchSyncStatus();
      fetchDashboardData();
      
      // Auto-refresh every 30 seconds
      const interval = setInterval(() => {
        fetchSyncStatus();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [isBackendAvailable]);

  const fetchSyncStatus = async () => {
    if (!BASE_URL) return;
    
    try {
      const response = await fetch(`${BASE_URL}/api/auto-sync/status`);
      if (response.ok) {
        const data = await response.json();
        setSyncStatus(data);
      }
    } catch (error) {
      console.warn("Failed to fetch sync status:", error);
    }
  };

  const fetchDashboardData = async () => {
    if (!BASE_URL) return;
    
    try {
      const response = await fetch(`${BASE_URL}/api/auto-sync/dashboard`);
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.warn("Failed to fetch dashboard data:", error);
    }
  };

  const handleStartSync = async () => {
    if (!BASE_URL) {
      toast.error("Backend not available for auto-sync");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/auto-sync/start`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const _data = await response.json();
        toast.success("🚀 Professional auto-sync started!");
        fetchSyncStatus();
      } else {
        const _error = await response.json();
        toast.error(_error.message || "Failed to start auto-sync");
      }
    } catch (_error) {
      toast.error("Failed to start auto-sync");
    } finally {
      setLoading(false);
    }
  };

  const handleStopSync = async () => {
    if (!BASE_URL) return;

    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/auto-sync/stop`, {
        method: 'POST',
      });
      
      if (response.ok) {
        toast.success("Auto-sync stopped");
        fetchSyncStatus();
      } else {
        toast.error("Failed to stop auto-sync");
      }
    } catch (_error) {
      toast.error("Failed to stop auto-sync");
    } finally {
      setLoading(false);
    }
  };

  const handleManualSync = async () => {
    if (!BASE_URL) return;

    setRefreshing(true);
    try {
      const response = await fetch(`${BASE_URL}/api/auto-sync/manual-trigger`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const _data = await response.json();
        toast.success("Manual sync triggered!");
        setTimeout(() => {
          fetchSyncStatus();
          fetchDashboardData();
        }, 2000);
      } else {
        const _error = await response.json();
        toast.error(_error.message || "Failed to trigger manual sync");
      }
    } catch (_error) {
      toast.error("Failed to trigger manual sync");
    } finally {
      setRefreshing(false);
    }
  };

  if (!isBackendAvailable) {
    return (
      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-700">
            <AlertCircle className="h-5 w-5" />
            Auto-Sync Unavailable
          </CardTitle>
          <CardDescription className="text-amber-600">
            Backend service is not configured. Auto-sync features require the backend API.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Professional Control Panel */}
      <Card className="border-primary/20 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Professional Auto-Sync Control
          </CardTitle>
          <CardDescription>
            Automated photo detection and face processing for high-volume photography workflow
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Indicators */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge 
                variant={syncStatus?.sync_active ? "default" : "secondary"}
                className="flex items-center gap-1"
              >
                {syncStatus?.sync_active ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Active
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-gray-400 rounded-full" />
                    Inactive
                  </>
                )}
              </Badge>
              
              {syncStatus && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Every {syncStatus.sync_interval_display}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleManualSync}
                variant="outline"
                size="sm"
                disabled={loading || refreshing || !syncStatus?.sync_active}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Manual Sync
              </Button>

              {syncStatus?.sync_active ? (
                <Button
                  onClick={handleStopSync}
                  variant="destructive"
                  size="sm"
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <Square className="h-4 w-4" />
                  Stop Auto-Sync
                </Button>
              ) : (
                <Button
                  onClick={handleStartSync}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  Start Auto-Sync
                </Button>
              )}
            </div>
          </div>

          {/* Statistics */}
          {syncStatus && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/60">
                <Camera className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {syncStatus.stats.total_photos_processed.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Photos Processed</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/60">
                <Users className="h-8 w-8 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {syncStatus.stats.total_faces_detected.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Faces Detected</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/60">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {syncStatus.stats.active_folders.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Active Folders</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dashboard Overview */}
      {dashboardData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Photography Dashboard
            </CardTitle>
            <CardDescription>
              Overview of your photography collection and processing status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold text-primary">
                  {dashboardData.overview.total_folders}
                </div>
                <div className="text-sm text-muted-foreground">Photo Collections</div>
              </div>
              
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold text-blue-600">
                  {dashboardData.overview.total_photos.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Total Photos</div>
              </div>
              
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold text-green-600">
                  {dashboardData.overview.total_faces_detected.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Faces Indexed</div>
              </div>
              
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-center gap-1">
                  {dashboardData.overview.system_ready ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                  )}
                  <span className="text-sm font-medium">
                    {dashboardData.overview.system_ready ? "Ready" : "Loading"}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">System Status</div>
              </div>
            </div>

            {/* Performance Info */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Face Model: {dashboardData.performance.face_model}</span>
              <span>Memory: {dashboardData.performance.memory_usage_mb}MB</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
