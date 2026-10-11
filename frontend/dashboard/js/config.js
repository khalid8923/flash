/* =========================================================
   MODULE - Config
   Central configuration for backend connectivity.
   Change BACKEND_URL for production. Toggle live mode from
   the settings panel or the header indicator.
   ========================================================= */
window.FLASH_CONFIG = {
  /* Backend endpoints */
  BACKEND_URL: {
    dev:  'http://localhost:3000',
    prod: 'https://flash-backend.onrender.com'
  },

  /* API request settings */
  REQUEST: {
    timeoutMs: 5000,
    retryCount: 2,
    retryDelayMs: 400
  },

  /* Cache TTL per endpoint (ms) */
  CACHE_TTL: {
    domains:      60_000,       // 1 minute
    games:        300_000,      // 5 minutes
    profile:      30_000,       // 30 seconds
    sessions:     15_000,       // 15 seconds
    plan:         120_000,      // 2 minutes
    health:       10_000        // 10 seconds
  },

  /* Feature flags */
  FLAGS: {
    liveMode: true,             // try to use backend if available
    showSourceBadges: true,     // show live/mock badge on panels
    cacheEnabled: true,
    strictMode: false           // if true, errors break the UI
  }
};