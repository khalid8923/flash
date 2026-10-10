/* go-no-go-stages.js — the 8 stages. Each: id, [en, ar] name, [en, ar] description, test(session) -> boolean.
   session = summary built in game.js: {mode, n, acc, d, c, maxLevel, score, isNewPB, prevPB, ...}. */
(function(){
'use strict';
window.GNG_STAGES={game:'go-no-go',list:[
 {id:'apprentice',n:['Apprentice','متدرّب'],d:['Reach level 5','بلغ المستوى ٥'],test:s=>s.mode==='classic'&&s.maxLevel>=5},
 {id:'journeyman',n:['Journeyman','ماهر'],d:['Reach level 10','بلغ المستوى ١٠'],test:s=>s.mode==='classic'&&s.maxLevel>=10},
 {id:'adept',n:['Adept','بارع'],d:['Reach level 15','بلغ المستوى ١٥'],test:s=>s.mode==='classic'&&s.maxLevel>=15},
 {id:'specialist',n:['Specialist','متخصص'],d:['d′ of 2.5 or higher over 20+ trials','حساسية d′ لا تقل عن ٢٫٥ في ٢٠ محاولة أو أكثر'],test:s=>s.n>=20&&s.d>=2.5},
 {id:'sprinter',n:['Sprinter','عدّاء'],d:['Speed mode at 85% accuracy','وضع السرعة بدقة ٨٥٪'],test:s=>s.mode==='speed'&&s.acc>=.85},
 {id:'perfectionist',n:['Perfectionist','مُتقِن'],d:['100% accuracy over 15+ trials','دقة ١٠٠٪ في ١٥ محاولة أو أكثر'],test:s=>s.n>=15&&s.acc===1},
 {id:'endless',n:['Endless Runner','عدّاء بلا حدود'],d:['Level 6 in Endless','المستوى ٦ في وضع بلا نهاية'],test:s=>s.mode==='endless'&&s.maxLevel>=6},
 {id:'master',n:['Master','أستاذ'],d:['Beat your best at level 12 or higher','تجاوز رقمك الأفضل عند المستوى ١٢ أو أعلى'],test:s=>s.isNewPB&&s.prevPB>0&&s.maxLevel>=12}
]};
})();
