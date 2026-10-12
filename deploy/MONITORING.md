# Monitoring & Alerts

## Free services (all $0)

### UptimeRobot (uptime)

1. Create account at uptimerobot.com
2. Add monitor:
   - Type: HTTPS
   - URL: `https://flash-backend.onrender.com/health`
   - Interval: 5 minutes
   - Alert: email on down
3. Add second monitor for `/ready` (DB check)

### Sentry (errors)

1. Create project at sentry.io
2. Install SDK: `npm i @sentry/node`
3. Add to `backend/src/server.ts` (see next session)

### Logflare (logs)

Free 1GB/month. Ships Pino logs to a searchable dashboard.

## Metrics to watch

| Metric | Target | Alert |
|---|---|---|
| Uptime | 99.5% | > 5 min down |
| p95 latency | < 500ms | > 1s |
| Error rate | < 0.5% | > 2% |
| AI provider failures | < 5% | > 20% |
| DB connections | < 8/10 | = 10 |

## Runbooks (link to internal docs)

- Backend down → check Render dashboard → restart
- DB full → run retention jobs → migrate to Neon Pro
- AI exhausted → enable OpenRouter fallback (already default)
- Rate limit hit → check `/admin/platform/health`