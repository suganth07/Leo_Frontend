/**
 * Optimized API Utilities
 * Reduces backend calls through intelligent caching and batching
 */

import { DataProcessor } from './data-processor';
import { ImageUtils } from './image-utils';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

export interface MatchStreamData {
  progress: number;
  matches_found: number;
  images?: any[];
  total_matches?: number;
  faces_in_query?: number;
  search_completed?: boolean;
}

/**
 * Optimized API client with caching and reduced backend calls
 */
export class OptimizedApiClient {
  private baseUrl: string;
  private static instance: OptimizedApiClient;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  static getInstance(baseUrl?: string): OptimizedApiClient {
    if (!OptimizedApiClient.instance || (baseUrl && OptimizedApiClient.instance.baseUrl !== baseUrl)) {
      OptimizedApiClient.instance = new OptimizedApiClient(baseUrl || '');
    }
    return OptimizedApiClient.instance;
  }

  /**
   * Get folders with intelligent caching
   */
  async getFolders(forceRefresh: boolean = false): Promise<ApiResponse<any[]>> {
    const cacheKey = 'folders_list';
    
    if (!forceRefresh) {
      const cached = DataProcessor.getCachedData(cacheKey);
      if (cached) {
        return { data: cached, success: true };
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/folders`);
      const result = await response.json();
      
      if (response.ok) {
        // Cache for 30 minutes
        DataProcessor.cacheData(cacheKey, result.folders);
        return { data: result.folders, success: true };
      } else {
        return { error: result.error || 'Failed to fetch folders', success: false };
      }
    } catch (error) {
      return { error: 'Network error while fetching folders', success: false };
    }
  }

  /**
   * Get images with caching and client-side processing
   */
  async getImages(folderId: string, forceRefresh: boolean = false): Promise<ApiResponse<any[]>> {
    const cacheKey = `images_${folderId}`;
    
    if (!forceRefresh) {
      const cached = DataProcessor.getCachedData(cacheKey);
      if (cached) {
        return { data: cached, success: true };
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/images?folder_id=${folderId}`);
      const result = await response.json();
      
      if (response.ok) {
        // Cache for 15 minutes (images change less frequently)
        DataProcessor.cacheData(cacheKey, result.images);
        return { data: result.images, success: true };
      } else {
        return { error: result.error || 'Failed to fetch images', success: false };
      }
    } catch (error) {
      return { error: 'Network error while fetching images', success: false };
    }
  }

  /**
   * Optimized face matching with client-side preprocessing
   */
  async matchFaces(
    file: File, 
    folderId: string,
    onProgress?: (data: MatchStreamData) => void
  ): Promise<ApiResponse<any>> {
    try {
      // Validate inputs
      console.log('OptimizedApiClient - matchFaces called with baseUrl:', this.baseUrl);
      
      if (!this.baseUrl) {
        console.error('OptimizedApiClient - No base URL configured');
        return { error: 'API base URL not configured', success: false };
      }

      if (!file || !folderId) {
        return { error: 'File and folder ID are required', success: false };
      }

      // Client-side preprocessing to reduce backend load
      const validation = ImageUtils.validateImage(file);
      if (!validation.isValid) {
        return { error: validation.error, success: false };
      }

      // Resize image on client-side for faster upload and processing
      const optimizedFile = await ImageUtils.resizeImage(file, {
        maxWidth: 640,
        maxHeight: 640,
        quality: 0.85
      });

      const formData = new FormData();
      formData.append('file', optimizedFile);
      formData.append('folder_id', folderId);

      const apiUrl = `${this.baseUrl}/api/match`;
      console.log('Making request to:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        // Handle different types of errors
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await response.json();
            return { error: errorData.error || errorData.detail || 'Match request failed', success: false };
          } catch (parseError) {
            return { error: `HTTP ${response.status}: ${response.statusText}`, success: false };
          }
        } else {
          // Non-JSON response (likely HTML error page)
          return { error: `Service unavailable (HTTP ${response.status})`, success: false };
        }
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        return { error: 'No response stream available', success: false };
      }

      let finalResult: any = null;
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (onProgress) {
                  onProgress(data);
                }

                if (data.search_completed) {
                  finalResult = data;
                }
              } catch (parseError) {
                console.warn('Failed to parse streaming data:', parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      return { data: finalResult, success: true };

    } catch (error) {
      console.error('Match faces error:', error);
      
      // Better error messages based on error type
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return { error: 'Network error - please check your connection', success: false };
      } else if (error instanceof Error) {
        return { error: error.message, success: false };
      } else {
        return { error: 'Failed to match faces', success: false };
      }
    }
  }

  /**
   * Check encoding status with caching
   */
  async hasEncoding(folderId: string): Promise<ApiResponse<boolean>> {
    const cacheKey = `encoding_status_${folderId}`;
    const cached = DataProcessor.getCachedData(cacheKey);
    
    if (cached !== null) {
      return { data: cached, success: true };
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/has-encoding?folder_id=${folderId}`);
      const result = await response.json();
      
      if (response.ok) {
        // Cache encoding status for 10 minutes
        DataProcessor.cacheData(cacheKey, result.exists);
        return { data: result.exists, success: true };
      } else {
        return { error: result.error || 'Failed to check encoding', success: false };
      }
    } catch (error) {
      return { error: 'Network error while checking encoding', success: false };
    }
  }

  /**
   * Create encoding with progress tracking
   */
  async createEncoding(
    folderId: string, 
    force: boolean = false,
    onProgress?: (progress: number, status: string) => void
  ): Promise<ApiResponse<any>> {
    try {
      if (onProgress) {
        onProgress(0, 'Starting encoding process...');
      }

      const response = await fetch(`${this.baseUrl}/api/create_encoding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          folder_id: folderId,
          force: force
        })
      });

      const result = await response.json();

      if (response.ok) {
        // Clear related caches
        this.clearFolderRelatedCache(folderId);
        
        if (onProgress) {
          onProgress(100, 'Encoding completed successfully!');
        }
        
        return { data: result, success: true };
      } else {
        return { error: result.error || 'Failed to create encoding', success: false };
      }
    } catch (error) {
      return { error: 'Network error while creating encoding', success: false };
    }
  }

  /**
   * Get auto-sync status with caching
   */
  async getAutoSyncStatus(): Promise<ApiResponse<any>> {
    const cacheKey = 'auto_sync_status';
    
    // Use shorter cache for real-time status (5 seconds)
    const cached = DataProcessor.getCachedData(cacheKey);
    if (cached) {
      return { data: cached, success: true };
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/auto-sync/status`);
      const result = await response.json();
      
      if (response.ok) {
        // Short cache for frequently changing data
        localStorage.setItem('leo_frontend_auto_sync_status', JSON.stringify({
          data: result,
          timestamp: Date.now(),
          expiry: Date.now() + 5000 // 5 seconds
        }));
        
        return { data: result, success: true };
      } else {
        return { error: result.error || 'Failed to get sync status', success: false };
      }
    } catch (error) {
      return { error: 'Network error while getting sync status', success: false };
    }
  }

  /**
   * Start auto-sync
   */
  async startAutoSync(): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auto-sync/start`, {
        method: 'POST'
      });
      
      const result = await response.json();
      
      if (response.ok) {
        // Clear sync status cache to get fresh data
        localStorage.removeItem('leo_frontend_auto_sync_status');
        return { data: result, success: true };
      } else {
        return { error: result.error || 'Failed to start auto-sync', success: false };
      }
    } catch (error) {
      return { error: 'Network error while starting auto-sync', success: false };
    }
  }

  /**
   * Stop auto-sync
   */
  async stopAutoSync(): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auto-sync/stop`, {
        method: 'POST'
      });
      
      const result = await response.json();
      
      if (response.ok) {
        // Clear sync status cache
        localStorage.removeItem('leo_frontend_auto_sync_status');
        return { data: result, success: true };
      } else {
        return { error: result.error || 'Failed to stop auto-sync', success: false };
      }
    } catch (error) {
      return { error: 'Network error while stopping auto-sync', success: false };
    }
  }

  /**
   * Clear cache for specific folder
   */
  private clearFolderRelatedCache(folderId: string): void {
    const keysToRemove = [
      `images_${folderId}`,
      `encoding_status_${folderId}`,
      'folders_list'
    ];

    keysToRemove.forEach(key => {
      localStorage.removeItem(`leo_frontend_${key}`);
    });
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    DataProcessor.clearExpiredCache();
    
    // Clear all leo_frontend cache entries
    const keys = Object.keys(localStorage).filter(key => 
      key.startsWith('leo_frontend_')
    );
    
    keys.forEach(key => localStorage.removeItem(key));
  }
}

/**
 * Global API client instance
 */
export const apiClient = OptimizedApiClient.getInstance();
