/* ═══════════════════════════════════════════════════════════
   Storage Layer — S3/R2 Implementation (STUB)
   ═══════════════════════════════════════════════════════════
   For scale: R2 (Cloudflare) has zero egress.
   Activate when: blobs exceed 500MB OR > 10K users.
*/

import type { Storage, StorageObject, StoragePutOptions, StorageStats } from './types.js';

export class S3Storage implements Storage {
  constructor(_opts: { bucket: string; region: string; accessKeyId: string; secretAccessKey: string }) {
    throw new Error('S3Storage not yet implemented. Use PostgresStorage for now.');
  }
  async put(_key: string, _data: Buffer, _opts?: StoragePutOptions): Promise<StorageObject> { throw new Error('not_implemented'); }
  async get(_key: string): Promise<Buffer | null> { throw new Error('not_implemented'); }
  async del(_key: string): Promise<boolean> { throw new Error('not_implemented'); }
  async exists(_key: string): Promise<boolean> { throw new Error('not_implemented'); }
  async list(_prefix: string, _limit?: number): Promise<StorageObject[]> { throw new Error('not_implemented'); }
  async url(_key: string, _expiresInMs?: number): Promise<string | null> { throw new Error('not_implemented'); }
  async stats(): Promise<StorageStats> { throw new Error('not_implemented'); }
}