/* ═══════════════════════════════════════════════════════════
   FLASH — Go/No-Go Adaptive DDM Engine
   Simplified real-time approximation of the Drift Diffusion Model
   Adjusts difficulty based on rolling performance window
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const WINDOW_SIZE = 20;   // rolling window of last 20 trials
  const MIN_TRIALS = 8;     // need this many before adapting

  const state = {
    trials: [],             // [{correct, rt, isGo, wasCommission}]
    level: 1,               // virtual difficulty level (1-20)
    driftEstimate: 0,       // ≈ how fast & accurate
    cautionEstimate: 0.5,   // 0=reckless, 1=over-cautious
    lastAdjust: 0,
    adjustments: []
  };

  /* ─── Config Ranges ─── */
  const RANGES = {
    stimulusDuration: { min: 350, max: 900 },
    iti:              { min: 400, max: 1200 },
    noGoRatio:        { min: 0.10, max: 0.35 }
  };

  /* ═══ Add a trial result ═══ */
  function recordTrial(t) {
    // t = { correct: bool, rt: ms, isGo: bool, wasCommission: bool }
    state.trials.push(t);
    if (state.trials.length > WINDOW_SIZE) state.trials.shift();
    return state.trials.length;
  }

  /* ═══ Compute rolling stats ═══ */
  function computeStats() {
    const w = state.trials;
    if (w.length === 0) return null;

    const total = w.length;
    const correct = w.filter(t => t.correct).length;
    const accuracy = correct / total;

    const validRTs = w.filter(t => t.rt > 0 && t.rt < 3000).map(t => t.rt);
    const meanRT = validRTs.length
      ? validRTs.reduce((a, b) => a + b, 0) / validRTs.length
      : 0;

    const commissions = w.filter(t => t.wasCommission).length;
    const noGoCount = w.filter(t => !t.isGo).length;
    const commissionRate = noGoCount > 0 ? commissions / noGoCount : 0;

    const rtVariance = validRTs.length >= 2
      ? validRTs.reduce((a, b) => a + (b - meanRT) ** 2, 0) / validRTs.length
      : 0;
    const rtStd = Math.sqrt(rtVariance);

    return { total, accuracy, meanRT, commissionRate, rtStd };
  }

  /* ═══ Estimate DDM-like parameters ═══ */
  function estimateDM() {
    const s = computeStats();
    if (!s || s.total < MIN_TRIALS) return null;

    // Drift estimate: higher when accurate + reasonably fast
    // Normalize: accuracy [0-1], RT [300-1000ms]
    const speedFactor = Math.max(0.1, Math.min(1.5, (1000 - s.meanRT) / 700 + 0.3));
    state.driftEstimate = parseFloat((s.accuracy * speedFactor).toFixed(3));

    // Caution estimate: high when RT std is high and few commissions
    // Also high when too slow
    const speedHesitancy = Math.min(1, s.meanRT / 900);
    const stabilityFactor = Math.min(1, 1 - s.rtStd / 400);
    state.cautionEstimate = parseFloat(
      ((1 - s.commissionRate) * 0.5 + speedHesitancy * 0.3 + stabilityFactor * 0.2).toFixed(3)
    );

    return { drift: state.driftEstimate, caution: state.cautionEstimate, stats: s };
  }

  /* ═══ Decide next difficulty adjustment ═══ */
  function computeAdjustment() {
    const dm = estimateDM();
    if (!dm) return null;

    const { drift, caution, stats } = dm;
    const adjustment = {};

    // Drift HIGH → increase pressure (shorter stimulus, tighter ITI)
    // Drift LOW → ease off
    if (drift > 0.75) {
      adjustment.pressure = +1;
    } else if (drift < 0.4) {
      adjustment.pressure = -1;
    } else {
      adjustment.pressure = 0;
    }

    // Caution HIGH + commissionRate LOW → reduce ITI
    // Caution LOW + commissionRate HIGH → increase ITI (give time to think)
    if (stats.commissionRate > 0.28) {
      adjustment.itiShift = +1;      // slower
    } else if (stats.commissionRate < 0.08 && caution < 0.4) {
      adjustment.itiShift = -1;      // faster
    } else {
      adjustment.itiShift = 0;
    }

    // Adjust no-Go ratio based on drift
    if (drift > 0.8 && stats.commissionRate < 0.15) {
      adjustment.ratioShift = +1;    // harder: more No-Go
    } else if (stats.commissionRate > 0.35) {
      adjustment.ratioShift = -1;    // easier: fewer No-Go
    } else {
      adjustment.ratioShift = 0;
    }

    // Level step
    const step = adjustment.pressure;
    state.level = Math.max(1, Math.min(20, state.level + step));

    return {
      level: state.level,
      drift,
      caution,
      adjustment,
      stats
    };
  }

  /* ═══ Compute actual difficulty values from current level ═══ */
  function getDifficulty(level) {
    const t = (level - 1) / 19;   // 0 → 1

    // Stimulus duration: high level → shorter
    const stimDur = Math.round(
      RANGES.stimulusDuration.max - t * (RANGES.stimulusDuration.max - RANGES.stimulusDuration.min)
    );

    // ITI: high level → shorter
    const iti = Math.round(
      RANGES.iti.max - t * (RANGES.iti.max - RANGES.iti.min)
    );

    // No-Go ratio: high level → more No-Go
    const noGo = parseFloat(
      (RANGES.noGoRatio.min + t * (RANGES.noGoRatio.max - RANGES.noGoRatio.min)).toFixed(2)
    );

    return { stimulusDuration: stimDur, iti, noGoRatio: noGo, level };
  }

  /* ═══ Main API — call after every trial ═══ */
  function onTrialEnd(trialResult) {
    recordTrial(trialResult);

    // Only adjust every 5 trials to avoid jitter
    if (state.trials.length < MIN_TRIALS) return null;
    if (state.trials.length - state.lastAdjust < 5) return null;

    state.lastAdjust = state.trials.length;
    const adj = computeAdjustment();
    if (adj) state.adjustments.push({ at: state.trials.length, ...adj });
    return adj;
  }

  /* ═══ Reset for new session ═══ */
  function reset(startLevel = 1) {
    state.trials = [];
    state.level = startLevel;
    state.driftEstimate = 0;
    state.cautionEstimate = 0.5;
    state.lastAdjust = 0;
    state.adjustments = [];
  }

  /* ═══ Public API ═══ */
  window.GNGDDM = {
    onTrialEnd,
    getDifficulty,
    reset,
    getLevel: () => state.level,
    getStats: () => computeStats(),
    getDM: () => estimateDM(),
    getState: () => ({ ...state })
  };
})();