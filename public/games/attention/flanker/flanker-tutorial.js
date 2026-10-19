/* ═══════════════════════════════════════════════════════════
   FLASH — Flanker Interactive Tutorial
   3-step guide + guided practice
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  let API = null;
  let timeouts = [];
  let step = 0;
  let guidedCorrect = 0;
  let guidedTotal = 0;

  function clearAll() {
    timeouts.forEach(clearTimeout);
    timeouts = [];
  }
  function push(fn, d) { const id = setTimeout(fn, d); timeouts.push(id); return id; }

  const SAMPLE_ROW = [
    { glyph: '←', side: 'flanker' },
    { glyph: '←', side: 'flanker' },
    { glyph: '←', side: 'center'  },
    { glyph: '←', side: 'flanker' },
    { glyph: '←', side: 'flanker' }
  ];

  const CONFLICT_ROW = [
    { glyph: '→', side: 'flanker' },
    { glyph: '→', side: 'flanker' },
    { glyph: '←', side: 'center'  },
    { glyph: '→', side: 'flanker' },
    { glyph: '→', side: 'flanker' }
  ];

  function start(apiRef) {
    API = apiRef;
    clearAll();
    step = 0;
    guidedCorrect = 0;
    guidedTotal = 0;
    showStep1();
  }

  /* ─── STEP 1: What is the target ─── */
  function showStep1() {
    step = 1;
    API.setPhase('idle');
    API.setTimer(100);

    API.render(`
      <div class="tut-progress">
        <span class="tut-dot active"></span>
        <span class="tut-dot"></span>
        <span class="tut-dot"></span>
      </div>

      <div class="phase-title">Tutorial · Step 1 of 3</div>
      <h2 class="phase-headline grd">The Target</h2>
      <p class="phase-sub">
        A row of 5 arrows appears. Your job: respond to the
        <strong style="color:#00EEFF">CENTER arrow only</strong>.
      </p>

      <div class="tut-demo">
        <div class="flanker-row">
          ${SAMPLE_ROW.map((item, i) => {
            const isCenter = item.side === 'center';
            const cls = isCenter ? 'center tut-highlight' : 'flanker tut-dim';
            return `<span class="flanker-arrow ${cls}">${item.glyph}</span>`;
          }).join('')}
        </div>
        <div class="tut-label">← This is the TARGET</div>
      </div>

      <button class="big-btn" id="tut-next">Got it →</button>
    `);

    API.$('tut-next').addEventListener('click', (e) => {
      e.stopPropagation();
      if (window.FlankerSounds) FlankerSounds.click();
      showStep2();
    });
  }

  /* ─── STEP 2: Ignore the flankers ─── */
  function showStep2() {
    step = 2;
    API.setPhase('idle');

    API.render(`
      <div class="tut-progress">
        <span class="tut-dot done"></span>
        <span class="tut-dot active"></span>
        <span class="tut-dot"></span>
      </div>

      <div class="phase-title">Tutorial · Step 2 of 3</div>
      <h2 class="phase-headline grd">The Distractors</h2>
      <p class="phase-sub">
        The other arrows are <strong style="color:#FF0077">distractors</strong>.
        They may point the <em>opposite</em> direction to trick you.
      </p>

      <div class="tut-demo">
        <div class="flanker-row">
          ${CONFLICT_ROW.map((item, i) => {
            const isCenter = item.side === 'center';
            const cls = isCenter ? 'center tut-highlight' : 'flanker tut-dim';
            return `<span class="flanker-arrow ${cls}">${item.glyph}</span>`;
          }).join('')}
        </div>
        <div class="tut-label">
          Center says <strong style="color:#00EEFF">LEFT</strong> ·
          Ignore the <strong style="color:#FF0077">RIGHT</strong> arrows
        </div>
      </div>

      <p class="phase-hint" style="margin-top:10px;">
        So the correct answer here is <kbd>←</kbd> LEFT
      </p>

      <button class="big-btn" id="tut-next" style="margin-top:20px;">Understood →</button>
    `);

    API.$('tut-next').addEventListener('click', (e) => {
      e.stopPropagation();
      if (window.FlankerSounds) FlankerSounds.click();
      showStep3();
    });
  }

  /* ─── STEP 3: Guided practice ─── */
  function showStep3() {
    step = 3;
    guidedCorrect = 0;
    guidedTotal = 0;
    nextGuidedTrial();
  }

  function nextGuidedTrial() {
    if (guidedTotal >= 3) {
      finishTutorial();
      return;
    }

    const isLeft = Math.random() < 0.5;
    const centerGlyph = isLeft ? '←' : '→';
    const flankerGlyph = isLeft ? '→' : '←';

    const row = [
      { glyph: flankerGlyph, side: 'flanker' },
      { glyph: flankerGlyph, side: 'flanker' },
      { glyph: centerGlyph,  side: 'center'  },
      { glyph: flankerGlyph, side: 'flanker' },
      { glyph: flankerGlyph, side: 'flanker' }
    ];

    API.setPhase('trial');
    API.render(`
      <div class="tut-progress">
        <span class="tut-dot done"></span>
        <span class="tut-dot done"></span>
        <span class="tut-dot active"></span>
      </div>

      <div class="phase-title">Tutorial · Practice ${guidedTotal + 1} of 3</div>
      <p class="phase-sub" style="margin-bottom:14px;">
        Which way does the <strong style="color:#00EEFF">CENTER</strong> arrow point?
      </p>

      <div class="flanker-wrap">
        ${API.renderFlankerRow(row, false, false)}
      </div>

      <div class="answer-row">
        <button class="answer-btn left-btn" data-side="left" data-key="←">
          <span class="arrow-icon">←</span>LEFT
        </button>
        <button class="answer-btn right-btn" data-side="right" data-key="→">
          <span class="arrow-icon">→</span>RIGHT
        </button>
      </div>

      <p class="phase-hint" style="margin-top:14px;">
        Hint: The center is <strong style="color:#FFD60A">highlighted</strong>
      </p>
    `);

    // Add temporary highlight to center for guided mode
    const center = API.getElContent().querySelector('.flanker-arrow.center');
    if (center) center.style.boxShadow = '0 0 30px rgba(0,238,255,.6)';

    API.getElContent().querySelectorAll('.answer-btn').forEach(btn => {
      btn.addEventListener('click', () => handleGuidedAnswer(btn, isLeft));
    });

    // Auto highlight correct button
    const correctBtn = isLeft
      ? API.getElContent().querySelector('.left-btn')
      : API.getElContent().querySelector('.right-btn');
    if (correctBtn) {
      correctBtn.style.boxShadow = '0 0 30px rgba(0,255,150,.4)';
      correctBtn.style.borderColor = 'var(--green)';
    }
  }

  function handleGuidedAnswer(btn, isLeft) {
    const chosen = btn.dataset.side;
    const correct = isLeft ? 'left' : 'right';
    const isCorrect = chosen === correct;

    guidedTotal++;
    if (isCorrect) guidedCorrect++;

    API.getElContent().querySelectorAll('.answer-btn').forEach(b => {
      b.disabled = true;
      if (b.dataset.side === correct) b.classList.add('correct');
      else if (b === btn) b.classList.add('wrong');
    });

    API.showFeedbackFlash(isCorrect);
    if (window.FlankerSounds) {
      isCorrect ? FlankerSounds.correct() : FlankerSounds.wrong();
    }

    push(() => nextGuidedTrial(), isCorrect ? 900 : 1300);
  }

  function finishTutorial() {
    clearAll();
    API.setPhase('correct');
    if (window.FlankerSounds) FlankerSounds.victory();

    const accuracy = guidedTotal > 0 ? Math.round((guidedCorrect / guidedTotal) * 100) : 0;
    const allCorrect = guidedCorrect === guidedTotal;

    // Mark tutorial done
    try { localStorage.setItem('flash:flanker:tutorial:done', '1'); } catch (e) {}

    API.render(`
      <div class="feedback-icon good">🎓</div>
      <h2 class="phase-headline grd">Tutorial Complete!</h2>
      <p class="phase-sub">
        You got <strong>${guidedCorrect}/${guidedTotal}</strong> correct (${accuracy}%).
        <br>
        ${allCorrect ? 'Perfect! You\'re ready to play.' : 'Nice work — keep practicing!'}
      </p>

      <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;margin-top:20px;">
        <button class="big-btn" id="tut-play">Start Playing</button>
        <button class="big-btn" id="tut-back" style="background:linear-gradient(135deg,#3A86FF,#00EEFF);">Back to Menu</button>
      </div>
    `);

    API.$('tut-play').addEventListener('click', (e) => {
      e.stopPropagation();
      if (window.FlankerSounds) FlankerSounds.click();
      API.exitToMenu();
    });
    API.$('tut-back').addEventListener('click', (e) => {
      e.stopPropagation();
      if (window.FlankerSounds) FlankerSounds.click();
      API.exitToMenu();
    });
  }

  function isDone() {
    try { return localStorage.getItem('flash:flanker:tutorial:done') === '1'; }
    catch (e) { return false; }
  }

  function reset() {
    try { localStorage.removeItem('flash:flanker:tutorial:done'); } catch (e) {}
  }

  window.FlankerTutorial = { start, isDone, reset };
})();