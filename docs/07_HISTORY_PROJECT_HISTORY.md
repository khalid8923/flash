## 2.1 البداية

المشروع بدأ كـ **41 لعبة** عبر **10 domains** (استنادًا لـ CHC Theory). كل لعبة كانت **4 ملفات** فقط (config, html, css, js).

### 2.2 التغييرات الكبرى

| المرحلة | التغيير | السبب |
|---|---|---|
| **البداية** | 41 لعبة × 4 ملفات | الخطة الأصلية |
| **التقليص** | 36 لعبة × 9 domains | 41 كانت طموحة جدًا |
| **التوسيع** | 8 ملفات لكل لعبة | فصل المسؤوليات |
| **Shared Systems** | i18n + settings + flash-stages | تقليل التكرار |
| **5 مودات** | Classic + Speed + Endless + Precision + Daily | عمق أكبر |
| **8 مراحل** | لكل لعبة | تقدم تدريجي |
| **EN + AR** | من البداية | جمهور أوسع |

### 2.3 المعمارية الأولى (الفرونت القديم)
Frontend (dashboard + 36 games)
├── dashboard: FLASH.html + flash.css + 3 JS
├── 36 games × 8 files
├── shared: i18n + settings + flash-stages
└── Storage: localStorage

text

**نقاط مهمة:**
- كل لعبة **self-contained**
- iframe isolation
- postMessage للتواصل مع dashboard
- localStorage بصيغة `flash:{game-id}:{type}`

## 2.4 العقود الأربعة (Contracts v1.0)

4 ملفات تم إنشاؤها كمواصفات ملزمة:

| # | الملف | الغرض |
|---|---|---|
| 1 | `docs/contracts/01_SESSION_SCHEMA.md` | شكل الـ session الواحدة |
| 2 | `docs/contracts/02_TRIAL_SCHEMA.md` | شكل الـ trial الواحد |
| 3 | `docs/contracts/03_POSTMESSAGE_PROTOCOL.md` | العقد بين Shell ↔ Game |
| 4 | `docs/contracts/04_GAME_CATALOG.md` | مواصفات 36 لعبة |

**الهدف:** تجميد العقود قبل أي implementation.

## 2.5 بناء الباك إند (بعدها)

### المرحلة 1 — البنية التحتية
- **Framework:** Fastify 5.1 (اخترناه لأنه أسرع 3x من Express)
- **Database:** Neon PostgreSQL (مجاني + لا يتوقف)
- **Language:** TypeScript 5.6
- **Validation:** Zod 3.23

### المرحلة 2 — Migrations (7 ملفات)
001_identity.sql → users, devices
002_catalog.sql → domains, games, badges, norms
003_facts.sql → sessions, session_trials
004_derived.sql → PB, stats, sync, ops
005_ai.sql → AI tables
006_difficulty.sql → Atlas + ability + decisions
007_ai_coach.sql → conversations + messages

text

### المرحلة 3 — Seed Data
- 9 domains
- 36 games (مع تفاصيل كاملة)
- 15 badges
- 540 مستوى في Atlas

### المرحلة 4 — AI Content Generation
- **Provider:** Groq (مجاني)
- **Model:** `openai/gpt-oss-120b`
- **36 prompt templates** — واحدة لكل لعبة
- **Cache** في `generated_content_cache`

### المرحلة 5 — Adaptive Difficulty Engine
- **Weighted Staircase** (بدون ML)
- **EMA** لتحديث القدرة
- **Frustration Cap** عند 3 fails
- **10 Reason Codes** للتفسير

### المرحلة 6 — Session Planner
- خطة يوم من 3 جلسات
- Warmup → Train → Challenge
- يستخدم ability + weaknesses

### المرحلة 7 — AI Coach Chat
- **Arabic:** `allam-2-7b` (SDAIA) مع context compression
- **English:** `gpt-oss-120b` مع context كامل
- يحفظ المحادثات في DB

## 2.6 استكشاف الفرونت الجديد (Antigravity)

### الفكرة
تصميم جديد اسمه **"The Folio Hand"** — طابع editorial/forensic manuscript.

### العناصر
- **Colors:** Vellum (#EFE7D3) + Ink (#1E2230) + Rubric (#B2341A)
- **Fonts:** Fraunces + Martian Mono + Amiri
- **Motion:** The Entry (خط يرسم + رقم يصعد + marks)
- **Layout:** Two-column، registration marks، hairlines

### الحالة
**متوقف مؤقتًا** — بسبب مشاكل تقنية (3 CSS files مفقودة + Access Denied في PowerShell).

## 2.7 الجدول الزمني

| التاريخ | الحدث |
|---|---|
| **قبل 2026-10-04** | 31 لعبة في الفرونت القديم |
| **2026-10-04** | 5 ألعاب جديدة (seq-mem, etc.) + handoff v6 |
| **2026-10-06** | إنشاء 4 contracts + backend foundation + 23 جدول |
| **2026-10-06** | Difficulty Atlas (3 ألعاب) + AI Content (7 ألعاب) |
| **2026-10-06** | توسيع Atlas إلى 36 لعبة + 540 مستوى |
| **2026-10-06** | توسيع AI Content إلى 36 لعبة |
| **2026-10-07** | Session Planner + AI Coach Chat |
| **2026-10-07** | تجربة Antigravity Frontend (متوقف) |

## 2.8 المشاكل الكبرى والحلول

| # | المشكلة | الحل |
|---|---|---|
| 1 | PostgreSQL BOM error في migrations | Strip `\uFEFF` من الملفات |
| 2 | AUTH_SECRET قصير جدًا | Auto-generate 64-char |
| 3 | Groq model deprecated | تغيير من `llama-3.3-70b` إلى `gpt-oss-120b` |
| 4 | Arabic context overflow | Context compression لـ allam-2-7b |
| 5 | PowerShell + Arabic encoding | `charset=utf-8` + Save to file |
| 6 | PowerShell + Emojis في scripts | شيل الإيموجي |
| 7 | Duplicate renderTabs | إزالة التعريف الأول |
| 8 | EADDRINUSE port 3000 | Kill node processes |

## 2.9 ما تم رفضه

| الشيء | السبب |
|---|---|
| React/Vue/Svelte | framework lock-in |
| TypeScript في الفرونت | build step |
| Vite/Webpack | build step |
| Tailwind | framework |
| shadcn/ui | يعتمد على React |
| Gemini API | mشاكل deprecation + timeouts |
| confetti/emojis | لا يناسب الطابع الجدي |
'@

$utf8 = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText("D:\Flash\docs\PROJECT_HANDOFF\02_PROJECT_HISTORY.md", $content, $utf8)
Write-Host "Created 02_PROJECT_HISTORY.md" -ForegroundColor Green