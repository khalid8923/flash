/* FLASH dashboard: domains, i18n (EN + AR), demo record.
   FLASH.adapt(profile, plan) is the single place to map backend responses
   (GET /profile, GET /plan) onto the shape returned by FLASH.demo(). */
window.FLASH={
dom:['attention','memory','speed','flexibility','inhibition','reasoning','spatial','language','planning'],
feat:['f_nudge','f_fingerprint','f_variants','f_predict','f_journal','f_voice','f_lab','f_director','f_lessons','f_errors','f_transfer','f_daily'],
adapt:function(p,pl){return null},
demo:function(){
var s=1234,i,c,series=[],fc=[],inked=[];
function r(){s=s*16807%2147483647;return s/2147483647}
function cl(x){return Math.max(8,Math.min(96,x))}
for(c=0;c<9;c++){var a=[],v=c===4?44:48+r()*26,dr=c===4?-0.5:0.25;
for(i=0;i<28;i++){v=cl(v+(r()-0.5)*7+dr);a.push(v)}
series.push(a);fc.push([cl(a[27]+dr*3+1),cl(a[27]+dr*6+1.5),cl(a[27]+dr*9+2)])}
for(i=0;i<28;i++)inked.push(i>=22||r()>0.4);
return{series:series,fc:fc,inked:inked,level:7,xp:1240,xpMax:1500,stage:3,
pred:{acc:[81,88],rt:[620,700]},
plan:[{kind:'warm',dom:'attention',game:'attention-1',min:3},{kind:'main',dom:'inhibition',game:'inhibition-2',min:8},{kind:'chal',dom:'speed',game:'speed-3',min:5}],
recent:[{dom:'inhibition',ago:0,acc:76,rt:642,rtv:120},{dom:'memory',ago:1,acc:88,rt:710,rtv:90},{dom:'speed',ago:2,acc:91,rt:512,rtv:70},{dom:'planning',ago:4,acc:82,rt:980,rtv:210}],
pb:[{dom:'memory',n:2,v:9},{dom:'speed',n:3,v:1840},{dom:'attention',n:1,v:96},{dom:'reasoning',n:4,v:14}],
missions:[{k:'m1',done:true},{k:'m2',done:false},{k:'m3',done:false}]}}
};
window.FLASH_I18N={
en:{rec:"record",contrast:"High contrast",otherLang:"العربية",annotate:"Annotate (press /)",write:"Write",
offline:"The server did not answer. Nothing was sent.",chans:"Channels",plan:"Three windows ahead",warm:"Warm-up",main:"Main",chal:"Challenge",
min:"min",open:"Open",recent:"Recent strips",pb:"Personal bests",miss:"Marks for today",m1:"Finish one warm-up",m2:"Reach level 6 in any speed game",m3:"Log mood and energy",done:"done",
ai:"Instruments",streak:"Days inked",level:"Level",xp:"XP",stage:"Stage",fc:"Next session, forecast",acc:"Accuracy",rt:"Median RT",ms:"ms",
mood:"Mood",energy:"Energy",logAction:"Log entry",logged:"Entry logged. The plan will adjust.",lessonBtn:"Open today's sixty-second lesson",
legend:"Solid line: recorded. Dashed line: forecast. Red line: now.",
aria_plot:"Nine channels of cognitive performance over the last four weeks, with a three-day forecast",
insight:"Your lowest channel has fallen for four sessions. A short run in each of its games would show whether it is fatigue or practice.",
d_attention:"Attention",d_memory:"Working memory",d_speed:"Processing speed",d_flexibility:"Flexibility",d_inhibition:"Inhibition",d_reasoning:"Reasoning",d_spatial:"Spatial",d_language:"Language",d_planning:"Planning",
f_nudge:"Nudge|In-game, in the margin",f_fingerprint:"Fingerprint|Header of the profile",f_variants:"Variants|Game idle screen",f_predict:"Forecast|The dashed trace ahead",f_journal:"Journal|Daily entry, below",f_voice:"Voice|Annotation line, microphone",f_lab:"Lab|Experiments, under the plan",f_director:"Director|The session strip",f_lessons:"Lessons|Sixty seconds, below",f_errors:"Error patterns|Beside each channel",f_transfer:"Transfer|Between channels",f_daily:"Daily plan|Three windows ahead"},
ar:{rec:"سجلّ",contrast:"تباين عالٍ",otherLang:"English",annotate:"أضف ملاحظة (اضغط /)",write:"اكتب",
offline:"لم يردّ الخادم. لم يُرسَل شيء.",chans:"القنوات",plan:"ثلاث نوافذ أمامك",warm:"إحماء",main:"أساسي",chal:"تحدٍّ",
min:"د",open:"افتح",recent:"آخر الشرائط",pb:"أفضل نتائجك",miss:"علامات اليوم",m1:"أنهِ جولة إحماء واحدة",m2:"بلوغ المستوى ٦ في أي لعبة سرعة",m3:"سجّل المزاج والطاقة",done:"مكتمل",
ai:"الأدوات",streak:"أيام مُحبَّرة",level:"المستوى",xp:"نقاط الخبرة",stage:"المرحلة",fc:"الجلسة القادمة، توقّع",acc:"الدقة",rt:"زمن الاستجابة الوسيط",ms:"م.ث",
mood:"المزاج",energy:"الطاقة",logAction:"سجّل الإدخال",logged:"سُجّل الإدخال. ستتكيّف الخطة.",lessonBtn:"افتح درس اليوم (ستون ثانية)",
legend:"الخط المتصل: مسجَّل. الخط المتقطّع: توقّع. الخط الأحمر: الآن.",
aria_plot:"تسع قنوات للأداء المعرفي خلال آخر أربعة أسابيع مع توقّع لثلاثة أيام",
insight:"انخفضت قناتك الأضعف في آخر أربع جلسات. جولة قصيرة في ألعابها ستبيّن إن كان السبب إرهاقًا أم تدريبًا.",
d_attention:"الانتباه",d_memory:"الذاكرة العاملة",d_speed:"سرعة المعالجة",d_flexibility:"المرونة الذهنية",d_inhibition:"الكف",d_reasoning:"الاستدلال",d_spatial:"الإدراك المكاني",d_language:"اللغة",d_planning:"التخطيط",
f_nudge:"تلميح|داخل اللعبة، في الهامش",f_fingerprint:"البصمة المعرفية|رأس الملف الشخصي",f_variants:"النسخ|شاشة بدء اللعبة",f_predict:"التوقّع|الخط المتقطّع أمامك",f_journal:"اليوميات|إدخال يومي، أدناه",f_voice:"الصوت|سطر الملاحظات، الميكروفون",f_lab:"المختبر|التجارب، تحت الخطة",f_director:"المخرج|شريط الجلسة",f_lessons:"الدروس|ستون ثانية، أدناه",f_errors:"أنماط الخطأ|بجانب كل قناة",f_transfer:"الانتقال|بين القنوات",f_daily:"خطة اليوم|ثلاث نوافذ أمامك"}
};
