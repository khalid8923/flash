/* ═══════════════════════════════════════════════════════════
   Storage Layer — Abstract Interface
   ═══════════════════════════════════════════════════════════
   For blobs: exports, backups, voice recordings, PDF reports.
*/

export interface StorageObject {
  key: string;
  size: number;
  contentType: string;
  url?: string;
  uploadedAt: string;
}

export interface StoragePutOptions {
  contentType?: string;
  /** If true, object is publicly readable via URL */
  public?: boolean;
  /** Auto-delete after N ms */
  ttlMs?: number;
  metadata?: Record<string, string>;
}

export interface Storage {
  /** Upload. Returns object metadata. */
  put(key: string, data: Buffer | Uint8Array, opts?: StoragePutOptions): Promise<StorageObject>;

  /** Download. Returns null if not found. */
  get(key: string): Promise<Buffer | null>;

  /** Delete. Returns true if existed. */
  del(key: string): Promise<boolean>;

  /** Check existence. */
  exists(key: string): Promise<boolean>;

  /** List keys with prefix. */
  list(prefix: string, limit?: number): Promise<StorageObject[]>;

  /** Get a signed/public URL for download. */
  url(key: string, expiresInMs?: number): Promise<string | null>;

  /** Stats. */
  stats(): Promise<StorageStats>;
}

export interface StorageStats {
  provider: 'postgres' | 's3' | 'r2';
  objects: number;
  totalBytes: number;
}