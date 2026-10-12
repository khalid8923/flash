/* ============================================================
   FLASH — Idea Flow · Extra Modes
   ============================================================ */
(function () {
  'use strict';

  const MODES = [
    { id: 'speed',     name: 'Speed',     icon: '⏱️', desc: '15 rapid-fire categories — push volume.',   meta: '15 rounds · 20s each',       config: { rounds: 15,       timePerRound: 20000, loseLifeOnError: false, rampLevels: false } },
    { id: 'endless',   name: 'Endless',   icon: '⚡', desc: 'Keep generating. Stall and it ends.',       meta: 'Infinite · strict survival', config: { rounds: Infinity, timePerRound: 15000, loseLifeOnError: true,  rampLevels: true } },
    { id: 'precision', name: 'Precision', icon: '🎯', desc: '10 rounds. No timer. Focus on quality.',    meta: '10 rounds · unlimited time', config: { rounds: 10,       timePerRound: 0,     loseLifeOnError: false, rampLevels: false } },
    { id: 'daily',     name: 'Daily',     icon: '★',  desc: 'Same protocol every day. Once per day.',    meta: '12 rounds · fixed time',     config: { rounds: 12,       timePerRound: 18000, loseLifeOnError: false, rampLevels: false, oncePerDay: true } }
  ];

  let active = null, timers = [];
  const clearTimers = () => { timers.forEach((t) => clearTimeout(t)); timers = []; };
  const setTimeoutSafe = (fn, ms) => { const id = setTimeout(fn, ms); timers.push(id); return id; };

  function start(modeId, apiRef, soundRef, helperRef) {
    const def = MODES.find((m) => m.id === modeId);
    if (!def) { console.warn('[IdeaFlowExtraModes] unknown mode:', modeId); return; }
    if (def.config.oncePerDay && helperRef && helperRef.isTodayDone()) { console.info('[IdeaFlowExtraModes] Daily already done'); return; }
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
      api.state.roundsCompleted = 0;
      api.state.totalRounds = config.rounds;
      api.state.totalIdeas = 0;
      api.state.noveltySum = 0;
    }
    if (typeof api.setPhase === 'function') api.setPhase('playing');
    if (typeof api.showCountdown === 'function') api.showCountdown(3, () => setTimeoutSafe(loadRound, 100));
    else setTimeoutSafe(loadRound, 100);
  }

  function loadRound() {
    const { config, api } = active;
    if (api.state.roundsCompleted >= config.rounds) return finish('done');
    if (config.rampLevels && api.state.level) {
      api.state.level = Math.min(15, 1 + Math.floor(api.state.roundsCompleted / 2));
    }
    if (typeof api.generatePrompt === 'function') api.generatePrompt({ round: api.state.roundsCompleted });
    if (config.timePerRound > 0) {
      if (typeof api.setTimer === 'function') api.setTimer(config.timePerRound);
      setTimeoutSafe(onTimeout, config.timePerRound + 30);
    }
  }

  function onTimeout() {
    const { api, sounds, config } = active;
    if (!api) return;
    if (sounds && sounds.timeout) sounds.timeout();
    if (api.state) api.state.roundsCompleted++;
    if (config.loseLifeOnError) {
      if (typeof api.showFeedbackFlash === 'function') api.showFeedbackFlash('error');
      return finish('failed');
    }
    if (typeof api.showFeedbackFlash === 'function') api.showFeedbackFlash('error');
    setTimeoutSafe(loadRound, 400);
  }

  function onAnswer(result) {
    if (!active || !active.api) return;
    const { api, sounds, config } = active;
    if (api.state) {
      api.state.roundsCompleted++;
      if (result && result.ideas) api.state.totalIdeas += result.ideas;
      if (result && result.novelty) api.state.noveltySum += result.novelty;
    }
    if (result && result.ideas > 0 && sounds && sounds.idea) sounds.idea();
    if (config.loseLifeOnError && result && result.ideas === 0) {
      if (typeof api.showFeedbackFlash === 'function') api.showFeedbackFlash('error');
      return finish('failed');
    }
    if (api.state.roundsCompleted >= config.rounds) finish('done');
    else setTimeoutSafe(loadRound, 400);
  }

  function finish(status) {
    if (!active || !active.api) return;
    const { api, helpers, sounds, id, config } = active;
    clearTimers();
    const s = api.state || {};
    const fluency = s.totalIdeas || 0;
    const novelty = s.roundsCompleted ? Math.round((s.noveltySum || 0) / s.roundsCompleted) : 0;
    const payload = {
      type: 'flash:game-complete',
      gameId: 'idea-flow', domain: 'creativity', mode: id,
      maxLevel: s.level || 1,
      fluency,
      novelty,
      accuracy: novelty,
      score: Math.round(fluency * 10 + novelty * 2),
      rcs: 0, medianRT: 0, rtv: 0,
      isNewPB: false
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

  window.IdeaFlowExtraModes = {
    getModeDefinitions: () => MODES.map((m) => ({ id: m.id, name: m.name, icon: m.icon, desc: m.desc, meta: m.meta })),
    start, abort, onAnswer,
    isActive: () => active !== null
  };
})();