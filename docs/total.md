FLASH — دليل التسليم الشامل للـ AI الجديد
التاريخ: 2026-10-04
الحالة: 31 لعبة جاهزة · 5 ألعاب متبقية
المسار: D:\Flash\

📌 رسالة افتتاحية للـ AI الجديد
يا AI الجديد:

إنت بتستلم مشروع اسمه FLASH — منصة تدريب معرفي في المتصفح. المشروع ده مبني بالكامل بحيث:

مفيش frameworks (لا React، لا Vue، لا Tailwind)

مفيش build step (لا Vite، لا Webpack)

مفيش TypeScript

كل لعبة self-contained تشتغل من file:// مباشرة

كل حاجة مكتوبة بالـ Vanilla HTML/CSS/JS

المستخدم اللي هتشتغل معاه:

مصري، vibe coder (مش بيكتب كود بنفسه)

بيفهم المفاهيم، بس مش بيبرمج

بيقول "اللي بعدو" أو "تمم" عشان تكمّل

عايز ملفات كاملة (مفيش Ctrl+H، مفيش partial)

عايز جداول + إيموجي + هيكل واضح

بيتكلم مصري + technical English

قواعد مقدّسة:

ابعت ملفات كاملة بس

حدّد كل ملف بـ الاسم + النوع (🆕/✏️) + المسار

لعبة واحدة في المرة

3 Phases لكل لعبة

جرّب كل Phase قبل اللي بعدها

🎨 الجزء الأول: فكرة المشروع
1.1 إيه هو FLASH؟
FLASH = منصة تدريب معرفي (Cognitive Training Platform) بتشتغل في المتصفح.

الفكرة الأساسية:

المستخدم يلعب ألعاب صغيرة (mini-games)

كل لعبة بتدرّب قدرة معرفية معينة

كل لعبة مبنية على paradigm علمي حقيقي من أبحاث peer-reviewed

النتيجة النهائية: تحسين القدرات المعرفية (memory, attention, speed, ...)

الجمهور:

بالغين عايزين يطوروا قدراتهم الذهنية

طلبة بيحضّروا للامتحانات

أي حد عايز بديل مجاني لـ Lumosity / Peak / BrainHQ

الميزة التنافسية:

كل لعبة بتستشهد بـ paper علمي حقيقي (مش بس "brain games")

مجاني بالكامل

مفتوح المصدر (كل الكود ظاهر)

في المتصفح (مفيش installation)

1.2 النظرية العلمية
المشروع مبني على CHC Theory (Cattell-Horn-Carroll) — نظرية في علم النفس المعرفي بتقسم الذكاء لـ 10 domains:

#	Domain	القدرة
1	Memory	الذاكرة العاملة، التذكر، الترابط
2	Attention	التركيز، الكبح، الانتباه المستمر
3	Speed	سرعة المعالجة، زمن رد الفعل
4	Spatial	التفكير المكاني، التدوير الذهني
5	Logic	المنطق، الاستدلال، الاستنباط
6	Language	اللغة، المفردات، التحليل اللغوي
7	Numerical	الحساب، الأنماط العددية
8	Creativity	التفكير التباعدي، الروابط البعيدة
9	Emotional	الذكاء العاطفي، التعاطف
10	Problem Solving	حل المشكلات، التخطيط
1.3 الهدف النهائي
الهدف الأصلي: 41 لعبة

الهدف المعدّل: 36 لعبة (6 CORE × 4 + 12 BONUS)

الحالي: 31 لعبة ✅

المتبقي: 5 ألعاب 🟡

🏗️ الجزء الثاني: Architecture
2.1 Tech Stack
Layer	Technology	ملاحظات
Frontend	Vanilla HTML/CSS/JS	مفيش framework
Canvas	Native Canvas API	radar chart + neural background
SVG	Inline SVG	faces, gears, voxels, mazes
Fonts	Google Fonts	Space Grotesk, Inter, JetBrains Mono, Cairo
Backend	Node.js + Express	مش متوصل حالياً
Storage	localStorage	client-side فقط
Auth	None	مخطط ليها
AI	Rule-based (planned)	مش متوصلة
Build	None	مفيش bundler
Testing	Manual checklist	مفيش framework
2.2 ليه Vanilla JS؟
القرار متعمد:

كل لعبة self-contained — أصغر من 30KB

تشتغل من file:// بدون server

مفيش build step — تعديل فوري

قابل للتعديل يدويًا — الـ AI يقدر يعدل بسهولة

Trade-off مقبول: code duplication بين الألعاب

2.3 ليه iframe؟
عزل كامل بين الألعاب

كل لعبة لها CSS/JS namespace خاص

لو لعبة crash → مش بتأثر على الداشبورد

تقدر تختبر اللعبة standalone

2.4 ليه 8 ملفات؟
Separation of concerns (helpers / sounds / stages / modes / core)

كل ملف أقل من 800 lines

سهل تنسخ ملفات لألعاب جديدة

سهل تعمل debugging

📁 الجزء الثالث: بنية المشروع
3.1 Folder Tree
text
D:\Flash\
│
├── backend/                              # Node.js (مش متوصل)
│   ├── server.js                         # 4 endpoints
│   └── package.json
│
├── docs/                                 # Documentation
│   └── FLASH_HANDOFF_v6.md               # هذا الملف
│
└── frontend/
    │
    ├── dashboard/                        # نقطة الدخول
    │   ├── FLASH.html                    # ENTRY POINT
    │   ├── flash.css                     # ~900 lines
    │   └── js/
    │       ├── flash-data.js             # DOMAINS + TRANSLATIONS
    │       ├── flash-charts.js           # Radar + Neural
    │       └── flash-core.js             # State + Render + postMessage
    │
    ├── games/                            # 9 domains
    │   ├── attention/                    ✅ 4/4
    │   │   ├── flanker/                  (9 files - has tutorial)
    │   │   ├── go-no-go/                 (10 files - has DDM)
    │   │   ├── task-switching/           (8 files)
    │   │   └── vigilance/                (8 files)
    │   │
    │   ├── spatial/                      ✅ 4/4
    │   │   ├── mental-rotation/
    │   │   ├── corsi-blocks/
    │   │   ├── map-memory/
    │   │   └── block-counter/
    │   │
    │   ├── speed/                        ✅ 4/4
    │   │   ├── reaction/
    │   │   ├── color-match/
    │   │   ├── symbol-sprint/
    │   │   └── rapid-fire/
    │   │
    │   ├── memory/                       🟡 3/4
    │   │   ├── n-back/
    │   │   ├── face-match/
    │   │   ├── pattern-recall/
    │   │   └── seq-mem/                  ❌ الناقص
    │   │
    │   ├── logic/                        🟡 3/4
    │   │   ├── matrix-logic/
    │   │   ├── syllogisms/
    │   │   ├── deduction/
    │   │   └── argument-analyzer/        ❌ الناقص
    │   │
    │   ├── language/                     🟡 1/4
    │   │   ├── lexical-decision/         ✅
    │   │   ├── vocabulary-elite/         ❌
    │   │   ├── verbal-analogies/         ❌
    │   │   └── word-scramble/            ❌
    │   │
    │   ├── creativity/                   ✅ 4/4
    │   │   ├── alternative-uses/
    │   │   ├── creative-connect/
    │   │   ├── story-spark/
    │   │   └── idea-flow/
    │   │
    │   ├── emotional/                    ✅ 4/4
    │   │   ├── micro-expressions/
    │   │   ├── tone-detector/
    │   │   ├── empathy-engine/
    │   │   └── social-read/
    │   │
    │   ├── problem/                      ✅ 4/4
    │   │   ├── hanoi/
    │   │   ├── river-crossing/
    │   │   ├── gear-logic/
    │   │   └── path-finder/
    │   │
    │   ├── numerical/                    (BONUS - لسه)
    │   │   └── (فاضي)
    │   │
    │   └── _template/                    (فاضي - اختياري)
    │
    └── shared/                           # ★ SHARED SYSTEMS
        ├── i18n.js                       # EN + AR + RTL
        ├── settings.js                   # Global settings + music
        ├── flash-stages.js               # Universal stages
        └── templates/                    # Game templates (قديمة)
3.2 بنية اللعبة الواحدة (8 ملفات)
كل لعبة جاهزة عندها 8 ملفات بالظبط:

text
frontend/games/{domain}/{game-id}/
├── config.json                    ← Metadata (documentation only)
├── game.html                      ← HTML + 8 script tags
├── game.css                       ← Specific (~500) + Shared (~450) lines
├── game.js                        ← Core logic (~900-1300 lines)
├── {game}-helpers.js              ← Storage + PB + History + Badges
├── {game}-sounds.js               ← Web Audio synthesis
├── {game}-stages.js               ← 8 progressive stages
└── {game}-extra-modes.js          ← Speed + Endless + Precision + Daily
الحجم الإجمالي للعبة الواحدة: ~3000 lines
الوقت المتوقع للبناء: 2-3 ساعات

🧠 الجزء الرابع: Logic المشروع
4.1 الفكرة الأساسية
المشروع فيه 3 طبقات:

text
┌──────────────────────────────────────────────────┐
│  LAYER 1: DASHBOARD (frontend/dashboard/)        │
│  - يعرض الـ 9 domains                            │
│  - يعرض الألعاب في كل domain                     │
│  - يفتح اللعبة في iframe                         │
│  - يستقبل postMessage من اللعبة                  │
│  - يحدّث النتائج (best score, level, progress)   │
└──────────────────────────────────────────────────┘
              ↕ (iframe + postMessage)
┌──────────────────────────────────────────────────┐
│  LAYER 2: SHARED SYSTEMS (frontend/shared/)      │
│  - i18n.js (ترجمات EN/AR)                        │
│  - settings.js (إعدادات عالمية)                  │
│  - flash-stages.js (نظام المراحل الموحد)         │
└──────────────────────────────────────────────────┘
              ↕ (يستخدموها)
┌──────────────────────────────────────────────────┐
│  LAYER 3: GAMES (frontend/games/{domain}/)       │
│  - 8 ملفات لكل لعبة                              │
│  - كل لعبة self-contained                        │
│  - بتستخدم shared systems                        │
│  - بتبعت postMessage للـ dashboard               │
└──────────────────────────────────────────────────┘
4.2 اللوجيك خطوة بخطوة
المستخدم بيفتح الداشبورد:

FLASH.html بتحمّل 5 scripts:

i18n.js (ترجمات)

settings.js (إعدادات)

flash-data.js (بيانات الـ 31 لعبة)

flash-charts.js (canvas rendering)

flash-core.js (core logic)

flash-core.js بيعمل init():

يعرض الـ 9 domain tabs

يعرض الألعاب في الـ domain الحالي

يعمل radar chart للـ cognitive profile

يجهّز postMessage listener

المستخدم يضغط على لعبة:

FLASH.loadGame(gameId) بتتنفذ

تفتح game.html في iframe (بيملأ الشاشة)

game.html بتحمّل الـ 8 ملفات بنفس الترتيب المقدّس

اللعبة بتشتغل:

game.js يعمل autoInit()

يعرض idle screen (5 modes + stages + missions)

المستخدم يختار mode

اللعبة تبدي (مع countdown 3-2-1)

بعد كل trial → feedback + sound

بعد كل level → check pass/fail

بعد كل session → completeGame()

لما اللعبة تخلص:

completeGame() بتعمل:

حساب accuracy + medianRT + rtv + rcs

check PB (Personal Best)

check badges (Bronze/Silver/Gold)

render insights (تحليل الأداء)

render history chart (SVG)

FlashStages.checkSession() → تحديث المراحل

emitComplete() → postMessage للـ dashboard

الـ Dashboard يستقبل postMessage:

handleGameComplete(payload) بتتنفذ

تحدّث best score + level + progress في sidebar

تعيد render الـ games list

4.3 الـ postMessage Protocol
كل لعبة لما تخلص session، بتبعت object زي ده:

javascript
window.parent.postMessage({
  type: 'flash:game-complete',      // معرف ثابت
  gameId: 'lexical-decision',       // معرف اللعبة
  domain: 'language',                // معرف الـ domain
  mode: 'classic',                   // classic | speed | endless | precision | daily
  maxLevel: 15,                      // أعلى level وصل
  accuracy: 87,                      // دقة 0-100
  score: 2450,                       // النقاط
  medianRT: 620,                     // وسيط زمن رد الفعل (ms)
  rtv: 145,                          // std dev of RTs
  rcs: 12.4,                         // rate-correct score
  isNewPB: true,                     // هل ده personal best جديد؟
  // + game-specific metrics:
  primingEffect: 45,                 // خاص بـ lexical-decision
  nonWordAccuracy: 92
}, '*');
الـ Dashboard بيستقبلها في flash-core.js:

javascript
window.addEventListener('message', (e) => {
  if (!e.data || e.data.type !== 'flash:game-complete') return;
  handleGameComplete(e.data);
});
4.4 Storage Schema (localStorage)
كل لعبة بتخزّن 6 types من البيانات:

text
flash:lang                    → 'en' | 'ar'
flash:settings                → { _v: 1, data: {...} }
flash:stages:{game-id}        → { completed: [...], updatedAt }
flash:{game-id}:pb            → { bestAccuracy, bestMedianRT, ..., updatedAt }
flash:{game-id}:history       → [{ date, mode, medianRT, accuracy, rcs }, ...]  (30 max)
flash:{game-id}:daily         → { 'YYYY-MM-DD': { done, rcs, accuracy }, ... }  (90 days)
flash:{game-id}:badges        → { classic: { bronze: {...} }, ... }
flash:{game-id}:missions      → { date, missions: [...] }
القاعدة: دايمًا flash:{game-id}:{type} format. مفيش استثناءات.

📋 الجزء الخامس: الـ Shared Systems (3 ملفات)
5.1 frontend/shared/i18n.js
الوظيفة: دعم EN + AR + RTL

API:

javascript
FLASH_I18N.t(key, params)         // ترجمة
FLASH_I18N.setLang('en'|'ar')     // تغيير اللغة + تطبيق dir
FLASH_I18N.getLang()              // اللغة الحالية
FLASH_I18N.isRTL()                // هل العربية؟
FLASH_I18N.addStrings(lang, obj)  // إضافة ترجمات runtime
Storage key: flash:lang
Event: flash:lang-changed
Coverage: 200+ string جاهزة

ملاحظة: كل لعبة بتضيف ترجماتها الخاصة بـ addStrings().

5.2 frontend/shared/settings.js
الوظيفة: إعدادات عالمية + Ambient music + Settings Panel UI

API:

javascript
FlashSettings.get(key)             // قراءة قيمة
FlashSettings.set(key, value)      // ضبط + حفظ + تطبيق + emit
FlashSettings.openPanel()          // فتح اللوحة العالمية
FlashSettings.closePanel()
FlashSettings.onChange(key, cb)    // الاشتراك في تغيير
FlashSettings.onAnyChange(cb)      // الاشتراك في الكل
FlashSettings.music.play()         // ambient pad
FlashSettings.music.pause()
FlashSettings.music.toggle()
FlashSettings.applyToDOM()         // تطبيق theme/motion/contrast
Storage key: flash:settings
Event: flash:settings-changed

Default settings:

theme: 'dark' (dark/light)

reducedMotion: false

highContrast: false

soundEnabled: true

soundVolume: 0.7

musicEnabled: false

musicVolume: 0.4

haptics: true

inputMode: 'both' (both/keyboard/touch)

autoSaveProgress: true

Settings Panel UI: بيت inject تلقائيًا عند أول مرة تفتح. فيه:

Appearance: Theme, Reduced Motion, High Contrast

Audio: Sound, SFX Volume, Music, Music Volume

Input: Haptics, Input Mode

System: Auto-save, Reset buttons

Music implementation:

Web Audio API

4 detuned oscillators: A2, E3, A3, E4

Slow LFO على gain

Fade in/out smoothly

Pauses when tab hidden

5.3 frontend/shared/flash-stages.js
الوظيفة: Universal 8-stage progression system

API:

javascript
FlashStages.init(gameId, stagesArray, { onStageComplete })
FlashStages.getProgress()           // { completed, total, currentIndex, currentStage, allDone }
FlashStages.checkSession(payload)   // { newlyCompleted, advanced, progress }
FlashStages.isStageDone(stageId)    // boolean
FlashStages.getStageAt(idx)         // stage object
FlashStages.renderStrip(container)  // renders 8 dots
FlashStages.showToast(stage)        // shows toast notification
FlashStages.reset()                 // reset all stages
Storage key: flash:stages:{gameId}
Structure: { completed: ['apprentice', ...], updatedAt }

Stage object:

javascript
{
  id: 'apprentice',
  name: 'Apprentice',
  icon: '🥉',
  desc: 'Reach Level 5',
  check: (session) => session.mode === 'classic' && session.maxLevel >= 5
}
كيف بيشتغل:

init() بتسجّل المراحل للعبة

عند نهاية session → checkSession(payload)

بتشوف المرحلة اللي بعدها → تشيك على الشرط

لو تحقق → mark complete + trigger onStageComplete

🎮 الجزء السادس: الـ 8 ملفات (تفصيلي)
6.1 config.json
الوظيفة: Metadata (documentation only — Dashboard مش بيقراه)

Structure:

json
{
  "id": "lexical-decision",
  "name": "Lexical Decision",
  "domain": "language",
  "icon": "📖",
  "description": "Semantic priming · real vs non-word (Meyer & Schvaneveldt 1971)",
  "difficulty": 5,
  "maxLevel": 15,
  "metrics": ["maxLevel", "accuracy", "medianRT", "rtv", "rcs", "primingEffect", "nonWordAccuracy"]
}
6.2 game.html
الوظيفة: HTML structure + script tags + buttons

Structure الأساسية:

html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{Game Name} — FLASH</title>
  <link rel="stylesheet" href="game.css">
</head>
<body>
  <div id="game-root">
    <header class="g-header">
      <div class="g-header-left">
        <button class="g-back-btn hidden" id="back-btn">←</button>
        <div class="g-logo">
          <span class="g-logo-icon">⚡</span>
          <span class="g-logo-text">FLASH</span>
        </div>
      </div>
      <div class="g-meta">
        <span class="g-meta-item">
          <span class="g-meta-label">LEVEL</span>
          <span class="g-meta-value" id="level-display">1</span>
        </span>
        <span class="g-meta-item">
          <span class="g-meta-label">STREAK</span>
          <span class="g-meta-value" id="streak-display">0</span>
        </span>
        <span class="g-meta-item">
          <span class="g-meta-label">LIVES</span>
          <span class="g-meta-value" id="lives-display">3</span>
        </span>
      </div>
      <button class="g-settings-btn" id="settings-btn">⚙</button>
    </header>

    <main id="stage" class="stage" data-phase="idle">
      <div class="stage-inner">
        <div id="phase-content"></div>
      </div>
    </main>

    <footer class="g-footer">
      <div class="timer-bar">
        <div class="timer-fill" id="timer-fill"></div>
      </div>
    </footer>
  </div>

  <!-- ⚠️ Script order matters (CRITICAL) -->
  <script src="../../../shared/i18n.js"></script>
  <script src="../../../shared/settings.js"></script>
  <script src="../../../shared/flash-stages.js"></script>
  <script src="{game}-stages.js"></script>
  <script src="{game}-helpers.js"></script>
  <script src="{game}-sounds.js"></script>
  <script src="{game}-extra-modes.js"></script>
  <script src="game.js"></script>
</body>
</html>
الـ Script order مقدّس:

i18n.js — أول ملف (game.js بيستخدم T.t())

settings.js — تاني (game.js بيستخدم FS.get())

flash-stages.js — تالت (game-stages بتستخدمه)

{game}-stages.js — game-specific stages

{game}-helpers.js — قبل game.js

{game}-sounds.js — قبل game.js

{game}-extra-modes.js — قبل game.js (game.js بينادي عليه)

game.js — آخر ملف

لو الترتيب اتغير:

❌ game.js هيرمي window.XHelpers is undefined

❌ FlashStages مش هيلاقي stages

❌ FLASH_I18N.t() هيرجع keys بدل ترجمات

6.3 game.css
بنية جزئين:

Specific styles (~150-500 lines) — layout + buttons + stimulus

Shared styles (~450 lines) — منسوخة لكل لعبة:

Back button

Settings button

Accessibility (Reduced Motion + High Contrast)

RTL support

Stages system (stage-dot, stage-current-info, stage-toast)

Missions card

Mode grid (4 cards)

Badges row (badge-icon)

PB banner (pb-banner)

Insights card (insights-card)

Endless HUD

Level-up flash

History chart

Responsive breakpoints

6.4 {game}-helpers.js
الوظيفة: Storage + PB + History + Missions + Badges + Stats + Insights + Chart

API:

javascript
window.{Game}Helpers = {
  // Personal Best
  getPB() → { bestAccuracy, bestMedianRT, bestRCS, ..., updatedAt }
  checkAndUpdatePB(session) → { newRecords }

  // History (last 30 sessions)
  getHistory() → []
  addToHistory(session) → []
  getRecentSessions(n) → []

  // Daily
  getTodayKey() → 'YYYY-MM-DD'
  isTodayDone() → boolean
  markTodayDone(result)

  // Missions (3 per day, deterministic by date)
  getTodayMissions() → { date, missions: [...] }
  updateMissionProgress(type, value) → {...}

  // Settings (compat layer)
  getSettings() / saveSettings() / applySettingsToDOM()

  // Badges (Bronze/Silver/Gold per mode)
  getBadges() → {}
  checkAndUnlockBadges(mode, data) → []
  getModeBadges(mode) → []

  // Statistics
  median(arr) → number
  stdDev(arr) → number
  rcs(correct, rts) → number

  // Insights (max 3 strings)
  generateInsights(session) → []

  // SVG chart
  renderChart(container, sessions, metric)

  // Reset
  resetAll()
};
Storage keys:

flash:{game-id}:pb

flash:{game-id}:history

flash:{game-id}:daily

flash:{game-id}:badges

flash:{game-id}:missions

6.5 {game}-sounds.js
الوظيفة: Web Audio API sound effects (مفيش files — كل حاجة synthesis)

API:

javascript
window.{Game}Sounds = {
  setEnabled(v),
  isEnabled(),
  hit(), miss(), tick(), go(),
  levelUp(), gameOver(), victory(),
  badge(), click(), personalBest(), breakChime(),
  // + game-specific sounds
};
Implementation:

AudioContext + OscillatorNode + GainNode

كل sound = سلسلة من beep(freq, dur, type, gain, delay) calls

"Signature chirp" = frequency sweep للإحساس premium

6.6 {game}-stages.js
الوظيفة: 8 progressive stages

Structure:

javascript
window.{Game}Stages = [
  {
    id: 'apprentice',
    name: 'Apprentice',
    icon: '🥉',
    desc: 'Reach Level 5 in Classic mode',
    check: (s) => s.mode === 'classic' && (s.maxLevel || 0) >= 5
  },
  // ... 7 more
];
الـ 8 stages القياسية:

Apprentice (🥉) — Level 5

Journeyman (🥈) — Level 10

Adept (🥇) — Level 15

Specialist (🎯) — game-specific metric

Sprinter (⚡) — Speed mode

Perfectionist (💎) — 100% accuracy

Endless Runner (🏃) — Endless mode Level 6

Master (👑) — Beat PB with high level

6.7 {game}-extra-modes.js
الوظيفة: 4 additional modes (Speed + Endless + Precision + Daily)

API:

javascript
window.{Game}ExtraModes = {
  getModeDefinitions() → [
    { id: 'speed',     name: 'Speed',     icon: '⏱️', desc: '...', meta: '...' },
    { id: 'endless',   name: 'Endless',   icon: '⚡', desc: '...', meta: '...' },
    { id: 'precision', name: 'Precision', icon: '🎯', desc: '...', meta: '...' },
    { id: 'daily',     name: 'Daily',     icon: '★',  desc: '...', meta: '...' }
  ],
  start(modeId, apiRef, soundRef, helperRef) { /* runs mode */ },
  abort()
};
الـ 4 modes:

Speed: عدد محدود + وقت قصير (مثلاً 15 trials · 1.5s each)

Endless: لا نهائي، خطأ واحد = game over، level ramps up

Precision: بدون ضغط وقت، max accuracy

Daily: بروتوكول ثابت، مرة يوميًا، mark done

كيفية الاستخدام:

اللعبة الرئيسية game.js تعرّف window.{Game}API

الـ extra-modes بتاخد apiRef وتعتمد عليه

الـ API بيعرّف: render(), setPhase(), generateTrial(), emit(), exitToMenu(), ...

6.8 game.js
الوظيفة: Core game logic (~900-1300 lines)

Structure:

javascript
(function () {
  'use strict';

  // 1. Module refs
  const H = window.{Game}Helpers;
  const S = window.{Game}Sounds;
  const STAGES = window.{Game}Stages;
  const FlashStages = window.FlashStages;
  const FS = window.FlashSettings;
  const T = window.FLASH_I18N || { t: (k) => k };

  // 2. Guard clause
  if (!H) { console.error('[Game] Helpers not loaded'); return; }

  // 3. Init stages
  if (FlashStages && STAGES) {
    FlashStages.init('{game-id}', STAGES, {
      onStageComplete: (stage) => {
        setTimeout(() => FlashStages.showToast(stage), 800);
        if (S) S.badge();
      }
    });
  }

  // 4. CONFIG
  const CONFIG = { maxLives: 3, maxLevel: 15, ... };

  // 5. STATE
  const state = { level: 1, lives: 3, ..., onComplete: null };

  // 6. Utilities (clearAllTimeouts, randInt, pickOne, shuffle, push)
  // 7. Settings (wireSettings, haptic, snd)
  // 8. UI Helpers (setPhase, render, setTimer, showFeedbackFlash, ...)
  // 9. Game-specific (generateQuestion, handleAnswer, handleTimeout, endLevel)
  // 10. Screens (showIdle, startClassic, startLevel, completeGame, resetGame)
  // 11. Mount (mount, wireRefs, bindGlobalKeys, autoInit)
  // 12. Expose API: window.{Game}API, window.{Game}Game
})();
الـ API اللي بتتعرّض للـ extra-modes:

javascript
window.{Game}API = {
  CONFIG, state,
  settings: () => FS ? FS.get() : {},
  render, setPhase, setTimer,
  showFeedbackFlash, showCountdown, showLevelUpFlash, haptic,
  generateQuestion, clearAllTimeouts,
  emit: (payload) => { /* postMessage + onComplete */ },
  exitToMenu: showIdle,
  $, getElContent: () => elContent
};
🎯 الجزء السابع: الـ 3-Phase Build Process
Phase 1 — Infrastructure (3 ملفات)
🆕 {game}-helpers.js

🆕 {game}-sounds.js

🆕 {game}-stages.js

بعد Phase 1: اللعبة مش شغالة لسه — بس infrastructure.

Phase 2 — UI Layer (3 ملفات)
🆕 game.html

🆕 game.css

🆕 {game}-extra-modes.js

بعد Phase 2: لسه مش شغالة — محتاجة Phase 3.

Phase 3 — Core Logic (2 ملفات)
🆕 game.js

🆕 config.json

بعد Phase 3: اللعبة شغالة 100%.

📊 الجزء الثامن: الحالة الحالية (31 لعبة)
6 CORE domains COMPLETE ✅
1. Attention & Focus (4/4)

flanker (Eriksen 1974)

go-no-go (Drewe 1975)

task-switching (Monsell 2003)

vigilance (Rosvold 1956)

2. Spatial Intelligence (4/4)

mental-rotation (Shepard 1971)

corsi-blocks (Corsi 1972)

map-memory (Postma 1996)

block-counter (KABC)

3. Speed (4/4) ← NEW

reaction (Simple RT)

color-match (Stroop 1935)

symbol-sprint (Treisman 1980)

rapid-fire (Monsell 2003)

4. Creativity (4/4)

alternative-uses (Guilford 1967)

creative-connect (Mednick 1962)

story-spark (Amabile 1982)

idea-flow (Guilford)

5. Emotional IQ (4/4)

micro-expressions (Ekman 1969)

tone-detector (MSCEIT)

empathy-engine (Ickes 1993)

social-read (Burgoon 1994)

6. Problem Solving (4/4)

hanoi (Simon 1975)

river-crossing (Simon 1971)

gear-logic (Hegarty 2004)

path-finder (Shallice 1982)

3 PARTIAL domains 🟡
7. Memory (3/4)

✅ n-back

✅ face-match

✅ pattern-recall

❌ seq-mem ← NEXT

8. Logic (3/4)

✅ matrix-logic

✅ syllogisms

✅ deduction

❌ argument-analyzer ← NEXT

9. Language (1/4)

✅ lexical-decision

❌ vocabulary-elite ← NEXT

❌ verbal-analogies ← NEXT

❌ word-scramble ← NEXT

🎯 الجزء التاسع: الـ 5 الألعاب المتبقية (تفصيلي)
1. seq-mem — Forward Digit Span
Domain: memory
Path: D:\Flash\frontend\games\memory\seq-mem\
Paradigm: Miller, G. A. (1956). Psychol. Rev., 63(2), 81-97.
Difficulty: 🟢 Easy

الميكانيكا:

اللعبة تعرض digits واحد واحد (مثلاً "3", "7", "5", "2")

كل digit يظهر لـ 950ms

بعد كل digits → المستخدم يدخلهم بنفس الترتيب

عنده keypad (أزرار 0-9)

Level 1: 3 digits → Level 15: 12 digits

Config:

startDigits: 3

maxLevel: 12 (أو 15)

digitShowDuration: 950ms

digitGapDuration: 280ms

Metric: Max Span (أعلى عدد digits اتذكر صح)

الـ citation: Miller (1956) — The magical number seven, plus or minus two.

2. argument-analyzer — Critical Thinking
Domain: logic
Path: D:\Flash\frontend\games\logic\argument-analyzer\
Paradigm: Abrami, P. C., et al. (2015). Rev. Educ. Res.
Difficulty: 🟡 Medium

الميكانيكا:

اللعبة تعرض argument قصير

المستخدم يحدّد نوع الـ fallacy (مغالطة منطقية)

يختار من 4-6 خيارات

الـ 6 Fallacies الأساسية:

Ad hominem — attack the person, not the argument

Straw man — misrepresent someone's argument

False dilemma — present only 2 options when more exist

Slippery slope — one small step leads to extreme

Appeal to authority — "expert said so, so it's true"

Circular reasoning — the conclusion is in the premise

Metric: Fallacy detection accuracy

3. vocabulary-elite — WAIS-IV Vocabulary
Domain: language
Path: D:\Flash\frontend\games\language\vocabulary-elite\
Paradigm: Wechsler, D. (2008). WAIS-IV.
Difficulty: 🟢 Easy

الميكانيكا:

اللعبة تعرض كلمة

المستخدم يختار synonym صحيح من 4 خيارات

Data: 30 words in 3 tiers:

Easy (10 كلمات): happy, big, fast, ...

Medium (10 كلمات): ambiguous, lucid, ...

Hard (10 كلمات): obfuscate, ubiquitous, ...

Metric: Accuracy

4. verbal-analogies — Sternberg 1977
Domain: language
Path: D:\Flash\frontend\games\language\verbal-analogies\
Paradigm: Sternberg, R. J. (1977). Psychol. Rev.
Difficulty: 🟡 Medium

الميكانيكا:

اللعبة تعرض الصيغة: A → B :: C → ?

مثال: "hot → cold :: day → ?" → "night"

المستخدم يختار من 4 خيارات

الـ 12 Relationship Types:

Synonym

Antonym

Part-Whole

Category

Function

Cause-Effect

Degree

Producer

Location

Characteristic

Instrument

Worker

Metric: Accuracy

5. word-scramble — Lexical Access
Domain: language
Path: D:\Flash\frontend\games\language\word-scramble\
Paradigm: Lexical access (generic)
Difficulty: 🟢 Easy

الميكانيكا:

اللعبة تعرض حروف مبعثرة

المستخدم يدوس على الحروف بالترتيب الصحيح

عنده hint (يكشف أول حرف)

Data: 60 كلمات في 3 tiers:

Tier 1 (3-4 حروف): cat, dog, tree, ...

Tier 2 (6-7 حروف): flower, bridge, ...

Tier 3 (8-9 حروف): elephant, mountain, ...

Metric: Accuracy + Time

🛠️ الجزء العاشر: الكومند لإنشاء ملفات لعبة جديدة
PowerShell Command (VS Code Terminal)
افتح VS Code Terminal (Ctrl + `) والصق:

powershell
mkdir "D:\Flash\frontend\games\{DOMAIN}\{GAME-ID}" -Force; cd "D:\Flash\frontend\games\{DOMAIN}\{GAME-ID}"; New-Item -ItemType File -Force config.json, game.html, game.css, game.js, {GAME-ID}-helpers.js, {GAME-ID}-sounds.js, {GAME-ID}-stages.js, {GAME-ID}-extra-modes.js
مثال لـ seq-mem
powershell
mkdir "D:\Flash\frontend\games\memory\seq-mem" -Force; cd "D:\Flash\frontend\games\memory\seq-mem"; New-Item -ItemType File -Force config.json, game.html, game.css, game.js, seq-mem-helpers.js, seq-mem-sounds.js, seq-mem-stages.js, seq-mem-extra-modes.js
مثال لـ argument-analyzer
powershell
mkdir "D:\Flash\frontend\games\logic\argument-analyzer" -Force; cd "D:\Flash\frontend\games\logic\argument-analyzer"; New-Item -ItemType File -Force config.json, game.html, game.css, game.js, argument-analyzer-helpers.js, argument-analyzer-sounds.js, argument-analyzer-stages.js, argument-analyzer-extra-modes.js
مثال لـ vocabulary-elite
powershell
mkdir "D:\Flash\frontend\games\language\vocabulary-elite" -Force; cd "D:\Flash\frontend\games\language\vocabulary-elite"; New-Item -ItemType File -Force config.json, game.html, game.css, game.js, vocabulary-elite-helpers.js, vocabulary-elite-sounds.js, vocabulary-elite-stages.js, vocabulary-elite-extra-modes.js
مثال لـ verbal-analogies
powershell
mkdir "D:\Flash\frontend\games\language\verbal-analogies" -Force; cd "D:\Flash\frontend\games\language\verbal-analogies"; New-Item -ItemType File -Force config.json, game.html, game.css, game.js, verbal-analogies-helpers.js, verbal-analogies-sounds.js, verbal-analogies-stages.js, verbal-analogies-extra-modes.js
مثال لـ word-scramble
powershell
mkdir "D:\Flash\frontend\games\language\word-scramble" -Force; cd "D:\Flash\frontend\games\language\word-scramble"; New-Item -ItemType File -Force config.json, game.html, game.css, game.js, word-scramble-helpers.js, word-scramble-sounds.js, word-scramble-stages.js, word-scramble-extra-modes.js
الكومند بيعمل:

ينشئ الفولدر (لو مش موجود)

يدخل عليه

ينشئ 8 ملفات فاضية

بعدين: تنسخ محتوى الملفات من الرسالة اللي فيها الكود.

📚 الجزء الحداشر: القواعد الذهبية للـ AI الجديد
11.1 القواعد (Non-Negotiable)
✅ ابعت ملفات كاملة — مفيش partial

✅ مفيش Ctrl+H — مفيش "add this line after line 42"

✅ مفيش diffs — ملفات كاملة بس

✅ حدّد كل ملف: Name + Path + Type (🆕 جديد / ✏️ هيتعدل)

✅ لعبة واحدة في المرة — مفيش خلط

✅ 3 Phases لكل لعبة بالترتيب

✅ Test each phase قبل اللي بعدها

✅ Script order في HTML مقدّس

✅ FlashSettings (مش per-game settings)

✅ FLASH_I18N.t() لكل النصوص

✅ postMessage لازم يحتوي على 7 core fields

✅ Storage keys: flash:{game-id}:{type}

✅ Match existing games' style — نفس الألوان والخطوط

✅ Exact paths: D:\Flash\frontend\games\{domain}\{game-id}\

11.2 User Communication
الأسلوب المطلوب:

مصري + technical English

جداول + emojis + هيكل واضح

بدون jargon غير مفسّر

افتراض إن المستخدم مش تقني

جداول، emojis، clear structure

المستخدم بيقول:

"اللي بعدو" → كمّل للخطوة الجاية

"تمم" → تمام، كمّل

"كمّل" → كمّل

"فيه مشكلة" → هيبعت screenshot / console log

User Context:

مصري، vibe coder

مش بيكتب كود بنفسه

بيفهم المفاهيم

عايز نتائج سريعة

بيدوس "اللي بعدو" لما يخلص

11.3 Build Discipline
بعد كل Phase، المستخدم:

يفتح game.html في المتصفح

يلعب اللعبة

يقول "تمم" (نجاح) أو "فيه مشكلة" (screenshot)

لو فيه مشكلة:

المستخدم يبعت screenshot / console log

الـ AI يصلّح

يبعت الملف المعدّل كامل

يعيد الاختبار

🎨 الجزء الثاني عشر: التصميم (Design System)
12.1 Color Palette
css
/* الأساسية */
--cyan:    #00EEFF;  /* اللون الأساسي */
--pink:    #FF0077;  /* اللون الثانوي */
--green:   #00FF96;  /* النجاح */
--yellow:  #FFD60A;  /* التنبيه */
--red:     #FF3355;  /* الخطأ */
--purple:  #9D4EDD;  /* الخاص */
--orange:  #FF6B35;  /* الخاص */

/* Gradients */
--grad:      linear-gradient(135deg, #00EEFF 0%, #FF0077 100%);
--grad-rev:  linear-gradient(135deg, #FF0077 0%, #00EEFF 100%);

/* Backgrounds */
--bg:      #04040A;
--bg-1:    #091323;
--bg-2:    #0D1A30;

/* Text */
--t1:      #EDF0FF;                  /* أساسي */
--t2:      rgba(237,240,255,.52);   /* ثانوي */
--t3:      rgba(237,240,255,.24);   /* خفيف */

/* Fonts */
--f-d:     'Space Grotesk', sans-serif;  /* Display */
--f-m:     'JetBrains Mono', monospace; /* Mono */
--f-b:     'Inter', sans-serif;         /* Body */
12.2 Typography
Headers: Space Grotesk (bold 700-800)

Body: Inter (regular 400-500)

Numbers: JetBrains Mono (medium 500)

Arabic: Cairo (400-700)

12.3 UI Components
Cards: border-radius 18-26px، backdrop-filter blur

Buttons: border-radius 14-18px، transitions 0.15-0.3s

Animations: cubic-bezier(.4,0,.2,1) — الافتراضي

Hover effects: translateY(-3px) + box-shadow

📈 الجزء الثالث عشر: postMessage بالتفصيل
13.1 الـ Payload الكامل
الـ 7 Core Fields (إلزامية):

javascript
{
  type: 'flash:game-complete',
  gameId: 'lexical-decision',
  domain: 'language',
  mode: 'classic',
  maxLevel: 15,
  accuracy: 87,
  score: 2450
}
الـ 4 Extended Fields (إلزامية برضه):

javascript
{
  medianRT: 620,   // milliseconds
  rtv: 145,        // std dev of RTs
  rcs: 12.4,       // rate-correct score
  isNewPB: true    // boolean
}
Game-Specific Fields (اختيارية بس مهمة):

javascript
{
  // أمثلة:
  switchCost: 120,          // rapid-fire
  searchSlope: 32,          // symbol-sprint
  stroopEffect: 95,         // color-match
  primingEffect: 45,        // lexical-decision
  nonWordAccuracy: 92,      // lexical-decision
  maxSpan: 7,               // seq-mem
  maxSequence: 6,           // pattern-recall
  fastestRT: 185            // reaction
}
13.2 كيف بيتبعت
في game.js في completeGame():

javascript
function emitComplete(payload) {
  if (typeof state.onComplete === 'function') state.onComplete(payload);
  if (window.parent && window.parent !== window) {
    try {
      window.parent.postMessage({ type: 'flash:game-complete', ...payload }, '*');
    } catch (e) {}
  }
}
13.3 كيف بيتبقى
في flash-core.js:

javascript
window.addEventListener('message', (e) => {
  if (!e.data || e.data.type !== 'flash:game-complete') return;
  handleGameComplete(e.data);
});

function handleGameComplete(payload) {
  console.log('[FLASH] Game complete:', payload);

  for (const d of DOMAINS) {
    const g = d.games.find(x => x.id === payload.gameId);
    if (!g) continue;

    if (typeof payload.score === 'number' && payload.score > (g.best || 0)) {
      g.best = payload.score;
    }

    const reportedLevel = payload.maxLevel || payload.levelReached || 0;
    if (typeof reportedLevel === 'number' && reportedLevel > (g.lv || 0)) {
      g.lv = reportedLevel;
    }

    if (typeof reportedLevel === 'number' && reportedLevel > 0) {
      g.prog = Math.min(100, Math.round((reportedLevel / 15) * 100));
    }

    g.lastPlayed = new Date().toISOString();
    g.lastSession = {
      mode: payload.mode || 'classic',
      accuracy: payload.accuracy,
      medianRT: payload.medianRT,
      score: payload.score
    };
    break;
  }

  renderGames();
  renderBars();
}
🔬 الجزء الرابع عشر: Academic Citations (كامل)
Memory
Jaeggi, S. M., et al. (2008). PNAS, 105(19). — N-Back

Miller, G. A. (1956). Psychol. Rev., 63(2). — Digit Span

Corsi, P. M. (1972). PhD thesis, McGill. — Corsi Blocks

Naveh-Benjamin, M. (2000). JEP: LMC. — Face Match

Attention
Eriksen & Eriksen (1974). Percept. Psychophys. — Flanker

Drewe (1975). Cortex. — Go/No-Go

Monsell (2003). Trends Cogn. Sci. — Task Switching

Rosvold et al. (1956). J. Consult. Psychol. — Vigilance

Spatial
Shepard & Metzler (1971). Science. — Mental Rotation

Corsi (1972). — Corsi

Postma & De Haan (1996). QJEP. — Map Memory

Kaufman & Kaufman (2004). KABC-II. — Block Counter

Speed
Stroop (1935). J. Exp. Psychol. — Color Match

Treisman & Gelade (1980). Cogn. Psychol. — Symbol Sprint

Monsell (2003). Trends Cogn. Sci. — Rapid Fire

Ball et al. (2002). JAMA. — Peripheral Speed

Logic
Raven (1938). Progressive Matrices. — Matrix Logic

Aristotle. — Syllogisms

Evans (2008). Annu. Rev. Psychol. — Deduction

Abrami et al. (2015). Rev. Educ. Res. — Argument Analyzer

Language
Sternberg (1977). Psychol. Rev. — Verbal Analogies

Meyer & Schvaneveldt (1971). J. Exp. Psychol. — Lexical Decision

Wechsler (2008). WAIS-IV. — Vocabulary, Digit Span

Creativity
Guilford (1967). Nature of Human Intelligence. — Alt Uses, Idea Flow

Mednick (1962). Psychol. Rev. — Creative Connect

Amabile (1982). JPSP. — Story Spark

Emotional
Ekman & Friesen (1969). Semiotica. — Micro Expressions

Mayer et al. (2002). MSCEIT. — Tone Detector

Ickes (1993). J. Pers. — Empathy Engine

Burgoon (1994). Handbook of Interpersonal Comm. — Social Read

Problem Solving
Simon (1975). Cogn. Psychol. — Hanoi

Simon & Newell (1971). Human Problem Solving. — River Crossing

Shallice (1982). Philos. Trans. R. Soc. B. — Path Finder

Hegarty (2004). Trends Cogn. Sci. — Gear Logic

🚀 الجزء الخامس عشر: خطوات البداية للـ AI الجديد
Step 1 — Verify Structure
اطلب من المستخدم يشغّل:

powershell
dir /s /b D:\Flash\frontend\games\*\*\game.html
المتوقع: ~31-36 فولدر فيهم game.html.

Step 2 — Test Dashboard
اطلب من المستخدم يفتح:

text
D:\Flash\frontend\dashboard\FLASH.html
المفروض يشوف:

9 domain tabs

~31 لعبة في sidebar

Cognitive profile radar chart

Speed domain مليان (4 ألعاب)

Step 3 — ابدأ بـ seq-mem
Phase 1:

🆕 seq-mem-helpers.js

🆕 seq-mem-sounds.js

🆕 seq-mem-stages.js

بعد ما المستخدم يختبر، قول "اللي بعدو" عشان:
Phase 2:

🆕 game.html

🆕 game.css

🆕 seq-mem-extra-modes.js

بعد الاختبار:
Phase 3:

🆕 game.js

🆕 config.json

Step 4 — Continue in order
✅ seq-mem (Memory)

✅ argument-analyzer (Logic)

✅ vocabulary-elite (Language)

✅ verbal-analogies (Language)

✅ word-scramble (Language)

Step 5 — After all 5 games
Update flash-data.js (add 5 new games + translations)

Test full dashboard

Optionally: BONUS domains

📊 الجزء السادس عشر: File Count
Category	Count
Ready games (31 × 8)	248
Shared systems (3)	3
Dashboard (5)	5
Backend (2)	2
Docs	~5
TOTAL CURRENT	~263 files
Remaining games (5 × 8)	40
TOTAL FINAL	~303 files
🎯 الجزء السابع عشر: ملاحظات نهائية
17.1 Script Order (تحذير مهم)
في game.html الترتيب مقدّس — لو اختلفت، اللعبة هتكسر.

الصح:

html
1. ../../../shared/i18n.js
2. ../../../shared/settings.js
3. ../../../shared/flash-stages.js
4. {game}-stages.js
5. {game}-helpers.js
6. {game}-sounds.js
7. {game}-extra-modes.js
8. game.js
17.2 Storage Key Format
دايمًا:

text
flash:{game-id}:{type}
أمثلة:

flash:lexical-decision:pb

flash:rapid-fire:history

flash:seq-mem:daily

مفيش استثناءات.

17.3 postMessage Core Fields
الـ 7 حقول الأساسية لازم يكونوا موجودين:

type: 'flash:game-complete'

gameId

domain

mode

maxLevel

accuracy

score

+ 4 extended:

medianRT

rtv

rcs

isNewPB

17.4 Language Support
كل string user-facing لازم يستخدم T.t('key') — مفيش hardcoded English.

لو فيه string مش موجود:

ضيفه في flash-data.js في TRANSLATIONS.en و TRANSLATIONS.ar

ولا استخدم T.addStrings('en', {...}) من داخل اللعبة

17.5 RTL Support
لما اللغة عربي:

<html dir="rtl">

Font بيتغير لـ Cairo تلقائيًا

بعض الـ elements بتتعكس (transform: scaleX(-1))

17.6 Anti-Cheat
في كل لعبة، فيه RT validation:

rtMin: 100ms — أي رد أقل من كده = invalid

rtMax: 30000ms — أي رد أكبر من كده = invalid

Invalid RTs مش بتتحسب في median

17.7 الـ 4 Extra Modes المطلوبة
كل لعبة لازم يكون عندها:

Speed — عدد محدود، وقت قصير

Endless — خطأ واحد = game over

Precision — بدون ضغط وقت

Daily — بروتوكول ثابت، مرة يوميًا

17.8 الـ 8 Stages المطلوبة
كل لعبة لازم يكون عندها 8 stages:

Level 5 — 🥉

Level 10 — 🥈

Level 15 — 🥇

Game-specific metric — 🎯

Speed mode — ⚡

100% accuracy — 💎

Endless mode — 🏃

Beat PB with high level — 👑

🎬 الجزء الثامن عشر: رسالة أخيرة للـ AI الجديد
إنت دلوقتي فاهم المشروع 100%.

اللي عليك:

ابدأ بـ seq-mem (Phase 1)

بعد ما المستخدم يختبر → Phase 2 → Phase 3

بعدين argument-analyzer بنفس النمط

بعدين vocabulary-elite

بعدين verbal-analogies

بعدين word-scramble

آخر حاجة: تحديث flash-data.js

القواعد الذهبية:

✅ ملفات كاملة

✅ لعبة واحدة في المرة

✅ 3 Phases

✅ Name + Path + Type

✅ مصري + English

User Communication:

بيقول "اللي بعدو" لما يخلص

بيقول "تمم" لما يوافق

بيبعت screenshot لو فيه مشكلة

الفلسفة:

الجودة أهم من السرعة

الاختبار بعد كل Phase

الاتساق مع الألعاب الموجودة

الـ Citation العلمي مهم

You're ready. Go build.

📌 نهاية الوثيقة
Last Updated: 2026-10-04
Version: v6.0
Status: 31 games READY · 5 games remaining

Next AI: Start with seq-mem Phase 1.

END OF DOCUMENT