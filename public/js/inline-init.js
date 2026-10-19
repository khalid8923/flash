(function(){
'use strict';
function init(){
  var F = window.FLASH;
  if (!F) { setTimeout(init, 200); return; }
  var th = document.getElementById('th');
  if (th) th.addEventListener('click', function(){
    var next = F.state && F.state.theme === 'dark' ? 'light' : 'dark';
    var TT = window.FLASH_MODULES && window.FLASH_MODULES.themeTransition;
    if (TT) TT.transition(next, th, function(){ F.setTheme(next); window.dispatchEvent(new Event('flash:render')); });
    else { F.toggleTheme && F.toggleTheme(); window.dispatchEvent(new Event('flash:render')); }
  });
      /* Add fingerprint link */
    var tools = document.querySelector('.hdr .tools');
    if (tools && !tools.querySelector('.fp-link')) {
      /* Add AI Lab link */
    var lab = document.createElement('a');
    lab.href = 'ai-lab.html';
    lab.className = 'lab-link';
    lab.style.cssText = 'display:inline-flex;align-items:center;gap:4px;padding:6px 10px;font-size:11px;color:var(--tx-mu);text-decoration:none;border:1px solid var(--ln);border-radius:6px;margin-inline-end:6px;';
    lab.innerHTML = '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 3v6L4 18a2 2 0 0 0 1.7 3h12.6a2 2 0 0 0 1.7-3L15 9V3"/></svg><span>Lab</span>';
    lab.onmouseenter = function(){ lab.style.background = 'color-mix(in srgb, var(--ac) 8%, transparent)'; };
    lab.onmouseleave = function(){ lab.style.background = 'transparent'; };
    tools.insertBefore(lab, tools.firstChild);

    var fp = document.createElement('a');
      fp.href = 'fingerprint.html';
      fp.className = 'fp-link';
      fp.style.cssText = 'display:inline-flex;align-items:center;gap:4px;padding:6px 10px;font-size:11px;color:var(--tx-mu);text-decoration:none;border:1px solid var(--ln);border-radius:6px;margin-inline-end:6px;';
      fp.innerHTML = '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/></svg><span>Fingerprint</span>';
      fp.onmouseenter = function(){ fp.style.background = 'color-mix(in srgb, var(--ac) 8%, transparent)'; };
      fp.onmouseleave = function(){ fp.style.background = 'transparent'; };
      tools.insertBefore(fp, tools.firstChild);
    }

    document.querySelectorAll('.lg button').forEach(function(b){
    b.addEventListener('click', function(){
      var next = b.dataset.l;
      var LF = window.FLASH_MODULES && window.FLASH_MODULES.langFlip;
      if (LF) LF.flip(next, function(){ F.setLang(next); });
      else { F.setLang && F.setLang(next); window.dispatchEvent(new Event('flash:render')); }
    });
  });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else setTimeout(init, 50);
})();