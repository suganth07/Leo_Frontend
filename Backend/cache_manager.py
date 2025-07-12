"""
Advanced Caching System for Leo Photography Platform
Provides multiple layers of caching for optimal performance
"""

import asyncio
import json
import hashlib
import time
import os
from typing import Any, Optional, Dict, List
import logging
from functools import wraps
import pickle
import gzip
from concurrent.futures import ThreadPoolExecutor

# Optional Redis import
try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    redis = None

logger = logging.getLogger(__name__)

class CacheManager:
    def __init__(self):
        # Memory cache for frequently accessed data
        self.memory_cache = {}
        self.cache_timestamps = {}
        self.cache_access_count = {}
        self.max_memory_items = 1000
        
        # Redis cache for distributed caching (if available)
        self.redis_client = None
        if REDIS_AVAILABLE:
            try:
                redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
                self.redis_client = redis.from_url(redis_url, decode_responses=False)
                self.redis_client.ping()
                logger.info("Redis cache connected successfully")
            except Exception as e:
                logger.warning(f"Redis not available, using memory cache only: {e}")
        else:
            logger.info("Redis not installed, using memory cache only")
        
        # Thread pool for async operations
        self.executor = ThreadPoolExecutor(max_workers=4)
        
        # Cache statistics
        self.stats = {
            'hits': 0,
            'misses': 0,
            'memory_size': 0,
            'redis_size': 0
        }
    
    def _generate_cache_key(self, namespace: str, key: str, **params) -> str:
        """Generate unique cache key"""
        key_data = f"{namespace}:{key}:{json.dumps(params, sort_keys=True)}"
        return hashlib.md5(key_data.encode()).hexdigest()
    
    def _compress_data(self, data: Any) -> bytes:
        """Compress data for storage"""
        pickled = pickle.dumps(data)
        return gzip.compress(pickled)
    
    def _decompress_data(self, compressed_data: bytes) -> Any:
        """Decompress data from storage"""
        pickled = gzip.decompress(compressed_data)
        return pickle.loads(pickled)
    
    def _cleanup_memory_cache(self):
        """Clean up memory cache based on LRU and size limits"""
        if len(self.memory_cache) <= self.max_memory_items:
            return
        
        # Sort by access count and timestamp
        sorted_keys = sorted(
            self.memory_cache.keys(),
            key=lambda k: (self.cache_access_count.get(k, 0), self.cache_timestamps.get(k, 0))
        )
        
        # Remove 20% of least used items
        remove_count = len(sorted_keys) // 5
        for key in sorted_keys[:remove_count]:
            self.memory_cache.pop(key, None)
            self.cache_timestamps.pop(key, None)
            self.cache_access_count.pop(key, None)
    
    async def get(self, namespace: str, key: str, **params) -> Optional[Any]:
        """Get data from cache"""
        cache_key = self._generate_cache_key(namespace, key, **params)
        
        # Check memory cache first
        if cache_key in self.memory_cache:
            self.cache_access_count[cache_key] = self.cache_access_count.get(cache_key, 0) + 1
            self.stats['hits'] += 1
            logger.debug(f"Memory cache hit: {namespace}:{key}")
            return self.memory_cache[cache_key]['data']
        
        # Check Redis cache
        if self.redis_client:
            try:
                cached_data = await asyncio.get_event_loop().run_in_executor(
                    self.executor, self.redis_client.get, cache_key
                )
                if cached_data:
                    data = self._decompress_data(cached_data)
                    # Store in memory cache for faster future access
                    self._set_memory_cache(cache_key, data)
                    self.stats['hits'] += 1
                    logger.debug(f"Redis cache hit: {namespace}:{key}")
                    return data
            except Exception as e:
                logger.warning(f"Redis cache error: {e}")
        
        self.stats['misses'] += 1
        return None
    
    def _set_memory_cache(self, cache_key: str, data: Any):
        """Set data in memory cache"""
        self.memory_cache[cache_key] = {
            'data': data,
            'timestamp': time.time()
        }
        self.cache_timestamps[cache_key] = time.time()
        self.cache_access_count[cache_key] = 1
        self._cleanup_memory_cache()
    
    async def set(self, namespace: str, key: str, data: Any, ttl: int = 3600, **params):
        """Set data in cache"""
        cache_key = self._generate_cache_key(namespace, key, **params)
        
        # Set in memory cache
        self._set_memory_cache(cache_key, data)
        
        # Set in Redis cache
        if self.redis_client:
            try:
                compressed_data = self._compress_data(data)
                await asyncio.get_event_loop().run_in_executor(
                    self.executor, 
                    lambda: self.redis_client.setex(cache_key, ttl, compressed_data)
                )
                logger.debug(f"Data cached in Redis: {namespace}:{key}")
            except Exception as e:
                logger.warning(f"Redis cache set error: {e}")
    
    async def delete(self, namespace: str, key: str, **params):
        """Delete data from cache"""
        cache_key = self._generate_cache_key(namespace, key, **params)
        
        # Remove from memory cache
        self.memory_cache.pop(cache_key, None)
        self.cache_timestamps.pop(cache_key, None)
        self.cache_access_count.pop(cache_key, None)
        
        # Remove from Redis cache
        if self.redis_client:
            try:
                await asyncio.get_event_loop().run_in_executor(
                    self.executor, self.redis_client.delete, cache_key
                )
            except Exception as e:
                logger.warning(f"Redis cache delete error: {e}")
    
    async def clear_namespace(self, namespace: str):
        """Clear all cache entries for a namespace"""
        # Clear memory cache
        keys_to_remove = [k for k in self.memory_cache.keys() if k.startswith(namespace)]
        for key in keys_to_remove:
            self.memory_cache.pop(key, None)
            self.cache_timestamps.pop(key, None)
            self.cache_access_count.pop(key, None)
        
        # Clear Redis cache
        if self.redis_client:
            try:
                pattern = f"{namespace}:*"
                keys = await asyncio.get_event_loop().run_in_executor(
                    self.executor, lambda: self.redis_client.keys(pattern)
                )
                if keys:
                    await asyncio.get_event_loop().run_in_executor(
                        self.executor, lambda: self.redis_client.delete(*keys)
                    )
            except Exception as e:
                logger.warning(f"Redis namespace clear error: {e}")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        total_requests = self.stats['hits'] + self.stats['misses']
        hit_rate = (self.stats['hits'] / total_requests * 100) if total_requests > 0 else 0
        
        return {
            'hit_rate': round(hit_rate, 2),
            'total_requests': total_requests,
            'memory_items': len(self.memory_cache),
            'redis_available': self.redis_client is not None,
            **self.stats
        }

# Global cache manager
cache_manager = CacheManager()

# Cache decorators
def cache_result(namespace: str, ttl: int = 3600, key_func=None):
    """Decorator to cache function results"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key
            if key_func:
                cache_key = key_func(*args, **kwargs)
            else:
                cache_key = f"{func.__name__}:{hash(str(args) + str(kwargs))}"
            
            # Try to get from cache
            cached_result = await cache_manager.get(namespace, cache_key)
            if cached_result is not None:
                return cached_result
            
            # Execute function and cache result
            if asyncio.iscoroutinefunction(func):
                result = await func(*args, **kwargs)
            else:
                result = func(*args, **kwargs)
            
            await cache_manager.set(namespace, cache_key, result, ttl)
            return result
        return wrapper
    return decorator

def cache_with_invalidation(namespace: str, ttl: int = 3600, invalidate_on: List[str] = None):
    """Cache with automatic invalidation on specific events"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            cache_key = f"{func.__name__}:{hash(str(args) + str(kwargs))}"
            
            # Check for invalidation events
            if invalidate_on:
                for event in invalidate_on:
                    if event in kwargs.get('events', []):
                        await cache_manager.delete(namespace, cache_key)
                        break
            
            # Try cache first
            cached_result = await cache_manager.get(namespace, cache_key)
            if cached_result is not None:
                return cached_result
            
            # Execute and cache
            if asyncio.iscoroutinefunction(func):
                result = await func(*args, **kwargs)
            else:
                result = func(*args, **kwargs)
            
            await cache_manager.set(namespace, cache_key, result, ttl)
            return result
        return wrapper
    return decorator

# Specialized caches for different data types
class FolderCache:
    """Specialized cache for folder data"""
    
    @staticmethod
    async def get_folders(root_folder_id: str) -> Optional[List[Dict]]:
        return await cache_manager.get('folders', 'list', root_id=root_folder_id)
    
    @staticmethod
    async def set_folders(root_folder_id: str, folders: List[Dict], ttl: int = 1800):
        await cache_manager.set('folders', 'list', folders, ttl, root_id=root_folder_id)
    
    @staticmethod
    async def invalidate_folders(root_folder_id: str):
        await cache_manager.delete('folders', 'list', root_id=root_folder_id)

class ImageCache:
    """Specialized cache for image data"""
    
    @staticmethod
    async def get_images(folder_id: str) -> Optional[List[Dict]]:
        return await cache_manager.get('images', 'list', folder_id=folder_id)
    
    @staticmethod
    async def set_images(folder_id: str, images: List[Dict], ttl: int = 3600):
        await cache_manager.set('images', 'list', images, ttl, folder_id=folder_id)
    
    @staticmethod
    async def invalidate_images(folder_id: str):
        await cache_manager.delete('images', 'list', folder_id=folder_id)

class EncodingCache:
    """Specialized cache for face encoding data"""
    
    @staticmethod
    async def get_encodings(folder_id: str) -> Optional[List[Dict]]:
        return await cache_manager.get('encodings', 'face_data', folder_id=folder_id)
    
    @staticmethod
    async def set_encodings(folder_id: str, encodings: List[Dict], ttl: int = 7200):
        await cache_manager.set('encodings', 'face_data', encodings, ttl, folder_id=folder_id)
    
    @staticmethod
    async def invalidate_encodings(folder_id: str):
        await cache_manager.delete('encodings', 'face_data', folder_id=folder_id)
