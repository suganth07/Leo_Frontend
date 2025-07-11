/**
 * Frontend Configuration Manager
 * Handles user preferences and settings locally to reduce backend calls
 */

import { useState } from 'react';

export interface UserPreferences {
  imageQuality: 'low' | 'medium' | 'high';
  autoOptimizeImages: boolean;
  defaultSortField: 'name' | 'date' | 'confidence';
  defaultSortDirection: 'asc' | 'desc';
  defaultConfidenceThreshold: number;
  enableAdvancedFilters: boolean;
  galleryItemsPerPage: number;
  enableImageCaching: boolean;
  autoSync: boolean;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: boolean;
  performance: 'speed' | 'quality' | 'balanced';
}

const DEFAULT_PREFERENCES: UserPreferences = {
  imageQuality: 'medium',
  autoOptimizeImages: true,
  defaultSortField: 'name',
  defaultSortDirection: 'asc',
  defaultConfidenceThreshold: 60,
  enableAdvancedFilters: true,
  galleryItemsPerPage: 20,
  enableImageCaching: true,
  autoSync: false
};

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  language: 'en',
  notifications: true,
  performance: 'balanced'
};

/**
 * Configuration manager for frontend settings
 */
export class ConfigManager {
  private static readonly PREFS_KEY = 'leo_user_preferences';
  private static readonly SETTINGS_KEY = 'leo_app_settings';

  /**
   * Get user preferences
   */
  static getUserPreferences(): UserPreferences {
    try {
      const stored = localStorage.getItem(this.PREFS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to handle new settings
        return { ...DEFAULT_PREFERENCES, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load user preferences:', error);
    }
    return DEFAULT_PREFERENCES;
  }

  /**
   * Save user preferences
   */
  static saveUserPreferences(preferences: Partial<UserPreferences>): void {
    try {
      const current = this.getUserPreferences();
      const updated = { ...current, ...preferences };
      localStorage.setItem(this.PREFS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.warn('Failed to save user preferences:', error);
    }
  }

  /**
   * Get app settings
   */
  static getAppSettings(): AppSettings {
    try {
      const stored = localStorage.getItem(this.SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load app settings:', error);
    }
    return DEFAULT_SETTINGS;
  }

  /**
   * Save app settings
   */
  static saveAppSettings(settings: Partial<AppSettings>): void {
    try {
      const current = this.getAppSettings();
      const updated = { ...current, ...settings };
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.warn('Failed to save app settings:', error);
    }
  }

  /**
   * Reset preferences to defaults
   */
  static resetPreferences(): void {
    try {
      localStorage.setItem(this.PREFS_KEY, JSON.stringify(DEFAULT_PREFERENCES));
    } catch (error) {
      console.warn('Failed to reset preferences:', error);
    }
  }

  /**
   * Reset settings to defaults
   */
  static resetSettings(): void {
    try {
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
    } catch (error) {
      console.warn('Failed to reset settings:', error);
    }
  }

  /**
   * Export user configuration for backup
   */
  static exportConfig(): string {
    return JSON.stringify({
      preferences: this.getUserPreferences(),
      settings: this.getAppSettings(),
      exportDate: new Date().toISOString(),
      version: '1.0'
    }, null, 2);
  }

  /**
   * Import user configuration from backup
   */
  static importConfig(configJson: string): boolean {
    try {
      const config = JSON.parse(configJson);
      
      if (config.preferences) {
        this.saveUserPreferences(config.preferences);
      }
      
      if (config.settings) {
        this.saveAppSettings(config.settings);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to import configuration:', error);
      return false;
    }
  }

  /**
   * Get image processing options based on user preferences
   */
  static getImageProcessingOptions() {
    const prefs = this.getUserPreferences();
    
    return {
      maxWidth: prefs.imageQuality === 'high' ? 1024 : prefs.imageQuality === 'medium' ? 640 : 320,
      maxHeight: prefs.imageQuality === 'high' ? 1024 : prefs.imageQuality === 'medium' ? 640 : 320,
      quality: prefs.imageQuality === 'high' ? 0.9 : prefs.imageQuality === 'medium' ? 0.8 : 0.7,
      autoOptimize: prefs.autoOptimizeImages
    };
  }

  /**
   * Get sorting options based on user preferences
   */
  static getDefaultSortOptions() {
    const prefs = this.getUserPreferences();
    
    return {
      field: prefs.defaultSortField,
      direction: prefs.defaultSortDirection
    };
  }

  /**
   * Get performance configuration based on user settings
   */
  static getPerformanceConfig() {
    const settings = this.getAppSettings();
    
    switch (settings.performance) {
      case 'speed':
        return {
          cacheEnabled: true,
          preloadImages: false,
          batchSize: 50,
          debounceMs: 100
        };
      case 'quality':
        return {
          cacheEnabled: true,
          preloadImages: true,
          batchSize: 20,
          debounceMs: 300
        };
      default: // balanced
        return {
          cacheEnabled: true,
          preloadImages: true,
          batchSize: 30,
          debounceMs: 200
        };
    }
  }
}

/**
 * React hook for user preferences
 */
export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(
    ConfigManager.getUserPreferences()
  );

  const updatePreferences = (updates: Partial<UserPreferences>) => {
    ConfigManager.saveUserPreferences(updates);
    setPreferences(ConfigManager.getUserPreferences());
  };

  const resetPreferences = () => {
    ConfigManager.resetPreferences();
    setPreferences(ConfigManager.getUserPreferences());
  };

  return {
    preferences,
    updatePreferences,
    resetPreferences
  };
}

/**
 * React hook for app settings
 */
export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(
    ConfigManager.getAppSettings()
  );

  const updateSettings = (updates: Partial<AppSettings>) => {
    ConfigManager.saveAppSettings(updates);
    setSettings(ConfigManager.getAppSettings());
  };

  const resetSettings = () => {
    ConfigManager.resetSettings();
    setSettings(ConfigManager.getAppSettings());
  };

  return {
    settings,
    updateSettings,
    resetSettings
  };
}
