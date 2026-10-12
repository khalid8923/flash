# Rate Limit Migration Guide

Current: `@fastify/rate-limit` uses in-memory store (per-instance).

## When to migrate

Migrate to DB-backed rate limiting when:
1. Running MORE THAN ONE backend instance, OR
2. Free-tier single instance crosses 100 req/s peak.

## How to migrate

The `rate_limit_buckets` table + `rate_limit_check()` function are already
created by migration 028. To switch:

### Step 1 - Create a custom store for @fastify/rate-limit

Create `src/config/rate-limit-store.ts`:

```typescript
import { pool } from './db.js';

export class PostgresRateLimitStore {
  async incr(
    key: string,
    callback: (err: Error | null, result: { current: number; ttl: number } | null) => void
  ) {
    try {
      const r = await pool.query(
        'SELECT * FROM rate_limit_check(, , , )',
        [key, 'default', 200, 60]
      );
      const row = r.rows[0];
      callback(null, { current: row.current_count, ttl: 60000 });
    } catch (err) {
      callback(err as Error, null);
    }
  }
}
```

### Step 2 - Update server.ts

```typescript
import { PostgresRateLimitStore } from './config/rate-limit-store.js';

await fastify.register(rateLimit, {
  global: true,
  max: 200,
  timeWindow: '1 minute',
  store: new PostgresRateLimitStore(),
  // ...rest of config
});
```

### Step 3 - Test with 2 instances

Run two backend instances on different ports, then hammer with the same
key. Both should see the same counter.

## Current state (free tier)

Keep in-memory. It works for single-instance deployments.
The migration above is ready when you need it.
