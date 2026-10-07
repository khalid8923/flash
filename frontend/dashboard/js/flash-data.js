/* ═══════════════════════════════════════════════════════════
   FLASH Dashboard — Data Layer v6.1
   36 games across 9 domains — 35 ready + 1 wip
   ═══════════════════════════════════════════════════════════ */

window.FLASH_DATA = {

  DOMAINS: [

    /* ═══════════════════════════════════════════════════════
       DOMAIN 1: ATTENTION — COMPLETE (4/4) ✅
       ═══════════════════════════════════════════════════════ */
    {
      id: 'attention',
      name: 'Attention & Focus',
      icon: '👁️',
      color: '#2EC4B6',
      score: 0, lv: 0,
      complete: true,
      core: true,
      games: [
        { id: 'flanker',        name: 'Flanker Test',    icon: '🎯', desc: 'Conflict resolution (Eriksen 1974)',      diff: 4, best: 0, lv: 0, prog: 0, status: 'ready' },
        { id: 'go-no-go',       name: 'Go / No-Go',      icon: '🚦', desc: 'Response inhibition (Drewe 1975)',        diff: 5, best: 0, lv: 0, prog: 0, status: 'ready' },
        { id: 'task-switching', name: 'Task Switching',  icon: '🔀', desc: 'Cognitive flexibility (Monsell 2003)',    diff: 5, best: 0, lv: 0, prog: 0, status: 'ready' },
        { id: 'vigilance',      name: 'Vigilance',       icon: '🎯', desc: 'Sustained attention (Rosvold 1956)',      diff: 5, best: 0, lv: 0, prog: 0, status: 'ready' }
      ]
    },

    /* ═══════════════════════════════════════════════════════
       DOMAIN 2: SPATIAL — COMPLETE (4/4) ✅
       ═══════════════════════════════════════════════════════ */
    {
      id: 'spatial',
      name: 'Spatial Intelligence',
      icon: '🗺️',
      color: '#5E5CE6',
      score: 0, lv: 0,
      complete: true,
      core: true,
      games: [
        { id: 'mental-rotation', name: 'Mental Rotation', icon: '🔄', desc: '3D object rotation (Shepard 1971)',       diff: 5, best: 0, lv: 0, prog: 0, status: 'ready' },
        { id: 'corsi-blocks',    name: 'Corsi Blocks',    icon: '🧱', desc: 'Visuospatial span (Corsi 1972)',          diff: 4, best: 0, lv: 0, prog: 0, status: 'ready' },
        { id: 'map-memory',      name: 'Map Memory',      icon: '🗺️', desc: 'Topographical memory (Postma 1996)',      diff: 5, best: 0, lv: 0, prog: 0, status: 'ready' },
        { id: 'block-counter',   name: 'Block Counter',   icon: '📦', desc: 'Hidden-block counting (KABC)',            diff: 4, best: 0, lv: 0, prog: 0, status: 'ready' }
      ]
    },

    /* ═══════════════════════════════════════════════════════
       DOMAIN 3: SPEED — COMPLETE (4/4) ✅
       ═══════════════════════════════════════════════════════ */
    {
      id: 'speed',
      name: 'Speed',
      icon: '⚡',
      color: '#FF6B35',
      score: 0, lv: 0,
      complete: true,
      core: true,
      games: [
        { id: 'reaction',      name: 'Reaction',      icon: '⚡', desc: 'Simple reaction time',                   diff: 1, best: 0, lv: 0, prog: 0, status: 'ready' },
        { id: 'color-match',   name: 'Color Match',   icon: '🎨', desc: 'Stroop interference (Stroop 1935)',      diff: 3, best: 0, lv: 0, prog: 0, status: 'ready' },
        { id: 'symbol-sprint', name: 'Symbol Sprint', icon: '🔍', desc: 'Visual search (Treisman 1980)',          diff: 4, best: 0, lv: 0, prog: 0, status: 'ready' },
        { id: 'rapid-fire',    name: 'Rapid Fire',    icon: '🔥', desc: 'Task switching (Monsell 2003)',          diff: 5, best: 0, lv: 0, prog: 0, status: 'ready' }
      ]
    },

    /* ═══════════════════════════════════════════════════════
       DOMAIN 4: MEMORY — COMPLETE (4/4) ✅
       ═══════════════════════════════════════════════════════ */
    {
      id: 'memory',
      name: 'Memory',
      icon: '🧠',
      color: '#00EEFF',
      score: 0, lv: 0,
      complete: true,
      core: true,
      games: [
        { id: 'n-back',         name: 'N-Back',         icon: '🧠', desc: 'Working memory span (Jaeggi 2008)',         diff: 5, best: 0, lv: 0, prog: 0, status: 'ready' },
        { id: 'face-match',     name: 'Face Match',     icon: '👤', desc: 'Associative memory (Naveh-Benjamin 2000)',  diff: 4, best: 0, lv: 0, prog: 0, status: 'ready' },
        { id: 'pattern-recall', name: 'Pattern Recall', icon: '🔷', desc: 'Sequential visuospatial (Corsi 1972)',      diff: 4, best: 0, lv: 0, prog: 0, status: 'ready' },
        { id: 'seq-mem',        name: 'Seq-Mem',        icon: '🔢', desc: 'Forward digit span (Miller 1956)',          diff: 3, best: 0, lv: 0, prog: 0, status: 'ready' }
      ]
    },

    /* ═══════════════════════════════════════════════════════
       DOMAIN 5: LOGIC — COMPLETE (4/4) ✅
       ═══════════════════════════════════════════════════════ */
    {
      id: 'logic',
      name: 'Logic & Reasoning',
      icon: '⚙️',
      color: '#3A86FF',
      score: 0, lv: 0,
      complete: true,
      core: true,
      games: [
        { id: 'matrix-logic',      name: 'Matrix Logic',      icon: '🔲', desc: 'Raven matrices (Raven 1938)',              diff: 5, best: 0, lv: 0, prog: 0, status: 'ready' },
        { id: 'syllogisms',        name: 'Syllogisms',        icon: '🎯', desc: 'Deductive reasoning (Aristotle)',          diff: 4, best: 0, lv: 0, prog: 0, status: 'ready' },
        { id: 'deduction',         name: 'Deduction Engine',  icon: '🔍', desc: 'Multi-premise inference (Evans 2008)',    diff: 5, best: 0, lv: 0, prog: 0, status: 'ready' },
        { id: 'argument-analyzer', name: 'Argument Analyzer', icon: '⚖️', desc: 'Fallacy detection (Abrami 2015)',         diff: 4, best: 0, lv: 0, prog: 0, status: 'ready' }
      ]
    },

    /* ═══════════════════════════════════════════════════════
       DOMAIN 6: LANGUAGE — COMPLETE (4/4) ✅
       ═══════════════════════════════════════════════════════ */
    {
      id: 'language',
      name: 'Language',
      icon: '📖',
      color: '#9D4EDD',
      score: 0, lv: 0,
      complete: true,
      core: true,
      games: [
        { id: 'lexical-decision',  name: 'Lexical Decision',  icon: '📖', desc: 'Semantic priming (Meyer 1971)',             diff: 5, best: 0, lv: 0, prog: 0, status: 'ready' },
        { id: 'vocabulary-elite',  name: 'Vocabulary Elite',  icon: '📚', desc: 'Synonym matching (WAIS-IV)',                diff: 3, best: 0, lv: 0, prog: 0, status: 'ready' },
        { id: 'verbal-analogies',  name: 'Verbal Analogies',  icon: '🔗', desc: 'A→B :: C→? (Sternberg 1977)',               diff: 4, best: 0, lv: 0, prog: 0, status: 'ready' },
        { id: 'word-scramble',     name: 'Word Scramble',     icon: '🔤', desc: 'Lexical access · letter rearrange',         diff: 3, best: 0, lv: 0, prog: 0, status: 'ready' }
      ]
    },

    /* ═══════════════════════════════════════════════════════
       DOMAIN 7: CREATIVITY — 3 ready + 1 wip ⚠️
       ═══════════════════════════════════════════════════════ */
    {
      id: 'creativity',
      name: 'Creativity',
      icon: '✨',
      color: '#FFD60A',
      score: 0, lv: 0,
      complete: false,
      core: true,
      games: [
        { id: 'alternative-uses', name: 'Alternative Uses', icon: '💡', desc: 'Divergent thinking (Guilford 1967)',      diff: 4, best: 0, lv: 0, prog: 0, status: 'ready' },
        { id: 'creative-connect', name: 'Creative Connect', icon: '🌐', desc: 'Remote Associates (Mednick 1962)',        diff: 5, best: 0, lv: 0, prog: 0, status: 'ready' },
        { id: 'story-spark',      name: 'Story Spark',      icon: '📖', desc: 'Narrative creativity (Amabile 1982)',     diff: 3, best: 0, lv: 0, prog: 0, status: 'ready' },
        { id: 'idea-flow',        name: 'Idea Flow',        icon: '🌊', desc: 'Ideational fluency (Guilford)',           diff: 4, best: 0, lv: 0, prog: 0, status: 'wip' }
      ]
    },

    /* ═══════════════════════════════════════════════════════
       DOMAIN 8: EMOTIONAL — COMPLETE (4/4) ✅
       ═══════════════════════════════════════════════════════ */
    {
      id: 'emotional',
      name: 'Emotional IQ',
      icon: '❤️',
      color: '#FF4D6D',
      score: 0, lv: 0,
      complete: true,
      core: true,
      games: [
        { id: 'micro-expressions', name: 'Micro Expressions', icon: '😮', desc: 'Facial emotion (Ekman 1969)',           diff: 5, best: 0, lv: 0, prog: 0, status: 'ready' },
        { id: 'tone-detector',     name: 'Tone Detector',     icon: '🎵', desc: 'Emotional tone (MSCEIT)',               diff: 5, best: 0, lv: 0, prog: 0, status: 'ready' },
        { id: 'empathy-engine',    name: 'Empathy Engine',    icon: '🫂', desc: 'Empathic accuracy (Ickes 1993)',        diff: 5, best: 0, lv: 0, prog: 0, status: 'ready' },
        { id: 'social-read',       name: 'Social Read',       icon: '👥', desc: 'Group dynamics (Burgoon 1994)',         diff: 5, best: 0, lv: 0, prog: 0, status: 'ready' }
      ]
    },

    /* ═══════════════════════════════════════════════════════
       DOMAIN 9: PROBLEM SOLVING — COMPLETE (4/4) ✅
       ═══════════════════════════════════════════════════════ */
    {
      id: 'problem',
      name: 'Problem Solving',
      icon: '🧩',
      color: '#0FD9B4',
      score: 0, lv: 0,
      complete: true,
      core: true,
      games: [
        { id: 'hanoi',          name: 'Tower of Hanoi', icon: '🗼', desc: 'Recursive planning (Simon 1975)',        diff: 4, best: 0, lv: 0, prog: 0, status: 'ready' },
        { id: 'river-crossing', name: 'River Crossing', icon: '🌊', desc: 'Constraint satisfaction (Simon 1971)',   diff: 4, best: 0, lv: 0, prog: 0, status: 'ready' },
        { id: 'gear-logic',     name: 'Gear Logic',     icon: '⚙️', desc: 'Mechanical reasoning (Hegarty 2004)',    diff: 5, best: 0, lv: 0, prog: 0, status: 'ready' },
        { id: 'path-finder',    name: 'Path Finder',    icon: '🗺️', desc: 'Maze planning (Shallice 1982)',          diff: 5, best: 0, lv: 0, prog: 0, status: 'ready' }
      ]
    }

  ],

  /* ═══════════════════════════════════════════════════════
     STUBS
     ═══════════════════════════════════════════════════════ */

  AI_RECS: [
    { name: 'N-Back',          icon: '🧠', color: '#00EEFF', why: 'Best working memory paradigm — Jaeggi 2008.',      lv: 'Lv.1' },
    { name: 'Mental Rotation', icon: '🔄', color: '#5E5CE6', why: 'Strongest transfer evidence (Uttal 2013).',        lv: 'Lv.1' },
    { name: 'Rapid Fire',      icon: '🔥', color: '#FF6B35', why: 'Task-switching under pressure — Monsell 2003.',    lv: 'Lv.1' }
  ],

  ACTIVITY: [
    { name: 'Reaction',     icon: '⚡', color: '#FFD60A', domain: 'Speed',     score: 1380, delta: '+12%', time: '2h ago' },
    { name: 'Color Match',  icon: '🎨', color: '#FF0077', domain: 'Speed',     score: 2100, delta: '+8%',  time: '3h ago' },
    { name: 'N-Back',       icon: '🧠', color: '#00EEFF', domain: 'Memory',    score: 1750, delta: '+5%',  time: '5h ago' },
    { name: 'Rapid Fire',   icon: '🔥', color: '#FF6B35', domain: 'Speed',     score: 1680, delta: '+9%',  time: '1d ago' },
    { name: 'Lexical Dec.', icon: '📖', color: '#9D4EDD', domain: 'Language',  score: 1440, delta: '+6%',  time: '1d ago' }
  ],

  NEXT_SESSIONS: [
    { name: 'Seq-Mem',           icon: '🔢', domain: 'Memory' },
    { name: 'Argument Analyzer', icon: '⚖️', domain: 'Logic' },
    { name: 'Vocabulary Elite',  icon: '📚', domain: 'Language' },
    { name: 'Verbal Analogies',  icon: '🔗', domain: 'Language' }
  ],

  /* ═══════════════════════════════════════════════════════
     TRANSLATIONS — EN + AR (9 domains · 36 games · 36 descs)
     ═══════════════════════════════════════════════════════ */

  TRANSLATIONS: {
    en: {
      /* ─── Domain names (9) ─── */
      'domain_attention':  'Attention & Focus',
      'domain_spatial':    'Spatial Intelligence',
      'domain_speed':      'Speed',
      'domain_memory':     'Memory',
      'domain_logic':      'Logic & Reasoning',
      'domain_language':   'Language',
      'domain_creativity': 'Creativity',
      'domain_emotional':  'Emotional IQ',
      'domain_problem':    'Problem Solving',

      /* ─── Game names (36) ─── */
      'game_flanker':              'Flanker Test',
      'game_go-no-go':             'Go / No-Go❌',
      'game_task-switching':       'Task Switching',
      'game_vigilance':            'Vigilance❌',
      'game_mental-rotation':      'Mental Rotation',
      'game_corsi-blocks':         'Corsi Blocks',
      'game_map-memory':           'Map Memory❌',
      'game_block-counter':        'Block Counter',
      'game_reaction':             'Reaction',
      'game_color-match':          'Color Match',
      'game_symbol-sprint':        'Symbol Sprint',
      'game_rapid-fire':           'Rapid Fire',
      'game_n-back':               'N-Back🙄',
      'game_face-match':           'Face Match',
      'game_pattern-recall':       'Pattern Recall',
      'game_seq-mem':              'Seq-Mem',
      'game_matrix-logic':         'Matrix Logic',
      'game_syllogisms':           'Syllogisms ❌',
      'game_deduction':            'Deduction Engine ❌',
      'game_argument-analyzer':    'Argument Analyzer',
      'game_lexical-decision':     'Lexical Decision',
      'game_vocabulary-elite':     'Vocabulary Elite',
      'game_verbal-analogies':     'Verbal Analogies',
      'game_word-scramble':        'Word Scramble',
      'game_alternative-uses':     'Alternative Uses',
      'game_creative-connect':     'Creative Connect',
      'game_story-spark':          'Story Spark',
      'game_idea-flow':            'Idea Flow',
      'game_micro-expressions':    'Micro Expressions',
      'game_tone-detector':        'Tone Detector',
      'game_empathy-engine':       'Empathy Engine',
      'game_social-read':          'Social Read',
      'game_hanoi':                'Tower of Hanoi',
      'game_river-crossing':       'River Crossing',
      'game_gear-logic':           'Gear Logic',
      'game_path-finder':          'Path Finder',

      /* ─── Game descriptions (36) ─── */
      'game_desc_flanker':              'Conflict resolution (Eriksen 1974)',
      'game_desc_go-no-go':             'Response inhibition (Drewe 1975)',
      'game_desc_task-switching':       'Cognitive flexibility (Monsell 2003)',
      'game_desc_vigilance':            'Sustained attention (Rosvold 1956)',
      'game_desc_mental-rotation':      '3D object rotation (Shepard 1971)',
      'game_desc_corsi-blocks':         'Visuospatial span (Corsi 1972)',
      'game_desc_map-memory':           'Topographical memory (Postma 1996)',
      'game_desc_block-counter':        'Hidden-block counting (KABC)',
      'game_desc_reaction':             'Simple reaction time',
      'game_desc_color-match':          'Stroop interference (Stroop 1935)',
      'game_desc_symbol-sprint':        'Visual search (Treisman 1980)',
      'game_desc_rapid-fire':           'Task switching (Monsell 2003)',
      'game_desc_n-back':               'Working memory span (Jaeggi 2008)',
      'game_desc_face-match':           'Associative memory (Naveh-Benjamin 2000)',
      'game_desc_pattern-recall':       'Sequential visuospatial (Corsi 1972)',
      'game_desc_seq-mem':              'Forward digit span (Miller 1956)',
      'game_desc_matrix-logic':         'Raven matrices (Raven 1938)',
      'game_desc_syllogisms':           'Deductive reasoning (Aristotle)',
      'game_desc_deduction':            'Multi-premise inference (Evans 2008)',
      'game_desc_argument-analyzer':    'Fallacy detection (Abrami 2015)',
      'game_desc_lexical-decision':     'Semantic priming (Meyer 1971)',
      'game_desc_vocabulary-elite':     'Synonym matching (WAIS-IV)',
      'game_desc_verbal-analogies':     'A→B :: C→? (Sternberg 1977)',
      'game_desc_word-scramble':        'Lexical access · letter rearrange',
      'game_desc_alternative-uses':     'Divergent thinking (Guilford 1967)',
      'game_desc_creative-connect':     'Remote Associates (Mednick 1962)',
      'game_desc_story-spark':          'Narrative creativity (Amabile 1982)',
      'game_desc_idea-flow':            'Ideational fluency (Guilford)',
      'game_desc_micro-expressions':    'Facial emotion (Ekman 1969)',
      'game_desc_tone-detector':        'Emotional tone (MSCEIT)',
      'game_desc_empathy-engine':       'Empathic accuracy (Ickes 1993)',
      'game_desc_social-read':          'Group dynamics (Burgoon 1994)',
      'game_desc_hanoi':                'Recursive planning (Simon 1975)',
      'game_desc_river-crossing':       'Constraint satisfaction (Simon 1971)',
      'game_desc_gear-logic':           'Mechanical reasoning (Hegarty 2004)',
      'game_desc_path-finder':          'Maze planning (Shallice 1982)'
    },

    ar: {
      /* ─── Domain names (9) ─── */
      'domain_attention':  'الانتباه والتركيز',
      'domain_spatial':    'الذكاء المكاني',
      'domain_speed':      'السرعة',
      'domain_memory':     'الذاكرة',
      'domain_logic':      'المنطق والاستدلال',
      'domain_language':   'اللغة',
      'domain_creativity': 'الإبداع',
      'domain_emotional':  'الذكاء العاطفي',
      'domain_problem':    'حل المشكلات',

      /* ─── Game names (36) ─── */
      'game_flanker':              'اختبار فلانكر',
      'game_go-no-go':             'اذهب / لا تذهب',
      'game_task-switching':       'تبديل المهام',
      'game_vigilance':            'اليقظة',
      'game_mental-rotation':      'التدوير الذهني',
      'game_corsi-blocks':         'مكعبات كورسي',
      'game_map-memory':           'ذاكرة الخريطة',
      'game_block-counter':        'عدّ المكعبات',
      'game_reaction':             'رد الفعل',
      'game_color-match':          'مطابقة الألوان',
      'game_symbol-sprint':        'سرعة الرموز',
      'game_rapid-fire':           'النيران السريعة',
      'game_n-back':               'إن-باك',
      'game_face-match':           'مطابقة الوجوه',
      'game_pattern-recall':       'استدعاء النمط',
      'game_seq-mem':              'التسلسل الرقمي',
      'game_matrix-logic':         'منطق المصفوفات',
      'game_syllogisms':           'القياس المنطقي',
      'game_deduction':            'محرك الاستنباط',
      'game_argument-analyzer':    'محلل الحجج',
      'game_lexical-decision':     'القرار المعجمي',
      'game_vocabulary-elite':     'نخبة المفردات',
      'game_verbal-analogies':     'التناظر اللفظي',
      'game_word-scramble':        'ترتيب الحروف',
      'game_alternative-uses':     'الاستخدامات البديلة',
      'game_creative-connect':     'الربط الإبداعي',
      'game_story-spark':          'شرارة القصة',
      'game_idea-flow':            'تدفق الأفكار',
      'game_micro-expressions':    'التعابير الدقيقة',
      'game_tone-detector':        'كاشف النبرة',
      'game_empathy-engine':       'محرك التعاطف',
      'game_social-read':          'القراءة الاجتماعية',
      'game_hanoi':                'برج هانوي',
      'game_river-crossing':       'عبور النهر',
      'game_gear-logic':           'منطق التروس',
      'game_path-finder':          'مكتشف المسار',

      /* ─── Game descriptions (36) ─── */
      'game_desc_flanker':              'حل التعارض (إريكسن 1974)',
      'game_desc_go-no-go':             'كبح الاستجابة (درو 1975)',
      'game_desc_task-switching':       'المرونة المعرفية (مونسيل 2003)',
      'game_desc_vigilance':            'الانتباه المستمر (روزفولد 1956)',
      'game_desc_mental-rotation':      'تدوير الأجسام ثلاثية الأبعاد (شبرد 1971)',
      'game_desc_corsi-blocks':         'نطاق الذاكرة البصرية المكانية (كورسي 1972)',
      'game_desc_map-memory':           'الذاكرة الطبوغرافية (بوستما 1996)',
      'game_desc_block-counter':        'عد المكعبات المخفية (KABC)',
      'game_desc_reaction':             'زمن رد الفعل البسيط',
      'game_desc_color-match':          'تداخل ستروب (ستروب 1935)',
      'game_desc_symbol-sprint':        'البحث البصري (تريزمان 1980)',
      'game_desc_rapid-fire':           'تبديل المهام (مونسيل 2003)',
      'game_desc_n-back':               'نطاق ذاكرة العمل (جيجي 2008)',
      'game_desc_face-match':           'الذاكرة الترابطية (نافيه-بنيامين 2000)',
      'game_desc_pattern-recall':       'ذاكرة تسلسلية بصرية مكانية (كورسي 1972)',
      'game_desc_seq-mem':              'نطاق الأرقام الأمامي (ميلر 1956)',
      'game_desc_matrix-logic':         'مصفوفات رافن (رافن 1938)',
      'game_desc_syllogisms':           'الاستدلال الاستنباطي (أرسطو)',
      'game_desc_deduction':            'استنتاج متعدد المقدمات (إيفانز 2008)',
      'game_desc_argument-analyzer':    'كشف المغالطات المنطقية (أبرامي 2015)',
      'game_desc_lexical-decision':     'التجهيز الدلالي (ماير 1971)',
      'game_desc_vocabulary-elite':     'مطابقة المرادفات (WAIS-IV)',
      'game_desc_verbal-analogies':     'أ→ب :: ج→؟ (ستيرنبرغ 1977)',
      'game_desc_word-scramble':        'الوصول المعجمي · ترتيب الحروف',
      'game_desc_alternative-uses':     'التفكير التباعدي (جيلفورد 1967)',
      'game_desc_creative-connect':     'الروابط البعيدة (ميدنيك 1962)',
      'game_desc_story-spark':          'الإبداع السردي (أمابيلا 1982)',
      'game_desc_idea-flow':            'طلاقة الأفكار (جيلفورد)',
      'game_desc_micro-expressions':    'تعابير الوجه (إكمان 1969)',
      'game_desc_tone-detector':        'النبرة العاطفية (MSCEIT)',
      'game_desc_empathy-engine':       'الدقة التعاطفية (إيكس 1993)',
      'game_desc_social-read':          'ديناميكيات المجموعة (بيرجون 1994)',
      'game_desc_hanoi':                'التخطيط التكراري (سايمون 1975)',
      'game_desc_river-crossing':       'إرضاء القيود (سايمون 1971)',
      'game_desc_gear-logic':           'الاستدلال الميكانيكي (هيجارتي 2004)',
      'game_desc_path-finder':          'تخطيط المتاهة (شاليس 1982)'
    }
  }

};