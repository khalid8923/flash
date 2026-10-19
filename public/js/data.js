window.FLASH_DATA = {
  user: { level: 42, levelDelta: 2, xp: 1240, xpNext: 1500, streak: 12, streakDelta: 3, freezeTokens: 1 },
  domains: [
    { id:"attention", c:"var(--d-attention)", name_en:"Attention", name_ar:"الانتباه", mastery:69, last10:[62,64,66,65,67,66,68,70,69,71], forecast:[71,72,72,73,73] },
    { id:"spatial", c:"var(--d-spatial)", name_en:"Spatial", name_ar:"الإدراك المكاني", mastery:58, last10:[60,59,61,58,60,57,59,56,58,57], forecast:[57,58,58,59,59] },
    { id:"speed", c:"var(--d-speed)", name_en:"Speed", name_ar:"السرعة", mastery:71, last10:[66,68,67,70,69,72,71,73,74,73], forecast:[74,75,75,76,76] },
    { id:"memory", c:"var(--d-memory)", name_en:"Memory", name_ar:"الذاكرة", mastery:76, last10:[70,72,71,74,76,75,78,80,79,82], forecast:[85,86,86,87,87] },
    { id:"logic", c:"var(--d-logic)", name_en:"Logic", name_ar:"المنطق", mastery:74, last10:[68,70,69,72,71,73,72,75,74,76], forecast:[76,77,77,78,78] },
    { id:"language", c:"var(--d-language)", name_en:"Language", name_ar:"اللغة", mastery:72, last10:[67,66,69,70,69,71,72,71,73,74], forecast:[74,75,75,76,76] },
    { id:"creativity", c:"var(--d-creativity)", name_en:"Creativity", name_ar:"الإبداع", mastery:63, last10:[55,57,56,59,58,60,61,60,62,63], forecast:[63,64,65,65,66] },
    { id:"emotional", c:"var(--d-emotional)", name_en:"Emotional IQ", name_ar:"الذكاء العاطفي", mastery:66, last10:[61,60,63,62,64,65,64,66,67,66], forecast:[67,68,68,69,69] },
    { id:"problem", c:"var(--d-problem)", name_en:"Problem Solving", name_ar:"حل المشكلات", mastery:70, last10:[64,66,65,67,69,68,70,69,71,72], forecast:[72,73,73,74,74] },
    { id:"numerical", c:"var(--d-numerical)", name_en:"Numerical", name_ar:"الأرقام", mastery:65, last10:[58,60,59,62,61,63,64,63,65,66], forecast:[66,67,67,68,68] }
  ],
  todayPlan: [
    { kind_en:"Warm-up", kind_ar:"إحماء", game_en:"Face Match", game_ar:"مطابقة الوجوه", domain:"memory", minutes:3, reason_en:"Ease into working memory", reason_ar:"دخول هادئ للذاكرة العاملة" },
    { kind_en:"Main", kind_ar:"أساسي", game_en:"Sequence Memory", game_ar:"ذاكرة التسلسل", domain:"memory", minutes:8, reason_en:"At your current level", reason_ar:"على مستواك الحالي" },
    { kind_en:"Challenge", kind_ar:"تحدٍّ", game_en:"Pattern Recall", game_ar:"استرجاع الأنماط", domain:"memory", minutes:5, reason_en:"One level up", reason_ar:"مستوى أعلى" }
  ],
  recentSessions: [
    { date:"2026-10-09", game_en:"Sequence Memory", game_ar:"ذاكرة التسلسل", domain:"memory", accuracy:86, medianRT:412, deltaVsPB:+2.1 },
    { date:"2026-10-09", game_en:"Face Match", game_ar:"مطابقة الوجوه", domain:"memory", accuracy:91, medianRT:388, deltaVsPB:-0.8 }
  ],
  fingerprint: { archetype_en:"Tidewatcher", archetype_ar:"راصد المدّ", modifier_en:"strong starts, fades late", modifier_ar:"بدايات قوية، تراجع متأخر" },
  topErrorPattern: { type_en:"post-error slowdown", type_ar:"تباطؤ بعد الخطأ", detail_en:"RT rises 24% after a wrong answer", detail_ar:"زمن الاستجابة يزيد ٢٤٪ بعد خطأ" },
  microLesson: { text_en:"Chunk digits in threes to extend span", text_ar:"قسّم الأرقام ثلاثيات لتوسيع المدى" },
  prediction: { accuracyRange: [84, 88], confidence: 0.78 },
  weeklyInsight: { text_en:"Your spatial accuracy trails. One focused week could close the gap.", text_ar:"دقة الإدراك المكاني متأخرة. أسبوع مركّز قد يقلّص الفجوة." },
  games: {
    attention: [
      { id:"flanker", n_en:"Flanker Test", n_ar:"اختبار فلانكر", ic:"🎯", d_en:"Conflict resolution · Eriksen 1974", d_ar:"حل التعارض · إريكسن 1974", status:"ready" },
      { id:"go-no-go", n_en:"Go / No-Go", n_ar:"انطلق / توقف", ic:"🚦", d_en:"Response inhibition · Drewe 1975", d_ar:"كبح الاستجابة · درو 1975", status:"ready" },
      { id:"task-switching", n_en:"Task Switching", n_ar:"تبديل المهام", ic:"🔀", d_en:"Cognitive flexibility · Monsell 2003", d_ar:"المرونة المعرفية · مونسيل 2003", status:"ready" },
      { id:"vigilance", n_en:"Vigilance", n_ar:"اليقظة", ic:"👁️", d_en:"Sustained attention · Rosvold 1956", d_ar:"الانتباه المستمر · روزفولد 1956", status:"ready" }
    ],
    spatial: [
      { id:"mental-rotation", n_en:"Mental Rotation", n_ar:"التدوير الذهني", ic:"🔄", d_en:"3D rotation · Shepard 1971", d_ar:"تدوير ثلاثي الأبعاد · شبرد 1971", status:"ready" },
      { id:"corsi-blocks", n_en:"Corsi Blocks", n_ar:"مكعبات كورسي", ic:"🧱", d_en:"Visuospatial span · Corsi 1972", d_ar:"النطاق المكاني · كورسي 1972", status:"ready" },
      { id:"map-memory", n_en:"Map Memory", n_ar:"ذاكرة الخريطة", ic:"🗺️", d_en:"Topographical memory · Postma 1996", d_ar:"الذاكرة الطبوغرافية · بوستما 1996", status:"ready" },
      { id:"block-counter", n_en:"Block Counter", n_ar:"عدّ الكتل", ic:"📦", d_en:"Hidden blocks · KABC-II", d_ar:"الكتل المخفية · KABC-II", status:"ready" }
    ],
    speed: [
      { id:"reaction", n_en:"Reaction", n_ar:"رد الفعل", ic:"⚡", d_en:"Simple RT · Ball 2002", d_ar:"زمن رد الفعل البسيط · بول 2002", status:"ready" },
      { id:"color-match", n_en:"Color Match", n_ar:"مطابقة الألوان", ic:"🎨", d_en:"Stroop · 1935", d_ar:"سترُوب · 1935", status:"ready" },
      { id:"symbol-sprint", n_en:"Symbol Sprint", n_ar:"سرعة الرموز", ic:"🔍", d_en:"Visual search · Treisman 1980", d_ar:"البحث البصري · تريزمان 1980", status:"ready" },
      { id:"rapid-fire", n_en:"Rapid Fire", n_ar:"النيران السريعة", ic:"🔥", d_en:"Multi-rule switching · Monsell 2003", d_ar:"تبديل قواعد متعددة · مونسيل 2003", status:"ready" }
    ],
    memory: [
      { id:"n-back", n_en:"N-Back", n_ar:"إن-باك", ic:"🧠", d_en:"Working memory · Jaeggi 2008", d_ar:"الذاكرة العاملة · جيجي 2008", status:"ready" },
      { id:"face-match", n_en:"Face Match", n_ar:"مطابقة الوجوه", ic:"👤", d_en:"Associative memory · Naveh-Benjamin 2000", d_ar:"الذاكرة الترابطية · نافيه-بنيامين 2000", status:"ready" },
      { id:"pattern-recall", n_en:"Pattern Recall", n_ar:"استرجاع الأنماط", ic:"🔷", d_en:"Visuospatial span · Corsi 1972", d_ar:"النطاق البصري المكاني · كورسي 1972", status:"ready" },
      { id:"seq-mem", n_en:"Sequence Memory", n_ar:"ذاكرة التسلسل", ic:"🔢", d_en:"Digit span · Miller 1956", d_ar:"نطاق الأرقام · ميلر 1956", status:"ready" },
      { id:"flash-cards", n_en:"Flash Cards", n_ar:"البطاقات الوميضية", ic:"🃏", d_en:"Visual memory · Naveh-Benjamin 2000", d_ar:"الذاكرة البصرية · نافيه-بنيامين 2000", status:"ready" }
    ],
    logic: [
      { id:"matrix-logic", n_en:"Matrix Logic", n_ar:"منطق المصفوفات", ic:"🔲", d_en:"Raven matrices · 1938", d_ar:"مصفوفات رافن · 1938", status:"ready" },
      { id:"syllogisms", n_en:"Syllogisms", n_ar:"القياس المنطقي", ic:"📐", d_en:"Aristotelian deduction · Aristotle", d_ar:"الاستنباط الأرسطي · أرسطو", status:"ready" },
      { id:"deduction", n_en:"Deduction", n_ar:"الاستنباط", ic:"🔍", d_en:"Inference · Evans 2008", d_ar:"الاستدلال · إيفانز 2008", status:"ready" },
      { id:"argument-analyzer", n_en:"Argument Analyzer", n_ar:"محلل الحجج", ic:"⚖️", d_en:"Fallacy detection · Abrami 2015", d_ar:"كشف المغالطات · أبرامي 2015", status:"ready" },
      { id:"truth-tbl", n_en:"Truth Tables", n_ar:"جداول الحقيقة", ic:"📋", d_en:"Boolean logic · Wason 1966", d_ar:"منطق بولياني · واسون 1966", status:"ready" }
    ],
    language: [
      { id:"lexical-decision", n_en:"Lexical Decision", n_ar:"القرار المعجمي", ic:"📖", d_en:"Semantic priming · Meyer 1971", d_ar:"التجهيز الدلالي · ماير 1971", status:"ready" },
      { id:"vocabulary-elite", n_en:"Vocabulary Elite", n_ar:"نخبة المفردات", ic:"📚", d_en:"Synonym matching · WAIS-IV", d_ar:"مطابقة المرادفات · WAIS-IV", status:"ready" },
      { id:"verbal-analogies", n_en:"Verbal Analogies", n_ar:"التناظر اللفظي", ic:"🔗", d_en:"A→B :: C→? · Sternberg 1977", d_ar:"أ→ب :: ج→؟ · ستيرنبرغ 1977", status:"ready" },
      { id:"word-scramble", n_en:"Word Scramble", n_ar:"ترتيب الحروف", ic:"🔤", d_en:"Lexical access · WAIS-IV", d_ar:"الوصول المعجمي · WAIS-IV", status:"ready" }
    ],
    creativity: [
      { id:"alternative-uses", n_en:"Alternative Uses", n_ar:"الاستخدامات البديلة", ic:"💡", d_en:"Divergent thinking · Guilford 1967", d_ar:"التفكير التباعدي · جيلفورد 1967", status:"ready" },
      { id:"creative-connect", n_en:"Creative Connect", n_ar:"الربط الإبداعي", ic:"🌐", d_en:"Remote Associates · Mednick 1962", d_ar:"الروابط البعيدة · ميدنيك 1962", status:"ready" },
      { id:"story-spark", n_en:"Story Spark", n_ar:"شرارة القصة", ic:"✨", d_en:"Narrative creativity · Amabile 1982", d_ar:"الإبداع السردي · أمابيلا 1982", status:"ready" },
      { id:"idea-flow", n_en:"Idea Flow", n_ar:"تدفق الأفكار", ic:"🌊", d_en:"Ideational fluency · Guilford", d_ar:"طلاقة الأفكار · جيلفورد", status:"ready" }
    ],
    emotional: [
      { id:"micro-expressions", n_en:"Micro Expressions", n_ar:"التعابير الدقيقة", ic:"😮", d_en:"Facial emotion · Ekman 1969", d_ar:"تعابير الوجه · إكمان 1969", status:"ready" },
      { id:"tone-detector", n_en:"Tone Detector", n_ar:"كاشف النبرة", ic:"🎵", d_en:"Emotional tone · MSCEIT", d_ar:"النبرة العاطفية · MSCEIT", status:"ready" },
      { id:"empathy-engine", n_en:"Empathy Engine", n_ar:"محرك التعاطف", ic:"🫂", d_en:"Empathic accuracy · Ickes 1993", d_ar:"الدقة التعاطفية · إيكس 1993", status:"ready" },
      { id:"social-read", n_en:"Social Read", n_ar:"القراءة الاجتماعية", ic:"👥", d_en:"Group dynamics · Burgoon 1994", d_ar:"ديناميكيات المجموعة · بيرجون 1994", status:"ready" }
    ],
    problem: [
      { id:"hanoi", n_en:"Tower of Hanoi", n_ar:"برج هانوي", ic:"🗼", d_en:"Recursive planning · Simon 1975", d_ar:"التخطيط التكراري · سايمون 1975", status:"ready" },
      { id:"river-crossing", n_en:"River Crossing", n_ar:"عبور النهر", ic:"🌊", d_en:"Constraint satisfaction · Simon 1971", d_ar:"إرضاء القيود · سايمون 1971", status:"ready" },
      { id:"gear-logic", n_en:"Gear Logic", n_ar:"منطق التروس", ic:"⚙️", d_en:"Mechanical reasoning · Hegarty 2004", d_ar:"الاستدلال الميكانيكي · هيجارتي 2004", status:"ready" },
      { id:"path-finder", n_en:"Path Finder", n_ar:"مكتشف المسار", ic:"🧭", d_en:"Maze planning · Shallice 1982", d_ar:"تخطيط المتاهة · شاليس 1982", status:"ready" }
    ],
    numerical: [
      { id:"digit-span", n_en:"Digit Span", n_ar:"مدى الأرقام", ic:"📊", d_en:"Backward recall · WAIS-IV", d_ar:"استدعاء عكسي · WAIS-IV", status:"ready" },
      { id:"mental-math", n_en:"Mental Math", n_ar:"الحساب الذهني", ic:"➕", d_en:"Arithmetic chains · Dehaene 1999", d_ar:"سلاسل حسابية · ديهاين 1999", status:"ready" },
      { id:"num-chains", n_en:"Number Chains", n_ar:"سلاسل الأرقام", ic:"🔗", d_en:"Patterns · Kyllonen 1990", d_ar:"الأنماط الرقمية · كيلونين 1990", status:"ready" },
      { id:"speed-calc", n_en:"Speed Calculus", n_ar:"الحساب السريع", ic:"⚡", d_en:"Equation speed · Salthouse 1996", d_ar:"سرعة المعادلات · سولتهاوس 1996", status:"ready" }
    ]
  }
};