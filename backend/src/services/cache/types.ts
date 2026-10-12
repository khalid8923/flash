/* ═══════════════════════════════════════════════════════════
   Cache Layer — Abstract Interface
   ═══════════════════════════════════════════════════════════
   Contract for all cache implementations.
   Current: memory (free tier)
   Migration: swap to redis (scale)
*/

export interface CacheSetOptions {
  /** Time-to-live in milliseconds */
  ttlMs?: number;
  /** If true, only set if key does not exist */
  nx?: boolean;
}

export interface CacheEntry<T> {
  value: T;
  expiresAt: number | null;
}

export interface Cache {
  /** Get a value. Returns null if missing or expired. */
  get<T>(key: string): Promise<T | null>;

  /** Set a value with optional TTL. */
  set<T>(key: string, value: T, opts?: CacheSetOptions): Promise<void>;

  /** Delete a key. Returns true if key existed. */
  del(key: string): Promise<boolean>;

  /** Check if key exists and is not expired. */
  has(key: string): Promise<boolean>;

  /** Get-or-set: if missing, call fn, store result, return. */
  getOrSet<T>(key: string, fn: () => Promise<T>, opts?: CacheSetOptions): Promise<T>;

  /** Increment a numeric value. Returns new value. */
  incr(key: string, by?: number, opts?: CacheSetOptions): Promise<number>;

  /** Clear all keys matching prefix. */
  clearPrefix(prefix: string): Promise<number>;

  /** Get statistics (implementation-specific). */
  stats(): Promise<CacheStats>;

  /** Shutdown gracefully. */
  close(): Promise<void>;
}

export interface CacheStats {
  provider: 'memory' | 'redis';
  keys: number;
  hits: number;
  misses: number;
  evictions: number;
}