/* ═══════════════════════════════════════════════════════════
   FLASH — Internationalization (i18n)
   Languages: English (en) · العربية (ar)
   Usage: FLASH_I18N.t('play')
          FLASH_I18N.setLang('ar')
          FLASH_I18N.t('sessions_count', { n: 5 })
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const LANGS = ['en', 'ar'];
  const DEFAULT_LANG = 'en';
  const STORAGE_KEY = 'flash:lang';

  /* ═══════════════════════════════════════════════════════
     STRINGS
     ═══════════════════════════════════════════════════════ */
  const strings = {

    /* ─────────── EN ─────────── */
    en: {
      /* Common */
      play: 'Play',
      back: 'Back',
      back_to_menu: 'Back to Menu',
      dashboard: 'Dashboard',
      close: 'Close',
      save: 'Save',
      cancel: 'Cancel',
      yes: 'Yes',
      no: 'No',
      continue: 'Continue',
      try_again: 'Try Again',
      start: 'Start',
      start_test: 'Start Test',
      loading: 'Loading…',
      soon: 'Soon',
      ready: 'READY',
      wip: 'WIP',
      live: 'LIVE',
      soon_msg: 'Coming soon',
      wip_msg: 'This game is still under development.',

      /* HUD */
      level: 'Level',
      streak: 'Streak',
      lives: 'Lives',
      score: 'Score',
      best: 'Best',
      time: 'Time',
      correct: 'Correct',
      wrong: 'Wrong',
      accuracy: 'Accuracy',

      /* Brand / Domain */
      training_module: 'Training Module',
      cognitive_iq: 'Cognitive IQ',
      day_streak: 'Day Streak',
      sessions_total: 'Sessions Total',
      global_rank: 'Global Rank',
      cognitive_profile: 'Cognitive Profile',
      overall_domain_score: 'Overall Domain Score',
      domain_breakdown: 'Domain Breakdown',
      ai_adaptive_engine: 'AI Adaptive Engine',
      recent_activity: 'Recent Activity',
      level_progression: 'Level & Progression',
      ai_next_sessions: 'AI-Recommended Next Sessions',

      /* Settings */
      settings: 'Settings',
      reduced_motion: 'Reduced Motion',
      high_contrast: 'High Contrast',
      input_mode: 'Input Mode',
      input_both: 'Keyboard + Touch',
      input_keyboard: 'Keyboard only',
      input_touch: 'Touch only',
      sound: 'Sound',
      haptics: 'Haptics',
      adaptive_ddm: 'Adaptive Difficulty',
      skip_practice: 'Skip Practice',
      distractors: 'Distractors',
      language: 'Language',
      reset_all_progress: 'Reset All Progress',
      reset_confirm: 'Reset ALL progress? This cannot be undone.',

      /* Modes */
      mode_classic: 'Classic',
      mode_speed: 'Speed',
      mode_endless: 'Endless',
      mode_precision: 'Precision',
      mode_daily: 'Daily',
      mode_tutorial: 'Tutorial',
      mode_practice: 'Practice',
      mode_sart: 'SART',
      mode_reversed: 'Reversed',
      mode_cued: 'Cued',
      mode_rule_switch: 'Rule Switch',
      mode_rule_rush: 'Rule Rush',
      mode_time_attack: 'Time Attack',
      mode_boss: 'Boss Fight',
      mode_reverse: 'Reverse',
      mode_challenges: 'Challenges',
      mode_assessment: 'Assessment',

      /* Mode descriptions (generic) */
      desc_standard: 'Standard assessment',
      desc_fast: 'Fast answers',
      desc_endless: 'One mistake = game over',
      desc_precision: 'Max accuracy',
      desc_daily: 'Fixed protocol · Once per day',
      desc_tutorial: 'Learn how to play',
      desc_completed: 'Completed today',
      desc_come_back: 'Come back tomorrow',

      /* Missions */
      todays_missions: 'Today\'s Missions',
      mission_play_2: 'Play 2 sessions',
      mission_play_4: 'Play 4 sessions',
      mission_acc_85: 'Reach 85% accuracy',
      mission_acc_95: 'Reach 95% accuracy',
      mission_pb: 'Beat a personal best',
      mission_streak_10: 'Reach a 10-streak',

      /* Stages */
      stage_progress: 'Stage Progress',
      current_stage: 'CURRENT STAGE',
      stage_complete: 'STAGE COMPLETE',
      all_stages: 'ALL STAGES',
      mastered: 'MASTERED',
      all_stages_done: 'You\'ve completed every stage!',
      not_yet: 'Not yet',
      completed: 'Completed',

      /* Result screen */
      test_complete: 'Test Complete',
      session_complete: 'Session Complete',
      your_score: 'Your Score',
      max_level: 'Max Level',
      median_rt: 'Median RT',
      rtv: 'RTV',
      rcs: 'RCS',
      performance_insights: 'Performance Insights',
      error_breakdown: 'Error Breakdown',
      commissions: 'Commissions',
      omissions: 'Omissions',
      anticipatory: 'Anticipatory',
      post_error: 'Post-error',
      personal_best: 'Personal Best',
      new_personal_best: '★ NEW PERSONAL BEST ★',
      recent_sessions: 'Recent Sessions',
      history: 'History',
      no_history: 'Play 2+ sessions to see progress',
      best_acc: 'BEST ACC',
      best_median: 'BEST MEDIAN',
      best_rcs: 'BEST RCS',
      best_level: 'BEST LEVEL',

      /* Messages */
      exit_confirm: 'Exit current session and return to menu?',
      session_over: 'Session Over',
      level_passed: 'Level {n} Passed',
      level_failed: 'Level Failed',
      get_ready: 'Get Ready',
      session_loading: 'Loading…',
      practice_round: 'Practice Round',
      challenge_complete: 'CHALLENGE COMPLETE',

      /* Achievement / motivation */
      excellent: 'Excellent!',
      great_job: 'Great job!',
      keep_going: 'Keep going!',
      level_up: 'LEVEL UP!',
      new_record: 'New Record!',

      /* Time */
      seconds: 'seconds',
      minutes: 'minutes',
      seconds_short: 's',
      ms: 'ms',

      /* Accessibility */
      high_contrast_mode: 'High Contrast Mode',
      reduced_motion_mode: 'Reduced Motion',

      /* Language */
      lang_en: 'English',
      lang_ar: 'العربية',
      switch_language: 'Switch Language'
    },

    /* ─────────── AR ─────────── */
    ar: {
      /* Common */
      play: 'العب',
      back: 'رجوع',
      back_to_menu: 'رجوع للقائمة',
      dashboard: 'الرئيسية',
      close: 'إغلاق',
      save: 'حفظ',
      cancel: 'إلغاء',
      yes: 'نعم',
      no: 'لا',
      continue: 'متابعة',
      try_again: 'حاول مجدداً',
      start: 'ابدأ',
      start_test: 'ابدأ الاختبار',
      loading: 'جارٍ التحميل…',
      soon: 'قريباً',
      ready: 'جاهز',
      wip: 'قيد التطوير',
      live: 'نشط',
      soon_msg: 'قريباً',
      wip_msg: 'هذه اللعبة لا تزال قيد التطوير.',

      /* HUD */
      level: 'المستوى',
      streak: 'السلسلة',
      lives: 'المحاولات',
      score: 'النقاط',
      best: 'الأفضل',
      time: 'الوقت',
      correct: 'صحيح',
      wrong: 'خطأ',
      accuracy: 'الدقة',

      /* Brand / Domain */
      training_module: 'وحدة التدريب',
      cognitive_iq: 'معدل الذكاء المعرفي',
      day_streak: 'التتابع اليومي',
      sessions_total: 'إجمالي الجلسات',
      global_rank: 'التصنيف العالمي',
      cognitive_profile: 'الملف المعرفي',
      overall_domain_score: 'النتيجة الإجمالية للمجال',
      domain_breakdown: 'تفصيل المجالات',
      ai_adaptive_engine: 'المحرك التكيفي الذكي',
      recent_activity: 'النشاط الأخير',
      level_progression: 'المستوى والتقدم',
      ai_next_sessions: 'الجلسات المقترحة تالياً',

      /* Settings */
      settings: 'الإعدادات',
      reduced_motion: 'تقليل الحركة',
      high_contrast: 'تباين عالي',
      input_mode: 'طريقة الإدخال',
      input_both: 'لوحة المفاتيح + اللمس',
      input_keyboard: 'لوحة المفاتيح فقط',
      input_touch: 'اللمس فقط',
      sound: 'الصوت',
      haptics: 'الاهتزاز',
      adaptive_ddm: 'الصعوبة التكيفية',
      skip_practice: 'تخطّي التدريب',
      distractors: 'المشتتات',
      language: 'اللغة',
      reset_all_progress: 'إعادة تعيين كل التقدم',
      reset_confirm: 'هل تريد إعادة تعيين كل التقدم؟ لا يمكن التراجع.',

      /* Modes */
      mode_classic: 'الكلاسيكي',
      mode_speed: 'السرعة',
      mode_endless: 'بلا نهاية',
      mode_precision: 'الدقة',
      mode_daily: 'اليومي',
      mode_tutorial: 'الشرح',
      mode_practice: 'التدريب',
      mode_sart: 'سارت',
      mode_reversed: 'المعكوس',
      mode_cued: 'المُلمَّح',
      mode_rule_switch: 'تبديل القاعدة',
      mode_rule_rush: 'هجوم القواعد',
      mode_time_attack: 'الهجوم الزمني',
      mode_boss: 'معركة الزعيم',
      mode_reverse: 'العكسي',
      mode_challenges: 'التحديات',
      mode_assessment: 'التقييم',

      /* Mode descriptions (generic) */
      desc_standard: 'تقييم قياسي',
      desc_fast: 'إجابات سريعة',
      desc_endless: 'خطأ واحد = نهاية اللعبة',
      desc_precision: 'أقصى دقة',
      desc_daily: 'بروتوكول ثابت · مرة يومياً',
      desc_tutorial: 'تعلّم كيف تلعب',
      desc_completed: 'مكتمل اليوم',
      desc_come_back: 'ارجع غداً',

      /* Missions */
      todays_missions: 'مهام اليوم',
      mission_play_2: 'العب جلستين',
      mission_play_4: 'العب 4 جلسات',
      mission_acc_85: 'وصل إلى دقة 85%',
      mission_acc_95: 'وصل إلى دقة 95%',
      mission_pb: 'حطّم رقمك القياسي',
      mission_streak_10: 'وصل لسلسلة 10',

      /* Stages */
      stage_progress: 'تقدّم المراحل',
      current_stage: 'المرحلة الحالية',
      stage_complete: 'مرحلة مكتملة',
      all_stages: 'كل المراحل',
      mastered: 'إتقان تام',
      all_stages_done: 'أكملت جميع المراحل!',
      not_yet: 'لم تُكتمل',
      completed: 'مكتملة',

      /* Result screen */
      test_complete: 'انتهى الاختبار',
      session_complete: 'انتهت الجلسة',
      your_score: 'نتيجتك',
      max_level: 'أعلى مستوى',
      median_rt: 'وسيط الزمن',
      rtv: 'تباين الزمن',
      rcs: 'نقاط RCS',
      performance_insights: 'تحليل الأداء',
      error_breakdown: 'تحليل الأخطاء',
      commissions: 'أخطاء الاندفاع',
      omissions: 'أخطاء التفويت',
      anticipatory: 'الاستباقية',
      post_error: 'ما بعد الخطأ',
      personal_best: 'أفضل نتيجة',
      new_personal_best: '★ رقم قياسي جديد ★',
      recent_sessions: 'الجلسات الأخيرة',
      history: 'السجل',
      no_history: 'العب جلستين أو أكثر لرؤية تقدمك',
      best_acc: 'أفضل دقة',
      best_median: 'أفضل وسيط',
      best_rcs: 'أفضل RCS',
      best_level: 'أعلى مستوى',

      /* Messages */
      exit_confirm: 'هل تريد الخروج من الجلسة والعودة للقائمة؟',
      session_over: 'انتهت الجلسة',
      level_passed: 'المستوى {n} — نجاح',
      level_failed: 'فشل المستوى',
      get_ready: 'استعد',
      session_loading: 'جارٍ التحميل…',
      practice_round: 'جولة تدريبية',
      challenge_complete: 'التحدي مكتمل',

      /* Achievement / motivation */
      excellent: 'ممتاز!',
      great_job: 'عمل رائع!',
      keep_going: 'استمر!',
      level_up: 'ارتقاء مستوى!',
      new_record: 'رقم قياسي جديد!',

      /* Time */
      seconds: 'ثوانٍ',
      minutes: 'دقائق',
      seconds_short: 'ث',
      ms: 'م.ث',

      /* Accessibility */
      high_contrast_mode: 'وضع التباين العالي',
      reduced_motion_mode: 'تقليل الحركة',

      /* Language */
      lang_en: 'English',
      lang_ar: 'العربية',
      switch_language: 'تغيير اللغة'
    }
  };

  /* ═══════════════════════════════════════════════════════
     API
     ═══════════════════════════════════════════════════════ */
  const I18N = {
    lang: DEFAULT_LANG,

    /**
     * Translate a key.
     * @param {string} key
     * @param {object} params - Optional {n: 5} for {n} replacement
     * @returns {string}
     */
    t(key, params) {
      const dict = strings[this.lang] || strings[DEFAULT_LANG];
      let text = dict[key];

      // Fallback to English
      if (text === undefined) {
        text = strings[DEFAULT_LANG][key] || key;
      }

      // Replace {param} placeholders
      if (params && typeof text === 'string') {
        for (const k in params) {
          text = text.replace(new RegExp('\\{' + k + '\\}', 'g'), params[k]);
        }
      }

      return text;
    },

    /**
     * Change language and update the DOM.
     * @param {string} lang - 'en' | 'ar'
     */
    setLang(lang) {
      if (!LANGS.includes(lang)) lang = DEFAULT_LANG;
      this.lang = lang;

      // Update <html lang=".." dir="..">
      const html = document.documentElement;
      html.setAttribute('lang', lang);
      html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
      html.setAttribute('data-lang', lang);

      // Save preference
      try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}

      // Notify listeners
      window.dispatchEvent(new CustomEvent('flash:lang-changed', { detail: { lang } }));
    },

    /**
     * Initialize from localStorage.
     */
    init() {
      let saved = DEFAULT_LANG;
      try { saved = localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG; } catch (e) {}
      if (!LANGS.includes(saved)) saved = DEFAULT_LANG;
      this.setLang(saved);
    },

    /**
     * Get current language.
     */
    getLang() { return this.lang; },

    /**
     * Check if current language is RTL.
     */
    isRTL() { return this.lang === 'ar'; },

    /**
     * Add a new string at runtime (for games to register their own).
     */
    addStrings(lang, obj) {
      if (!strings[lang]) strings[lang] = {};
      Object.assign(strings[lang], obj);
    }
  };

  /* ═══ Auto-init as soon as this file loads ═══ */
  I18N.init();

  /* ═══ Expose globally ═══ */
  window.FLASH_I18N = I18N;
})();