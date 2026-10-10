/* FLASH dashboard core: state, SVG paper renderer, coach annotation line, postMessage hook.
   Backend calls: POST /ai/chat, POST /ai/journal/entry, GET /ai/lessons/auto, GET /profile, GET /plan.
   Set window.FLASH_API to the API origin before this script if it is not same-origin. */
(function(){'use strict';
var F=window.FLASH,I=window.FLASH_I18N,ROW=56,RUL=30,W=1000,N=31,PAST=28,H=RUL+9*ROW;
var S={lang:'en',hc:false,sel:0,d:null,cid:null,note:null};
function $(i){return document.getElementById(i)}
function all(q){return Array.prototype.slice.call(document.querySelectorAll(q))}
try{var sv=localStorage.getItem('flash-lang');S.lang=sv||((navigator.language||'').slice(0,2)==='ar'?'ar':'en');S.hc=localStorage.getItem('flash-hc')==='1'}catch(e){}
function t(k){return(I[S.lang]&&I[S.lang][k])||I.en[k]||k}
function nf(v,d){return new Intl.NumberFormat(S.lang==='ar'?'ar-EG':'en-US',{maximumFractionDigits:d||0}).format(v)}
function sg(v){return(v>0.05?'+':v<-0.05?'\u2212':'\u00B1')+nf(Math.abs(v),1)}
function avg(a,i,j){var s=0,k;for(k=i;k<j;k++)s+=a[k];return s/(j-i)}
function api(p,o){return fetch((window.FLASH_API||'')+p,Object.assign({credentials:'include',headers:{'Content-Type':'application/json'}},o||{})).then(function(r){return r.ok?r.json():null}).catch(function(){return null})}
function weakest(d){var w=0,c;for(c=1;c<9;c++)if(d.series[c][PAST-1]<d.series[w][PAST-1])w=c;return w}

function paper(d){
var rtl=S.lang==='ar',i,c,r;
function X(n){var f=n/(N-1);return(rtl?1-f:f)*W}
function Y(k,v){return RUL+k*ROW+ROW-6-Math.max(0,Math.min(100,v))/100*(ROW-12)}
var xa=X(PAST-1),xb=X(N-1);
var g='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none" aria-hidden="true"><rect class="fut" x="'+Math.min(xa,xb)+'" y="0" width="'+Math.abs(xb-xa)+'" height="'+H+'"/>';
for(i=0;i<N;i++){var k=i<PAST&&d.inked[i];g+='<line class="'+(i%7===0?'w ':'')+(k?'k':'')+'" x1="'+X(i)+'" x2="'+X(i)+'" y1="'+(k?0:RUL-6)+'" y2="'+H+'"/>'}
for(r=0;r<=9;r++)g+='<line x1="0" x2="'+W+'" y1="'+(RUL+r*ROW)+'" y2="'+(RUL+r*ROW)+'"/>';
g+='</svg>';
var tr='<svg class="tr" viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none" role="img" aria-label="'+t('aria_plot')+'">';
for(c=0;c<9;c++){var a=d.series[c],p='',q='M'+X(PAST-1).toFixed(1)+' '+Y(c,a[PAST-1]).toFixed(1);
for(i=0;i<PAST;i++)p+=(i?'L':'M')+X(i).toFixed(1)+' '+Y(c,a[i]).toFixed(1);
for(i=0;i<3;i++)q+='L'+X(PAST+i).toFixed(1)+' '+Y(c,d.fc[c][i]).toFixed(1);
tr+='<g data-c="'+c+'" class="'+(S.sel===c?'on':'')+'" style="--k:var(--c'+c+')"><path d="'+p+'"/><path class="f" d="'+q+'"/></g>'}
return g+tr+'</svg>'}

function detail(c){var id=F.dom[c],k,s='<h2>'+t('d_'+id)+'</h2><ul class="games">';
for(k=1;k<=4;k++)s+='<li><a href="shell.html?game='+id+'-'+k+'">'+t('d_'+id)+' '+nf(k)+'</a></li>';
return s+'</ul>'}

function anchor(x){var p=document.querySelector('.plot');if(!p||!S.d)return;
var o=p.querySelector('.anno');if(o)o.remove();
var n=document.createElement('p');n.className='anno';n.style.top=(RUL+weakest(S.d)*ROW+ROW/2)+'px';
n.textContent=x.length>160?x.slice(0,157)+'\u2026':x;p.appendChild(n)}

function render(){
var d=S.d,rtl=S.lang==='ar',c,i,h='',R=document.documentElement;
R.lang=S.lang;R.dir=rtl?'rtl':'ltr';
if(S.hc)R.setAttribute('data-hc','');else R.removeAttribute('data-hc');
$('hc').setAttribute('aria-pressed',S.hc?'true':'false');
all('[data-i]').forEach(function(e){e.textContent=t(e.getAttribute('data-i'))});
$('date').textContent=new Date().toLocaleDateString(rtl?'ar-EG':'en-GB',{day:'numeric',month:'short',year:'numeric'});
h+='<section class="paper"><div class="labels"><div class="sp">'+t('chans')+'</div>';
for(c=0;c<9;c++){var a=d.series[c],dl=avg(a,PAST-7,PAST)-avg(a,PAST-14,PAST-7);
h+='<button type="button" class="ch'+(S.sel===c?' on':'')+'" data-c="'+c+'" aria-pressed="'+(S.sel===c)+'" style="--k:var(--c'+c+')"><span class="nm">'+t('d_'+F.dom[c])+'</span><span class="rd">'+nf(a[PAST-1])+' <i>'+sg(dl)+'</i></span></button>'}
h+='</div><div class="plot">'+paper(d)+'<i class="pen"></i></div></section><p class="leg">'+t('legend')+'</p>';
var st=0,tk='';for(i=PAST-1;i>=0&&d.inked[i];i--)st++;
for(i=0;i<8;i++)tk+='<b'+(i<d.stage?' class="on"':'')+'></b>';
h+='<dl class="read"><div><dt>'+t('streak')+'</dt><dd>'+nf(st)+'</dd></div><div><dt>'+t('level')+'</dt><dd>'+nf(d.level)+'</dd></div><div><dt>'+t('xp')+'</dt><dd>'+nf(d.xp)+' <small class="rd">/ '+nf(d.xpMax)+'</small></dd></div><div><dt>'+t('stage')+'</dt><dd><span class="tk" role="img" aria-label="'+nf(d.stage)+' / '+nf(8)+'">'+tk+'</span></dd></div></dl>';
h+='<section id="plan" class="folio"><h2>'+t('plan')+'</h2><ol class="strip">'+d.plan.map(function(p){return'<li style="flex:'+p.min+'"><small>'+t(p.kind)+'</small><b>'+t('d_'+p.dom)+'</b><span class="rd">'+nf(p.min)+' '+t('min')+'</span><a href="shell.html?game='+encodeURIComponent(p.game)+'">'+t('open')+'</a></li>'}).join('')+'</ol><p id="fc" class="rd">'+t('fc')+': '+t('acc')+' '+nf(d.pred.acc[0])+'\u2013'+nf(d.pred.acc[1])+' %, '+t('rt')+' '+nf(d.pred.rt[0])+'\u2013'+nf(d.pred.rt[1])+' '+t('ms')+'</p></section>';
h+='<section id="detail" class="folio">'+detail(S.sel)+'</section>';
h+='<div class="cols"><section class="folio"><h2>'+t('recent')+'</h2><ul class="rec">'+d.recent.map(function(r){return'<li><span>'+t('d_'+r.dom)+'</span><time class="rd">'+new Date(Date.now()-r.ago*864e5).toLocaleDateString(rtl?'ar-EG':'en-GB',{day:'numeric',month:'short'})+'</time><span class="rule" aria-hidden="true"><i style="inset-inline-start:'+(r.rt/15)+'%;width:'+(r.rtv/15)+'%"></i></span><span class="rd">'+nf(r.acc)+' %</span><span class="rd">'+nf(r.rt)+' '+t('ms')+'</span></li>'}).join('')+'</ul></section>';
h+='<section class="folio"><h2>'+t('pb')+'</h2><dl class="pbl">'+d.pb.map(function(p){return'<div><dt>'+t('d_'+p.dom)+' '+nf(p.n)+'</dt><dd class="rd">'+nf(p.v)+'</dd></div>'}).join('')+'</dl></section>';
h+='<section class="folio"><h2>'+t('miss')+'</h2><ul class="mis">'+d.missions.map(function(m){return'<li'+(m.done?' class="done"':'')+'><span class="box"></span>'+t(m.k)+(m.done?'<span class="sr"> '+t('done')+'</span>':'')+'</li>'}).join('')+'</ul></section>';
h+='<form id="jr" class="folio jr"><h2 id="journal">'+t('f_journal').split('|')[0]+'</h2><label><span>'+t('mood')+'</span><input type="range" name="mood" min="1" max="9" value="5"></label><label><span>'+t('energy')+'</span><input type="range" name="energy" min="1" max="9" value="5"></label><button type="submit">'+t('logAction')+'</button><output id="jo"></output></form>';
h+='<section id="lesson" class="folio"><h2>'+t('f_lessons').split('|')[0]+'</h2><button type="button" id="les">'+t('lessonBtn')+'</button><p id="lt"></p></section>';
var map={f_predict:'#fc',f_journal:'#journal',f_lessons:'#lesson',f_daily:'#plan',f_voice:'#q'};
h+='<section class="folio"><h2>'+t('ai')+'</h2><ol class="idx">'+F.feat.map(function(k){var b=t(k).split('|'),n='<b>'+b[0]+'</b><span>'+b[1]+'</span>';return'<li>'+(map[k]?'<a href="'+map[k]+'">'+n+'</a>':'<div>'+n+'</div>')+'</li>'}).join('')+'</ol></section></div>';
$('app').innerHTML=h;
anchor(S.note||t('insight'))}

function select(c){S.sel=c;
all('.ch').forEach(function(b){var on=+b.getAttribute('data-c')===c;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on?'true':'false')});
all('.tr g').forEach(function(g){g.classList.toggle('on',+g.getAttribute('data-c')===c)});
$('detail').innerHTML=detail(c)}

function say(x,w){var p=document.createElement('p');p.className='n '+w;p.textContent=x;$('log').appendChild(p);$('log').scrollTop=1e5;if(w==='ai'){S.note=x;anchor(x)}}

$('app').addEventListener('click',function(e){
var b=e.target.closest&&e.target.closest('.ch');if(b)select(+b.getAttribute('data-c'));
if(e.target.id==='les')api('/ai/lessons/auto').then(function(r){var x=r&&(r.text||r.content||r.body);$('lt').textContent=x||t('offline')})});
$('app').addEventListener('submit',function(e){if(e.target.id!=='jr')return;e.preventDefault();var f=e.target;
api('/ai/journal/entry',{method:'POST',body:JSON.stringify({mood:+f.mood.value,energy:+f.energy.value})}).then(function(r){$('jo').textContent=r?t('logged'):t('offline')})});
$('note').addEventListener('submit',function(e){e.preventDefault();var q=$('q'),m=q.value.trim();if(!m)return;q.value='';say(m,'you');
api('/ai/chat',{method:'POST',body:JSON.stringify({message:m,conversation_id:S.cid,language:S.lang})}).then(function(r){
if(r&&r.conversation_id)S.cid=r.conversation_id;
say((r&&(r.reply||r.message||r.response))||t('offline'),'ai')})});
$('lg').addEventListener('click',function(){S.lang=S.lang==='ar'?'en':'ar';try{localStorage.setItem('flash-lang',S.lang)}catch(e){}render()});
$('hc').addEventListener('click',function(){S.hc=!S.hc;try{localStorage.setItem('flash-hc',S.hc?'1':'0')}catch(e){}render()});
document.addEventListener('keydown',function(e){if(e.key==='/'&&!/INPUT|TEXTAREA/.test(document.activeElement.tagName)){e.preventDefault();$('q').focus()}});

/* A finished session writes onto today's column of its channel, then the paper re-inks. */
window.addEventListener('message',function(e){
if(e.origin!==location.origin&&location.protocol!=='file:')return;
var m=e.data;if(!m||m.type!=='flash:game-complete'||typeof m.accuracy!=='number')return;
var c=F.dom.indexOf(m.domain);if(c<0)return;
var acc=m.accuracy<=1?m.accuracy*100:m.accuracy,a=S.d.series[c];
a[PAST-1]=Math.round(a[PAST-1]*0.6+acc*0.4);S.d.inked[PAST-1]=true;S.sel=c;render()});

S.d=F.demo();S.sel=weakest(S.d);render();
Promise.all([api('/profile'),api('/plan')]).then(function(r){var d=(r[0]||r[1])?F.adapt(r[0],r[1]):null;if(d){S.d=d;S.sel=weakest(d);render()}});
})();
