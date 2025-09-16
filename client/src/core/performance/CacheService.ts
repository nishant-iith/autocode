/**
 * Cache Service Implementation
 * Provides in-memory caching with TTL and LRU eviction
 */

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl?: number;
  accessCount: number;
  lastAccessed: number;
}

export interface CacheOptions {
  maxSize?: number;
  defaultTtl?: number; // Time to live in milliseconds
  cleanupInterval?: number; // Cleanup interval in milliseconds
}

export interface CacheStatistics {
  size: number;
  maxSize: number;
  hits: number;
  misses: number;
  hitRate: number;
  evictions: number;
  oldestEntry?: number;
  newestEntry?: number;
}

/**
 * High-performance in-memory cache with LRU eviction and TTL support
 */
export class CacheService<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private accessOrder: string[] = [];
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0
  };
  private cleanupTimer?: NodeJS.Timeout;

  constructor(private options: CacheOptions = {}) {
    const {
      maxSize = 1000,
      defaultTtl = 300000, // 5 minutes
      cleanupInterval = 60000 // 1 minute
    } = options;

    this.options = { maxSize, defaultTtl, cleanupInterval };

    // Start cleanup timer
    this.startCleanup();
  }

  /**
   * Get value from cache
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return undefined;
    }

    // Check TTL
    if (this.isExpired(entry)) {
      this.delete(key);
      this.stats.misses++;
      return undefined;
    }

    // Update access information
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.updateAccessOrder(key);

    this.stats.hits++;
    return entry.value;
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      value,
      timestamp: now,
      ttl: ttl || this.options.defaultTtl,
      accessCount: 1,
      lastAccessed: now
    };

    // If key already exists, update it
    if (this.cache.has(key)) {
      this.cache.set(key, entry);
      this.updateAccessOrder(key);
      return;
    }

    // Check if we need to evict
    if (this.cache.size >= (this.options.maxSize || 1000)) {
      this.evictLRU();
    }

    this.cache.set(key, entry);
    this.accessOrder.push(key);
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (this.isExpired(entry)) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete key from cache
   */
  delete(key: string): boolean {
    const existed = this.cache.delete(key);
    if (existed) {
      const index = this.accessOrder.indexOf(key);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
      }
    }
    return existed;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
    this.stats = { hits: 0, misses: 0, evictions: 0 };
  }

  /**
   * Get cache statistics
   */
  getStatistics(): CacheStatistics {
    const entries = Array.from(this.cache.values());
    const timestamps = entries.map(e => e.timestamp);

    return {
      size: this.cache.size,
      maxSize: this.options.maxSize || 1000,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
      evictions: this.stats.evictions,
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : undefined,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : undefined
    };
  }

  /**
   * Get or set with a factory function
   */
  async getOrSet<U extends T>(
    key: string,
    factory: () => Promise<U> | U,
    ttl?: number
  ): Promise<U> {
    const cached = this.get(key);
    if (cached !== undefined) {
      return cached as U;
    }

    const value = await factory();
    this.set(key, value, ttl);
    return value;
  }

  /**
   * Get multiple keys at once
   */
  getMultiple(keys: string[]): Map<string, T> {
    const result = new Map<string, T>();
    for (const key of keys) {
      const value = this.get(key);
      if (value !== undefined) {
        result.set(key, value);
      }
    }
    return result;
  }

  /**
   * Set multiple key-value pairs
   */
  setMultiple(entries: Map<string, T>, ttl?: number): void {
    for (const [key, value] of entries) {
      this.set(key, value, ttl);
    }
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.cache) {
      if (this.isExpired(entry, now)) {
        this.delete(key);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  /**
   * Dispose cache and stop cleanup timer
   */
  dispose(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    this.clear();
  }

  private isExpired(entry: CacheEntry<T>, now = Date.now()): boolean {
    if (!entry.ttl) return false;
    return now - entry.timestamp > entry.ttl;
  }

  private updateAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }

  private evictLRU(): void {
    if (this.accessOrder.length === 0) return;

    const lruKey = this.accessOrder[0];
    this.delete(lruKey);
    this.stats.evictions++;
  }

  private startCleanup(): void {
    if (this.options.cleanupInterval && this.options.cleanupInterval > 0) {
      this.cleanupTimer = setInterval(() => {
        this.cleanup();
      }, this.options.cleanupInterval);
    }
  }
}

/**
 * Global cache instances for different use cases
 */
export class CacheManager {
  private static instances = new Map<string, CacheService>();

  static getCache<T>(name: string, options?: CacheOptions): CacheService<T> {
    if (!this.instances.has(name)) {
      this.instances.set(name, new CacheService<T>(options));
    }
    return this.instances.get(name) as CacheService<T>;
  }

  static clearCache(name: string): boolean {
    const cache = this.instances.get(name);
    if (cache) {
      cache.clear();
      return true;
    }
    return false;
  }

  static disposeCache(name: string): boolean {
    const cache = this.instances.get(name);
    if (cache) {
      cache.dispose();
      this.instances.delete(name);
      return true;
    }
    return false;
  }

  static disposeAll(): void {
    for (const [name, cache] of this.instances) {
      cache.dispose();
    }
    this.instances.clear();
  }

  static getAllStatistics(): Record<string, CacheStatistics> {
    const stats: Record<string, CacheStatistics> = {};
    for (const [name, cache] of this.instances) {
      stats[name] = cache.getStatistics();
    }
    return stats;
  }
}

// Pre-configured cache instances
export const fileContentCache = CacheManager.getCache<string>('fileContent', {
  maxSize: 500,
  defaultTtl: 600000, // 10 minutes
  cleanupInterval: 120000 // 2 minutes
});

export const validationCache = CacheManager.getCache<boolean>('validation', {
  maxSize: 1000,
  defaultTtl: 300000, // 5 minutes
  cleanupInterval: 60000 // 1 minute
});

export const modelCache = CacheManager.getCache<any>('models', {
  maxSize: 100,
  defaultTtl: 3600000, // 1 hour
  cleanupInterval: 300000 // 5 minutes
});