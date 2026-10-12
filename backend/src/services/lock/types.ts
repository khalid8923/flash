/* ═══════════════════════════════════════════════════════════
   Lock Layer — Abstract Interface
   ═══════════════════════════════════════════════════════════ */

export interface Lock {
  /** Acquire lock. Returns release function. Throws if timeout. */
  acquire(key: string, opts?: { ttlMs?: number; waitMs?: number }): Promise<() => Promise<void>>;

  /** Try to acquire (non-blocking). Returns null if unavailable. */
  tryAcquire(key: string, opts?: { ttlMs?: number }): Promise<(() => Promise<void>) | null>;
}