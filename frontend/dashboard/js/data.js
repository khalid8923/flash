/* ═══════════════════════════════════════════════════════════
   FLASH — Data Layer
   Domains, games, mock sessions
   ═══════════════════════════════════════════════════════════ */
window.FLASH_DATA = {

  user: {
    level: 42,
    levelDelta: +2,
    xp: 1240,
    xpNext: 1500,
    streak: 12,
    streakDelta: +3,
    freezeTokens: 1
  },

  domains: [
    { id:"attention", c:"var(--d-attention)", name_en:"Attention",       name_ar:"الانتباه",           mastery:69, last10:[62,64,66,65,67,66,68,70,69,71], forecast:[71,72,72,73,73] },
    { id:"spatial",   c:"var(--d-spatial)",   name_en:"Spatial",         name_ar:"الإدراك المكاني",     mastery:58, last10:[60,59,61,58,60,57,59,56,58,57], forecast:[57,58,58,59,59] },
    { id:"speed",     c:"var(--d-speed)",     name_en:"Speed",           name_ar:"السرعة",             mastery:71, last10:[66,68,67,70,69,72,71,73,74,73], forecast:[74,75,75,76,76] },
    { id:"memory",    c:"var(--d-memory)",    name_en:"Memory",          name_ar:"الذاكرة",            mastery:76, last10:[70,72,71,74,76,75,78,80,79,82], forecast:[85,86,86,87,87] },
    { id:"logic",     c:"var(--d-logic)",     name_en:"Logic",           name_ar:"المنطق",             mastery:74, last10:[68,70,69,72,71,73,72,75,74,76], forecast:[76,77,77,78,78] },
    { id:"language",  c:"var(--d-language)",  name_en:"Language",        name_ar:"اللغة",              mastery:72, last10:[67,66,69,70,69,71,72,71,73,74], forecast:[74,75,75,76,76] },
    { id:"creativity",c:"var(--d-creativity)",name_en:"Creativity",      name_ar:"الإبداع",            mastery:63, last10:[55,57,56,59,58,60,61,60,62,63], forecast:[63,64,65,65,66] },
    { id:"emotional", c:"var(--d-emotional)", name_en:"Emotional IQ",    name_ar:"الذكاء العاطفي",     mastery:66, last10:[61,60,63,62,64,65,64,66,67,66], forecast:[67,68,68,69,69] },
    { id:"problem",   c:"var(--d-problem)",   name_en:"Problem Solving", name_ar:"حل المشكلات",        mastery:70, last10:[64,66,65,67,69,68,70,69,71,72], forecast:[72,73,73,74,74] },
    { id:"numerical", c:"var(--d-numerical)", name_en:"Numerical",       name_ar:"الأرقام",            mastery:65, last10:[58,60,59,62,61,63,64,63,65,66], forecast:[66,67,67,68,68] }
  ],

  todayPlan: [
    { kind_en:"Warm-up",   kind_ar:"إحماء",   game_en:"Face Match",      game_ar:"مطابقة الوجوه",     domain:"memory", minutes:3, reason_en:"Ease into working memory",     reason_ar:"دخول هادئ للذاكرة العاملة" },
    { kind_en:"Main",      kind_ar:"أساسي",   game_en:"Sequence Memory", game_ar:"ذاكرة التسلسل",     domain:"memory", minutes:8, reason_en:"At your current level",        reason_ar:"على مستواك الحالي" },
    { kind_en:"Challenge", kind_ar:"تحدٍّ",   game_en:"Pattern Recall",  game_ar:"استرجاع الأنماط",   domain:"memory", minutes:5, reason_en:"One level up",                  reason_ar:"مستوى أعلى" }
  ],

  recentSessions: [
    { date:"2026-10-09", game_en:"Sequence Memory", game_ar:"ذاكرة التسلسل",   domain:"memory",     accuracy:86, medianRT:412, deltaVsPB:+2.1 },
    { date:"2026-10-09", game_en:"Face Match",      game_ar:"مطابقة الوجوه",   domain:"memory",     accuracy:91, medianRT:388, deltaVsPB:-0.8 },
    { date:"2026-10-08", game_en:"Mental Rotation", game_ar:"التدوير الذهني",   domain:"spatial",    accuracy:71, medianRT:640, deltaVsPB:-4.6 },
    { date:"2026-10-08", game_en:"Visual Search",   game_ar:"البحث البصري",     domain:"attention",  accuracy:88, medianRT:451, deltaVsPB:-1.2 },
    { date:"2026-10-07", game_en:"Matrix Reasoning",game_ar:"استدلال المصفوفات",domain:"logic",      accuracy:79, medianRT:702, deltaVsPB:-2.9 },
    { date:"2026-10-07", game_en:"Pattern Recall",  game_ar:"استرجاع الأنماط",  domain:"memory",     accuracy:74, medianRT:523, deltaVsPB:+1.4 },
    { date:"2026-10-06", game_en:"Word Fluency",    game_ar:"الطلاقة اللفظية",  domain:"language",   accuracy:83, medianRT:610, deltaVsPB:-3.1 },
    { date:"2026-10-05", game_en:"Reaction Time",   game_ar:"زمن الرد",         domain:"speed",      accuracy:90, medianRT:366, deltaVsPB:-0.4 },
    { date:"2026-10-04", game_en:"Digit Span",      game_ar:"مدى الأرقام",      domain:"numerical",  accuracy:68, medianRT:655, deltaVsPB:-5.2 },
    { date:"2026-10-03", game_en:"Creative Connect",game_ar:"الربط الإبداعي",   domain:"creativity", accuracy:81, medianRT:580, deltaVsPB:-1.7 }
  ],

  fingerprint: {
    archetype_en:"Tidewatcher", archetype_ar:"راصد المدّ",
    modifier_en:"strong starts, fades late",
    modifier_ar:"بدايات قوية، تراجع متأخر"
  },

  topErrorPattern: {
    type_en:"post-error slowdown", type_ar:"تباطؤ بعد الخطأ",
    detail_en:"RT rises 24% after a wrong answer",
    detail_ar:"زمن الاستجابة يزيد ٢٤٪ بعد خطأ"
  },

  microLesson: {
    text_en:"Chunk digits in threes to extend span",
    text_ar:"قسّم الأرقام ثلاثيات لتوسيع المدى"
  },

  prediction: {
    accuracyRange: [84, 88],
    confidence: 0.78
  },

  weeklyInsight: {
    text_en:"Your spatial accuracy trails. One focused week could close the gap.",
    text_ar:"دقة الإدراك المكاني متأخرة. أسبوع مركّز قد يقلّص الفجوة."
  }
};