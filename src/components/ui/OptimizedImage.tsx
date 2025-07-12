/**
 * Optimized Image Component for Leo Photography Platform
 * Features: Lazy loading, progressive enhancement, error handling, caching
 */

'use client';

import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import Image from 'next/image';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onClick?: () => void;
  onLoad?: () => void;
  onError?: () => void;
  lazy?: boolean;
  thumbnail?: string;
  sizes?: string;
}

const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  width = 800,
  height = 600,
  className = '',
  priority = false,
  quality = 75,
  placeholder = 'empty',
  blurDataURL,
  onClick,
  onLoad,
  onError,
  lazy = true,
  thumbnail,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
}: OptimizedImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const [currentSrc, setCurrentSrc] = useState(thumbnail || src);
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || isInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, isInView]);

  // Progressive loading: thumbnail -> full image
  useEffect(() => {
    if (!isInView || imageError) return;

    if (thumbnail && currentSrc === thumbnail) {
      // Load full image after thumbnail is displayed
      const timer = setTimeout(() => {
        setCurrentSrc(src);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isInView, thumbnail, currentSrc, src, imageError]);

  const handleLoad = useCallback(() => {
    setImageLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setImageError(true);
    onError?.();
    
    // Fallback to thumbnail or placeholder
    if (currentSrc !== thumbnail && thumbnail) {
      setCurrentSrc(thumbnail);
      setImageError(false);
    }
  }, [onError, currentSrc, thumbnail]);

  const handleRetry = useCallback(() => {
    setImageError(false);
    setImageLoaded(false);
    setCurrentSrc(src);
  }, [src]);

  // Generate optimized blur placeholder
  const generateBlurDataURL = useCallback(() => {
    if (blurDataURL) return blurDataURL;
    
    // Create a simple blur placeholder
    const canvas = document.createElement('canvas');
    canvas.width = 10;
    canvas.height = 8;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, 10, 8);
    }
    return canvas.toDataURL();
  }, [blurDataURL]);

  if (!isInView) {
    return (
      <div
        ref={imgRef}
        className={`${className} bg-gray-200 animate-pulse flex items-center justify-center`}
        style={{ width, height }}
      >
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  if (imageError && (!thumbnail || currentSrc === thumbnail)) {
    return (
      <div
        className={`${className} bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500`}
        style={{ width, height }}
      >
        <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-sm">Failed to load image</p>
        <button
          onClick={handleRetry}
          className="mt-2 px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      onClick={onClick}
      style={{ width, height }}
    >
      <Image
        src={currentSrc}
        alt={alt}
        width={width}
        height={height}
        quality={quality}
        priority={priority}
        placeholder={placeholder}
        blurDataURL={placeholder === 'blur' ? generateBlurDataURL() : undefined}
        onLoad={handleLoad}
        onError={handleError}
        sizes={sizes}
        className={`transition-opacity duration-300 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        } ${onClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
        style={{
          objectFit: 'cover',
          width: '100%',
          height: '100%',
        }}
      />
      
      {/* Loading overlay */}
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <LoadingSpinner size="sm" />
        </div>
      )}
      
      {/* Progressive enhancement indicator */}
      {thumbnail && currentSrc === thumbnail && !imageError && (
        <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
          Preview
        </div>
      )}
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;
