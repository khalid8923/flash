/* ═══════════════════════════════════════════════════════════
   Queue Layer — Factory & Singleton
   ═══════════════════════════════════════════════════════════
   To migrate: implement DbQueue, then set QUEUE_PROVIDER=db.
   Current: InlineQueue (fire-and-forget, no durability).
*/

import type { Queue } from './types.js';
import { InlineQueue } from './inline.js';

let instance: Queue | null = null;

function createQueue(): Queue {
  const provider = process.env.QUEUE_PROVIDER ?? 'inline';
  if (provider === 'db') {
    throw new Error(
      'DbQueue not yet implemented. ' +
      'To activate: implement services/queue/db.ts using job_runs table. ' +
      'Currently using inline queue (fire-and-forget).'
    );
  }
  return new InlineQueue();
}

export function getQueue(): Queue {
  if (!instance) instance = createQueue();
  return instance;
}

export async function closeQueue(): Promise<void> {
  if (instance) { await instance.stop(); instance = null; }
}

export type { Queue, Job, JobHandler, JobOptions, QueueStats } from './types.js';