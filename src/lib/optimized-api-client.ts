/**
 * Optimized API Client for Leo Photography Platform
 * Features: Caching, Error Handling, Security, Performance Optimization
 */

import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

// Types
interface CacheEntry {
  data: any;
  timestamp: number;
  expiry: number;
}

interface ApiResponse<T = any> {
  data: T;
  cached?: boolean;
  timestamp?: string;
}

interface SecurityConfig {
  apiKey?: string;
  encryptIds?: boolean;
}

class OptimizedApiClient {
  private client: AxiosInstance;
  private cache: Map<string, CacheEntry> = new Map();
  private requestQueue: Map<string, Promise<any>> = new Map();
  private securityConfig: SecurityConfig = {};

  constructor(baseURL?: string) {
    this.client = axios.create({
      baseURL: baseURL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080',
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Request interceptor for security and optimization
    this.client.interceptors.request.use(
      (config) => {
        // Add API key if available
        if (this.securityConfig.apiKey) {
          config.headers.Authorization = `Bearer ${this.securityConfig.apiKey}`;
        }

        // Add request ID for tracking
        config.headers['X-Request-ID'] = this.generateRequestId();
        
        // Enable compression
        config.headers['Accept-Encoding'] = 'gzip, deflate, br';

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for caching and error handling
    this.client.interceptors.response.use(
      (response) => {
        // Log performance metrics
        this.logPerformance(response);
        return response;
      },
      (error: AxiosError) => {
        this.handleError(error);
        return Promise.reject(error);
      }
    );
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCacheKey(url: string, params?: any): string {
    const keyData = `${url}_${JSON.stringify(params || {})}`;
    return btoa(keyData).replace(/[^a-zA-Z0-9]/g, '');
  }

  private logPerformance(response: AxiosResponse): void {
    const requestTime = (response.config as any).metadata?.startTime;
    if (requestTime) {
      const duration = Date.now() - requestTime;
      console.log(`API Request: ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`);
    }
  }

  private handleError(error: AxiosError): void {
    if (error.response) {
      console.error(`API Error: ${error.response.status} - ${error.response.statusText}`);
    } else if (error.request) {
      console.error('Network Error: No response received');
    } else {
      console.error('Request Error:', error.message);
    }
  }

  private isValidCacheEntry(entry: CacheEntry): boolean {
    return Date.now() < entry.expiry;
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now >= entry.expiry) {
        this.cache.delete(key);
      }
    }
  }

  // Cache management
  public clearCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  public getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      totalSize: JSON.stringify(Array.from(this.cache.values())).length,
    };
  }

  // Security configuration
  public setSecurityConfig(config: SecurityConfig): void {
    this.securityConfig = { ...this.securityConfig, ...config };
  }

  // Generic GET request with caching
  public async get<T = any>(
    url: string, 
    params?: any, 
    options: { 
      cache?: boolean; 
      cacheTTL?: number; 
      forceRefresh?: boolean;
    } = {}
  ): Promise<ApiResponse<T>> {
    const { cache = true, cacheTTL = 300000, forceRefresh = false } = options; // 5 minutes default
    const cacheKey = this.generateCacheKey(url, params);

    // Check cache first
    if (cache && !forceRefresh) {
      const cachedEntry = this.cache.get(cacheKey);
      if (cachedEntry && this.isValidCacheEntry(cachedEntry)) {
        console.log(`Cache hit: ${url}`);
        return {
          data: cachedEntry.data,
          cached: true,
          timestamp: new Date(cachedEntry.timestamp).toISOString(),
        };
      }
    }

    // Check if request is already in flight
    if (this.requestQueue.has(cacheKey)) {
      console.log(`Request deduplication: ${url}`);
      return this.requestQueue.get(cacheKey);
    }

    // Make the request
    const requestPromise = this.makeRequest<T>(url, params, cache, cacheTTL, cacheKey);
    this.requestQueue.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      this.requestQueue.delete(cacheKey);
    }
  }

  private async makeRequest<T>(
    url: string, 
    params: any, 
    cache: boolean, 
    cacheTTL: number, 
    cacheKey: string
  ): Promise<ApiResponse<T>> {
    // Add metadata for performance tracking
    const config: any = {
      params,
      metadata: { startTime: Date.now() }
    };

    const response = await this.client.get<T>(url, config);

    // Cache successful responses
    if (cache && response.status === 200) {
      const cacheEntry: CacheEntry = {
        data: response.data,
        timestamp: Date.now(),
        expiry: Date.now() + cacheTTL,
      };
      this.cache.set(cacheKey, cacheEntry);
      
      // Clean up old cache entries periodically
      if (this.cache.size > 100) {
        this.cleanupCache();
      }
    }

    return {
      data: response.data,
      cached: false,
    };
  }

  // POST request for form data
  public async postFormData<T = any>(url: string, formData: FormData): Promise<ApiResponse<T>> {
    const config: any = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      metadata: { startTime: Date.now() }
    };

    const response = await this.client.post<T>(url, formData, config);
    return { data: response.data };
  }

  // POST request for JSON data
  public async post<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    const config: any = {
      metadata: { startTime: Date.now() }
    };

    const response = await this.client.post<T>(url, data, config);
    return { data: response.data };
  }

  // Streaming request for large data
  public async getStream(url: string, onProgress?: (progress: any) => void): Promise<ReadableStream> {
    const response = await fetch(`${this.client.defaults.baseURL}${url}`, {
      headers: {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    // Create a transform stream to parse SSE data
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk);
        const lines = text.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (onProgress) {
                onProgress(data);
              }
              controller.enqueue(data);
            } catch (e) {
              console.warn('Failed to parse SSE data:', line);
            }
          }
        }
      },
    });

    return response.body.pipeThrough(transformStream);
  }

  // Batch requests for multiple endpoints
  public async batchGet<T = any>(requests: Array<{ url: string; params?: any }>): Promise<Array<ApiResponse<T>>> {
    const promises = requests.map(req => this.get<T>(req.url, req.params));
    return Promise.all(promises);
  }

  // Health check
  public async healthCheck(): Promise<any> {
    try {
      const response = await this.get('/health', undefined, { cache: false });
      return response.data;
    } catch (error) {
      throw new Error('Backend is not available');
    }
  }
}

// Create global instance
const apiClient = new OptimizedApiClient();

// Photography-specific API methods
export class PhotographyAPI {
  static async getFolders(): Promise<any[]> {
    const response = await apiClient.get('/api/folders', undefined, { 
      cache: true, 
      cacheTTL: 1800000 // 30 minutes
    });
    return response.data.folders || [];
  }

  static async getImages(folderId: string, encryptedId?: string): Promise<any[]> {
    const params = encryptedId ? { encrypted_folder_id: encryptedId } : { folder_id: folderId };
    const response = await apiClient.get('/api/images', params, { 
      cache: true, 
      cacheTTL: 3600000 // 1 hour
    });
    return response.data.images || [];
  }

  static async matchFaces(file: File, folderId: string, onProgress?: (progress: any) => void): Promise<ReadableStream> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder_id', folderId);

    // Use streaming for face matching
    return apiClient.getStream('/api/match', onProgress);
  }

  static async createEncoding(folderId: string, force: boolean = false): Promise<any> {
    return apiClient.post('/api/create_encoding', { folder_id: folderId, force });
  }

  static async hasEncoding(folderId: string): Promise<boolean> {
    const response = await apiClient.get('/api/has-encoding', { folder_id: folderId }, {
      cache: true,
      cacheTTL: 300000 // 5 minutes
    });
    return response.data.exists;
  }

  static async getCacheStats(): Promise<any> {
    return apiClient.get('/api/cache/stats', undefined, { cache: false });
  }

  static async clearCache(namespace?: string): Promise<any> {
    return apiClient.post('/api/cache/clear', { namespace });
  }

  static async getSystemPerformance(): Promise<any> {
    return apiClient.get('/api/system/performance', undefined, { cache: false });
  }
}

// Export the client and API
export { apiClient, OptimizedApiClient };
export default PhotographyAPI;
