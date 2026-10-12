/* ═══════════════════════════════════════════════════════════
   Idempotency Layer — In-Memory Implementation
   ═══════════════════════════════════════════════════════════
   Use for: dev, single instance.
   Limit: lost on restart, not shared across instances.
*/

import type { IdempotencyStore, IdempotentRecord } from './types.js';

export class MemoryIdempotencyStore implements IdempotencyStore {
  private store = new Map<string, IdempotentRecord<unknown>>();
  private maxSize: number;

  constructor(opts: { maxSize?: number } = {}) {
    this.maxSize = opts.maxSize ?? 1000;
  }

  async get<T>(key: string): Promise<IdempotentRecord<T> | null> {
    const rec = this.store.get(key) as IdempotentRecord<T> | undefined;
    if (!rec) return null;
    if (new Date(rec.expiresAt).getTime() < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return rec;
  }

  async set<T>(key: string, response: T, status: number, ttlMs = 300_000): Promise<void> {
    if (this.store.size >= this.maxSize) this.evict();
    this.store.set(key, {
      key,
      response,
      status,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + ttlMs).toISOString(),
    });
  }

  async del(key: string): Promise<boolean> {
    return this.store.delete(key);
  }

  async cleanup(): Promise<number> {
    const now = Date.now();
    let count = 0;
    for (const [k, r] of this.store) {
      if (new Date(r.expiresAt).getTime() < now) { this.store.delete(k); count++; }
    }
    return count;
  }

  private evict(): void {
    /* Drop oldest 20% */
    const sorted = [...this.store.entries()].sort((a, b) =>
      a[1].createdAt.localeCompare(b[1].createdAt)
    );
    const drop = Math.max(1, Math.floor(this.maxSize * 0.2));
    for (let i = 0; i < drop && i < sorted.length; i++) {
      const entry = sorted[i];
      if (entry) this.store.delete(entry[0]);
    }
  }
}