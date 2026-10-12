/* ============================================================
   FLASH — Game Catalog Patch
   Adds the newly completed games (mental-math, num-chains,
   speed-calc, idea-flow) to the dashboard without touching
   data.js. Safe to remove when data.js is updated manually.
   ============================================================ */
(function () {
  'use strict';

  /* ═══════════════════════════════════════════════════════════
     NEW GAMES — must match existing data.js shape
     ═══════════════════════════════════════════════════════════ */
  const NEW_GAMES = [
    {
      id: 'mental-math',
      domain: 'numerical',
      name: { en: 'Mental Math', ar: 'الحساب الذهني' },
      desc: { en: 'Arithmetic fluency under time pressure', ar: 'طلاقة حسابية تحت ضغط الوقت' },
      icon: '🧮',
      paradigm: 'Dehaene 1999'
    },
    {
      id: 'num-chains',
      domain: 'numerical',
      name: { en: 'Num Chains', ar: 'سلاسل الأرقام' },
      desc: { en: 'Multi-step chains — working memory load', ar: 'سلاسل متعددة الخطوات — عبء الذاكرة العاملة' },
      icon: '🔗',
      paradigm: 'Kyllonen 1990'
    },
    {
      id: 'speed-calc',
      domain: 'numerical',
      name: { en: 'Speed Calc', ar: 'حساب سريع' },
      desc: { en: 'Rapid calculations — processing speed', ar: 'حسابات سريعة — سرعة المعالجة' },
      icon: '⚡',
      paradigm: 'Salthouse 1996'
    },
    {
      id: 'idea-flow',
      domain: 'creativity',
      name: { en: 'Idea Flow', ar: 'تدفق الأفكار' },
      desc: { en: 'Divergent thinking — fluency and novelty', ar: 'تفكير تباعدي — الطلاقة والأصالة' },
      icon: '💡',
      paradigm: 'Guilford 1967'
    }
  ];

  /* ═══════════════════════════════════════════════════════════
     APPLY — mutate in-memory dashboard data if available
     ═══════════════════════════════════════════════════════════ */
  function applyToData() {
    const data = window.FLASH_DATA || window.FLASH?.data;
    if (!data || !Array.isArray(data.domains)) return false;

    let added = 0;
    NEW_GAMES.forEach((g) => {
      const dom = data.domains.find((d) => d.id === g.domain);
      if (!dom) return;
      if (!Array.isArray(dom.games)) dom.games = [];
      const exists = dom.games.some((x) => x.id === g.id);
      if (!exists) {
        dom.games.push({
          id: g.id,
          name: g.name.en,
          nameAr: g.name.ar,
          desc: g.desc.en,
          descAr: g.desc.ar,
          icon: g.icon,
          paradigm: g.paradigm,
          status: 'ready'
        });
        added++;
      }
    });

    if (added > 0) {
      console.log('[Game Catalog Patch] Added ' + added + ' games to dashboard');
      /* Trigger re-render if dashboard has one */
      if (typeof window.render === 'function') {
        try { window.render(); } catch (_) {}
      }
      window.dispatchEvent(new CustomEvent('flash:catalog-updated', { detail: { added } }));
    }
    return added > 0;
  }

  /* ═══════════════════════════════════════════════════════════
     RETRY — dashboard may load after this script
     ═══════════════════════════════════════════════════════════ */
  function tryApply(attempt) {
    attempt = attempt || 0;
    if (applyToData()) return;
    if (attempt < 10) {
      setTimeout(() => tryApply(attempt + 1), 300);
    } else {
      console.info('[Game Catalog Patch] data not found — skipped silently');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => tryApply(0));
  } else {
    tryApply(0);
  }

})();