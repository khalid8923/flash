/* =========================================================
   FLASH - Configuration
   ========================================================= */
(function () {
  'use strict';
  const isCapacitor = window.Capacitor !== undefined;
  
  window.FLASH_CONFIG = {
    API_BASE: isCapacitor ? 'https://flash-backend.onrender.com' : 'http://localhost:3000',
    liveMode: !isCapacitor, // Offline on mobile, Live on web
    isCapacitor: isCapacitor,
    REQUEST: { timeoutMs: 8000, retryCount: 2, retryDelayMs: 500 },
    CACHE_TTL: { profile: 30000, sessions: 15000, plan: 60000 }
  };
  
  console.info('[FLASH_CONFIG] Ready. LiveMode:', window.FLASH_CONFIG.liveMode);
})();