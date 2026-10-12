/* ============================================================
   FLASH - API Extension (Engagement + Personalization)
   Extends FLASH_API with new endpoint methods
   ============================================================ */
(function () {
  'use strict';

  const API = window.FLASH_API;
  if (!API) {
    console.error('[api-engagement] requires api.js to load first');
    return;
  }

  /* ─── XP & Leveling ─── */
  API.xp = () => API.get('/me/xp');
  API.xpHistory = () => API.get('/me/xp/history');

  /* ─── Referrals ─── */
  API.referralCode = () => API.get('/me/referral/code');
  API.referralStats = () => API.get('/me/referral/stats');
  API.redeemReferral = (code) => API.post('/referrals/redeem', { code });

  /* ─── Daily Challenge ─── */
  API.dailyChallenge = () => API.get('/daily-challenge');
  API.dailyChallengeLeaderboard = () => API.get('/daily-challenge/leaderboard');
  API.submitChallengeResult = (data) => API.post('/daily-challenge/result', data);

  /* ─── Streaks ─── */
  API.streak = () => API.get('/me/streak');
  API.streakCheckin = () => API.post('/me/streak/checkin');

  /* ─── Favorites ─── */
  API.favorites = () => API.get('/me/favorites');
  API.addFavorite = (gameId) => API.post('/me/favorites', { game_id: gameId });
  API.removeFavorite = (gameId) => API.del('/me/favorites/' + encodeURIComponent(gameId));

  /* ─── Ratings ─── */
  API.rateGame = (gameId, rating, feedback) =>
    API.post('/me/ratings', { game_id: gameId, rating, feedback });
  API.gameRating = (gameId) =>
    API.get('/games/' + encodeURIComponent(gameId) + '/rating');
  API.myGameRating = (gameId) =>
    API.get('/me/ratings/' + encodeURIComponent(gameId));

  /* ─── Session Notes ─── */
  API.saveNote = (data) => API.post('/me/session-notes', data);
  API.getNote = (sessionId) =>
    API.get('/me/session-notes/' + encodeURIComponent(sessionId));
  API.listNotes = () => API.get('/me/session-notes');

  /* ─── Coach Feedback ─── */
  API.submitCoachFeedback = (data) => API.post('/me/coach-feedback', data);

  console.info('[FLASH_API_ENGAGEMENT] v1 ready — 19 methods added');
})();