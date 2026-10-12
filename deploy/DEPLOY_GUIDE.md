# FLASH — Deploy Guide (Step by Step)

Estimated time: 30 minutes. Cost: $0.

---

## Step 0 — Prerequisites

- GitHub account with the FLASH repo pushed
- A clean main branch

Verify from terminal:

    cd D:\Flash
    git status
    git log --oneline -5

---

## Step 1 — Neon PostgreSQL (Database)

1. Go to https://neon.tech - Sign up (GitHub login is fastest)
2. Create project:
   - Name: flash-prod
   - Region: Frankfurt (closest to MENA)
   - PostgreSQL 17
3. Copy the Connection String (Pooled). Looks like:

       postgresql://user:pass@ep-xxx-pooler.eu-central-1.aws.neon.tech/flashdb?sslmode=require

4. Save it. Needed in Steps 2 and 3.

Test from PowerShell:

    cd D:\Flash\backend
    $env:DATABASE_URL = "postgresql://..."
    npm run migrate
    npm run seed
    npm run seed:atlas

Expected: 50 migrations applied, 9 domains + 42 games seeded.

---

## Step 2 — Render (Backend)

1. Go to https://render.com - Sign up with GitHub
2. Dashboard - New - Blueprint
3. Connect your flash repo
4. Render auto-detects backend/render.yaml
5. Click Apply to create the service
6. Fill environment variables:

| Key | Value |
|---|---|
| DATABASE_URL | From Step 1 |
| AUTH_SECRET | Auto-generated (leave default) |
| ADMIN_TOKEN | 24-char hex (generate random) |
| BACKUP_KEY | 32-byte base64 (generate random) |
| GROQ_API_KEY | From console.groq.com/keys |
| OPENROUTER_API_KEY | Optional |
| GEMINI_API_KEY | Optional |
| RESEND_API_KEY | Optional |

7. Click Deploy - takes ~5 minutes
8. Wait for Live status
9. Copy URL: https://flash-backend.onrender.com
10. Test:

        curl https://flash-backend.onrender.com/health
        curl https://flash-backend.onrender.com/ready

    Expected: {"ok":true,...} for both

---

## Step 3 — Update Frontend Backend URL

Edit frontend/dashboard/js/config.js:

    prod: "https://flash-backend.onrender.com",   // replace with your URL

Then update backend CORS_ORIGIN in Render dashboard:

    https://flash.pages.dev,https://your-custom-domain

---

## Step 4 — Cloudflare Pages (Frontend)

1. Go to https://dash.cloudflare.com - Pages - Create a project
2. Connect GitHub - select flash repo
3. Build settings:
   - Framework preset: None
   - Build command: echo "no build"
   - Build output directory: frontend
4. Environment variables: none (frontend is static)
5. Click Save and Deploy - takes ~2 minutes
6. Copy URL: https://flash.pages.dev

Test: open https://flash.pages.dev/frontend/dashboard/

---

## Step 5 — Custom Domain (Optional)

Cloudflare Pages - Custom domains - Add domain - flash.yourdomain.com.
SSL handled automatically.

---

## Step 6 — Monitoring (UptimeRobot)

1. https://uptimerobot.com - Sign up
2. Add New Monitor:
   - Type: HTTP(s)
   - URL: https://flash-backend.onrender.com/health
   - Interval: 5 minutes
3. Add second monitor for /ready (DB check)
4. Alerts: email on down

---

## Step 7 — Smoke Test

    curl https://flash-backend.onrender.com/health
    curl https://flash-backend.onrender.com/ready
    curl https://flash-backend.onrender.com/games
    curl https://flash-backend.onrender.com/domains

Then open https://flash.pages.dev in browser. Check:
- No console errors
- XP bar visible
- Command palette (Ctrl+K) works
- Weekly report button visible

---

## Rollback

    git revert HEAD                                  # local
    # Render:    Dashboard - Manual Deploy - Rollback
    # Cloudflare: Dashboard - Deployments - Rollback
    # Neon:       Backups - Restore point-in-time

---

## Costs (Free Tier)

| Service | Free Limit | Alerts at |
|---|---|---|
| Cloudflare Pages | Unlimited bandwidth | Never |
| Render Web | 750h/month | >1000 users |
| Neon | 1GB, 100 CU-h | >5000 users |
| Groq | 1000 req/day | >500 active users |

Total: $0/month for first ~500-1000 users.

---

## Upgrade Path

### To 1K-10K users (~$50/month)
- Neon Pro ($19/month) - 10GB, no cold starts
- Render Starter ($7/month) - no sleep

### To 10K-100K users (~$500/month)
- Neon Scale ($69/month)
- Render Standard ($25/month)
- Upstash Redis ($20/month)
- Groq paid tier

Code changes needed: 0 - just env vars (CACHE_PROVIDER=redis, etc.).

---

## Environment Variables Checklist

- [ ] DATABASE_URL (Neon pooled)
- [ ] AUTH_SECRET (64-char)
- [ ] ADMIN_TOKEN (24-char hex)
- [ ] BACKUP_KEY (32-byte base64)
- [ ] GROQ_API_KEY
- [ ] OPENROUTER_API_KEY (optional)
- [ ] GEMINI_API_KEY (optional)
- [ ] RESEND_API_KEY (optional)
- [ ] CORS_ORIGIN = https://flash.pages.dev

---

## Common Issues

### "Application failed to respond"
- Check Render logs - usually DB connection error
- Verify DATABASE_URL uses -pooler suffix
- Add ?sslmode=require if missing

### "CORS error in browser"
- Add your Pages URL to CORS_ORIGIN in Render env
- Redeploy backend (manual)

### "Render service sleeping"
- Free tier sleeps after 15 min idle
- UptimeRobot pings keep it awake
- Or upgrade to Render Starter ($7/month)

### "Migrations fail"
- Run migrate from a machine with Neon URL
- Or use Render Shell: Dashboard - Shell - npm run migrate

---

## Success Criteria

- [ ] curl /ready returns ok:true
- [ ] https://flash.pages.dev loads without errors
- [ ] Session submit works
- [ ] AI chat responds
- [ ] Weekly report shows data

All 5 pass -> ready for first 10 users.
