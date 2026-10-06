# FLASH — Strategy & Architecture Document v1.0

**Status:** Living Document (يتحدث باستمرار)
**Date:** 2026-10-06
**Owner:** Khalid (Founder) + AI Team
**Purpose:** مرجع استراتيجي شامل للمشروع — للمؤسس، للـ AI الجاي، وللمستثمرين

---

## 🎯 PART 1: الرؤية والمشروع

### 1.1 إيه هو FLASH؟

**FLASH** = منصة تدريب معرفي في المتصفح، مبنية على paradigms علمية حقيقية (peer-reviewed)، بديل مجاني لـ Lumosity / Peak / BrainHQ.

### 1.2 المشكلة في السوق

| المشكلة | الحل بتاعنا |
|---|---|
| المنصات الحالية (Lumosity, Peak) مدفوعة + مش حقيقية علمياً | مجاني + كل لعبة بـ citation أكاديمي |
| المحتوى ثابت وبيتكرر (المستخدم بيحفظ الإجابات) | **AI توليدي** — محتوى لا نهائي |
| تجربة واحدة للجميع (one-size-fits-all) | **AI تكييفي** — تجربة مخصصة لكل مستخدم |
| مفيش تحليل حقيقي للأداء | **AI تشخيصي** — تحليل أنماط عميق |
| مش داعم للعربية | EN + AR من اليوم الأول |

### 1.3 الفكرة المميزة (الميزة القاتلة)

**"FLASH مش مجرد ألعاب — ده محرك AI توليدي بيخلق محتوى معرفي مخصص لكل مستخدم في الوقت الفعلي."**

الـ AI بتاعنا بيعمل 3 حاجات مفيش حد تاني بيعملها كلها في نفس الوقت:

1. **توليد محتوى لا نهائي** — بدل بنك أسئلة ثابت
2. **تكييف لحظي** — كل جلسة مختلفة حسب أداء المستخدم
3. **تشخيص عميق** — تحليل الأنماط الدقيقة (مش بس صح/غلط)

---

## 🏗️ PART 2: المعمارية (Architecture)

### 2.1 الرسم العام
┌─────────────────────────────────────────────────────────────┐
│ │
│ Cloudflare Pages (Frontend) ← مجاني 100% │
│ ├─ Shell (Dashboard) │
│ ├─ IndexedDB replica (sessions + outbox) │
│ ├─ MessageChannel bridge │
│ └─ 36 Game iframes (sandboxed, stateless) │
│ │
└──────────────────────┬──────────────────────────────────────┘
│ HTTPS
┌──────────────────────▼──────────────────────────────────────┐
│ │
│ Render (Backend — Fastify + TypeScript) ← مجاني 100% │
│ ├─ /auth/* (Better Auth) │
│ ├─ /sessions (Ingest raw trials) │
│ ├─ /sync (Push + Pull) │
│ ├─ /profile (Derived cognitive profile) │
│ └─ /ai/* (AI endpoints) │
│ │
└──────────────────────┬──────────────────────────────────────┘
│
┌──────────────┼──────────────┐
│ │ │
┌───────▼──────┐ ┌────▼─────┐ ┌─────▼────────┐
│ │ │ │ │ │
│ Neon │ │ GroqCloud│ │ Resend │
│ PostgreSQL │ │ LLM API │ │ Email │
│ (Free 1GB) │ │ (Free) │ │ (Free 3k) │
│ │ │ │ │ │
└──────────────┘ └──────────┘ └──────────────┘

text

### 2.2 الـ Stack الكامل

| Layer | Technology | Cost | Notes |
|---|---|---|---|
| **Frontend Hosting** | Cloudflare Pages | $0 | Unlimited bandwidth, global CDN |
| **Backend Hosting** | Render Free Tier | $0 | 750 hours/month, sleep after 15min idle |
| **Database** | Neon PostgreSQL | $0 | 100 projects, 1GB each, no auto-pause |
| **AI — Primary** | GroqCloud | $0 | Fast LLM inference, generous free tier |
| **AI — Fallback** | OpenRouter | $0 | 50 requests/day, 25+ models |
| **Email** | Resend | $0 | 3,000 emails/month |
| **Domain** | Cloudflare | $0 | SSL مجاني |
| **Total Monthly Cost** | | **$0** | ✅ |

---

## 💰 PART 3: التكاليف والمقارنة

### 3.1 لماذا مجاني 100%؟

الهدف من المرحلة الجاية هو **إثبات الفكرة للمستثمر**. مش محتاجين ندفع أي حاجة لما نقدر نشتغل بالخدمات المجانية.

### 3.2 جدول الخدمات المجانية

| الخدمة | الخطة المجانية | كفاية لحد |
|---|---|---|
| **Cloudflare Pages** | غير محدود | ∞ |
| **Render Web Service** | 750 ساعة/شهر | 1000 مستخدم |
| **Neon PostgreSQL** | 100 مشروع × 1GB | 10,000 مستخدم |
| **GroqCloud** | Rate-limited (يومي) | 500 مستخدم |
| **OpenRouter** | 50 طلب/يوم | fallback فقط |
| **Resend** | 3,000 إيميل/شهر | 500 مستخدم |
| **Better Auth** | Self-hosted | ∞ |

### 3.3 لو احتجنا نرقّي (بعد ما ييجي مستثمر)

| المرحلة | التكلفة المتوقعة | التغطية |
|---|---|---|
| **500-1000 مستخدم** | ~$15-25/شهر | Railway + Neon Pro |
| **5000 مستخدم** | ~$75-100/شهر | Scale up |
| **50000 مستخدم** | ~$300-500/شهر | Full production |

---

## 🧠 PART 4: استراتيجية الـ AI — التفاصيل الكاملة

### 4.1 المستويات الخمسة للـ AI

| المستوى | التقنية | التكلفة | متى يتفعّل | الأولوية |
|---|---|---|---|---|
| **0** | Static (مفيش AI) | $0 | دلوقتي | ✅ موجود |
| **1** | Rule-Based Recommendations | $0 | المرحلة 2 | 🔴 عالية |
| **2** | Adaptive Difficulty (DDA) | $0 | المرحلة 2 | 🔴 عالية |
| **3** | Generative Content (LLM) | $0 (Groq) | المرحلة 3 | 🔴 عالية |
| **4** | AI Coach (LLM) | $0 (Groq) | المرحلة 4 | 🟡 متوسطة |
| **5** | Custom ML Model | $50-200/شهر | 100K+ session | ⚪ مستقبلي |

### 4.2 المستوى 1: Rule-Based Recommendations

**الفكرة:** قواعد بسيطة مبنية على بيانات المستخدم.

**المنطق:**
لو domain score < 50 → رشح أسهل لعبة فيه

لو domain score 50-70 → رشح لعبة متوسطة

لو domain score > 70 → رشح تحدي أعلى

لو مفيش session من 3 أيام → رشح "Daily"

لو المستخدم ثابت في أداء معين → رشح لعبة جديدة

text

**التكلفة:** $0 — بيشتغل على السيرفر العادي.

### 4.3 المستوى 2: Adaptive Difficulty (DDA)

**الفكرة:** تعديل صعوبة كل لعبة تلقائياً حسب أداء المستخدم.

**المنطق:**
خد آخر 5 sessions للمستخدم

احسب mean accuracy + consistency (std dev)

لو accuracy > 85% و consistency < 10% → ارفع الصعوبة

لو accuracy < 60% → خفف الصعوبة

لو consistency > 20% → استنى (المستخدم متقلب)

text

**التكلفة:** $0

### 4.4 المستوى 3: Generative Content — الميزة القاتلة ⭐

**الفكرة:** الـ LLM بيولّد محتوى جديد لكل لعبة، بدل بنك أسئلة ثابت.

**إزاي يشتغل؟**
User Request:
"أنا محتاج سؤال verbal-analogies صعوبة 7/10"

Backend sends to Groq:
{
"game": "verbal-analogies",
"difficulty": 7,
"relation_type": "part-whole",
"avoid": ["previous 50 analogies"],
"language": "en",
"format": { "a": "string", "b": "string", "c": "string",
"options": ["string", "string", "string", "string"],
"correct_index": 0 }
}

Groq returns in ~200ms:
{
"a": "wheel",
"b": "car",
"c": "petal",
"options": ["flower", "leaf", "stem", "root"],
"correct_index": 0
}

text

**الميزة القاتلة:**
- **محتوى لا نهائي** — مفيش حفظ إجابات
- **تشخيص أنضف** — كل trial على محتوى جديد
- **تجربة فريدة** — كل مستخدم بيشوف حاجات مختلفة

**التطبيق على الألعاب:**

| اللعبة | نوع التوليد | مثال |
|---|---|---|
| `verbal-analogies` | Generate A-B-C + options | "wheel:car :: petal:?" |
| `vocabulary-elite` | Generate word + 3 distractors | "Happy → (Glad, Sad, Angry, Tired)" |
| `syllogisms` | Generate premises + conclusion | "All men are mortal..." |
| `argument-analyzer` | Generate fallacy example | "Ad hominem example..." |
| `matrix-logic` | Generate pattern + tile options | 3x3 matrix with rule |
| `alternative-uses` | Generate object | "List uses for: umbrella" |
| `story-spark` | Generate 3-word prompt | "Lighthouse, whisper, midnight" |

**التكلفة:** $0 (Groq free tier)

**Fallback:** لو Groq استهلك، OpenRouter (50 requests/day).

### 4.5 المستوى 4: AI Coach

**الفكرة:** مساعد ذكي يشرح للمستخدم ويقدم نصائح مخصصة.

**مثال:**
User: "ليه درجاتي في N-Back واطية؟"

AI Coach:
"من آخر 10 sessions، دقتك بتقل بعد الـ Level 3.
ده طبيعي — N-Back بيتحدى ذاكرتك العاملة.
أنصحك بـ:

تلعب Precision Mode لمدة 3 أيام

ترتاح 10 دقايق بين الـ sessions

تجرب Corsi Blocks لتقوية الذاكرة البصرية"

text

**التكلفة:** $0 (Groq)

### 4.6 المستوى 5: Custom ML Model (مستقبلي)

**التكلفة:** $50-200/شهر (GPU)
**متى:** بعد 100K+ session
**الهدف:** نموذج يتنبأ بأداء المستخدم قبل ما يلعب.

---

## 🗄️ PART 5: Data Model للـ AI

### 5.1 الجداول الإضافية (فوق الـ Contracts)

**جدول `user_cognitive_profile`:**
```sql
CREATE TABLE user_cognitive_profile (
  user_id UUID PRIMARY KEY,
  domain_scores JSONB,          -- {memory: 0.72, attention: 0.65, ...}
  strengths JSONB,              -- ["memory", "logic"]
  weaknesses JSONB,             -- ["speed", "emotional"]
  learning_rate FLOAT,          -- معدل التحسن
  consistency FLOAT,            -- ثبات الأداء
  profile_version INT,
  computed_at TIMESTAMPTZ
);
جدول ai_recommendation_log:

sql
CREATE TABLE ai_recommendation_log (
  id UUID PRIMARY KEY,
  user_id UUID,
  recommendation_type TEXT,     -- 'next_game' | 'difficulty' | 'coach'
  payload JSONB,
  user_action TEXT,             -- 'accepted' | 'rejected' | 'ignored'
  created_at TIMESTAMPTZ
);
جدول adaptive_difficulty_state:

sql
CREATE TABLE adaptive_difficulty_state (
  user_id UUID,
  game_id TEXT,
  current_difficulty INT,
  target_difficulty INT,
  adjustments JSONB,
  updated_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, game_id)
);
جدول generated_content_cache:

sql
CREATE TABLE generated_content_cache (
  id UUID PRIMARY KEY,
  game_id TEXT,
  difficulty INT,
  content_hash TEXT,            -- منع التكرار
  content JSONB,
  generated_at TIMESTAMPTZ,
  used_count INT DEFAULT 0
);
🚀 PART 6: خطة التنفيذ
المرحلة 1: البنية التحتية (Backend + DB)
#	المهمة	الوقت
1	Setup Fastify + TypeScript	2h
2	Neon PostgreSQL connection	1h
3	Migrations (Identity + Catalog + Facts + Derived)	3h
4	Migrations للـ AI tables	1h
5	Zod schemas (من الـ contracts)	2h
6	/health + /sessions (ingest)	3h
7	Golden fixture tests	4h
المجموع		~16h (2-3 أيام)
المرحلة 2: محرك الـ AI الأساسي
#	المهمة	الوقت
1	Groq API integration	2h
2	Rule-based recommendations	3h
3	Adaptive difficulty (DDA)	3h
4	Wire into API responses	2h
المجموع		~10h (1-2 يوم)
المرحلة 3: الميزة القاتلة (Generative Engine)
#	المهمة	الوقت
1	LLM prompt templates لكل لعبة	4h
2	Content validation pipeline	3h
3	Caching layer	2h
4	Proof of Concept: verbal-analogies	3h
5	Proof of Concept: vocabulary-elite	3h
6	Integration + testing	4h
المجموع		~19h (3-4 أيام)
المرحلة 4: AI Coach
#	المهمة	الوقت
1	Coach endpoint	2h
2	User history summarization	3h
3	Prompt engineering	4h
4	UI integration (later)	—
المجموع		~9h (1-2 يوم)
المرحلة 5: Frontend Refactor
#	المهمة
1	Shell refactor (MessageChannel + IndexedDB)
2	Pilot game: seq-mem
3	Roll out for 35 games
🎯 PART 7: القرارات النهائية
البند	الاختيار	السبب
Backend Framework	Fastify + TypeScript	أسرع 3x من Express + Type-safe
Database	Neon PostgreSQL (Free)	لا يتوقف + PostgreSQL كامل
Backend Hosting	Render Free Tier	750h/شهر + مجاني
Frontend Hosting	Cloudflare Pages	غير محدود + مجاني
AI — Primary LLM	GroqCloud (Llama 3.3 70B)	سرعة فائقة + مجاني
AI — Fallback	OpenRouter	50/day + 25 models
Auth	Better Auth	Self-hosted + مجاني
Email	Resend	3000/شهر + مجاني
Sync Strategy	Facts + Union (من الخطة الأصلية)	Idempotent + Offline-first
🧭 PART 8: الفرق بيننا وبين المنافسين
Feature	Lumosity	Peak	BrainHQ	FLASH
السعر	$11.99/شهر	$9.99/شهر	$14/شهر	مجاني
Scientific Papers	❌	❌	✅	✅
AI Adaptive	محدود	محدود	محدود	✅ متقدم
AI Generative Content	❌	❌	❌	✅ لا نهائي
AI Coach	❌	❌	❌	✅ مخصص
Open Source	❌	❌	❌	✅ 100%
Arabic Support	❌	❌	❌	✅ كامل
Offline Play	محدود	محدود	❌	✅ كامل
📊 PART 9: مؤشرات النجاح (KPIs)
المرحلة الأولى (بعد 3 شهور)
500 مستخدم مسجّل

5000 sessions

Retention > 30%

AI recommendations acceptance > 50%

المرحلة الثانية (بعد 6 شهور)
5000 مستخدم

50K sessions

AI generative content stable

Proof of concept للمستثمر

المرحلة الثالثة (بعد سنة)
50K مستخدم

500K sessions

AI Coach live

Ready for Series Seed

⚠️ PART 10: المخاطر وخطط التخفيف
المخاطرة	الاحتمال	التأثير	التخفيف
Groq rate limits	متوسط	عالي	Fallback لـ OpenRouter + Cache
Render sleep after 15min	عالي	منخفض	UptimeRobot pings + Neon constant DB
Neon 1GB limit	منخفض	متوسط	Archive old sessions + compression
LLM content quality	متوسط	عالي	Validation pipeline + human review
User data privacy	منخفض	عالي	Encryption + GDPR compliance
Backend down	متوسط	عالي	Cloudflare Workers fallback
📎 ملاحظات مهمة
كل الخدمات دي مجانية 100% وموثقة من المصادر الرسمية.

الـ AI حقيقي — مش مجرد نظام توصيات. ده LLM بيولّد محتوى.

الميزة القاتلة = Generative Engine — هي دي اللي هتجذب المستثمر.

المعمارية مبنية على الـ Contracts — 4 ملفات موثّقة.

كل حاجة قابلة للتطوير — لما ييجي مستثمر، الترقية سهلة.