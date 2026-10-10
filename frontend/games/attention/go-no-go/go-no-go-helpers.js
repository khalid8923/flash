/* go-no-go-helpers.js — storage, PB, history, daily log, badges, missions, i18n, SDT maths, network.
   Exposes window.GNG_HELPERS. Every shared-service call (FlashSettings, FlashStages, FLASH_I18N, backend) goes
   through this file, so a changed shared signature is a one-place fix.
   Template: change ID/DOMAIN, STR, summarize(); keep the storage keys and exported names. */
(function(){
'use strict';
const ID='go-no-go',DOMAIN='attention',P='flash:';
const K={stages:P+'stages:'+ID,pb:P+ID+':pb',history:P+ID+':history',daily:P+ID+':daily',badges:P+ID+':badges',missions:P+ID+':missions'};
const get=(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}};
const set=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};

/* ---- shared-service adapters (signatures assumed; adjust here only) ---- */
const settings=()=>{try{return(window.FlashSettings&&FlashSettings.get())||{}}catch(e){return{}}};
const onSettings=f=>{try{window.FlashSettings&&FlashSettings.onChange&&FlashSettings.onChange(f)}catch(e){}};
const openPanel=()=>{try{window.FlashSettings&&FlashSettings.openPanel&&FlashSettings.openPanel()}catch(e){}};
const FS=f=>{const s=window.FlashStages;return s&&typeof s[f]==='function'?s[f].bind(s):null};

/* ---- i18n: FLASH_I18N wins when it knows 'gng.<key>'; this EN/AR table is the fallback ---- */
const STR={
en:{title:'Go / No-Go',cite:'Drewe 1975, signal detection',rule:'Press when the needle rests on zero. Withhold when it is deflected.',
 classic:'Classic',classic_d:'45 trials, 3 lives',speed:'Speed',speed_d:'20 trials, short window',endless:'Endless',endless_d:'the first error ends it',
 precision:'Precision',precision_d:'15 trials, open window',daily:'Daily',daily_d:'24 trials, once a day',done:'Done today',
 best:'Best',level:'Level',settings:'Settings',menu:'Menu',again:'Again',newpb:'New personal best',stage:'Stage',badge:'Badge',score:'Score',
 crit:'Criterion c',acc:'Accuracy',rt:'Median RT',hits:'Hits',miss:'Misses',fa:'False alarms',cr:'Correct withholds',
 n_fa:'Read the needle before you press.',n_ms:'Commit sooner when it is on zero.',n_ok:'Hold this rhythm.',
 m_play:'Play 3 sessions',m_d:'Reach d′ 1.5',m_prec:'Finish a Precision run',
 b_first:'First record',b_d2:'d′ above 2',b_clean:'No false alarms',b_quick:'Median under 350 ms'},
ar:{title:'انطلق / توقّف',cite:'ديوي ١٩٧٥، نظرية كشف الإشارة',rule:'اضغط حين تستقر الإبرة على الصفر، وامتنع حين تنحرف.',
 classic:'كلاسيكي',classic_d:'٤٥ محاولة، ٣ فرص',speed:'سرعة',speed_d:'٢٠ محاولة، نافذة قصيرة',endless:'بلا نهاية',endless_d:'أول خطأ يُنهيها',
 precision:'دقة',precision_d:'١٥ محاولة، نافذة مفتوحة',daily:'يومي',daily_d:'٢٤ محاولة، مرة كل يوم',done:'أُنجز اليوم',
 best:'الأفضل',level:'المستوى',settings:'الإعدادات',menu:'القائمة',again:'مرة أخرى',newpb:'رقم شخصي جديد',stage:'المرحلة',badge:'وسام',score:'النقاط',
 crit:'معيار القرار c',acc:'الدقة',rt:'وسيط زمن الاستجابة',hits:'إصابات',miss:'إغفالات',fa:'إنذارات كاذبة',cr:'امتناع صحيح',
 n_fa:'اقرأ الإبرة قبل أن تضغط.',n_ms:'احسم أسرع حين تكون على الصفر.',n_ok:'حافظ على هذا الإيقاع.',
 m_play:'العب ٣ جلسات',m_d:'بلوغ d′ بقيمة ١٫٥',m_prec:'أكمل جولة دقة',
 b_first:'أول تسجيل',b_d2:'d′ فوق ٢',b_clean:'بلا إنذارات كاذبة',b_quick:'الوسيط أقل من ٣٥٠ مللي ثانية'}
};
const qs=new URLSearchParams(location.search);   // ?lang=ar previews Arabic without the settings panel
const isAr=()=>String(qs.get('lang')||settings().lang||document.documentElement.lang||'en').slice(0,2)==='ar';
const T=k=>{try{const v=window.FLASH_I18N&&FLASH_I18N.t('gng.'+k);if(v&&v!=='gng.'+k)return v}catch(e){}return STR[isAr()?'ar':'en'][k]||STR.en[k]||k};
const N=(x,d=0)=>new Intl.NumberFormat(isAr()?'ar-EG':'en',{minimumFractionDigits:d,maximumFractionDigits:d}).format(x);
const stageName=id=>{const s=window.GNG_STAGES.list.find(x=>x.id===id);return s?s.n[isAr()?1:0]:id};

/* ---- signal detection: log-linear corrected d' and criterion c ---- */
const zs=p=>{const q=p<.5?p:1-p,t=Math.sqrt(-2*Math.log(q)),x=t-((.010328*t+.802853)*t+2.515517)/(((.001308*t+.189269)*t+1.432788)*t+1);return p<.5?-x:x};
const sdt=(h,m,fa,cr)=>{const a=zs((h+.5)/(h+m+1)),b=zs((fa+.5)/(fa+cr+1));return{d:a-b,c:-(a+b)/2}};
function summarize(tr){           // aggregates for the UI and postMessage only; the server gets raw trials
  let h=0,m=0,fa=0,cr=0;const rt=[];
  tr.forEach(t=>{if(t.go){if(t.resp){h++;rt.push(t.rt)}else m++}else{if(t.resp)fa++;else cr++}});
  const s=rt.slice().sort((a,b)=>a-b),k=s.length>>1,sum=rt.reduce((a,b)=>a+b,0),mean=rt.length?sum/rt.length:0,o=sdt(h,m,fa,cr);
  return{n:tr.length,h,m,fa,cr,acc:tr.length?(h+cr)/tr.length:0,
    med:s.length?(s.length%2?s[k]:(s[k-1]+s[k])/2):0,
    rtv:rt.length?Math.sqrt(rt.reduce((a,x)=>a+(x-mean)*(x-mean),0)/rt.length):0,
    rcs:sum?h/(sum/1000):0,d:o.d,c:o.c};
}

/* ---- PB (per mode), history (30), daily log (90 days) ---- */
const pbAll=()=>get(K.pb,{});
const pbCheck=(mode,score,level,d)=>{const p=pbAll(),was=p[mode]?p[mode].score:0;if(score>was){p[mode]={score,level,d,date:today()};set(K.pb,p);return true}return false};
const history=()=>get(K.history,[]);
const addHistory=r=>set(K.history,history().concat([r]).slice(-30));
const dailyLog=()=>get(K.daily,{});
const dailyDone=()=>!!dailyLog()[today()];
const dailyAdd=r=>{const l=dailyLog();l[today()]=r;Object.keys(l).sort().slice(0,-90).forEach(k=>{delete l[k]});set(K.daily,l)};

/* ---- stages, badges, missions ---- */
const stageCheck=s=>{const u=get(K.stages,{}),f=[];window.GNG_STAGES.list.forEach(x=>{if(!u[x.id]&&x.test(s)){u[x.id]=Date.now();f.push(x.id)}});if(f.length)set(K.stages,u);return f};
const BAD=[{id:'first',t:s=>s.n>0},{id:'d2',t:s=>s.n>=20&&s.d>=2},{id:'clean',t:s=>s.n>=20&&s.fa===0},{id:'quick',t:s=>s.n>=15&&s.med>0&&s.med<350}];
const unlockBadges=s=>{const u=get(K.badges,{}),f=[];BAD.forEach(b=>{if(!u[b.id]&&b.t(s)){u[b.id]=Date.now();f.push(b.id)}});if(f.length)set(K.badges,u);return f};
const MIS=[{id:'play',n:3,f:()=>1},{id:'d',n:1,f:s=>s.n>=15&&s.d>=1.5?1:0},{id:'prec',n:1,f:s=>s.mode==='precision'?1:0}];
function missions(){let m=get(K.missions,null);if(!m||m.date!==today()){m={date:today(),p:{play:0,d:0,prec:0}};set(K.missions,m)}return m}
const updateMissions=s=>{const m=missions();MIS.forEach(x=>{m.p[x.id]=Math.min(x.n,(m.p[x.id]||0)+x.f(s))});set(K.missions,m)};

/* ---- idle-screen renderers ---- */
const row=(el,a)=>{el.innerHTML=a.map(x=>'<span>'+x+'</span>').join('')};
const pbRow=el=>{const p=pbAll().classic;row(el,p?[T('best')+' '+N(p.score),T('level')+' '+N(p.level),'d′ '+N(p.d,2)]:[])};
const missionRow=el=>{const m=missions();row(el,MIS.map(x=>(m.p[x.id]>=x.n?'■ ':'□ ')+T('m_'+x.id)))};
function drawStrip(el){const u=get(K.stages,{}),i=isAr()?1:0;el.innerHTML=window.GNG_STAGES.list.map(s=>'<span class="stg'+(u[s.id]?' on':'')+'" title="'+s.d[i]+'">'+s.n[i]+'</span>').join('')}
function drawLog(svg){            // d' per session, last 15; dashed line = Specialist threshold; time runs in reading direction
  const h=history().slice(-15),st=280/14,ar=isAr(),X=i=>ar?290-i*st:10+i*st,Y=d=>65-Math.max(0,Math.min(4,d))*15;
  svg.innerHTML='<line class="ref" x1="10" x2="290" y1="'+Y(2.5)+'" y2="'+Y(2.5)+'"/>'
    +(h.length>1?'<polyline class="trace" points="'+h.map((r,i)=>X(i)+','+Y(r.d)).join(' ')+'"/>':'')
    +h.map((r,i)=>'<circle class="'+(r.mode==='classic'?'':'alt')+'" cx="'+X(i)+'" cy="'+Y(r.d)+'" r="2.6"/>').join('');
}

/* ---- backend: null on any failure so the game always runs offline ---- */
const base=()=>window.FLASH_API_BASE||'';
async function net(path,body){
  if(location.protocol==='file:'&&!base())return null;
  const c=new AbortController(),t=setTimeout(()=>c.abort(),2500);
  try{const r=await fetch(base()+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json'},credentials:'include',body:body?JSON.stringify(body):undefined,signal:c.signal});return r.ok?await r.json():null}
  catch(e){return null}finally{clearTimeout(t)}
}
const localSeed=()=>Array.from(crypto.getRandomValues(new Uint8Array(8)),b=>b.toString(16).padStart(2,'0')).join('');

window.GNG_HELPERS={ID,DOMAIN,K,get,set,today,settings,onSettings,openPanel,FS,T,N,isAr,stageName,sdt,summarize,
  pbAll,pbCheck,history,addHistory,dailyDone,dailyAdd,stageCheck,unlockBadges,updateMissions,pbRow,missionRow,drawStrip,drawLog,net,localSeed};
})();
