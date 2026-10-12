/* ═══════════════════════════════════════════════════════════
   Queue Layer — Inline Implementation
   ═══════════════════════════════════════════════════════════
   Runs jobs synchronously (fire-and-forget).
   Use for: free tier, low volume, dev.
   Limitation: blocks request if handler takes time. Not durable.
*/

import { randomUUID } from 'node:crypto';
import type { Queue, Job, JobHandler, JobOptions, QueueStats } from './types.js';

export class InlineQueue implements Queue {
  private handlers = new Map<string, JobHandler<unknown>>();
  private jobs = new Map<string, Job>();
  private pending = 0;
  private completed = 0;
  private failed = 0;

  async enqueue<T>(type: string, payload: T, opts: JobOptions = {}): Promise<string> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const job: Job<T> = {
      id,
      type,
      payload,
      attempts: 0,
      maxAttempts: opts.maxAttempts ?? 3,
      createdAt: now,
      scheduledAt: opts.delayMs ? new Date(Date.now() + opts.delayMs).toISOString() : now,
    };
    this.jobs.set(id, job as Job);

    const handler = this.handlers.get(type);
    if (!handler) {
      /* No handler registered: store and return. User must call process(). */
      return id;
    }

    /* Fire-and-forget with setTimeout for delay */
    const run = async () => {
      this.pending++;
      job.attempts++;
      job.startedAt = new Date().toISOString();
      try {
        await handler(job as Job<unknown>);
        job.completedAt = new Date().toISOString();
        this.completed++;
      } catch (err) {
        job.lastError = (err as Error).message;
        if (job.attempts < job.maxAttempts) {
          const delay = (opts.backoffMs ?? 1000) * Math.pow(2, job.attempts - 1);
          setTimeout(run, delay);
          return;
        }
        this.failed++;
      } finally {
        this.pending--;
      }
    };

    if (opts.delayMs) setTimeout(run, opts.delayMs);
    else setImmediate(run);

    return id;
  }

  process<T>(type: string, handler: JobHandler<T>): void {
    this.handlers.set(type, handler as JobHandler<unknown>);
  }

  async start(): Promise<void> { /* no-op */ }
  async stop(): Promise<void> { /* no-op */ }

  async getJob(id: string): Promise<Job | null> {
    return this.jobs.get(id) ?? null;
  }

  async stats(): Promise<QueueStats> {
    return {
      provider: 'inline',
      pending: this.pending,
      running: 0,
      completed: this.completed,
      failed: this.failed,
    };
  }
}