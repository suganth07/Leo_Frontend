/**
 * Frontend Image Processing Utilities
 * Optimized for client-side processing to reduce backend load
 */

export interface ImageValidationResult {
  isValid: boolean;
  error?: string;
  processedFile?: File;
}

export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export class ImageUtils {
  private static readonly VALID_TYPES = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp'
  ];

  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  /**
   * Validate image file on client-side
   * Replaces backend validation for faster feedback
   */
  static validateImage(file: File): ImageValidationResult {
    if (!file) {
      return { isValid: false, error: 'No file provided' };
    }

    if (!this.VALID_TYPES.includes(file.type.toLowerCase())) {
      return { 
        isValid: false, 
        error: 'Invalid file type. Please upload JPEG, PNG, or WebP images.' 
      };
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return { 
        isValid: false, 
        error: `File too large. Maximum size is ${this.MAX_FILE_SIZE / 1024 / 1024}MB.` 
      };
    }

    return { isValid: true };
  }

  /**
   * Resize image on client-side to reduce upload time and backend processing
   * Optimized for face recognition (640x640 max recommended)
   */
  static async resizeImage(
    file: File, 
    options: ImageProcessingOptions = {}
  ): Promise<File> {
    const {
      maxWidth = 640,
      maxHeight = 640,
      quality = 0.85,
      format = 'jpeg'
    } = options;

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      img.onload = () => {
        // Calculate optimal dimensions while maintaining aspect ratio
        const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
        
        // Only resize if image is larger than target
        if (ratio >= 1) {
          resolve(file);
          return;
        }

        canvas.width = Math.floor(img.width * ratio);
        canvas.height = Math.floor(img.height * ratio);

        // High-quality image rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const processedFile = new File([blob], file.name, {
                type: `image/${format}`,
                lastModified: Date.now()
              });
              resolve(processedFile);
            } else {
              reject(new Error('Failed to process image'));
            }
          },
          `image/${format}`,
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Get image dimensions without uploading to backend
   */
  static async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
        URL.revokeObjectURL(img.src);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('Failed to load image'));
      };
      
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Create image preview without backend processing
   */
  static createImagePreview(file: File): string {
    return URL.createObjectURL(file);
  }

  /**
   * Clean up image preview URLs to prevent memory leaks
   */
  static revokeImagePreview(url: string): void {
    URL.revokeObjectURL(url);
  }

  /**
   * Batch process multiple images with progress tracking
   */
  static async batchProcessImages(
    files: File[],
    options: ImageProcessingOptions = {},
    onProgress?: (progress: number, processedCount: number) => void
  ): Promise<File[]> {
    const processedFiles: File[] = [];
    
    for (let i = 0; i < files.length; i++) {
      try {
        const validation = this.validateImage(files[i]);
        if (!validation.isValid) {
          console.warn(`Skipping invalid file: ${files[i].name} - ${validation.error}`);
          continue;
        }

        const processedFile = await this.resizeImage(files[i], options);
        processedFiles.push(processedFile);

        if (onProgress) {
          const progress = Math.round(((i + 1) / files.length) * 100);
          onProgress(progress, i + 1);
        }
      } catch (error) {
        console.error(`Failed to process ${files[i].name}:`, error);
      }
    }

    return processedFiles;
  }
}

/**
 * File type detection utilities
 */
export class FileTypeUtils {
  /**
   * Check if file is an image based on extension and MIME type
   */
  static isImage(file: File): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'];
    const fileName = file.name.toLowerCase();
    const hasImageExtension = imageExtensions.some(ext => fileName.endsWith(ext));
    const hasImageMimeType = file.type.startsWith('image/');
    
    return hasImageExtension && hasImageMimeType;
  }

  /**
   * Get file extension from filename
   */
  static getFileExtension(filename: string): string {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
