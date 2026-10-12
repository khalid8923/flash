/* ============================================================
   FLASH - Data Export
   Download JSON/CSV of local dashboard data
   ============================================================ */
(function () {
  'use strict';

  const F = window.FLASH;
  const API = window.FLASH_API;

  function download(filename, content, mime) {
    const blob = new Blob([content], { type: mime || 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 200);
  }

  function timestamp() {
    return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  }

  async function collectAll() {
    const data = {
      exported_at: new Date().toISOString(),
      version: 1,
      user: null,
      xp: null,
      streak: null,
      favorites: null,
      sessions: null,
      recent_sessions: null,
      domains: null
    };

    /* Local state */
    try {
      const M = window.FLASH_DATA;
      if (M) {
        data.domains = M.domains || null;
        data.recent_sessions = M.recentSessions || null;
      }
    } catch (_) {}

    /* Remote (best-effort) */
    if (API) {
      const safe = (fn) => fn().catch(() => null);
      data.xp = await safe(() => API.xp());
      data.streak = await safe(() => API.streak());
      data.favorites = await safe(() => API.favorites());
      data.sessions = await safe(() => API.sessions(100));
    }

    return data;
  }

  async function downloadJSON() {
    if (window.FLASH_TOAST) window.FLASH_TOAST.info('Preparing export…', 'Export');
    try {
      const data = await collectAll();
      const content = JSON.stringify(data, null, 2);
      download('flash-export-' + timestamp() + '.json', content, 'application/json');
      if (window.FLASH_TOAST) window.FLASH_TOAST.success('Export downloaded', 'Ready');
    } catch (err) {
      if (window.FLASH_TOAST) window.FLASH_TOAST.error('Export failed: ' + err.message);
    }
  }

  async function downloadCSV() {
    if (window.FLASH_TOAST) window.FLASH_TOAST.info('Preparing CSV…', 'Export');
    try {
      const data = await collectAll();
      const sessions = (data.sessions && data.sessions.sessions) || data.recent_sessions || [];

      const header = ['date', 'game', 'domain', 'mode', 'accuracy', 'median_rt_ms', 'score'];
      const rows = sessions.map(s => [
        s.started_at || s.date || '',
        s.game_id || s.game || '',
        s.domain_id || s.domain || '',
        s.mode || '',
        s.accuracy != null ? s.accuracy : '',
        s.median_rt_ms != null ? s.median_rt_ms : (s.medianRT != null ? s.medianRT : ''),
        s.primary_score != null ? s.primary_score : (s.score != null ? s.score : ''),
      ]);

      const csv = [header, ...rows]
        .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      download('flash-sessions-' + timestamp() + '.csv', csv, 'text/csv');
      if (window.FLASH_TOAST) window.FLASH_TOAST.success('CSV downloaded', 'Ready');
    } catch (err) {
      if (window.FLASH_TOAST) window.FLASH_TOAST.error('CSV export failed: ' + err.message);
    }
  }

  window.FLASH_DATA_EXPORT = {
    downloadJSON,
    downloadCSV,
    collectAll,
    version: '1.0.0'
  };

  console.info('[DATA_EXPORT] loaded — window.FLASH_DATA_EXPORT available');
})();