# FLASH — Documentation Master Index

**Last Updated:** 2026-10-09
**Status:** Living Document

---

## دليل الملفات

| # | المجلد | الوصف |
|---|--------|-------|
| 01 | **ARCHITECTURE** | المعمارية الكاملة للمشروع |
| 02 | **CONTRACTS** | العقود الرسمية الأربعة (Frozen) |
| 03 | **BACKEND** | توثيق كامل للـ Backend + كل الـ Handoffs |
| 04 | **AI_SYSTEM** | نظام الذكاء الاصطناعي + المحرك التكيفي |
| 05 | **FRONTEND** | دليل الفرونت إند + القواعد |
| 06 | **PROJECT_HISTORY** | تاريخ المشروع من البداية |
| 07 | **SESSIONS** | سجلات الجلسات الأخيرة |
| 08 | **STATS_AND_TREES** | إحصائيات + أشجار الملفات |

---

## 01_ARCHITECTURE/

| الملف | الوصف |
|-------|-------|
| `01_CORE_ARCHITECTURE.md` | المعمارية الأساسية + 8-file pattern |
| `02_STRATEGY_AND_ARCHITECTURE.md` | الاستراتيجية الشاملة للمشروع |
| `03_SYSTEM_ARCHITECTURE.md` | معمارية الطبقات الثلاث |

---

## 02_CONTRACTS/ (Frozen — لا تُعدّل)

| الملف | الوصف |
|-------|-------|
| `01_SESSION_SCHEMA.md` | شكل الـ Session الواحدة |
| `02_TRIAL_SCHEMA.md` | شكل الـ Trial الواحد |
| `03_POSTMESSAGE_PROTOCOL.md` | بروتوكول Shell ↔ Game |
| `04_GAME_CATALOG.md` | مواصفات الـ 36 لعبة |

---

## 03_BACKEND/

| الملف | الوصف |
|-------|-------|
| `01_FOUNDATION.md` | البنية التحتية الأساسية |
| `02_HANDOFF_v1.md` | أول جلسة Backend (17 endpoint) |
| `03_HANDOFF_v2.md` | بعد Sprint AI الكامل (35 endpoint) |
| `04_HANDOFF_v3.md` | بعد Catalog System (40 endpoint) |
| `05_HANDOFF_v4.md` | بعد 17 Sprint (85 endpoint) |
| `06_HANDOFF_v4.1.md` | بعد Frontend Experiments |
| `07_FIX_LOG.md` | سجل الأخطاء والحلول |

---

## 04_AI_SYSTEM/

| الملف | الوصف |
|-------|-------|
| `01_PLAYER_INTELLIGENCE.md` | استراتيجية AI + Evidence Ladder |
| `02_ADAPTIVE_ENGINE.md` | المحرك التكيفي للصعوبة |
| `03_AI_CONTRACTS.md` | عقود AI للـ Frontend |

---

## 05_FRONTEND/

| الملف | الوصف |
|-------|-------|
| `01_ROADMAP_AND_STATUS.md` | حالة الألعاب + الـ citations |
| `02_WORKFLOW_AND_RULES.md` | القواعد الذهبية للـ AI + 3-Phase build |

---

## 06_PROJECT_HISTORY/

| الملف | الوصف |
|-------|-------|
| `01_OVERVIEW.md` | نظرة عامة على المشروع |
| `02_HISTORY.md` | التاريخ الكامل |
| `03_EVOLUTION.md` | سجل التطور |
| `04_LEGACY_REFERENCE.md` | مرجع قديم كامل |
| `05_LEGACY_INDEX.md` | فهرس المشروع الأصلي |

---

## 07_SESSIONS/

| الملف | الوصف |
|-------|-------|
| `01_RECENT_SESSION.md` | أحدث جلسة تطوير |
| `02_SESSION_LOG_v1.md` | سجل جلسة شاملة |

---

## 08_STATS_AND_TREES/

| الملف | الوصف |
|-------|-------|
| `01_STATS.md` | إحصائيات المشروع |
| `02_TREE.md` | شجرة الملفات |
| `03_TREE_FULL.md` | الشجرة الكاملة |
| `04_TREE_RAW.txt` | شجرة خام |
| `05_TREE_SIMPLE.txt` | شجرة مبسطة |
| `06_FOLDERS.txt` | قائمة المجلدات |
| `07_PATHS.txt` | قائمة المسارات |
| `08_TOTAL_REFERENCE.md` | المرجع الشامل القديم |

---

## قواعد سريعة للـ AI الجديد

1. اقرأ `00_INDEX.md` (هذا الملف) أولاً
2. ثم `01_ARCHITECTURE/01_CORE_ARCHITECTURE.md`
3. ثم `02_CONTRACTS/` (كل الملفات الأربعة)
4. ثم `04_AI_SYSTEM/01_PLAYER_INTELLIGENCE.md`
5. ثم `03_BACKEND/06_HANDOFF_v4.1.md` (أحدث حالة)

**القواعد الذهبية:** لا تعدّل الـ Contracts · لا تكسر 8-file pattern · لا تخترع L4 claims