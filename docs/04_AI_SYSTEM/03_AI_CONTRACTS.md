**Status:** Frozen — المرجع الرسمي للـ Frontend
**Date:** 2026-10-07
**Owner:** Backend
**Consumers:** Frontend Engineer

---

## 0. القواعد العامة

| البند | القاعدة |
|-------|---------|
| **Base URL (dev)** | `http://localhost:3000` |
| **Base URL (prod)** | TBD |
| **Auth** | ❌ مفيش حالياً — كل الـ endpoints تستخدم `getOrCreateDemoUser()` |
| **Content-Type** | `application/json; charset=utf-8` |
| **Language** | كل endpoint بياخد `language=en|ar` (default `en`) |
| **Response** | دايماً JSON. مفيش HTML |
| **Errors** | `{ error: "code", message?: "..." }` |

---

## 1. Common Response Envelope

كل ردود AI فيها الحقول دي:

```json
{
  "source": "llm | cache | fallback | rule | no_data | insufficient_data | static",
  "provider": "groq | openrouter | gemini | none",
  "model": "openai/gpt-oss-120b",
  "language": "en | ar",
  "latency_ms": 1234,
  "tokens": { "prompt": 100, "completion": 50, "total": 150 }
}
ملاحظة: لو source: "fallback" | "rule" | "static" → provider: "none" و model: "fallback/template".

2. Endpoints
2.1 POST /ai/recap — Session Recap
الغرض: تحليل نصي بعد انتهاء جلسة.

Request:

json
{
  "session_id": "uuid",
  "language": "en | ar"
}
Response:

json
{
  "recap": "string (2-4 sentences)",
  "language": "en",
  "model": "openai/gpt-oss-120b",
  "provider": "groq",
  "source": "llm | fallback",
  "latency_ms": 1800,
  "tokens": { "prompt": 400, "completion": 120, "total": 520 },
  "validation_issues": []
}
متى تتصل؟ بعد POST /sessions ما ينجح.

2.2 GET /ai/insights — Weekly Insights
الغرض: ملخص أسبوعي (فكرة + خطوة تالية).

Query: ?language=en|ar

Response:

json
{
  "insights": "string (3-5 sentences)",
  "week_start": "2026-09-30",
  "week_end": "2026-10-07",
  "stats": {
    "sessions": 12,
    "avg_accuracy": 78.5,
    "avg_median_rt_ms": 1200,
    "accuracy_delta": 6.4,
    "top_domain": "memory",
    "weakest_domain": "speed",
    "promotions": 2,
    "demotions": 0,
    "days_active": 5
  },
  "source": "llm | fallback | no_data",
  "language": "en",
  "model": "...",
  "provider": "groq",
  "latency_ms": 1500
}
متى تتصل؟ Dashboard load (مرة يومياً كفاية).

ملاحظة: لو مفيش sessions → source: "no_data" + stats.sessions: 0.

2.3 GET /ai/daily-plan — AI Daily Plan
الغرض: اقتراح 3-5 ألعاب النهاردة.

Query: ?language=en|ar

Response:

json
{
  "plan": [
    {
      "game_id": "flanker",
      "game_name": "Flanker Test",
      "domain_id": "attention",
      "mode": "classic",
      "minutes": 3,
      "reason": "string (max 15 words)"
    }
  ],
  "summary": "string (max 30 words)",
  "generated_at": "ISO date",
  "source": "llm | rule | cache",
  "language": "en",
  "model": "...",
  "provider": "groq",
  "latency_ms": 2000,
  "tokens": { ... }
}
متى تتصل؟ Home screen (once per session, cached 6h).

2.4 POST /ai/nudge — In-Game Micro-Coach
الغرض: رسالة قصيرة وسط اللعب (2-12 كلمة).

Request:

json
{
  "trigger": "slow_down | speed_up | tired | focus | streak_break | great_run",
  "game_id": "flanker",
  "game_name": "Flanker Test",
  "recent_accuracy": 87,
  "recent_median_rt_ms": 1200,
  "baseline_accuracy": 88,
  "baseline_rt_ms": 900,
  "consecutive_mistakes": 0,
  "session_duration_ms": 180000,
  "trials_count": 15,
  "language": "en"
}
Response:

json
{
  "message": "Response time up 40% — take a breath.",
  "trigger": "slow_down",
  "source": "llm | cache | static",
  "provider": "groq",
  "language": "en",
  "latency_ms": 800
}
متى تتصل؟

كل 5 trials

لو accuracy قل 20% عن baseline → slow_down

لو accuracy > 95% و RT ثابت → speed_up

لو 3 misses ورا بعض → focus

لو الجلسة > 10 دقايق → tired

⚠️ مهم: message جملة قصيرة جداً. الـ UI يظهرها كـ toast.

2.5 GET /ai/fingerprint — Cognitive Fingerprint
الغرض: بصمة معرفية للمستخدم.

Query: ?language=en|ar&refresh=true

Response:

json
{
  "archetype": "methodical",
  "archetype_label": "المنهجي",
  "modifiers": ["learner"],
  "modifier_labels": ["بيتحسن مع الوقت"],
  "summary": "string (3-5 sentences)",
  "traits": {
    "avg_accuracy": 91.7,
    "median_rt_ms": 2350,
    "rt_std_ms": 281,
    "accuracy_slope": 8.33,
    "top_domain": "memory",
    "top_domain_accuracy": 91.7,
    "weakest_domain": "speed",
    "weakest_domain_accuracy": 65.0,
    "unique_games_played": 12,
    "domains_touched": 4
  },
  "evidence_tier": "calibrating | provisional | established",
  "confidence": 0.13,
  "sessions_used": 4,
  "source": "llm | rule | cache | insufficient_data",
  "language": "en",
  "model": "openai/gpt-oss-120b",
  "provider": "groq",
  "latency_ms": 2500
}
8 Archetypes:
sharp_shooter, impulsive, methodical, cautious, balanced, exploring, specialist, explorer

متى تتصل؟ Profile page. Cache 6h.

ملاحظة: لو sessions_used < 3 → source: "insufficient_data" + رسالة "لسه بدري".

2.6 POST /ai/fingerprint/regenerate — Force Refresh
Request: { "language": "en | ar" }

Response: نفس /ai/fingerprint.

2.7 GET /ai/health — Provider Health
الغرض: حالة كل AI providers.

Response:

json
{
  "ok": true,
  "providers": [
    { "name": "groq", "enabled": true },
    { "name": "openrouter", "enabled": true },
    { "name": "gemini", "enabled": true }
  ],
  "health": [
    { "name": "groq", "healthy": true, "totalCalls": 5, "totalFailures": 0, "cooldown_remaining_ms": 0 }
  ]
}
متى تتصل؟ Admin/monitoring only.

3. Existing Endpoints (غير AI)
Core
Method	Path	الوصف
GET	/health	Server + DB status
GET	/sessions?limit=30	آخر الجلسات
POST	/sessions	تسجيل جلسة جديدة
GET	/plan	Daily Ritual (rule-based)
GET	/profile	بروفايل المستخدم
GET	/ability	قدرات لكل لعبة
GET	/next/:gameId	المستوى القادم
GET	/decisions	قرارات المحرك
GET	/games	36 لعبة
GET	/domains	9 domains
Full specs: docs/contracts/01_SESSION_SCHEMA.md → 04_GAME_CATALOG.md

4. Error Codes
Status	Error	المعنى
400	invalid_payload	Zod رفض الـ body
400	unsupported_game	اللعبة مش بتدعم AI generation
404	session_not_found	الجلسة مش موجودة
404	not_found	Resource عام
500	internal_error	خطأ داخلي
500	recap_failed	فشل Recap
500	insights_failed	فشل Insights
500	daily_plan_failed	فشل Plan
500	nudge_failed	فشل Nudge
500	fingerprint_failed	فشل Fingerprint
503	ai_not_configured	مفيش AI providers
5. المتبقي — Features مخطط لها
#	Endpoint	الحالة
8	POST /ai/director/start + SSE	🔜 الأصعب
3	POST /ai/generate-variant	🔜
4	GET /ai/predictions	🔜
5	POST /ai/journal + GET /ai/journal	🔜
6	POST /ai/voice	🔜
7	POST /ai/lab/start + ...	🔜
10	GET /ai/lessons	🔜
11	GET /ai/error-patterns	🔜
12	GET /ai/transfer-signals	🔜
6. Frontend Integration Rules
6.1 ما هو مسموح
✅ استخدام أي endpoint من القايمة فوق

✅ إرسال language في كل request

✅ عرض source + provider في dev mode (للتشخيص)

✅ عمل cache محلي للـ fingerprint + insights (6h TTL)

6.2 ما هو ممنوع
❌ تعديل الـ request shape

❌ الاعتماد على حقول غير موثقة

❌ إضافة ? params غير مذكورة

❌ تعديل الـ endpoints من غير مراجعة الـ backend

❌ استدعاء /ai/generate بدون game_id صحيح

6.3 ملاحظات مهمة
Retry: آمن، لأن كل endpoints idempotent (basically read-only)

Rate limit: 200 req/min — لو حصل خطأ، خد break

Timeout: 30s max per request. الـ AI calls بتاخد 1-3s عادةً

Cold start: أول call بعد startup ممكن ياخد 5s

7. Migration Checklist للـ Frontend Dev
قبل أي integration:

□ اقرأ الملف ده كامل
□ اقرأ docs/contracts/01_SESSION_SCHEMA.md (لـ POST /sessions)
□ اعمل test call لكل endpoint من Postman/PowerShell
□ تحقق من source + provider في الـ response
□ اعمل UI loading state لكل AI call
□ اعمل fallback UI لو source != "llm"

### 2.8 Director Mode — AI-Managed Session

**الغرض:** الـ AI يدير جلسة كاملة (توليد سكريبت → تعديل لحظي → ملخص نهائي).

#### Flow:
1. `POST /ai/director/start` → يولّد سكريبت 4-6 جولات
2. بعد كل جولة → `POST /ai/director/:id/checkpoint`
3. لما ينتهي → `POST /ai/director/:id/end`
4. أي وقت → `GET /ai/director/:id` (حالة الجلسة)

---

#### `POST /ai/director/start`

**Request:**
```json
{ "language": "en | ar" }
Response:

json
{
  "session_id": "uuid",
  "started_at": "ISO date",
  "script": {
    "version": 1,
    "rounds": [
      {
        "round_number": 1,
        "game_id": "flanker",
        "game_name": "Flanker Test",
        "domain_id": "attention",
        "mode": "warmup",
        "target_level": 3,
        "estimated_minutes": 2,
        "reason": "Light warmup before main work."
      }
    ],
    "rationale": "8-minute session: warmup, weakness focus, variety finish.",
    "estimated_minutes": 8
  },
  "first_round": { ...same as rounds[0]... },
  "source": "llm | rule",
  "provider": "groq",
  "model": "openai/gpt-oss-120b",
  "language": "en",
  "latency_ms": 2500,
  "tokens": { "prompt": 800, "completion": 400, "total": 1200 }
}
POST /ai/director/:id/checkpoint
Request:

json
{
  "round_number": 1,
  "game_id": "flanker",
  "accuracy": 87,
  "median_rt_ms": 950,
  "level_reached": 4,
  "duration_ms": 120000,
  "user_feedback": "energized | tired | null",
  "language": "en"
}
Response:

json
{
  "session_id": "uuid",
  "round_just_finished": 1,
  "decision": {
    "action": "continue | adjust | end_early",
    "next_round": { ...full round... } | null,
    "reason": "string (max 20 words)",
    "nudge": "string (max 12 words) | null",
    "session_progress": 0.33
  },
  "next_round": { ...same as decision.next_round... },
  "source": "llm | rule",
  "provider": "groq",
  "model": "openai/gpt-oss-120b",
  "language": "en",
  "latency_ms": 1200
}
Actions:

continue → اللاعب على المسار → next_round مأخوذ من السكريبت

adjust → غيّر الجولة الجاية (أسهل / مختلف)

end_early → أوقف الجلسة (إجهاد / فشل متكرر) → next_round = null

⚠️ Frontend Rule: لو action == "end_early" → اعتبر الجلسة خلصت، ونادي /end.

POST /ai/director/:id/end
Request:

json
{
  "abandoned": false,
  "language": "en"
}
Response:

json
{
  "session_id": "uuid",
  "ended_at": "ISO date",
  "duration_ms": 480000,
  "total_rounds": 5,
  "completed_rounds": 4,
  "avg_accuracy": 85.2,
  "avg_median_rt_ms": 920,
  "final_script": "string (3-5 sentences)",
  "highlights": [
    "Completed 4 rounds",
    "Improved accuracy by 8%"
  ],
  "next_recommendation": "string",
  "source": "llm | rule",
  "provider": "groq",
  "model": "openai/gpt-oss-120b",
  "language": "en",
  "latency_ms": 1800
}
GET /ai/director/:id
Response: كامل الجلسة (session + script + checkpoints) للـ recovery.

json
{
  "id": "uuid",
  "user_id": "uuid",
  "started_at": "ISO",
  "ended_at": "ISO | null",
  "script": { ... },
  "checkpoints": [ ... ],
  "final_state": "active | completed | abandoned | null"
}
متى تتصل؟

بعد refresh → تستعيد الجلسة

أثناء polling للتأكد من التقدم

Frontend Integration Tips
#	النصيحة
1	استخدم POST /start مرة واحدة، احتفظ بـ session_id
2	بعد كل جولة، دايماً نادي /checkpoint — مش اختياري
3	اعرض decision.reason و decision.nudge في UI (toast)
4	لو action == "end_early" → نادي /end فوراً
5	session_progress للـ progress bar
6	لو الـ checkpoint failed → retry مرة، بعدها اعتبر الجلسة انتهت
7	لازم تعمل end للجلسة حتى لو abandoned: true
'@	
𝑐
𝑜
𝑛
𝑡
𝑒
𝑛
𝑡
=
content=content + $newSection

𝑒
𝑛
𝑐
=
𝑁
𝑒
𝑤
−
𝑂
𝑏
𝑗
𝑒
𝑐
𝑡
𝑆
𝑦
𝑠
𝑡
𝑒
𝑚
.
𝑇
𝑒
𝑥
𝑡
.
𝑈
𝑇
𝐹
8
𝐸
𝑛
𝑐
𝑜
𝑑
𝑖
𝑛
𝑔
enc=New−ObjectSystem.Text.UTF8Encodingfalse
[System.IO.File]::WriteAllText(
𝑝
𝑎
𝑡
ℎ
,
path,content, 
𝑒
𝑛
𝑐
)
𝑊
𝑟
𝑖
𝑡
𝑒
−
𝐻
𝑜
𝑠
𝑡
"
𝑂
𝐾
𝐴
𝐼
𝐶
𝑂
𝑁
𝑇
𝑅
𝐴
𝐶
𝑇
𝑆
𝑣
1.
𝑚
𝑑
𝑢
𝑝
𝑑
𝑎
𝑡
𝑒
𝑑
(
enc)Write−Host"OKAI 
C
​
 ONTRACTS 
v
​
 1.mdupdated(((Get-Item $path).Length) bytes)" -ForegroundColor Green

text

---

## 🎬 Restart + اختبار

**نافذة 1:** Ctrl+C → `npm run dev`

**نافذة 2:** بعد 5 ثواني — اختبار شامل:

```powershell
Start-Sleep -Seconds 5

Write-Host "`n══════════ 1) START ══════════" -ForegroundColor Yellow
$body = @{ language = "en" } | ConvertTo-Json
[System.IO.File]::WriteAllText("$env:TEMP\d-start.json", $body, [System.Text.UTF8Encoding]::new($false))

$start = Invoke-RestMethod -Uri 'http://localhost:3000/ai/director/start' -Method Post -InFile "$env:TEMP\d-start.json" -ContentType 'application/json; charset=utf-8'

Write-Host "Session ID: $($start.session_id)"
Write-Host "Source: $($start.source) | Provider: $($start.provider) | Latency: $($start.latency_ms)ms"
Write-Host "Rationale: $($start.script.rationale)"
Write-Host "`nRounds:" -ForegroundColor Cyan
foreach ($r in $start.script.rounds) {
  Write-Host "  R$($r.round_number) [$($r.mode)] $($r.game_name) @ L$($r.target_level) ($($r.estimated_minutes)min) — $($r.reason)"
}

$sid = $start.session_id
$firstRound = $start.script.rounds[0]

Write-Host "`n══════════ 2) CHECKPOINT ══════════" -ForegroundColor Yellow
$cpBody = @{
  round_number = $firstRound.round_number
  game_id = $firstRound.game_id
  accuracy = 88
  median_rt_ms = 950
  level_reached = $firstRound.target_level
  duration_ms = 120000
  user_feedback = "energized"
  language = "en"
} | ConvertTo-Json
[System.IO.File]::WriteAllText("$env:TEMP\d-cp.json", $cpBody, [System.Text.UTF8Encoding]::new($false))

$cp = Invoke-RestMethod -Uri "http://localhost:3000/ai/director/$sid/checkpoint" -Method Post -InFile "$env:TEMP\d-cp.json" -ContentType 'application/json; charset=utf-8'

Write-Host "Action: $($cp.decision.action)"
Write-Host "Reason: $($cp.decision.reason)"
Write-Host "Nudge:  $($cp.decision.nudge)"
Write-Host "Progress: $($cp.decision.session_progress)"
if ($cp.next_round) {
  Write-Host "Next: R$($cp.next_round.round_number) $($cp.next_round.game_name) @ L$($cp.next_round.target_level)"
}

Write-Host "`n══════════ 3) GET STATE ══════════" -ForegroundColor Yellow
$state = Invoke-RestMethod "http://localhost:3000/ai/director/$sid"
Write-Host "Final state: $($state.final_state) | Checkpoints: $($state.checkpoints.Count)"

Write-Host "`n══════════ 4) END ══════════" -ForegroundColor Yellow
$endBody = @{ abandoned = $false; language = "en" } | ConvertTo-Json
[System.IO.File]::WriteAllText("$env:TEMP\d-end.json", $endBody, [System.Text.UTF8Encoding]::new($false))

$end = Invoke-RestMethod -Uri "http://localhost:3000/ai/director/$sid/end" -Method Post -InFile "$env:TEMP\d-end.json" -ContentType 'application/json; charset=utf-8'

Write-Host "Completed rounds: $($end.completed_rounds) / $($end.total_rounds)"
Write-Host "Avg accuracy: $($end.avg_accuracy)%"
Write-Host "`nFinal Script: $($end.final_script)" -ForegroundColor White
Write-Host "`nHighlights:" -ForegroundColor Cyan
$end.highlights | ForEach-Object { Write-Host "  • $_" }
Write-Host "`nNext: $($end.next_recommendation)" -ForegroundColor Green


#----------------------------------------------------------------------#



FLASH Backend — Handoff & Session Log v1.0

**التاريخ:** 2026-10-07
**الغرض:** مرجع كامل لأي AI هيشتغل على الـ Backend بعد كده
**المرجع السابق:** `docs/PROJECT_HANDOFF/` (00 → 21)

---

## ⚡ ملخص سريع

| المقياس | قبل الجلسة | بعد الجلسة |
|---------|:---:|:---:|
| Endpoints | 17 | 30 |
| DB Tables | 30 | 40 |
| AI Services | 7 | 15 |
| AI Providers | 1 (Groq) | 3 (Groq + OpenRouter + Gemini) |
| Migrations | 7 | 8 |

---

## 1. BEFORE — حالة الـ Backend قبل الجلسة

**Stack:** Fastify 5 + TypeScript 5.6 + Neon PostgreSQL 17 + Zod 3.23

**ما كان موجود:**
- ✅ Session ingestion (`POST /sessions`) + PB + badges + adaptive engine
- ✅ AI Content Generation (`POST /ai/generate`) — 36 games
- ✅ Adaptive Difficulty Engine — 540 levels
- ✅ Session Planner (`GET /plan`) — rule-based
- ✅ AI Coach Chat (`POST /ai/chat`) — AR: allam-2-7b | EN: gpt-oss-120b
- ✅ Conversation persistence
- ✅ Rule-based recommendations
- ✅ Idempotency على `client_session_id`
- ✅ 30 DB tables + 7 migrations + 17 endpoints

---

## 2. AFTER — كل حاجة اتبنت في الجلسة

### Sprint 1 — AI Features الأساسية

#### 1.1 Session Recap — `POST /ai/recap`
- LLM يكتب تحليل نصي بعد كل جلسة
- `src/services/ai/recap.ts` + `prompts-recap.ts`
- 2-4 جمل، source: llm/fallback

#### 1.2 Weekly Insights — `GET /ai/insights`
- فكرة واحدة + خطوة تالية أسبوعية
- `src/services/ai/insights.ts` + `prompts-insights.ts`
- يقارن الأسبوع الحالي باللي قبله

#### 1.3 Content Validator — `src/services/ai/validator.ts`
طبقة حماية على كل LLM output:
1. **L4 filter** — يمنع: ADHD / IQ / تشخيص / علاج / التوحد
2. **Hype filter** — يمنع: "miracle" / "عبقري"
3. **Shape validator** — JSON ناقص fields
4. **Echo detector** — كرر fact sheet
5. **Header stripper** — يشيل section headers

### Sprint 1.5 — Multi-Provider Router
src/services/ai/
├── router.ts # الموزّع الرئيسي
├── health.ts # Circuit breaker
└── providers/
├── types.ts # AIProvider interface
├── groq-provider.ts # Groq wrapper
├── openrouter-provider.ts
└── gemini-provider.ts # يدعم صيغة AQ.Ab8RN6... الجديدة

text

**Provider Order:** Groq → OpenRouter → Gemini → Rule fallback
**Circuit Breaker:** 3 فشل متتالية → cooldown 60 ثانية

### Feature 1 — In-Game Micro-Coach — `POST /ai/nudge`

- الـ frontend يبعت آخر 5 trials → رجّع جملة قصيرة (2-12 كلمة)
- **6 triggers:** slow_down, speed_up, tired, focus, streak_break, great_run
- Cache في `nudge_cache` بـ `pattern_hash`
- `src/services/ai/nudge.ts` + `prompts-nudge.ts`
- `src/routes/ai-coach.ts`

### Feature 2 — Cognitive Fingerprint — `GET /ai/fingerprint`

- AI يحلل نمط المستخدم → بصمة فريدة
- **8 Archetypes:** sharp_shooter, impulsive, methodical, cautious, balanced, exploring, specialist, explorer
- **5 Modifiers:** learner, plateaued, variable, specialist, generalist
- Rule-based classification + LLM phrasing
- Cache في `cognitive_fingerprints` (6h TTL)
- `src/services/ai/fingerprint.ts` + `prompts-fingerprint.ts`

### Feature 6 — Voice-First — `POST /ai/voice/chat`

- Multipart audio → Whisper (Groq) → Coach chat
- **Whisper model:** `whisper-large-v3-turbo`
- Auto language detection (EN/AR)
- TTS على الفرونت (Web Speech API)
- `src/services/ai/voice/transcribe.ts` + `voice-coach.ts`
- `src/routes/ai-voice.ts`
- ⚠️ محتاج `@fastify/multipart` في server.ts

### Feature 8 — Director Mode — `POST /ai/director/*`

AI يدير جلسة كاملة (4-6 جولات):
- `POST /ai/director/start` — يولّد سكريبت
- `GET /ai/director/:id` — حالة الجلسة
- `POST /ai/director/:id/checkpoint` — بعد كل جولة
- `POST /ai/director/:id/end` — ملخص نهائي

- `src/services/ai/director/types.ts`
- `src/services/ai/director/prompts.ts`
- `src/services/ai/director/session.ts`
- `src/services/ai/director/decider.ts`
- `src/routes/ai-director.ts`
- Rule-based prefilter للقرارات السريعة

### Feature 10 — Micro-Lessons — `GET /ai/lessons`

- 5 topics ثابتة مربوطة بـ domains
- درس 60 ثانية + citation حقيقي
- Auto-picks topic حسب ضعف المستخدم
- Cache في `micro_lessons` (5 أيام TTL)
- `src/services/ai/micro-lessons.ts` + `prompts-micro-lessons.ts`

### Feature 11 — Error Pattern Analysis — `GET /ai/error-patterns`

4 detectors (rule-based deterministic):
1. **post_error_slowdown** — RT بعد الخطأ > 1.25×
2. **first_trial_penalty** — أول 3 محاولات أسوأ بـ 25%
3. **late_session_fatigue** — نص تاني أسوأ بـ 15%
4. **consecutive_errors** — 3+ أخطاء متتالية

- `src/services/ai/error-patterns.ts` + `prompts-error-patterns.ts`

### Feature 1.6 — AI Health — `GET /ai/health`

- يعرض حالة كل provider + fallback chain
- `ok: true` لو provider واحد على الأقل شغال

---

## 3. Endpoints — القايمة الكاملة (30)

### Core (10)
| Method | Path | الوصف |
|--------|------|-------|
| GET | `/health` | حالة السيرفر + DB |
| GET | `/domains` | 9 domains |
| GET | `/games` | 36 لعبة |
| GET | `/plan` | Daily Ritual (rule-based) |
| GET | `/profile` | بروفايل + recs |
| GET | `/ability` | قدرة المستخدم |
| GET | `/next/:gameId` | المستوى القادم |
| GET | `/decisions` | قرارات المحرك |
| GET | `/sessions` | آخر 30 جلسة |
| POST | `/sessions` | ingest كامل |

### AI Core (7)
| Method | Path | الوصف |
|--------|------|-------|
| GET | `/ai/status` | حالة AI |
| POST | `/ai/generate` | توليد محتوى |
| POST | `/ai/chat` | AI Coach Chat |
| GET | `/ai/conversations` | المحادثات |
| GET | `/ai/conversations/:id` | رسائل محادثة |
| POST | `/ai/recap` | تحليل جلسة |
| GET | `/ai/insights` | ملخص أسبوعي |

### AI Features الجديدة (13)
| Method | Path | الوصف |
|--------|------|-------|
| GET | `/ai/daily-plan` | خطة يومية بالـ AI |
| POST | `/ai/nudge` | مدرب لحظي |
| GET | `/ai/fingerprint` | بصمة معرفية |
| POST | `/ai/fingerprint/regenerate` | إعادة توليد |
| GET | `/ai/error-patterns` | تحليل الأخطاء |
| GET | `/ai/lessons/topics` | قايمة المواضيع |
| GET | `/ai/lessons` | درس تلقائي |
| GET | `/ai/lessons/:topic` | درس محدد |
| POST | `/ai/lessons/regenerate` | تجديد |
| POST | `/ai/director/start` | بداية جلسة مُدارة |
| GET | `/ai/director/:id` | حالة الجلسة |
| POST | `/ai/director/:id/checkpoint` | نتيجة جولة |
| POST | `/ai/director/:id/end` | نهاية الجلسة |
| GET | `/ai/voice/status` | حالة Voice |
| POST | `/ai/voice/chat` | محادثة صوتية |
| GET | `/ai/health` | صحة الـ providers |

---

## 4. File Structure
backend/src/
├── config/
│ ├── env.ts (added: GROQ_MODEL_FAST, VOICE_MODEL, VOICE_MAX_BYTES)
│ └── db.ts
├── migrations/
│ ├── 001_identity.sql
│ ├── 002_catalog.sql
│ ├── 003_facts.sql
│ ├── 004_derived.sql
│ ├── 005_ai.sql
│ ├── 006_difficulty.sql
│ ├── 007_ai_coach.sql
│ └── 008_ai_extended.sql 🆕 (11 tables)
├── routes/
│ ├── ai.ts ✏️ (+recap, insights, daily-plan, health)
│ ├── ai-coach.ts 🆕 (nudge)
│ ├── ai-profile.ts 🆕 (fingerprint, error-patterns, lessons)
│ ├── ai-director.ts 🆕 (director mode)
│ ├── ai-voice.ts 🆕 (voice chat)
│ ├── games.ts
│ ├── health.ts
│ ├── next.ts
│ ├── plan.ts
│ ├── profile.ts
│ └── sessions.ts
├── services/
│ ├── ai/
│ │ ├── groq-client.ts (legacy)
│ │ ├── gemini-client.ts (legacy)
│ │ ├── coach.ts ✏️ (uses router)
│ │ ├── context.ts
│ │ ├── generate.ts ✏️ (router + validator)
│ │ ├── prompts.ts
│ │ ├── prompts-base.ts
│ │ ├── prompts-extended.ts
│ │ ├── recap.ts 🆕
│ │ ├── prompts-recap.ts 🆕
│ │ ├── insights.ts 🆕
│ │ ├── prompts-insights.ts 🆕
│ │ ├── daily-plan.ts 🆕
│ │ ├── prompts-daily-plan.ts 🆕
│ │ ├── validator.ts 🆕
│ │ ├── nudge.ts 🆕
│ │ ├── prompts-nudge.ts 🆕
│ │ ├── fingerprint.ts 🆕
│ │ ├── prompts-fingerprint.ts 🆕
│ │ ├── error-patterns.ts 🆕
│ │ ├── prompts-error-patterns.ts 🆕
│ │ ├── micro-lessons.ts 🆕
│ │ ├── prompts-micro-lessons.ts 🆕
│ │ ├── health.ts 🆕 (circuit breaker)
│ │ ├── router.ts 🆕 (multi-provider)
│ │ ├── director/ 🆕
│ │ │ ├── types.ts
│ │ │ ├── prompts.ts
│ │ │ ├── session.ts
│ │ │ └── decider.ts
│ │ ├── voice/ 🆕
│ │ │ ├── transcribe.ts
│ │ │ └── voice-coach.ts
│ │ └── providers/ 🆕
│ │ ├── types.ts
│ │ ├── groq-provider.ts
│ │ ├── openrouter-provider.ts
│ │ └── gemini-provider.ts
│ ├── difficulty/
│ ├── derive.ts
│ ├── pb.ts
│ ├── planner.ts
│ ├── recommendations.ts
│ ├── badges.ts
│ └── users.ts
├── schemas/
├── migrate.ts
├── seed.ts
└── server.ts ✏️ (multipart + 5 new routes)

docs/
├── BACKEND_HANDOFF_v1.md 🆕 (هذا الملف)
└── AI_CONTRACTS_v1.md (pending)

text

---

## 5. Database Tables (40)

### Identity (2)
`users`, `devices`

### Catalog (5)
`domains`, `games`, `game_domain_weights`, `badges`, `norms`

### Facts (2)
`sessions`, `session_trials`

### Derived (4)
`personal_bests`, `user_game_stats`, `domain_scores`, `user_badges`

### Sync + Ops (6)
`user_sync_state`, `user_settings`, `play_tickets`, `integrity_events`, `import_batches`, `_migrations`

### AI Base (6)
`user_cognitive_profile`, `ai_recommendation_log`, `adaptive_difficulty_state`, `generated_content_cache`, `ai_conversations`, `ai_messages`

### Difficulty (3)
`difficulty_configs` (540 rows), `player_game_ability`, `engine_decisions`

### Extended 🆕 (11 — Migration 008)
`nudge_cache`, `cognitive_fingerprints`, `game_variants`, `predictions`, `journal_entries`, `lab_experiments`, `micro_lessons`, `director_sessions`, `voice_requests`, `transfer_signals`, `error_patterns`

---

## 6. Environment Variables

```env
# Server
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
LOG_LEVEL=info

# Database
DATABASE_URL=postgresql://...

# Auth
AUTH_SECRET=...
AUTH_URL=http://localhost:3000

# AI — Groq (primary)
GROQ_API_KEY=gsk_...
GROQ_MODEL_EN=openai/gpt-oss-120b
GROQ_MODEL_AR=allam-2-7b
GROQ_MODEL_FAST=openai/gpt-oss-20b

# AI — Gemini (fallback)
GEMINI_API_KEY=AQ.Ab8RN6...     # صيغة جديدة من Google
GEMINI_MODEL=gemini-2.0-flash

# AI — OpenRouter (fallback)
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=google/gemini-2.0-flash-exp:free

# Voice
VOICE_MODEL=whisper-large-v3-turbo
VOICE_MAX_BYTES=10485760

# Email
RESEND_API_KEY=...
EMAIL_FROM=FLASH <noreply@flash.app>

# Frontend
CORS_ORIGIN=http://localhost:5173,https://flash.pages.dev
7. القواعد الذهبية
7.1 Evidence Ladder
Level	النوع	مسموح؟
L0	Observed	✅
L1	Derived	✅
L2	Estimated	✅
L3	Hypothesized	✅
L4	Clinical	🚫 PROHIBITED
L4 Forbidden: ADHD / IQ / depression / autism / diagnosis / therapy / cure / "brain age" / "طبي" في سياق طبي

7.2 AI Rules
✅ LLM phrases insights; it does NOT invent them

✅ كل LLM output يمر على validator.ts

✅ Model Routing: AR → allam-2-7b | EN → gpt-oss-120b

✅ كل AI بيمر على router.ts

❌ ممنوع hype words / exclamation marks / emojis

❌ ممنوع مقارنة المستخدم بالآخرين

7.3 Code Rules
✅ Fastify 5 + TypeScript strict + Zod

✅ ESM imports (.js suffix)

✅ await fastify.register(...) لكل route

✅ UTF8Encoding $false في PowerShell للملفات اللي فيها عربي

❌ مفيش تغيير للـ contracts

❌ مفيش touch للـ frontend

7.4 Cache Strategy
Service	TTL	Location
daily-plan	6h	In-memory
fingerprint	6h	DB
error-patterns	6h	In-memory
micro-lessons	5d	DB
nudge	∞	DB (pattern hash)
7.5 Model Selection Gotchas
gpt-oss-120b is a reasoning model — needs max_tokens >= 500 (consumes ~300 on internal reasoning)

allam-2-7b is fast but generic — needs strong rules + negative examples

OpenRouter models often change names — always verify availability

8. Known Issues
#	المشكلة	الحالة
1	nudge latency ~2.5s (بطيء)	🟡 يحتاج تحسين
2	OpenRouter: llama-3.3-70b-instruct:free اتشال — استبدلناه بـ gemini-2.0-flash-exp:free	✅
3	Gemini keys بصيغة جديدة تحتاج x-goog-api-key header	✅
4	مفيش /ai/health كان — اتضاف	✅
5	AR reasons generic في allam-2-7b	🟡 مقبول
6	مفيش tests	🟡 Sprint 5
7	Auth = demo user only	🟡 Sprint 2 (مؤجل)
8	Sync = pending	🟡 Sprint 3 (مؤجل)
9. المتبقي — Features قادمة
Features مخططة (5)
#	Feature	Status
3	Dynamic Game Variants	🔜
4	Predictive Coach	🔜
5	AI Journal	🔜
7	AI Lab	🔜
12	Transfer Tracker	🔜
Sprints الكبار (مؤجلة)
Sprint 2 — Auth (Better Auth + Resend)

Sprint 3 — Sync (offline-first)

Sprint 4 — Polish (tests + Dockerfile + Pino)

10. Test Commands
Health check
powershell
Invoke-RestMethod http://localhost:3000/health
Invoke-RestMethod http://localhost:3000/ai/health
Session ingest
powershell
$body = @{
  schema_version = 1
  client_session_id = [guid]::NewGuid().ToString()
  game_id = "seq-mem"
  domain_id = "memory"
  mode = "classic"
  seed = "test1234abcd5678"
  started_at = (Get-Date).AddMinutes(-2).ToUniversalTime().ToString("o")
  ended_at = (Get-Date).ToUniversalTime().ToString("o")
  game_version = "1.0.0"
  scoring_version = 1
  trials = @(@{ index=0; rt_ms=2000; correct=$true; is_practice=$false; stimulus=@{}; response=@{} })
  config = @{ max_lives=3 }
  client_meta = @{ user_agent="PS"; viewport=@{w=1920;h=1080}; device_id="test"; device_clock_skew_ms=$null }
  source = "live"
} | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri 'http://localhost:3000/sessions' -Method Post -Body $body -ContentType 'application/json'
AI Recap
powershell
$sid = (Invoke-RestMethod http://localhost:3000/sessions).sessions[0].id
$body = @{ session_id = $sid; language = "ar" } | ConvertTo-Json
[System.IO.File]::WriteAllText("$env:TEMP\recap.json", $body, [System.Text.UTF8Encoding]::new($false))
Invoke-RestMethod -Uri 'http://localhost:3000/ai/recap' -Method Post -InFile "$env:TEMP\recap.json" -ContentType 'application/json; charset=utf-8'
AI Insights
powershell
Invoke-RestMethod 'http://localhost:3000/ai/insights?language=ar'
Daily Plan
powershell
Invoke-RestMethod 'http://localhost:3000/ai/daily-plan?language=ar'
Nudge
powershell
$body = @{
  trigger = "great_run"; game_id = "flanker"; game_name = "Flanker Test"
  recent_accuracy = 96; recent_median_rt_ms = 780
  baseline_accuracy = 90; baseline_rt_ms = 850
  consecutive_mistakes = 0; session_duration_ms = 150000
  trials_count = 10; language = "en"
} | ConvertTo-Json
[System.IO.File]::WriteAllText("$env:TEMP\nudge.json", $body, [System.Text.UTF8Encoding]::new($false))
Invoke-RestMethod -Uri 'http://localhost:3000/ai/nudge' -Method Post -InFile "$env:TEMP\nudge.json" -ContentType 'application/json; charset=utf-8'
Fingerprint
powershell
Invoke-RestMethod 'http://localhost:3000/ai/fingerprint?language=ar'
Error Patterns
powershell
Invoke-RestMethod 'http://localhost:3000/ai/error-patterns?language=ar'
Micro-Lessons
powershell
Invoke-RestMethod 'http://localhost:3000/ai/lessons/topics'
Invoke-RestMethod 'http://localhost:3000/ai/lessons?language=ar'
Invoke-RestMethod 'http://localhost:3000/ai/lessons/working_memory?language=en'
Director Mode
powershell
# Start
$body = @{ language = "en" } | ConvertTo-Json
[System.IO.File]::WriteAllText("$env:TEMP\d.json", $body, [System.Text.UTF8Encoding]::new($false))
$start = Invoke-RestMethod -Uri 'http://localhost:3000/ai/director/start' -Method Post -InFile "$env:TEMP\d.json" -ContentType 'application/json; charset=utf-8'
$sid = $start.session_id

# Checkpoint
$cp = @{
  round_number = 1; game_id = $start.script.rounds[0].game_id
  accuracy = 88; median_rt_ms = 950; level_reached = 3
  duration_ms = 120000; user_feedback = "energized"; language = "en"
} | ConvertTo-Json
[System.IO.File]::WriteAllText("$env:TEMP\cp.json", $cp, [System.Text.UTF8Encoding]::new($false))
Invoke-RestMethod -Uri "http://localhost:3000/ai/director/$sid/checkpoint" -Method Post -InFile "$env:TEMP\cp.json" -ContentType 'application/json; charset=utf-8'

# End
$end = @{ abandoned = $false; language = "en" } | ConvertTo-Json
[System.IO.File]::WriteAllText("$env:TEMP\end.json", $end, [System.Text.UTF8Encoding]::new($false))
Invoke-RestMethod -Uri "http://localhost:3000/ai/director/$sid/end" -Method Post -InFile "$env:TEMP\end.json" -ContentType 'application/json; charset=utf-8'
Voice Status
powershell
Invoke-RestMethod 'http://localhost:3000/ai/voice/status'
11. Common Commands
powershell
# Development
cd D:\Flash\backend
npm run dev

# Migration
npm run migrate

# Seed
npm run seed
npm run seed:atlas

# Type check
npx tsc --noEmit

# Kill all node
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Clear caches (لما تحتاج تجبر إعادة توليد)
powershell
$clear = @'
import { pool } from './src/config/db.js';
await pool.query('DELETE FROM micro_lessons');
await pool.query('DELETE FROM cognitive_fingerprints');
await pool.query('DELETE FROM nudge_cache');
console.log('cleared');
process.exit(0);
'@
$enc = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText("D:\Flash\backend\temp-clear.ts", $clear, $enc)
cd D:\Flash\backend
npx tsx temp-clear.ts
Remove-Item "D:\Flash\backend\temp-clear.ts"
12. Lessons Learned (مهمة للـ AI الجديد)
12.1 PowerShell + Arabic
دايماً استخدم [System.IO.File]::WriteAllText($path, $content, (New-Object System.Text.UTF8Encoding $false))

Write-Host بيبوّظ العربي في الكونسول — استخدم ConvertTo-Json للعرض

-replace مع \r\n بيكسر الملفات — استخدم .Replace() string method

12.2 Groq Models
openai/gpt-oss-120b = reasoning — محتاج max_tokens >= 500 دايمًا

openai/gpt-oss-20b = أسرع للـ simple tasks

allam-2-7b = للعربي بس

الموديلات بتتغير على Groq — دايماً تحقق من /v1/models

12.3 OpenRouter
الموديلات الـ :free بتتشال بسرعة

استخدم google/gemini-2.0-flash-exp:free كـ fallback

تأكد إن الـ slug موجود قبل ما تستخدمه

12.4 Gemini
الصيغة الجديدة: AQ.Ab8RN6... (مش AIzaSy...)

تحتاج x-goog-api-key header (مش ?key=)

Endpoint: generativelanguage.googleapis.com/v1beta/models/{model}:generateContent

12.5 Circular Imports
دايمًا استخدم dynamic await import('../planner.js') لو محتاج تكسر circular dependency

13. Instructions للـ AI الجديد
13.1 قبل ما تبدأ
اقرأ الملف ده كامل

اقرأ docs/PROJECT_HANDOFF/00_INDEX.md

اقرأ docs/contracts/01_SESSION_SCHEMA.md + 04_GAME_CATALOG.md

اقرأ docs/06_PLAYER_INTELLIGENCE.md (Evidence Ladder)

بص على backend/src/server.ts + backend/src/services/ai/router.ts

بص على backend/src/services/ai/validator.ts

13.2 القواعد
✅ Full files only — مفيش partial/diffs

✅ Name + Path + Type قبل كل code block

✅ كل تعديل = اختبره قبل "تمم"

✅ Migration جديدة = رقم جديد (009_...)، متعدّلش القديمة

✅ Arabic text في PowerShell = UTF8Encoding $false

❌ متعدّلش الـ contracts

❌ متـلـمسش الـ frontend

❌ متخترعش L4 claims

13.3 الأولويات القادمة
Feature 12 — Transfer Tracker (الأسهل)

Feature 4 — Predictive Coach (الأعمق)

Feature 5 — AI Journal (opt-in)

Feature 7 — AI Lab

Feature 3 — Dynamic Game Variants (الأصعب)

Sprint 2 — Auth

Sprint 3 — Sync

Sprint 4 — Polish + Deployment

13.4 آخر 3 حاجات اتعملت (للـ context)
Micro-Lessons — Feature 10، شغال بالكامل AR + EN

Error Patterns — Feature 11، شغال (يحتاج بيانات أكتر)

Multi-Provider Router — كل AI بيمر عليه

14. Contact Points & Docs
Contracts: docs/contracts/01_SESSION_SCHEMA.md → 04_GAME_CATALOG.md

Player Intelligence: docs/06_PLAYER_INTELLIGENCE.md

AI & Adaptive Engine: docs/07_AI_AND_ADAPTIVE_ENGINE.md

Strategies: docs/STRATEGY_AND_ARCHITECTURE.md

Backend Handoff: هذا الملف

آخر تحديث: 2026-10-07
الإصدار: v1.0
Next AI: ابدأ من قسم 13.3 الأولويات القادمة