/* ═══════════════════════════════════════════════════════════
   Idempotency Layer — Abstract Interface
   ═══════════════════════════════════════════════════════════ */

export interface IdempotentRecord<T = unknown> {
  key: string;
  response: T;
  status: number;
  createdAt: string;
  expiresAt: string;
}

export interface IdempotencyStore {
  /** Look up a previous execution. */
  get<T = unknown>(key: string): Promise<IdempotentRecord<T> | null>;

  /** Record a successful execution. */
  set<T>(key: string, response: T, status: number, ttlMs?: number): Promise<void>;

  /** Remove a record. */
  del(key: string): Promise<boolean>;

  /** Cleanup expired records. */
  cleanup(): Promise<number>;
}