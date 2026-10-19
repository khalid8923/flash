/* ============================================================
   FLASH — Speed Calc · Extra Modes
   ============================================================ */
(function () {
  'use strict';

  const MODES = [
    { id: 'speed',     name: 'Speed',     icon: '⏱️', desc: '25 fast calculations — strict time.',         meta: '25 trials · 2000ms',        config: { trials: 25,       timePerTrial: 2000, loseLifeOnError: false, rampLevels: false, precisionFocus: false } },
    { id: 'endless',   name: 'Endless',   icon: '⚡', desc: 'Ramp up. One mistake ends the run.',          meta: 'Infinite · strict survival', config: { trials: Infinity, timePerTrial: 3500, loseLifeOnError: true,  rampLevels: true,  precisionFocus: false } },
    { id: 'precision', name: 'Precision', icon: '🎯', desc: '20 problems. No time pressure. Max accuracy.', meta: '20 trials · unlimited time', config: { trials: 20,       timePerTrial: 0,    loseLifeOnError: false, rampLevels: false, precisionFocus: true } },
    { id: 'daily',     name: 'Daily',     icon: '★',  desc: 'Same protocol every day. Once per day.',       meta: '30 trials · fixed time',     config: { trials: 30,       timePerTrial: 3000, loseLifeOnError: false, rampLevels: false, precisionFocus: false, oncePerDay: true } }
  ];

  let active = null, timers = [];
  const clearTimers = () => { timers.forEach((t) => clearTimeout(t)); timers = []; };
  const setTimeoutSafe = (fn, ms) => { const id = setTimeout(fn, ms); timers.push(id); return id; };

  function start(modeId, apiRef, soundRef, helperRef) {
    const def = MODES.find((m) => m.id === modeId);
    if (!def) { console.warn('[SpeedCalcExtraModes] unknown mode:', modeId); return; }
    if (def.config.oncePerDay && helperRef && helperRef.isTodayDone()) { console.info('[SpeedCalcExtraModes] Daily already done'); return; }
    active = { id: modeId, def, config: def.config, api: apiRef, sounds: soundRef, helpers: helperRef };
    runStart();
  }

  function runStart() {
    const { config, api } = active;
    if (!api) return;
    clearTimers();
    if (api.state) {
      api.state.mode = active.id;
      api.state.lives = config.loseLifeOnError ? 1 : Infinity;
      api.state.trialsCompleted = 0;
      api.state.totalTrials = config.trials;
      api.state.correct = 0;
      api.state.rts = [];
    }
    if (typeof api.setPhase === 'function') api.setPhase('playing');
    if (typeof api.showCountdown === 'function') api.showCountdown(3, () => setTimeoutSafe(loadTrial, 100));
    else setTimeoutSafe(loadTrial, 100);
  }

  function loadTrial() {
    const { config, api } = active;
    if (api.state.trialsCompleted >= config.trials) return finish('done');
    if (config.rampLevels && api.state.level) {
      api.state.level = Math.min(15, 1 + Math.floor(api.state.trialsCompleted / 3));
    }
    if (typeof api.generateQuestion === 'function') api.generateQuestion({ trial: api.state.trialsCompleted });
    if (config.timePerTrial > 0) {
      if (typeof api.setTimer === 'function') api.setTimer(config.timePerTrial);
      setTimeoutSafe(onTimeout, config.timePerTrial + 30);
    }
  }

  function onTimeout() {
    const { api, sounds, config } = active;
    if (!api) return;
    if (sounds && sounds.timeout) sounds.timeout();
    if (api.state) api.state.trialsCompleted++;
    if (config.loseLifeOnError) {
      if (typeof api.showFeedbackFlash === 'function') api.showFeedbackFlash('error');
      return finish('failed');
    }
    if (typeof api.showFeedbackFlash === 'function') api.showFeedbackFlash('error');
    if (api.state) api.state.misses = (api.state.misses || 0) + 1;
    setTimeoutSafe(loadTrial, 400);
  }

  function onAnswer(result) {
    if (!active || !active.api) return;
    const { api, sounds, config, id } = active;
    if (api.state) {
      api.state.trialsCompleted++;
      if (result && result.correct) {
        api.state.correct = (api.state.correct || 0) + 1;
        if (result.rt) api.state.rts.push(result.rt);
      } else {
        api.state.misses = (api.state.misses || 0) + 1;
      }
    }
    if (result && result.correct && sounds && sounds.hit) sounds.hit();
    else if (sounds && sounds.miss) sounds.miss();

    if (config.loseLifeOnError && result && !result.correct) {
      if (typeof api.showFeedbackFlash === 'function') api.showFeedbackFlash('error');
      return finish('failed');
    }
    if (api.state.trialsCompleted >= config.trials) finish('done');
    else setTimeoutSafe(loadTrial, 400);
  }

  function finish(status) {
    if (!active || !active.api) return;
    const { api, helpers, sounds, id, config } = active;
    clearTimers();
    const s = api.state || {};
    const accuracy = s.trialsCompleted ? Math.round((s.correct || 0) / Math.max(1, s.trialsCompleted) * 100) : 0;
    const medianRT = helpers && s.rts && s.rts.length ? helpers.median(s.rts) : 0;
    const rcsVal = helpers && s.rts ? helpers.rcs(s.correct || 0, s.rts) : 0;
    const payload = {
      type: 'flash:game-complete',
      gameId: 'speed-calc', domain: 'numerical', mode: id,
      maxLevel: s.level || 1, accuracy,
      score: Math.round((s.correct || 0) * 10 + rcsVal * 5),
      medianRT,
      rtv: helpers && s.rts ? helpers.stdDev(s.rts) : 0,
      rcs: rcsVal, isNewPB: false
    };
    if (helpers && helpers.checkAndUpdatePB) payload.isNewPB = helpers.checkAndUpdatePB(payload).isNewPB;
    if (helpers && helpers.addToHistory) helpers.addToHistory(payload);
    if (config.oncePerDay && helpers && helpers.markTodayDone) helpers.markTodayDone(payload);
    if (sounds) {
      if (status === 'failed' && sounds.gameOver) sounds.gameOver();
      else if (payload.isNewPB && sounds.personalBest) sounds.personalBest();
      else if (sounds.victory) sounds.victory();
    }
    if (typeof api.emit === 'function') api.emit(payload);
    active = null;
  }

  function abort() { clearTimers(); active = null; }

  window.SpeedCalcExtraModes = {
    getModeDefinitions: () => MODES.map((m) => ({ id: m.id, name: m.name, icon: m.icon, desc: m.desc, meta: m.meta })),
    start, abort, onAnswer,
    isActive: () => active !== null
  };
})();