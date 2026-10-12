/* ═══════════════════════════════════════════════════════════
   Queue Layer — Postgres Implementation (STUB)
   ═══════════════════════════════════════════════════════════
   Durable queue using job_runs table + SKIP LOCKED.
   Status: skeleton ready, implement when inline becomes bottleneck.
*/

import type { Queue, Job, JobHandler, JobOptions, QueueStats } from './types.js';

export class DbQueue implements Queue {
  constructor(_opts: { pollIntervalMs?: number } = {}) {
    throw new Error('DbQueue not yet implemented. Use inline queue for now.');
  }
  async enqueue<T>(_type: string, _payload: T, _opts?: JobOptions): Promise<string> { throw new Error('not_implemented'); }
  process<T>(_type: string, _handler: JobHandler<T>): void { throw new Error('not_implemented'); }
  async start(): Promise<void> { throw new Error('not_implemented'); }
  async stop(): Promise<void> { throw new Error('not_implemented'); }
  async getJob(_id: string): Promise<Job | null> { throw new Error('not_implemented'); }
  async stats(): Promise<QueueStats> { throw new Error('not_implemented'); }
}