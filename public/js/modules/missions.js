(function () {
  'use strict';
  
  window.FLASH_MODULES = window.FLASH_MODULES || {};
  window.FLASH_MODULES.missions = {
    render: function() {
      return `
        <div class="missions-block">
          <h3>Daily Missions</h3>
          <div class="mission-item">
            <div class="m-check">✓</div>
            <div class="m-text">Play 2 sessions</div>
            <div class="m-xp">+50 XP</div>
          </div>
          <div class="mission-item incomplete">
            <div class="m-check"></div>
            <div class="m-text">Reach 85% accuracy</div>
            <div class="m-xp">+100 XP</div>
          </div>
          <div class="mission-item incomplete">
            <div class="m-check"></div>
            <div class="m-text">Try a new game</div>
            <div class="m-xp">+75 XP</div>
          </div>
        </div>
      `;
    }
  };
})();