/**
 * Performance Caching System
 * In-memory and persistent caching for improved performance
 */

interface CacheEntry<T = any> {
  value: T;
  expiry: number;
  created: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  entries: number;
  memoryUsage: number;
  hitRate: number;
}

class PerformanceCache {
  private cache = new Map<string, CacheEntry>();
  private stats = { hits: 0, misses: 0 };
  private maxSize: number;
  private defaultTTL: number;

  constructor(maxSize = 1000, defaultTTL = 300000) { // 5 minutes default
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    
    // Cleanup expired entries every 5 minutes
    setInterval(() => this.cleanup(), 300000);
  }

  set<T>(key: string, value: T, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.defaultTTL);
    
    // If cache is full, remove LRU entry
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      value,
      expiry,
      created: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now()
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;
    
    return entry.value as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    return entry !== undefined && Date.now() <= entry.expiry;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
  }

  invalidatePattern(pattern: string): number {
    const regex = new RegExp(pattern);
    let deleted = 0;
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deleted++;
      }
    }
    
    return deleted;
  }

  private evictLRU(): void {
    let lruKey = '';
    let lruTime = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed;
        lruKey = key;
      }
    }
    
    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
      }
    }
  }

  getStats(): CacheStats {
    const memoryUsage = this.estimateMemoryUsage();
    const total = this.stats.hits + this.stats.misses;
    
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      entries: this.cache.size,
      memoryUsage,
      hitRate: total > 0 ? (this.stats.hits / total) * 100 : 0
    };
  }

  private estimateMemoryUsage(): number {
    let size = 0;
    for (const [key, entry] of this.cache.entries()) {
      size += key.length * 2; // String characters
      size += JSON.stringify(entry.value).length * 2;
      size += 64; // Overhead for entry metadata
    }
    return size;
  }
}

// Cache instances for different data types
export const studentCache = new PerformanceCache(500, 600000); // 10 minutes
export const eventCache = new PerformanceCache(200, 300000); // 5 minutes
export const analyticsCache = new PerformanceCache(100, 1800000); // 30 minutes
export const fileCache = new PerformanceCache(50, 3600000); // 1 hour

// Cache key generators
export const CacheKeys = {
  students: {
    all: () => 'students:all',
    byBatch: (batch: string) => `students:batch:${batch}`,
    byId: (id: string) => `students:id:${id}`,
    search: (query: string, filters: string) => `students:search:${query}:${filters}`,
    stats: () => 'students:stats'
  },
  events: {
    all: () => 'events:all',
    byId: (id: string) => `events:id:${id}`,
    byYear: (year: number) => `events:year:${year}`,
    upcoming: () => 'events:upcoming',
    stats: () => 'events:stats'
  },
  analytics: {
    dashboard: () => 'analytics:dashboard',
    performance: (period: string) => `analytics:performance:${period}`,
    trends: (type: string) => `analytics:trends:${type}`,
    reports: (type: string, period: string) => `analytics:reports:${type}:${period}`
  },
  files: {
    photo: (id: string) => `files:photo:${id}`,
    report: (type: string, id: string) => `files:report:${type}:${id}`
  }
};

// Cached data fetchers
export class CachedDataService {
  static async getStudents(cacheKey: string, fetcher: () => Promise<any>) {
    const cached = studentCache.get(cacheKey);
    if (cached) return cached;

    const data = await fetcher();
    studentCache.set(cacheKey, data);
    return data;
  }

  static async getEvents(cacheKey: string, fetcher: () => Promise<any>) {
    const cached = eventCache.get(cacheKey);
    if (cached) return cached;

    const data = await fetcher();
    eventCache.set(cacheKey, data);
    return data;
  }

  static async getAnalytics(cacheKey: string, fetcher: () => Promise<any>) {
    const cached = analyticsCache.get(cacheKey);
    if (cached) return cached;

    const data = await fetcher();
    analyticsCache.set(cacheKey, data, 1800000); // 30 minutes for analytics
    return data;
  }

  static invalidateStudentCache(studentId?: string, batch?: string) {
    if (studentId) {
      studentCache.delete(CacheKeys.students.byId(studentId));
    }
    if (batch) {
      studentCache.delete(CacheKeys.students.byBatch(batch));
    }
    studentCache.delete(CacheKeys.students.all());
    studentCache.delete(CacheKeys.students.stats());
    studentCache.invalidatePattern('students:search:.*');
  }

  static invalidateEventCache(eventId?: string) {
    if (eventId) {
      eventCache.delete(CacheKeys.events.byId(eventId));
    }
    eventCache.delete(CacheKeys.events.all());
    eventCache.delete(CacheKeys.events.upcoming());
    eventCache.delete(CacheKeys.events.stats());
    eventCache.invalidatePattern('events:year:.*');
  }

  static invalidateAnalyticsCache() {
    analyticsCache.clear();
  }
}

// Response compression helpers
export function shouldCompress(request: Request): boolean {
  const acceptEncoding = request.headers.get('accept-encoding') || '';
  return acceptEncoding.includes('gzip') || acceptEncoding.includes('deflate');
}

export function addCompressionHeaders(response: Response): Response {
  if (response.headers.get('content-type')?.includes('application/json')) {
    response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
  }
  return response;
}

// Performance monitoring
export class PerformanceMonitor {
  private static timings = new Map<string, number>();

  static startTimer(label: string): void {
    this.timings.set(label, Date.now());
  }

  static endTimer(label: string): number {
    const start = this.timings.get(label);
    if (!start) return 0;
    
    const duration = Date.now() - start;
    this.timings.delete(label);
    
    // Log slow operations in development
    if (process.env.NODE_ENV === 'development' && duration > 1000) {
      console.warn(`[Performance] Slow operation: ${label} took ${duration}ms`);
    }
    
    return duration;
  }

  static async measureAsync<T>(label: string, operation: () => Promise<T>): Promise<T> {
    this.startTimer(label);
    try {
      const result = await operation();
      return result;
    } finally {
      this.endTimer(label);
    }
  }

  static getAllStats() {
    return {
      cache: {
        students: studentCache.getStats(),
        events: eventCache.getStats(),
        analytics: analyticsCache.getStats(),
        files: fileCache.getStats()
      }
    };
  }
}