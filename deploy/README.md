# FLASH — Deployment Guide

## Architecture

    ┌─────────────────┐
    │  Cloudflare     │  ← Frontend (Pages)
    │  Pages          │    $0, unlimited bandwidth
    └────────┬────────┘
             │ HTTPS + CORS
    ┌────────▼────────┐
    │  Render         │  ← Backend (Web Service)
    │  Free Tier      │    $0, 750h/month
    └────────┬────────┘
             │ pg pool
    ┌────────▼────────┐
    │  Neon           │  ← PostgreSQL
    │  Free Tier      │    $0, 1GB, 100 CU-hours
    └─────────────────┘

## Backend (Render)

1. Push to `main` on GitHub
2. Render Dashboard → New → Blueprint
3. Connect repo → auto-detects `backend/render.yaml`
4. Fill secrets in dashboard:
   - `DATABASE_URL` (Neon)
   - `AUTH_SECRET` (auto-generated)
   - `ADMIN_TOKEN`
   - `BACKUP_KEY`
   - `GROQ_API_KEY`
   - `OPENROUTER_API_KEY` (optional)
   - `GEMINI_API_KEY` (optional)
   - `RESEND_API_KEY` (optional)
5. Deploy → note the URL (e.g. `https://flash-backend.onrender.com`)

## Frontend (Cloudflare Pages)

1. Cloudflare Dashboard → Pages → New Project
2. Connect GitHub repo
3. Build settings:
   - Framework preset: **None**
   - Build command: `echo "no build"`
   - Build output directory: `frontend`
4. Deploy → note the URL (e.g. `https://flash.pages.dev`)

## Post-Deploy

1. Update backend `CORS_ORIGIN` to include the Pages URL
2. Update frontend `js/config.js` BACKEND_URL.prod
3. Test: `curl https://flash-backend.onrender.com/health`
4. Setup monitoring (UptimeRobot)
5. Custom domain + SSL (Cloudflare)

## Cost (Free tier limits)

| Service | Limit | When to upgrade |
|---|---|---|
| Cloudflare Pages | Unlimited | Never (for our use case) |
| Render Web | 750h/month, sleeps after 15 min | > 1000 users |
| Neon | 1GB storage, 100 CU-h | > 5000 users |
| Groq | 1000 req/day | > 500 active users |
| Resend | 3000 emails/month | > 500 signups/month |

## Scale-Out Path

1. Set `CACHE_PROVIDER=redis` + `REDIS_URL` → 2× throughput
2. Set `QUEUE_PROVIDER=db` → durable jobs
3. Set `STORAGE_PROVIDER=s3` → unlimited blobs
4. Add second Render instance (needs Redis for shared state)
5. Migrate to Render Pro ($7/month) → no sleep

**Zero code changes required.** Just env vars.