/* go-no-go-sounds.js — Web Audio synthesis, no audio files. One short voice per outcome.
   Sound never carries information the screen lacks, so muted play is fully playable. */
(function(){
'use strict';
const AC=window.AudioContext||window.webkitAudioContext;
let ctx=null,muted=false;
const ac=()=>{if(!AC)return null;if(!ctx)ctx=new AC();if(ctx.state==='suspended')ctx.resume();return ctx};
function tone(f,d,type,g,delay){
  const x=ac();if(!x||muted)return;
  const o=x.createOscillator(),v=x.createGain(),t=x.currentTime+(delay||0);
  o.type=type||'sine';o.frequency.setValueAtTime(f,t);
  v.gain.setValueAtTime(.0001,t);v.gain.exponentialRampToValueAtTime(g||.1,t+.01);v.gain.exponentialRampToValueAtTime(.0001,t+d);
  o.connect(v);v.connect(x.destination);o.start(t);o.stop(t+d+.03);
}
window.GNG_SOUND={
  unlock:ac,mute:m=>{muted=!!m},
  onset:()=>tone(660,.05,'triangle',.05),                                   // stylus tick: needle appears
  hit:()=>tone(880,.09,'sine',.1),cr:()=>tone(440,.07,'sine',.06),          // correct press / correct withhold
  fa:()=>tone(170,.2,'sawtooth',.08),miss:()=>tone(250,.14,'square',.04),   // errors: low and dry
  level:()=>[523,659,784].forEach((f,i)=>tone(f,.1,'sine',.08,i*.07)),
  end:()=>[392,330,262].forEach((f,i)=>tone(f,.16,'triangle',.08,i*.12))
};
})();
