/* ═══════════════════════════════════════════════════════════
   Cache Layer — In-Memory Implementation
   ═══════════════════════════════════════════════════════════
   Use for: free tier, single instance, dev
   Limitations: not shared across instances, lost on restart
*/

import type { Cache, CacheStats, CacheSetOptions } from './types.js';

interface Entry<T> {
  value: T;
  expiresAt: number | null;
}

export class MemoryCache implements Cache {
  private store = new Map<string, Entry<unknown>>();
  private hits = 0;
  private misses = 0;
  private evictions = 0;
  private maxKeys: number;
  private gcTimer: NodeJS.Timeout | null = null;

  constructor(opts: { maxKeys?: number; gcIntervalMs?: number } = {}) {
    this.maxKeys = opts.maxKeys ?? 10_000;
    const gcIntervalMs = opts.gcIntervalMs ?? 60_000;
    this.gcTimer = setInterval(() => this.gc(), gcIntervalMs);
    this.gcTimer.unref?.();
  }

  async get<T>(key: string): Promise<T | null> {
    const e = this.store.get(key) as Entry<T> | undefined;
    if (!e) { this.misses++; return null; }
    if (e.expiresAt !== null && e.expiresAt < Date.now()) {
      this.store.delete(key);
      this.misses++;
      return null;
    }
    this.hits++;
    return e.value;
  }

  async set<T>(key: string, value: T, opts: CacheSetOptions = {}): Promise<void> {
    if (opts.nx && this.store.has(key)) return;
    const expiresAt = opts.ttlMs ? Date.now() + opts.ttlMs : null;
    this.store.set(key, { value, expiresAt });
    if (this.store.size > this.maxKeys) this.evictOldest();
  }

  async del(key: string): Promise<boolean> {
    return this.store.delete(key);
  }

  async has(key: string): Promise<boolean> {
    const e = this.store.get(key);
    if (!e) return false;
    if (e.expiresAt !== null && e.expiresAt < Date.now()) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  async getOrSet<T>(key: string, fn: () => Promise<T>, opts: CacheSetOptions = {}): Promise<T> {
    const existing = await this.get<T>(key);
    if (existing !== null) return existing;
    const value = await fn();
    await this.set(key, value, opts);
    return value;
  }

  async incr(key: string, by = 1, opts: CacheSetOptions = {}): Promise<number> {
    const current = (await this.get<number>(key)) ?? 0;
    const next = current + by;
    await this.set(key, next, opts);
    return next;
  }

  async clearPrefix(prefix: string): Promise<number> {
    let count = 0;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) { this.store.delete(key); count++; }
    }
    return count;
  }

  async stats(): Promise<CacheStats> {
    return {
      provider: 'memory',
      keys: this.store.size,
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
    };
  }

  async close(): Promise<void> {
    if (this.gcTimer) clearInterval(this.gcTimer);
    this.store.clear();
  }

  private gc(): void {
    const now = Date.now();
    for (const [k, e] of this.store) {
      if (e.expiresAt !== null && e.expiresAt < now) {
        this.store.delete(k);
        this.evictions++;
      }
    }
  }

  private evictOldest(): void {
    /* Delete oldest 10% when over limit */
    const drop = Math.max(1, Math.floor(this.maxKeys * 0.1));
    let i = 0;
    for (const k of this.store.keys()) {
      if (i++ >= drop) break;
      this.store.delete(k);
      this.evictions++;
    }
  }
}