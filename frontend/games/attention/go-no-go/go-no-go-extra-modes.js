/* go-no-go-extra-modes.js — Speed, Endless, Precision, Daily.
   Each mode is data plus optional hooks, merged into CONFIG.modes by install(api):
   trials, lives (0 = count only), lvl(n) = level for trial n, penalty, shape(q) = timing override,
   locked(), onStart(api), onEnd(api, summary), daily (seed derives from the date). Core loop stays in game.js. */
(function(){
'use strict';
const H=()=>window.GNG_HELPERS;
const MODES={
  speed:{id:'speed',trials:20,lives:0,penalty:100,lvl:n=>6+Math.floor(n/5),
    shape:q=>{q.dur*=.6;q.win=q.dur+300;q.isi*=.7;return q},          // short exposure, tight window, flat penalty per error
    onStart:api=>api.setTimer(0)},
  endless:{id:'endless',trials:Infinity,lives:1,lvl:n=>1+Math.floor(n/4)},   // ramps every 4 trials; one life = first error ends it
  precision:{id:'precision',trials:15,lives:0,lvl:()=>10,
    shape:q=>{q.dur=1600;q.win=1900;q.isi=700;return q}},             // no time pressure; errors are only counted
  daily:{id:'daily',trials:24,lives:0,daily:true,lvl:()=>8,
    locked:()=>H().dailyDone(),                                        // one play per calendar day
    onEnd:(api,s)=>H().dailyAdd({score:s.score,d:s.d,acc:s.acc})}
};
window.GNG_MODES={MODES,install:api=>{Object.assign(api.CONFIG.modes,MODES);return api}};
})();
