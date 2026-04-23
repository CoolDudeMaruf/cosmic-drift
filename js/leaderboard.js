/**
 * Cosmic Drift — Leaderboard Module
 *
 * Manages global leaderboard, personal score history,
 * seed data for demo purposes, and UI rendering.
 *
 * @module leaderboard
 * @version 1.0.0
 */

const CosmicLeaderboard = (() => {
  'use strict';

  /* ══════════════════════════════════════
     SEED DATA — Pre-populated bot players
     ══════════════════════════════════════ */
  const SEED_PLAYERS = [
    { username: 'NovaStar', country: { code: 'US', name: 'United States', flag: '🇺🇸' }, highScore: 14820, gamesPlayed: 47, bestCombo: 25 },
    { username: 'PhantomX', country: { code: 'JP', name: 'Japan', flag: '🇯🇵' }, highScore: 12350, gamesPlayed: 83, bestCombo: 30 },
    { username: 'AceViper', country: { code: 'KR', name: 'South Korea', flag: '🇰🇷' }, highScore: 11200, gamesPlayed: 62, bestCombo: 22 },
    { username: 'ZeroCool', country: { code: 'DE', name: 'Germany', flag: '🇩🇪' }, highScore: 9840, gamesPlayed: 35, bestCombo: 18 },
    { username: 'PixelDust', country: { code: 'BR', name: 'Brazil', flag: '🇧🇷' }, highScore: 8950, gamesPlayed: 29, bestCombo: 20 },
    { username: 'CosmicRay', country: { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' }, highScore: 8100, gamesPlayed: 41, bestCombo: 16 },
    { username: 'StormByte', country: { code: 'CA', name: 'Canada', flag: '🇨🇦' }, highScore: 7660, gamesPlayed: 38, bestCombo: 15 },
    { username: 'Blitzkrieg', country: { code: 'SE', name: 'Sweden', flag: '🇸🇪' }, highScore: 6800, gamesPlayed: 22, bestCombo: 14 },
    { username: 'NightFury', country: { code: 'IN', name: 'India', flag: '🇮🇳' }, highScore: 6220, gamesPlayed: 55, bestCombo: 19 },
    { username: 'GlitchWave', country: { code: 'FR', name: 'France', flag: '🇫🇷' }, highScore: 5470, gamesPlayed: 18, bestCombo: 12 },
    { username: 'ShadowMech', country: { code: 'AU', name: 'Australia', flag: '🇦🇺' }, highScore: 4990, gamesPlayed: 27, bestCombo: 11 },
    { username: 'IronPulse', country: { code: 'PL', name: 'Poland', flag: '🇵🇱' }, highScore: 4350, gamesPlayed: 33, bestCombo: 13 },
    { username: 'VoidWalker', country: { code: 'NL', name: 'Netherlands', flag: '🇳🇱' }, highScore: 3800, gamesPlayed: 15, bestCombo: 10 },
    { username: 'StarBlade', country: { code: 'TR', name: 'Turkey', flag: '🇹🇷' }, highScore: 3220, gamesPlayed: 21, bestCombo: 9 },
    { username: 'TurboNova', country: { code: 'PH', name: 'Philippines', flag: '🇵🇭' }, highScore: 2680, gamesPlayed: 12, bestCombo: 8 },
  ];

  /* ══════════════════════════════════════
     LEADERBOARD LOGIC
     ══════════════════════════════════════ */

  /** Get the combined global leaderboard (real + seed players), sorted by highScore */
  function getGlobalLeaderboard() {
    const realUsers = CosmicAuth.getAllUsers();

    // Merge real users with seed players (seeds act as "other players")
    const combined = [
      ...realUsers.map(u => ({
        username: u.username,
        country: u.country,
        highScore: u.highScore,
        gamesPlayed: u.gamesPlayed,
        bestCombo: u.bestCombo || 0,
        isReal: true,
      })),
      ...SEED_PLAYERS.map(s => ({
        ...s,
        isReal: false,
      })),
    ];

    // Sort by high score descending
    combined.sort((a, b) => b.highScore - a.highScore);

    return combined;
  }

  /** Get the current user's rank */
  function getCurrentRank() {
    const session = CosmicAuth.getCurrentSession();
    if (!session || session.isGuest) return null;

    const board = getGlobalLeaderboard();
    const idx = board.findIndex(p => p.username === session.username && p.isReal);
    return idx >= 0 ? idx + 1 : null;
  }

  /** Get personal score history for current user */
  function getPersonalScores() {
    const user = CosmicAuth.getCurrentUser();
    if (!user) return [];
    return user.scores || [];
  }

  /* ══════════════════════════════════════
     RENDER — Global leaderboard table
     ══════════════════════════════════════ */
  function renderGlobalBoard(container) {
    const board = getGlobalLeaderboard();
    const session = CosmicAuth.getCurrentSession();
    const currentUser = session && !session.isGuest ? session.username : null;

    if (board.length === 0) {
      container.innerHTML = '<p class="lb-empty">No scores yet. Be the first!</p>';
      return;
    }

    let html = `
      <table class="lb-table">
        <thead>
          <tr>
            <th class="lb-rank">#</th>
            <th class="lb-flag"></th>
            <th class="lb-name">Pilot</th>
            <th class="lb-score">High Score</th>
            <th class="lb-games">Games</th>
            <th class="lb-combo">Best Combo</th>
          </tr>
        </thead>
        <tbody>
    `;

    board.forEach((p, i) => {
      const rank = i + 1;
      const isMe = p.isReal && p.username === currentUser;
      const rankIcon = rank === 1 ? '👑' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
      const rowClass = isMe ? 'lb-row-me' : (rank <= 3 ? 'lb-row-top' : '');

      html += `
        <tr class="lb-row ${rowClass}">
          <td class="lb-rank">${rankIcon}</td>
          <td class="lb-flag">${p.country?.flag || '🌍'}</td>
          <td class="lb-name">${escapeHTML(p.username)}${isMe ? ' <span class="lb-you">YOU</span>' : ''}</td>
          <td class="lb-score">${p.highScore.toLocaleString()}</td>
          <td class="lb-games">${p.gamesPlayed}</td>
          <td class="lb-combo">${p.bestCombo}x</td>
        </tr>
      `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
  }

  /* ══════════════════════════════════════
     RENDER — Personal score history
     ══════════════════════════════════════ */
  function renderPersonalBoard(container) {
    const user = CosmicAuth.getCurrentUser();
    if (!user) {
      container.innerHTML = '<p class="lb-empty">Sign in to track your scores!</p>';
      return;
    }

    const scores = user.scores || [];

    let html = `
      <div class="lb-personal-stats">
        <div class="lb-stat">
          <span class="lb-stat-label">High Score</span>
          <span class="lb-stat-value">${user.highScore.toLocaleString()}</span>
        </div>
        <div class="lb-stat">
          <span class="lb-stat-label">Games Played</span>
          <span class="lb-stat-value">${user.gamesPlayed}</span>
        </div>
        <div class="lb-stat">
          <span class="lb-stat-label">Best Combo</span>
          <span class="lb-stat-value">${(user.bestCombo || 0)}x</span>
        </div>
        <div class="lb-stat">
          <span class="lb-stat-label">Avg Score</span>
          <span class="lb-stat-value">${user.gamesPlayed > 0 ? Math.round(user.totalScore / user.gamesPlayed).toLocaleString() : '—'}</span>
        </div>
      </div>
    `;

    if (scores.length > 0) {
      html += `
        <h3 class="lb-history-title">Recent Games</h3>
        <table class="lb-table lb-table-personal">
          <thead>
            <tr>
              <th class="lb-rank">#</th>
              <th class="lb-score">Score</th>
              <th class="lb-date">Date</th>
            </tr>
          </thead>
          <tbody>
      `;

      scores.forEach((s, i) => {
        const isHigh = s.score === user.highScore;
        html += `
          <tr class="lb-row ${isHigh ? 'lb-row-top' : ''}">
            <td class="lb-rank">${i + 1}</td>
            <td class="lb-score">${s.score.toLocaleString()}${isHigh ? ' ⭐' : ''}</td>
            <td class="lb-date">${formatDate(s.date)}</td>
          </tr>
        `;
      });

      html += '</tbody></table>';
    } else {
      html += '<p class="lb-empty">No games played yet. Get out there, pilot!</p>';
    }

    container.innerHTML = html;
  }

  /* ══════════════════════════════════════
     HELPERS
     ══════════════════════════════════════ */
  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function formatDate(timestamp) {
    const d = new Date(timestamp);
    const now = new Date();
    const diff = now - d;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;

    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return {
    getGlobalLeaderboard,
    getCurrentRank,
    getPersonalScores,
    renderGlobalBoard,
    renderPersonalBoard,
  };
})();
