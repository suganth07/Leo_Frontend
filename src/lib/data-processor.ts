/**
 * Frontend Data Processing Utilities
 * Optimized for client-side data manipulation and caching
 */

export interface FolderData {
  id: string;
  name: string;
  photo_count?: number;
  face_count?: number;
  last_sync?: string;
  encoding_exists?: boolean;
}

export interface ImageData {
  id: string;
  name: string;
  url: string;
  confidence?: number;
  matched_face_index?: number;
  query_face_index?: number;
}

export interface MatchResult {
  images: ImageData[];
  total_matches: number;
  faces_in_query: number;
  search_completed: boolean;
}

export interface SortOptions {
  field: 'name' | 'confidence' | 'date';
  direction: 'asc' | 'desc';
}

export interface FilterOptions {
  minConfidence?: number;
  maxConfidence?: number;
  searchTerm?: string;
  fileTypes?: string[];
}

/**
 * Client-side data processing and caching utilities
 */
export class DataProcessor {
  private static readonly CACHE_PREFIX = 'leo_frontend_';
  private static readonly CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes

  /**
   * Sort images by various criteria on frontend
   * Reduces backend processing load
   */
  static sortImages(images: ImageData[], options: SortOptions): ImageData[] {
    return [...images].sort((a, b) => {
      const { field, direction } = options;
      let comparison = 0;

      switch (field) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'confidence':
          comparison = (a.confidence || 0) - (b.confidence || 0);
          break;
        case 'date':
          // Extract date from filename if available, otherwise use name
          const dateA = this.extractDateFromFilename(a.name);
          const dateB = this.extractDateFromFilename(b.name);
          comparison = dateA.getTime() - dateB.getTime();
          break;
      }

      return direction === 'desc' ? -comparison : comparison;
    });
  }

  /**
   * Filter images based on criteria - frontend processing
   */
  static filterImages(images: ImageData[], options: FilterOptions): ImageData[] {
    return images.filter(image => {
      // Confidence filtering
      if (options.minConfidence !== undefined && 
          (image.confidence || 0) < options.minConfidence) {
        return false;
      }

      if (options.maxConfidence !== undefined && 
          (image.confidence || 0) > options.maxConfidence) {
        return false;
      }

      // Search term filtering
      if (options.searchTerm && 
          !image.name.toLowerCase().includes(options.searchTerm.toLowerCase())) {
        return false;
      }

      // File type filtering
      if (options.fileTypes && options.fileTypes.length > 0) {
        const extension = image.name.split('.').pop()?.toLowerCase();
        if (!extension || !options.fileTypes.includes(extension)) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Group images by confidence ranges for better visualization
   */
  static groupImagesByConfidence(images: ImageData[]): Record<string, ImageData[]> {
    const groups = {
      'high': [] as ImageData[], // 80-100%
      'medium': [] as ImageData[], // 60-79%
      'low': [] as ImageData[] // Below 60%
    };

    images.forEach(image => {
      const confidence = image.confidence || 0;
      if (confidence >= 80) {
        groups.high.push(image);
      } else if (confidence >= 60) {
        groups.medium.push(image);
      } else {
        groups.low.push(image);
      }
    });

    return groups;
  }

  /**
   * Calculate statistics on frontend to reduce backend load
   */
  static calculateImageStats(images: ImageData[]): {
    total: number;
    averageConfidence: number;
    highConfidenceCount: number;
    mediumConfidenceCount: number;
    lowConfidenceCount: number;
  } {
    const total = images.length;
    const confidences = images.map(img => img.confidence || 0);
    const averageConfidence = confidences.reduce((sum, conf) => sum + conf, 0) / total || 0;

    const highConfidenceCount = confidences.filter(conf => conf >= 80).length;
    const mediumConfidenceCount = confidences.filter(conf => conf >= 60 && conf < 80).length;
    const lowConfidenceCount = confidences.filter(conf => conf < 60).length;

    return {
      total,
      averageConfidence: Math.round(averageConfidence * 10) / 10,
      highConfidenceCount,
      mediumConfidenceCount,
      lowConfidenceCount
    };
  }

  /**
   * Paginate results on frontend
   */
  static paginateImages(
    images: ImageData[], 
    page: number, 
    itemsPerPage: number = 20
  ): { 
    data: ImageData[]; 
    pagination: { 
      currentPage: number; 
      totalPages: number; 
      totalItems: number; 
      hasNext: boolean; 
      hasPrev: boolean; 
    } 
  } {
    const totalItems = images.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const data = images.slice(startIndex, endIndex);

    return {
      data,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  /**
   * Cache data in localStorage with expiry
   */
  static cacheData(key: string, data: any): void {
    try {
      const cacheItem = {
        data,
        timestamp: Date.now(),
        expiry: Date.now() + this.CACHE_EXPIRY
      };
      localStorage.setItem(this.CACHE_PREFIX + key, JSON.stringify(cacheItem));
    } catch (error) {
      console.warn('Failed to cache data:', error);
    }
  }

  /**
   * Retrieve cached data if not expired
   */
  static getCachedData(key: string): any | null {
    try {
      const cached = localStorage.getItem(this.CACHE_PREFIX + key);
      if (!cached) return null;

      const cacheItem = JSON.parse(cached);
      if (Date.now() > cacheItem.expiry) {
        localStorage.removeItem(this.CACHE_PREFIX + key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.warn('Failed to retrieve cached data:', error);
      return null;
    }
  }

  /**
   * Clear expired cache entries
   */
  static clearExpiredCache(): void {
    try {
      const keys = Object.keys(localStorage).filter(key => 
        key.startsWith(this.CACHE_PREFIX)
      );

      keys.forEach(key => {
        const cached = localStorage.getItem(key);
        if (cached) {
          const cacheItem = JSON.parse(cached);
          if (Date.now() > cacheItem.expiry) {
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.warn('Failed to clear expired cache:', error);
    }
  }

  /**
   * Extract date from filename patterns
   */
  private static extractDateFromFilename(filename: string): Date {
    // Common date patterns in filenames
    const patterns = [
      /(\d{4})[_-](\d{2})[_-](\d{2})/, // YYYY-MM-DD or YYYY_MM_DD
      /(\d{2})[_-](\d{2})[_-](\d{4})/, // DD-MM-YYYY or DD_MM_YYYY
      /(\d{4})(\d{2})(\d{2})/, // YYYYMMDD
      /IMG[_-](\d{4})(\d{2})(\d{2})/, // IMG_YYYYMMDD
    ];

    for (const pattern of patterns) {
      const match = filename.match(pattern);
      if (match) {
        try {
          let year, month, day;
          if (pattern === patterns[0] || pattern === patterns[2] || pattern === patterns[3]) {
            // YYYY-MM-DD format
            year = parseInt(match[1]);
            month = parseInt(match[2]) - 1; // Month is 0-indexed
            day = parseInt(match[3]);
          } else {
            // DD-MM-YYYY format
            day = parseInt(match[1]);
            month = parseInt(match[2]) - 1;
            year = parseInt(match[3]);
          }
          
          const date = new Date(year, month, day);
          if (!isNaN(date.getTime())) {
            return date;
          }
        } catch (error) {
          continue;
        }
      }
    }

    // If no date pattern found, return current date
    return new Date();
  }
}

/**
 * Progress tracking utilities for frontend
 */
export class ProgressTracker {
  private listeners: ((progress: number, status: string) => void)[] = [];

  /**
   * Add progress listener
   */
  addListener(callback: (progress: number, status: string) => void): void {
    this.listeners.push(callback);
  }

  /**
   * Remove progress listener
   */
  removeListener(callback: (progress: number, status: string) => void): void {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Update progress and notify listeners
   */
  updateProgress(progress: number, status: string): void {
    this.listeners.forEach(listener => listener(progress, status));
  }

  /**
   * Reset progress
   */
  reset(): void {
    this.updateProgress(0, 'Ready');
  }
}
