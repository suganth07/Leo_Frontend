/**
 * Module resolver utility for handling different build environments
 * This helps ensure consistent module resolution across different platforms
 */

// Re-export all lib modules to create a centralized import point
export { DataProcessor } from './data-processor';
export { OptimizedApiClient } from './optimized-api';
export { ImageUtils } from './image-utils';
export { ConfigManager } from './config-manager';
export { ENV_DEBUG } from './env-debug';

// Export all types
export type {
  FolderData,
  ImageData,
  MatchResult,
  SortOptions,
  FilterOptions,
} from './data-processor';

export type {
  ApiResponse,
  MatchStreamData,
} from './optimized-api';

export type {
  UserPreferences,
  AppSettings,
} from './config-manager';
