/* ═══════════════════════════════════════════════════════════
   Queue Layer — Abstract Interface
   ═══════════════════════════════════════════════════════════ */

export interface JobOptions {
  /** Delay before processing (ms) */
  delayMs?: number;
  /** Max retry attempts */
  maxAttempts?: number;
  /** Backoff multiplier for retries */
  backoffMs?: number;
  /** Priority (higher = earlier) */
  priority?: number;
  /** Unique job key for deduplication */
  uniqueKey?: string;
}

export interface Job<T = unknown> {
  id: string;
  type: string;
  payload: T;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  scheduledAt: string;
  startedAt?: string;
  completedAt?: string;
  lastError?: string;
}

export type JobHandler<T = unknown> = (job: Job<T>) => Promise<void>;

export interface Queue {
  /** Enqueue a job. Returns job ID. */
  enqueue<T>(type: string, payload: T, opts?: JobOptions): Promise<string>;

  /** Register a handler for a job type. */
  process<T>(type: string, handler: JobHandler<T>): void;

  /** Start processing. No-op for inline queue. */
  start(): Promise<void>;

  /** Stop processing gracefully. */
  stop(): Promise<void>;

  /** Get job by ID. */
  getJob(id: string): Promise<Job | null>;

  /** Get stats. */
  stats(): Promise<QueueStats>;
}

export interface QueueStats {
  provider: 'inline' | 'db' | 'bullmq' | 'sqs';
  pending: number;
  running: number;
  completed: number;
  failed: number;
}