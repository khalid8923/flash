/* ============================================================
   FLASH - Tag Panels
   Adds data-panel="today|season|recent" to the 3 main columns.
   Cleans up any misplaced .dp-block/.ml-block from previous runs.
   ============================================================ */
(function () {
  'use strict';

  function tagColumns() {
    var main = document.querySelector('.main');
    if (!main) return;

    var cols = main.querySelectorAll(':scope > .col');
    if (cols[0]) cols[0].setAttribute('data-panel', 'today');
    if (cols[1]) cols[1].setAttribute('data-panel', 'season');
    if (cols[2]) cols[2].setAttribute('data-panel', 'recent');
  }

  function cleanupMisplacedBlocks() {
    /* Remove any .dp-block or .ml-block that ended up in a week-cell */
    var weekCells = document.querySelectorAll('.week-cell, .heatmap .cell, [class*="week-cell"]');
    for (var i = 0; i < weekCells.length; i++) {
      var dp = weekCells[i].querySelector('.dp-block');
      if (dp) dp.remove();
      var ml = weekCells[i].querySelector('.ml-block');
      if (ml) ml.remove();
    }

    /* Also remove any .dp-block that isn't inside [data-panel="today"] */
    var allDp = document.querySelectorAll('.dp-block');
    for (var j = 0; j < allDp.length; j++) {
      var parent = allDp[j].closest('[data-panel="today"]');
      if (!parent) {
        allDp[j].remove();
      }
    }

    var allMl = document.querySelectorAll('.ml-block');
    for (var k = 0; k < allMl.length; k++) {
      var parent2 = allMl[k].closest('[data-panel="today"]');
      if (!parent2) {
        allMl[k].remove();
      }
    }
  }

  function boot() {
    tagColumns();
    cleanupMisplacedBlocks();

    /* Re-run after every render */
    window.addEventListener('flash:render', function () {
      setTimeout(function () {
        tagColumns();
        cleanupMisplacedBlocks();
      }, 100);
    }, { passive: true });

    console.info('[FLASH_TAG_PANELS] ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 400); });
  } else {
    setTimeout(boot, 400);
  }

  window.FLASH_TAG_PANELS = { tag: tagColumns, cleanup: cleanupMisplacedBlocks, version: '1.0.0' };
})();