/* game.js — FLASH Go/No-Go core (reference template).
   Phases: idle > count > [fix > stim > resp > fb]* > end.
   Randomness: seedrandom(seed), exactly 3 draws per trial (isGo, side, jitter) so the server can replay a session.
   Template rule: keep the phase machine and window.GoNoGoAPI; replace levers, generateQuestion, present/resolve, summary. */
(function(){
'use strict';
const H=window.GNG_HELPERS,Snd=window.GNG_SOUND,ST=window.GNG_STAGES;
const $=id=>document.getElementById(id);
const getElContent=id=>($(id)||{}).textContent||'';

const CONFIG={
  id:H.ID,domain:H.DOMAIN,tapeMax:36,grace:200,
  pGo:L=>Math.min(.9,.70+.012*(L-1)),   // lever 1: P(Go) = how strong the habit to press is
  dev:L=>Math.max(8,44-2.4*(L-1)),      // lever 2: No-Go deflection in degrees = how hard to tell apart
  dur:L=>Math.max(260,700-28*(L-1)),    // lever 3: needle exposure in ms
  isi:L=>Math.max(350,900-35*(L-1)),    // lever 4: fixation interval in ms (jittered +-150)
  modes:{classic:{id:'classic',trials:45,lives:3,lvl:n=>1+Math.floor(n/3)}}   // other four: go-no-go-extra-modes.js
};
const S={mode:'classic',phase:'idle',level:1,maxLevel:1,lives:3,score:0,trials:[],ids:[],armed:false,seed:null,ticket:null,cur:null,t0:0,to:0,rng:null};
const settings=H.settings;
const RM=()=>matchMedia('(prefers-reduced-motion: reduce)').matches||settings().reducedMotion===true;
const later=(f,ms)=>{const i=setTimeout(f,ms);S.ids.push(i);return i};
const clearAllTimeouts=()=>{S.ids.forEach(clearTimeout);S.ids=[]};
const emit=(t,d)=>document.dispatchEvent(new CustomEvent('flash:'+t,{detail:d}));
const haptic=(ms=12)=>{if(settings().haptics!==false&&navigator.vibrate)navigator.vibrate(ms)};
const setPhase=p=>{S.phase=p;$('app').dataset.phase=p};
const fixed=()=>isFinite(CONFIG.modes[S.mode].trials);
const needle=deg=>$('needle').setAttribute('transform','rotate('+deg+')');

function mkRng(seed){
  if(typeof window.seedrandom==='function')return window.seedrandom(seed);        // server contract
  let a=0;for(const c of seed)a=Math.imul(a^c.charCodeAt(0),16777619)>>>0;      // offline dev fallback (mulberry32)
  return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
}

/* ---- presentation (also exposed to extra-modes) ---- */
function setTimer(ms){                       // the ring drains = remaining response window
  const r=$('ring');r.style.transition='none';r.style.strokeDashoffset=0;
  if(!ms||RM())return;
  void r.getBoundingClientRect();r.style.transition='stroke-dashoffset '+ms+'ms linear';r.style.strokeDashoffset=100;
}
function showFeedbackFlash(k){const a=$('app');a.dataset.fb=k;later(()=>{a.dataset.fb=''},260)}   // ring takes the pen colour
function showCountdown(n,cb){setPhase('count');(function step(i){$('count').textContent=i>0?H.N(i):'';if(i<=0)return cb&&cb();Snd.onset();later(()=>step(i-1),700)})(n)}
function showLevelUpFlash(L){const e=$('lvl');e.textContent=H.T('level')+' '+H.N(L);e.classList.remove('step');void e.offsetWidth;e.classList.add('step');Snd.level()}
function render(){
  const m=CONFIG.modes[S.mode];
  $('mode-l').textContent=H.T(S.mode);$('lvl').textContent=H.T('level')+' '+H.N(S.level);
  $('lives').innerHTML=m.lives?Array.from({length:m.lives},(_,i)=>'<i class="'+(i<S.lives?'':'off')+'"></i>').join(''):'';
}

/* ---- tape: one hole per trial ---- */
function tapeInit(){$('tape').innerHTML='<i></i>'.repeat(fixed()?CONFIG.modes[S.mode].trials:0)}
function tapeCell(){const t=$('tape');return fixed()?t.children[S.cur.n]:t.lastElementChild}
function tapeNow(){const t=$('tape');if(!fixed()){t.appendChild(document.createElement('i'));while(t.children.length>CONFIG.tapeMax)t.removeChild(t.firstChild)}tapeCell().className='now'}

/* ---- trials: deterministic from the server seed ---- */
function generateQuestion(){
  const m=CONFIG.modes[S.mode],r=S.rng,L=S.level;
  const go=r()<CONFIG.pGo(L),side=r()<.5?-1:1,jit=(r()-.5)*300;    // fixed draw order
  let q={go,dev:go?0:side*CONFIG.dev(L),dur:CONFIG.dur(L),isi:CONFIG.isi(L)+jit};
  q.win=q.dur+CONFIG.grace;
  if(m.shape)q=m.shape(q);
  q.dur=Math.round(q.dur);q.win=Math.round(q.win);q.isi=Math.round(q.isi);
  return q;
}
function nextTrial(){
  const m=CONFIG.modes[S.mode],n=S.trials.length;
  if(n>=m.trials)return finish('done');
  const L=m.lvl(n);if(n>0&&L>S.level)showLevelUpFlash(L);
  S.level=L;S.maxLevel=Math.max(S.maxLevel,L);
  const q=generateQuestion();q.n=n;q.level=L;S.cur=q;
  setPhase('fix');render();tapeNow();setTimer(0);needle(0);
  later(()=>present(q),q.isi);
}
function present(q){
  setPhase('stim');needle(q.dev);S.t0=performance.now();S.armed=true;setTimer(q.win);Snd.onset();
  later(()=>{if(S.armed)setPhase('resp')},q.dur);          // needle leaves, window stays open
  S.to=later(()=>resolve(null),q.win);
}
function press(e){
  if(e.type==='keydown'&&(e.repeat||(e.code!=='Space'&&e.code!=='Enter')))return;
  if(S.armed&&(S.phase==='stim'||S.phase==='resp')){e.preventDefault();resolve(performance.now()-S.t0)}
}
function resolve(rt){
  if(!S.armed)return;S.armed=false;clearTimeout(S.to);
  const q=S.cur,m=CONFIG.modes[S.mode],resp=rt!==null;
  const kind=q.go?(resp?'hit':'ms'):(resp?'fa':'cr'),err=kind==='fa'||kind==='ms';
  S.trials.push({n:q.n,level:q.level,go:q.go,dev:q.dev,resp,rt:resp?Math.round(rt):null});   // RAW trial only
  const base={hit:50+Math.round(Math.max(0,600-(rt||0))/12),cr:60,fa:-100,ms:-50}[kind];
  S.score=Math.max(0,S.score+Math.round(base*(1+q.level/10))-(err&&m.penalty||0));
  if(err&&m.lives)S.lives--;
  setPhase('fb');needle(0);setTimer(0);tapeCell().className=kind;render();
  showFeedbackFlash(err?'bad':'ok');Snd[kind==='ms'?'miss':kind]();if(err)haptic(25);
  if(S.trials.length%5===0)nudge();
  const dead=err&&m.lives&&S.lives<=0;
  later(()=>dead?finish('lives'):nextTrial(),err?520:380);
}

/* ---- AI: marginal note every 5 trials (server text, local fallback) ---- */
async function nudge(){
  const l5=S.trials.slice(-5),fa=l5.filter(t=>!t.go&&t.resp).length,ms=l5.filter(t=>t.go&&!t.resp).length;
  const r=await Promise.race([H.net('/ai/nudge',{game_id:CONFIG.id,ticket_id:S.ticket,level:S.level,last5:l5}),new Promise(f=>setTimeout(()=>f(null),1200))]);
  if(S.phase==='idle'||S.phase==='end')return;
  const e=$('note'),w=document.createElement('span');e.innerHTML='';w.className='w';
  w.textContent=(r&&r.text)||H.T(fa>ms?'n_fa':ms>fa?'n_ms':'n_ok');e.appendChild(w);later(()=>{e.innerHTML=''},4200);
}
async function recap(){const r=await H.net('/ai/recap',{game_id:CONFIG.id,ticket_id:S.ticket});if(r&&r.text&&S.phase==='end')$('rc').textContent=r.text}

/* ---- end of session ---- */
async function finish(reason){
  clearAllTimeouts();S.armed=false;
  const m=CONFIG.modes[S.mode],s=H.summarize(S.trials),prev=(H.pbAll()[S.mode]||{}).score||0;
  Object.assign(s,{mode:S.mode,maxLevel:S.maxLevel,score:S.score,reason,prevPB:prev});
  s.isNewPB=H.pbCheck(S.mode,S.score,S.maxLevel,s.d);
  H.addHistory({t:Date.now(),mode:S.mode,level:S.maxLevel,acc:s.acc,d:s.d,score:S.score});
  if(m.onEnd)m.onEnd(API,s);
  const fresh=H.stageCheck(s),badges=H.unlockBadges(s);H.updateMissions(s);
  const cs=H.FS('checkSession'),ts=H.FS('showToast');
  try{if(cs)cs(CONFIG.id,s);if(ts)fresh.forEach(i=>ts(H.stageName(i)))}catch(e){}
  H.net('/sessions',{game_id:CONFIG.id,ticket_id:S.ticket,seed:S.seed,mode:S.mode,trials:S.trials});   // raw trials only; server computes the rest
  window.parent.postMessage({type:'flash:game-complete',gameId:CONFIG.id,domain:CONFIG.domain,mode:S.mode,maxLevel:S.maxLevel,
    accuracy:s.acc,score:S.score,medianRT:s.med,rtv:s.rtv,rcs:s.rcs,isNewPB:s.isNewPB,
    dprime:s.d,criterion:s.c,hits:s.h,misses:s.m,falseAlarms:s.fa,correctRejections:s.cr},'*');
  Snd.end();showEnd(s,fresh,badges);emit('session-end',s);recap();
}
function showEnd(s,fresh,badges){
  setPhase('end');
  const row=(k,v)=>'<dt>'+H.T(k)+'</dt><dd>'+v+'</dd>';
  const tag=(k,ids,f)=>ids.map(i=>'<p class="tag">'+H.T(k)+': '+f(i)+'</p>').join('');
  $('res').innerHTML='<p class="big">'+H.N(s.d,2)+'<small>d′</small></p>'+(s.isNewPB?'<p class="pbm">'+H.T('newpb')+'</p>':'')
    +'<dl>'+row('score',H.N(s.score))+row('acc',H.N(s.acc*100)+'%')+row('crit',H.N(s.c,2))+row('rt',s.med?H.N(s.med)+' ms':'—')
    +row('hits',H.N(s.h))+row('miss',H.N(s.m))+row('fa',H.N(s.fa))+row('cr',H.N(s.cr))+'</dl>'
    +tag('stage',fresh,H.stageName)+tag('badge',badges,i=>H.T('b_'+i));
  $('rc').textContent='';
}

/* ---- idle, i18n, lifecycle ---- */
function applyI18n(){
  const ar=H.isAr();
  document.documentElement.lang=ar?'ar':'en';document.documentElement.dir=ar?'rtl':'ltr';
  document.querySelectorAll('[data-i]').forEach(e=>{e.textContent=H.T(e.dataset.i)});
  $('ring').setAttribute('transform',ar?'rotate(-90) scale(1,-1)':'rotate(-90)');   // window drains in reading direction
  $('app').dataset.rm=RM()?'on':'';
}
function showIdle(){
  setPhase('idle');applyI18n();
  $('ledger').innerHTML=Object.keys(CONFIG.modes).map(id=>{
    const m=CONFIG.modes[id],lock=m.locked&&m.locked();
    return'<button class="notch" data-mode="'+id+'"'+(lock?' aria-disabled="true"':'')+'><b>'+H.T(id)+'</b><small>'+H.T(lock?'done':id+'_d')+'</small></button>';
  }).join('');
  H.pbRow($('pb'));H.missionRow($('ms'));H.drawLog($('log'));
  const rs=H.FS('renderStrip');
  if(rs){try{rs($('stages'),CONFIG.id)}catch(e){H.drawStrip($('stages'))}}else H.drawStrip($('stages'));
}
function reset(mode){
  clearAllTimeouts();const m=CONFIG.modes[mode];
  Object.assign(S,{mode,level:m.lvl(0),maxLevel:m.lvl(0),lives:m.lives,score:0,trials:[],armed:false,cur:null});
  needle(0);setTimer(0);$('note').innerHTML='';
}
async function start(mode){
  const m=CONFIG.modes[mode];
  if(S.phase!=='idle'||!m||(m.locked&&m.locked()))return;
  Snd.unlock();reset(mode);setPhase('count');tapeInit();render();
  const t=await H.net('/plays',{game_id:CONFIG.id,mode});                 // play ticket: server seed
  S.seed=(t&&t.seed)||(m.daily?'daily-'+H.today():H.localSeed());S.ticket=(t&&t.ticket_id)||null;
  S.rng=mkRng(S.seed);
  if(S.ticket)await H.net('/plays/consume',{ticket_id:S.ticket});         // verify before the trial loop
  if(S.phase!=='count')return;                                              // player left during the handshake
  if(m.onStart)m.onStart(API);
  showCountdown(3,nextTrial);
}
function exitToMenu(){clearAllTimeouts();S.armed=false;setTimer(0);needle(0);showIdle()}
function drawTicks(){
  let s='';
  for(let a=-60;a<=60;a+=10){
    const r=a*Math.PI/180,l=a%30?6:12,x=Math.sin(r),y=-Math.cos(r);
    s+='<line x1="'+(x*(84-l)).toFixed(1)+'" y1="'+(y*(84-l)).toFixed(1)+'" x2="'+(x*84).toFixed(1)+'" y2="'+(y*84).toFixed(1)+'"/>';
  }
  $('ticks').innerHTML=s;
}

/* ---- public API (go-no-go-extra-modes.js and the shell call these) ---- */
const API=window.GoNoGoAPI={CONFIG,state:S,settings,render,setPhase,setTimer,showFeedbackFlash,showCountdown,showLevelUpFlash,
  haptic,generateQuestion,clearAllTimeouts,emit,exitToMenu,$,getElContent};

function init(){
  window.GNG_MODES.install(API);
  drawTicks();
  document.addEventListener('keydown',e=>{if(e.code==='Escape'&&S.phase!=='idle')return exitToMenu();press(e)});
  document.addEventListener('pointerdown',e=>{if(!e.target.closest('button,input,select,[role=dialog]'))press(e)});
  $('ledger').addEventListener('click',e=>{const b=e.target.closest('.notch');if(b&&b.getAttribute('aria-disabled')!=='true')start(b.dataset.mode)});
  $('x').onclick=exitToMenu;
  $('again').onclick=()=>{const m=S.mode;showIdle();start(m)};
  $('cfg').onclick=H.openPanel;
  H.onSettings(()=>{Snd.mute(settings().sound===false);if(S.phase==='idle')showIdle();else applyI18n()});
  const fi=H.FS('init');try{if(fi)fi(CONFIG.id,ST.list)}catch(e){}
  Snd.mute(settings().sound===false);
  showIdle();
}
init();
})();
