(function () {
  'use strict';
  function mountBrain() {
    const todayPanel = document.querySelector('[data-panel="today"]');
    if (!todayPanel) {
      // Wait for tag-panels to finish
      setTimeout(mountBrain, 200);
      return;
    }
    if (todayPanel.querySelector('.brain-alt-wrap')) return; // Already mounted

    const wrap = document.createElement('div');
    wrap.className = 'brain-alt-wrap';
    wrap.style.cssText = 'width:100%; height:200px; margin-bottom:20px; position:relative;';
    todayPanel.insertBefore(wrap, todayPanel.firstChild);

    if (window.FLASH_MODULES && window.FLASH_MODULES.brainAlt) {
        window.FLASH_MODULES.brainAlt.mount(wrap);
        console.log('[Brain Alt] Mounted successfully in Today panel.');
    }
  }
  document.addEventListener('DOMContentLoaded', () => setTimeout(mountBrain, 500));
  window.addEventListener('flash:render', () => setTimeout(mountBrain, 200));
})();