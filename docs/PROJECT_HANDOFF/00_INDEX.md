**التاريخ:** 2026-10-07
**الغرض:** نقل كامل لذاكرة المشروع إلى AI جديد — صفر فقدان سياق

---

## الملفات

| # | الملف | المحتوى |
|---|---|---|
| 00 | INDEX | هذا الملف |
| 01 | PROJECT_OVERVIEW | هوية المشروع، الأهداف، الرؤية، المصطلحات |
| 02 | PROJECT_HISTORY | التاريخ الكامل من البداية |
| 03 | ARCHITECTURE | المعمارية التقنية بكل طبقاتها |
| 04 | FILE_STRUCTURE | شجرة الملفات والفولدرات |
| 05 | COMPONENTS | جرد كامل للمكونات |
| 06 | FEATURES | كل ميزة (منفذة/مخططة/مرفوضة) |
| 07 | AI_SYSTEM | نظام AI: توليد + محادثة + تكييف |
| 08 | GAME_LOGIC | منطق الألعاب الـ36 |
| 09 | DATABASE | 30 جدول + Schema |
| 10 | UI_UX | نظام التصميم الكامل |
| 11 | BUGS | كل المشاكل والحلول |
| 12 | DECISIONS | سجل القرارات + الأسباب |
| 13 | REJECTED_APPROACHES | ما تم تجربته ورُفض |
| 14 | CURRENT_STATE | اللقطة الحالية بالضبط |
| 15 | ROADMAP | كل ما هو مخطط |
| 16 | DEVELOPMENT_SETUP | كيف تطوّر المشروع |
| 17 | DEPENDENCIES | كل الحزم والإصدارات |
| 18 | COMMANDS_AND_PROMPTS | الأوامر والـ prompts |
| 19 | CONVERSATION_KNOWLEDGE | معرفة من المحادثات |
| 20 | UNKNOWN_INFORMATION | ما لا يمكن التحقق منه |
| 21 | NEXT_AI_INSTRUCTIONS | تعليمات صريحة للـ AI الجديد |

---

## قواعد سريعة للـ AI الجديد

1. **اقرأ كل الملفات قبل أن تبدأ**
2. **لا تفترض أي شيء لم يُوثّق**
3. **احترم كل قرار تم اتخاذه**
4. **لا تعيد تجربة ما تم رفضه**
5. **الأرقام الحقيقية مهمة**: 391 ملف، 4.4 MB، 107,467 سطر
6. **المشروع يعمل حاليًا** — لا تكسره

---

## الحالة الحالية في سطر واحد

> **المشروع في مرحلة "الباك إند مكتمل تقريبًا + فرونت تجريبي قيد الاستكشاف + AI Coach يعمل"**

---

## المسار الأساسي
D:\Flash
├── backend\ ← Fastify + Neon + AI
├── frontend\ ← 36 لعبة (dashboard قديم)
├── docs\ ← كل التوثيق
│ ├── contracts\ ← 4 عقود
│ └── PROJECT_HANDOFF\ ← هذا الفولدر
└── PROJECT_STATS.ps1 ← سكريبت إحصائيات

text
'@

$utf8 = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText("D:\Flash\docs\PROJECT_HANDOFF\00_INDEX.md", $content, $utf8)
Write-Host "Created 00_INDEX.md" -ForegroundColor Green