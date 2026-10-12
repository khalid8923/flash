/* ═══════════════════════════════════════════════════════════
   Storage Layer — Factory & Singleton
   ═══════════════════════════════════════════════════════════
   To migrate: implement S3Storage, then set STORAGE_PROVIDER=s3.
   Current: PostgresStorage (Neon bytea, ~1GB limit).
*/

import type { Storage } from './types.js';
import { PostgresStorage } from './postgres.js';

let instance: Storage | null = null;

function createStorage(): Storage {
  const provider = process.env.STORAGE_PROVIDER ?? 'postgres';
  if (provider === 's3') {
    throw new Error(
      'S3Storage not yet implemented. ' +
      'To activate: npm install @aws-sdk/client-s3, then update services/storage/s3.ts. ' +
      'Currently using PostgresStorage (Neon bytea).'
    );
  }
  return new PostgresStorage();
}

export function getStorage(): Storage {
  if (!instance) instance = createStorage();
  return instance;
}

export type { Storage, StorageObject, StoragePutOptions, StorageStats } from './types.js';