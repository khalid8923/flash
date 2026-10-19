/* ============================================================
   FLASH - Toast Dedupe
   Stop showing same toast repeatedly (max 1 per category per 10s)
   ============================================================ */
(function () {
  'use strict';
  if (!window.FLASH_UI || !window.FLASH_UI.showToast) {
    setTimeout(arguments.callee, 200);
    return;
  }
  var orig = window.FLASH_UI.showToast.bind(window.FLASH_UI);
  var lastSeen = {};
  var WINDOW_MS = 10000;

  window.FLASH_UI.showToast = function (opts) {
    opts = opts || {};
    var cat = opts.category || opts.kind || 'info';
    var now = Date.now();
    if (lastSeen[cat] && now - lastSeen[cat] < WINDOW_MS) {
      return { dismiss: function(){}, el: null };
    }
    lastSeen[cat] = now;
    return orig(opts);
  };
  console.info('[FLASH_TOAST_DEDUPE] active');
})();